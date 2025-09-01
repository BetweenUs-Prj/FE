// src/pages/reaction/ReactionGameREST.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../hooks/useGameStore';
import { http, getUid } from '../../api/http';
import { createRound, registerClick } from '../../api/reaction';
import { getSessionDetails } from '../../api/session';

interface ReactionResult {
  userUid: string;
  deltaMs: number;
  falseStart: boolean;
  rank: number;
}
interface ReactionRound {
  roundId: number;
  sessionId: number;
  status: 'WAITING' | 'PREPARING' | 'RED' | 'FINISHED';
  redAt: number;
  createdAt: number;
  participants: number;
  results: ReactionResult[];
}
interface GameState {
  currentRound: ReactionRound | null;
  playerReady: boolean;
  gameStarted: boolean;
}

export default function ReactionGameREST() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const nav = useNavigate();
  const setGameType = useGameStore((s) => s.setGameType);

  const [gameState, setGameState] = useState<GameState>({
    currentRound: null,
    playerReady: false,
    gameStarted: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [clicked, setClicked] = useState(false);

  const mountedRef = useRef(true);
  const redStartTime = useRef<number | null>(null);
  const roundPollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const noRoundCountRef = useRef(0); // 204 응답 카운터를 ref로 변경

  // 생애주기
  useEffect(() => {
    mountedRef.current = true;
    try { setGameType?.('REACTION'); } catch {}
    return () => {
      mountedRef.current = false;
      if (roundPollingRef.current) clearInterval(roundPollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setPlayerReady(false).catch(() => {});
    };
  }, [setGameType]);

  // 결과 페이지로 이동(결과 대기는 거기서 처리)
  const goResult = useCallback(() => {
    if (!sessionId) {
      console.error('[REACTION-GAME] No sessionId for navigation!');
      return;
    }
    console.log('[REACTION-GAME] 🎯 Navigating to results page:', `/game/reaction/result/${sessionId}`);
    console.log('[REACTION-GAME] Current location:', window.location.pathname);
    nav(`/game/reaction/result/${sessionId}`, { replace: true, state: { from: 'reaction', gameType: 'REACTION' } });
    console.log('[REACTION-GAME] ✅ Navigation completed');
  }, [nav, sessionId]);

  // 세션 상태 확인
  const checkSessionCompletion = useCallback(async () => {
    if (!sessionId || !mountedRef.current) return false;
    try {
      const sessionDetails = await getSessionDetails(Number(sessionId));
      console.log('[REACTION-GAME] Session status:', sessionDetails.status);
      
      // 세션이 FINISHED 상태라면 완료된 것
      if (sessionDetails.status === 'FINISHED') {
        console.log('[REACTION-GAME] 🎉 Session finished, going to results');
        console.log('[REACTION-GAME] Session data:', sessionDetails);
        goResult();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[REACTION-GAME] Failed to check session status:', error);
      return false;
    }
  }, [sessionId, goResult]);

  // 현재 라운드 조회
  const fetchCurrentRound = useCallback(async () => {
    console.log('[REACTION-GAME] 🔄 fetchCurrentRound called, sessionId:', sessionId, 'mounted:', mountedRef.current, 'noRoundCount:', noRoundCountRef.current);
    if (!sessionId || !mountedRef.current) return;
    try {
      const res = await http.get(`/mini-games/reaction/sessions/${sessionId}/current-round`, {
        params: { ts: Date.now() },
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      console.log('[REACTION-GAME] 📡 API Response status:', res.status, 'data:', res.data);

      // 204 응답 처리
      if (res.status === 204 || !res.data) {
        console.log('[REACTION-GAME] 🔍 Got 204 response or empty data, current count:', noRoundCountRef.current);
        // 204 응답 카운터 증가
        noRoundCountRef.current += 1;
        const newCount = noRoundCountRef.current;
        console.log('[REACTION-GAME] 📈 Updated count to:', newCount);
        
        // 연속으로 5번 이상 204를 받으면 세션 상태 확인
        if (newCount >= 5) {
          console.log('[REACTION-GAME] 🔍 Checking session completion after', newCount, '204 responses...');
          const sessionCompleted = await checkSessionCompletion();
          if (sessionCompleted) {
            console.log('[REACTION-GAME] ✅ Session completed, returning...');
            return; // 결과 페이지로 이동됨
          }
          // 10번 이상 204를 받으면 강제로 결과 페이지로 이동
          if (newCount >= 10) {
            console.log('[REACTION-GAME] 🚨 Too many 204 responses, forcing navigation to results');
            console.log('[REACTION-GAME] 204 count:', newCount);
            goResult();
            return;
          }
        }
        
        // 라운드 아직 없음 → 그냥 대기 화면 유지
        setGameState((p) => ({ ...p, currentRound: null }));
        setLoading(false);
        return;
      }

      const round: ReactionRound = res.data;

      // 성공적으로 라운드를 받았으므로 204 카운터 리셋
      noRoundCountRef.current = 0;

      setGameState((p) => ({
        ...p,
        currentRound: round,
        gameStarted: round.status !== 'WAITING'
      }));

      if (round.status === 'RED' && !clicked) {
        redStartTime.current = round.redAt;
      }

      // 게임이 완전히 종료된 경우에만 결과 페이지로 이동
      if (round.status === 'FINISHED') {
        console.log('[REACTION-GAME] 🎉 Round finished, moving to results after 2 seconds...');
        console.log('[REACTION-GAME] Round data:', round);
        setTimeout(() => {
          if (mountedRef.current) {
            console.log('[REACTION-GAME] 🚀 Timeout completed, calling goResult...');
            goResult();
          } else {
            console.warn('[REACTION-GAME] ⚠️ Component unmounted, skipping navigation');
          }
        }, 2000); // 2초 대기 후 이동
      }

      setLoading(false);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch current round:', error);
      setLoading(false);
    }
  }, [sessionId, clicked, goResult, checkSessionCompletion]);

  // 준비 토글(실패/400 무시)
  const setPlayerReady = useCallback(async (ready: boolean) => {
    if (!sessionId) return;
    try {
      const endpoint = ready ? 'ready' : 'unready';
      await http.post(`/mini-games/reaction/sessions/${sessionId}/${endpoint}`);
      setGameState((p) => ({ ...p, playerReady: ready }));
    } catch (error) {
      console.warn('Failed to set player ready state:', error);
    }
  }, [sessionId]);

  // 라운드 생성(호스트만 노출하는 버튼이라면 라우터/상태에서 구분)
  const createRoundHandler = useCallback(async () => {
    if (!sessionId) return;
    try {
      await createRound(Number(sessionId));
      
      // 표시용 카운트다운
      setCountdown(5);
      let c = 5;
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setCountdown(null);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to create round:', error);
      setError('게임을 시작할 수 없습니다.');
    }
  }, [sessionId]);

  // 클릭 처리: 클릭 후 즉시 결과 표시하고 3초 후 결과 페이지로 이동
  const handleClick = useCallback(async () => {
    if (!gameState.currentRound || clicked || gameState.currentRound.status !== 'RED') return;

    setClicked(true);
    const now = Date.now();
    if (redStartTime.current) {
      setReactionTime(now - redStartTime.current);
    }

    try {
      const response = await registerClick(gameState.currentRound.roundId);
      if (response.deltaMs) {
        setReactionTime(response.deltaMs);
      }
    } catch (error) {
      console.warn('Failed to register click:', error);
    }

    // 클릭 완료 후에는 결과 페이지로 이동하지 않음 (다른 플레이어 대기)
    // setTimeout(() => {
    //   if (mountedRef.current) {
    //     goResult();
    //   }
    // }, 3000);
  }, [gameState.currentRound, clicked, goResult]);

  // 폴링 시작
  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      await setPlayerReady(true).catch(() => {});
      await fetchCurrentRound();
      if (roundPollingRef.current) clearInterval(roundPollingRef.current);
      roundPollingRef.current = setInterval(() => fetchCurrentRound(), 1000); // 1초마다 체크로 변경
    })();

    return () => {
      if (roundPollingRef.current) clearInterval(roundPollingRef.current);
    };
  }, [sessionId, fetchCurrentRound, setPlayerReady]);

  // 스페이스바
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState.currentRound?.status === 'RED') {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState.currentRound?.status, handleClick]);

  // ----------- UI -----------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mb-4 mx-auto"></div>
          <p className="text-white text-center">게임을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">오류 발생</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => nav('/')} className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 font-semibold">
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  // 라운드 없음/WAITING
  if (!gameState.currentRound || gameState.currentRound.status === 'WAITING') {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center max-w-2xl">
          <div className="text-6xl mb-6">⚡</div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">반응속도 게임</h1>
          <p className="text-gray-400 mb-8 text-lg">빨간 불이 켜지면 최대한 빠르게 클릭하세요!</p>

          <div className="bg-gray-700 rounded-lg p-6 mb-8 text-left text-gray-300">
            <p>• 준비 버튼을 눌러 게임을 시작하세요</p>
            <p>• 카운트다운 후 랜덤 시간에 빨간 불이 켜집니다</p>
            <p>• 빨간 불이 켜지면 화면을 클릭하거나 스페이스바를 누르세요</p>
            <p>• 빨간 불이 켜지기 전에 클릭하면 부정출발입니다</p>
          </div>

          {!gameState.playerReady ? (
            <button
              onClick={() => setPlayerReady(true)}
              className="px-8 py-4 bg-yellow-500 text-black rounded-xl hover:bg-yellow-600 font-bold text-xl transition transform hover:scale-105"
            >
              게임 참가
            </button>
          ) : (
            <div>
              <p className="text-green-400 font-semibold mb-4">참가 완료! 다른 플레이어를 기다리는 중…</p>
              <button
                onClick={createRoundHandler}
                className="px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold text-xl transition transform hover:scale-105"
              >
                게임 시작
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 카운트다운
  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl font-bold text-yellow-400 mb-4 animate-pulse" style={{ textShadow: '0 0 50px rgba(255,193,7,.8)' }}>
            {countdown}
          </div>
          <p className="text-2xl text-white">준비하세요…</p>
        </div>
      </div>
    );
  }

  // PREPARING
  if (gameState.currentRound.status === 'PREPARING') {
    return (
      <div className="min-h-screen flex items-center justify-center cursor-pointer" style={{ backgroundColor: '#1a1a2e' }} onClick={handleClick}>
        <div className="text-center">
          <div className="text-6xl mb-6 animate-pulse">⏳</div>
          <h2 className="text-3xl font-bold text-white mb-4">준비하세요…</h2>
          <p className="text-gray-400 text-lg">빨간 불이 켜지면 클릭하세요</p>
          <p className="text-gray-500 text-sm mt-4">화면을 클릭하거나 스페이스바를 누르세요</p>
        </div>
      </div>
    );
  }

  // RED
  if (gameState.currentRound.status === 'RED') {
    return (
      <div className="min-h-screen flex items-center justify-center cursor-pointer" style={{ backgroundColor: '#dc2626' }} onClick={handleClick}>
        <div className="text-center text-white">
          {clicked ? (
            <div>
              <div className="text-8xl mb-4">✅</div>
              <h2 className="text-4xl font-bold mb-4">클릭 완료!</h2>
              {reactionTime !== null && <p className="text-2xl font-semibold">반응시간: {reactionTime}ms</p>}
              <p className="text-xl opacity-80 mt-2">결과 페이지로 이동합니다…</p>
            </div>
          ) : (
            <div>
              <div className="text-9xl mb-6 animate-bounce">🔴</div>
              <h2 className="text-5xl font-bold mb-4">지금 클릭!</h2>
              <p className="text-2xl opacity-80">화면을 클릭하거나 스페이스바를 누르세요</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
