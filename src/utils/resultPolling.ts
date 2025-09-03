import { http } from '../api/http';

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

// 호스트만 멱등 finish 보강
export async function ensureFinished(sessionId: number, isHost: boolean) {
  try {
    const s = await http.get(`/mini-games/sessions/${sessionId}`, { validateStatus: () => true });
    const status = s.status === 200 ? s.data?.status : 'UNKNOWN';
    console.log(`[POLLING] Session ${sessionId} status: ${status}`);
    
    if (status === 'FINISHED' || status === 'COMPLETED') {
      console.log(`[POLLING] Session already finished: ${status}`);
      return 'DONE';
    }
    
    if (isHost && (status === 'IN_PROGRESS' || status === 'WAITING')) {
      console.log(`[POLLING] Host reinforcing finish for session ${sessionId}`);
      const finishRes = await http.post(`/mini-games/sessions/${sessionId}/finish`, {}, { validateStatus: () => true });
      console.log(`[POLLING] Finish reinforcement result: ${finishRes.status}`);
      return 'TRYING';
    }
    
    return status || 'UNKNOWN';
  } catch (e) {
    console.warn('[POLLING] ensureFinished failed:', e);
    return 'UNKNOWN';
  }
}

/**
 * 무제한 지수 백오프 폴링 (개선판)
 * - 204/404/500 = not ready 로 처리, 계속 재시도
 * - 매 틱마다 /scores 병행 호출로 부분 결과 갱신
 * - 5초마다 호스트가 finish 보강
 * - 3틱마다 세션 상태 확인
 * - 최종 200 오면 onFinal 호출
 */
export async function pollResultsStreaming(
  sessionId: number,
  isHost: boolean,
  signal: AbortSignal,
  isReactionGame: boolean = true,
  onPartial: (scores: any[]) => void,
  onFinal: (data: any) => void,
  onStatusUpdate?: (status: string) => void
) {
  let delay = 400;                    // 0.4s → 2s
  let lastReinforce = 0;
  let degradedModeTimeout = 30000;    // 30초 후 degraded mode
  const startTime = Date.now();
  
  console.log(`[POLLING] Starting unlimited streaming poll for session ${sessionId}, isHost: ${isHost}, isReaction: ${isReactionGame}`);
  
  let attempt = 0;
  while (!signal.aborted) {
    attempt++;
    console.log(`[POLLING] Streaming attempt ${attempt}, delay: ${delay}ms`);
    
    // 1) 결과 시도 - 두 게임 타입 모두 같은 엔드포인트 사용
    const resultsEndpoint = `/mini-games/results/${sessionId}`;

    const r = await http.get(resultsEndpoint, {
      validateStatus: () => true,
      signal
    });

    console.log(`[POLLING] Results API status: ${r.status}`);

    if (r.status === 200 && r.data) {
      console.log('[POLLING] 🎉 Final results ready!');
      onFinal(r.data);
      return;
    }

    // 인증/권한/세션 없음만 즉시 오류
    if (r.status === 401 || r.status === 403) {
      console.error(`[POLLING] Auth/permission error: ${r.status}`);
      throw new Error(`results ${r.status}`);
    }

    // 30초 후 degraded mode: 422 집계 실패가 지속되면 부분 점수로 결과 생성
    const elapsed = Date.now() - startTime;
    if (elapsed > degradedModeTimeout && r.status === 422 && isReactionGame) {
      console.log(`[POLLING] ⚠️ Degraded mode activated after ${elapsed}ms - using partial scores as final result`);
      
      // 마지막 부분 점수를 최종 결과로 변환
      try {
        const s = await http.get(`/mini-games/sessions/${sessionId}/scores`, { 
          validateStatus: () => true,
          signal 
        });
        
        if (s.status === 200 && Array.isArray(s.data)) {
          // localStorage에서 실제 리액션 타임 가져오기
          const rawClicksKey = `reaction_raw_clicks_${sessionId}`;
          const rawClicks = localStorage.getItem(rawClicksKey);
          let reactionTimesByUser: Map<string, number> = new Map();
          
          if (rawClicks && isReactionGame) {
            const clicks = JSON.parse(rawClicks) as Array<{ userUid: string; reactionTimeMs: number }>;
            // 각 유저의 최고 기록 계산
            clicks.forEach(click => {
              const current = reactionTimesByUser.get(click.userUid);
              if (!current || click.reactionTimeMs < current) {
                reactionTimesByUser.set(click.userUid, click.reactionTimeMs);
              }
            });
          }
          
          const sortedPlayers = s.data.map((player: any, index: number) => {
              const reactionTime = reactionTimesByUser.get(player.userUid);
              return {
                userUid: player.userUid,
                totalScore: reactionTime || player.totalScore || player.score || 0,
                correctCount: player.correctCount || 0,
                totalAnswers: player.totalAnswers || player.totalAnswered || 0,
                rank: index,
                bestTimeMs: reactionTime || player.bestTimeMs || null
              };
            }).sort((a: any, b: any) => {
              // 리액션 게임은 시간이 낮을수록 좋음
              if (isReactionGame) {
                return (a.totalScore || 999999) - (b.totalScore || 999999);
              }
              // 퀴즈는 점수가 높을수록 좋음
              return (b.totalScore || 0) - (a.totalScore || 0);
            }).map((player: any, index: number) => ({
              ...player,
              rank: index + 1
            }));
          
          const degradedResult = {
            sessionId,
            players: sortedPlayers,
            winnerUid: sortedPlayers.length > 0 ? sortedPlayers[0].userUid : null,
            status: 'FINISHED',
            message: 'Results generated from partial scores (server aggregation failed)',
            timestamp: Date.now(),
            degradedMode: true
          };
          
          console.log('[POLLING] 🎉 Degraded mode final results ready!', degradedResult);
          onFinal(degradedResult);
          return;
        }
      } catch (e) {
        console.warn('[POLLING] Failed to generate degraded mode result:', e);
      }
    }

    // 204/404/422/500 = 아직 준비 안됨 - 계속 폴링 (422: 집계 실패는 임시 상태로 처리)
    console.log(`[POLLING] Status ${r.status} - treating as "not ready yet", continuing... (elapsed: ${elapsed}ms)`);

    // 2) 폴백: 매 틱마다 점수 가져오기 (부분 결과 항상 최신화)
    try {
      const s = await http.get(`/mini-games/sessions/${sessionId}/scores`, { 
        validateStatus: () => true,
        signal 
      });
      if (s.status === 200 && Array.isArray(s.data) && s.data.length) {
        console.log('[POLLING] 📊 Updating partial scores');
        onPartial(
          s.data.map((it: any, i: number) => ({
            userUid: it.userUid || it.uid,
            displayName: it.userUid || it.uid,
            score: it.totalScore ?? it.score ?? 0,
            rank: i + 1,
            bestMs: it.bestTimeMs ?? it.totalResponseTime ?? it.reactionTime ?? null,
            correctCount: it.correctCount ?? 0,
            totalAnswers: it.totalAnswers ?? 0
          }))
        );
      }
    } catch (e) {
      console.warn('[POLLING] Scores fetch failed (non-fatal):', e);
    }

    // 3) 3틱마다 세션 상태 확인 (안내 메시지 동기화)
    if (attempt % 3 === 0 && onStatusUpdate) {
      try {
        const st = await http.get(`/mini-games/sessions/${sessionId}`, { 
          validateStatus: () => true, 
          signal 
        });
        if (st.status === 200) {
          const sessionStatus = st.data?.status;
          console.log(`[POLLING] Session status check: ${sessionStatus}`);
          
          if (sessionStatus === 'FINISHED' || sessionStatus === 'COMPLETED') {
            onStatusUpdate('세션이 종료되었습니다. 서버가 최종 기록을 확정 중입니다...');
          } else if (sessionStatus === 'IN_PROGRESS') {
            onStatusUpdate('게임이 진행 중입니다. 결과를 집계하고 있습니다...');
          } else {
            onStatusUpdate('서버가 결과를 집계 중입니다...');
          }
        }
      } catch (e) {
        console.warn('[POLLING] Session status check failed (non-fatal):', e);
      }
    }

    // 4) 5초마다 호스트 보강
    if (Date.now() - lastReinforce > 5000) {
      console.log('[POLLING] 5 seconds passed, reinforcing finish...');
      await ensureFinished(sessionId, isHost);
      lastReinforce = Date.now();
    }

    await sleep(delay);
    delay = Math.min(2000, Math.floor(delay * 1.35));
  }

  throw new DOMException('aborted', 'AbortError');
}

// 레거시 호환성을 위한 별칭 (기존 코드에서 사용할 수 있도록)
export async function pollResultsWithBackoff(
  sessionId: number,
  isHost: boolean,
  signal: AbortSignal,
  isReactionGame: boolean = true,
  onPartial?: (scores: any[]) => void
) {
  return new Promise((resolve, reject) => {
    pollResultsStreaming(
      sessionId,
      isHost,
      signal,
      isReactionGame,
      (scores) => {
        if (onPartial) onPartial(scores);
      },
      (data) => {
        resolve({ data, degraded: false });
      }
    ).catch(reject);
  });
}