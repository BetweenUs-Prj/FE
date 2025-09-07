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
      console.log('[REACTION-GAME] 📡 Response headers:', res.headers);

      // 세션 상태 헤더 확인
      const sessionStatus = res.headers['x-session-status'];
      if (sessionStatus === 'FINISHED') {
        console.log('[REACTION-GAME] 🎉 Session is FINISHED (from header), navigating to results');
        goResult();
        return;
      }

      // 204 응답 처리
      if (res.status === 204 || !res.data) {
        console.log('[REACTION-GAME] 🔍 Got 204 response or empty data, current count:', noRoundCountRef.current);
        console.log('[REACTION-GAME] 🔍 Session status from header:', sessionStatus);
        
        // 세션이 종료됨을 헤더로 확인
        if (sessionStatus === 'FINISHED') {
          console.log('[REACTION-GAME] 🎉 Session finished (header check), navigating to results');
          goResult();
          return;
        }
        
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

  // 픽셀 아트 스타일과 이벤트 핸들러
  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
    } 
  };

  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(0)'; 
      e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; 
    } 
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(2px)'; 
      e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; 
    } 
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
    } 
  };

  // 픽셀 아트 스타일 정의
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    .pixel-game-body { 
      font-family: 'Press Start 2P', cursive; 
      background-color: #2c2d3c; 
      color: #f2e9e4; 
      background-image: linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px); 
      background-size: 4px 4px; 
      image-rendering: pixelated; 
      min-height: 100vh; 
    }
    .pixel-container { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      padding: 2rem; 
    }
    .game-clickable-area {
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    .red-bg {
      background-color: #dc2626 !important;
    }
    @keyframes countdown-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
  `;

  // ----------- UI -----------

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '2rem', animation: 'countdown-pulse 2s ease-in-out infinite' }}>⏳</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f2e9e4' }}>게임을 불러오는 중...</h2>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>반응속도 게임을 준비하고 있습니다</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '2rem', color: '#e76f51' }}>⚠️</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f2e9e4' }}>오류 발생</h2>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '2rem' }}>{error}</p>
              <button 
                onClick={() => nav('/')}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '0.8rem',
                  backgroundColor: '#fbbf24',
                  color: '#0d0d0d',
                  border: '2px solid #0d0d0d',
                  boxShadow: '4px 4px 0px #0d0d0d',
                  cursor: 'pointer',
                  fontFamily: "'Press Start 2P', cursive"
                }}
              >
                홈으로 이동
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 라운드 없음/WAITING
  if (!gameState.currentRound || gameState.currentRound.status === 'WAITING') {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '2rem', animation: 'countdown-pulse 2s ease-in-out infinite' }}>⚡</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f2e9e4' }}>반응속도 게임 준비 중...</h2>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>게임을 로딩하고 있습니다</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 카운트다운
  if (countdown !== null && countdown > 0) {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '6rem', 
                fontWeight: 'bold', 
                color: '#fbbf24', 
                marginBottom: '2rem',
                animation: 'countdown-pulse 1s ease-in-out infinite',
                textShadow: '0 0 50px rgba(251, 191, 36, 0.8)'
              }}>
                {countdown}
              </div>
              <p style={{ fontSize: '1.2rem', color: '#f2e9e4' }}>준비하세요…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // PREPARING
  if (gameState.currentRound.status === 'PREPARING') {
    return (
      <>
        <style>{styles}</style>
        <div 
          className="game-clickable-area"
          onClick={handleClick}
          style={{ backgroundColor: '#1a1a2e' }}
        >
          <div style={{ textAlign: 'center', color: '#ffffff' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'countdown-pulse 2s ease-in-out infinite' }}>🟢</div>
            <div style={{ fontSize: '1.5rem', textShadow: '2px 2px 0px #0d0d0d', marginBottom: '0.5rem' }}>준비하세요…</div>
            <div style={{ fontSize: '0.9rem', opacity: '0.9', marginBottom: '0.5rem' }}>빨간 불이 켜지면 클릭하세요</div>
            <div style={{ fontSize: '0.7rem', opacity: '0.7' }}>화면을 클릭하거나 스페이스바를 누르세요</div>
          </div>
        </div>
      </>
    );
  }

  // RED
  if (gameState.currentRound.status === 'RED') {
    return (
      <>
        <style>{styles}</style>
        <div 
          className={`game-clickable-area ${clicked ? '' : 'red-bg'}`}
          onClick={handleClick}
          style={clicked ? { backgroundColor: '#a7c957' } : {}}
        >
          <div style={{ textAlign: 'center', color: '#ffffff' }}>
            {clicked ? (
              <div>
                <div style={{ fontSize: '4rem', marginBottom: '2rem', animation: 'countdown-pulse 2s ease-in-out infinite' }}>⏳</div>
                <div style={{ fontSize: '1.5rem', textShadow: '2px 2px 0px #0d0d0d', marginBottom: '1rem' }}>기록 완료!</div>
                {reactionTime !== null && (
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0d0d0d', marginBottom: '1.5rem' }}>
                    반응시간: {reactionTime}ms
                  </div>
                )}
                <div style={{ fontSize: '0.9rem', opacity: '0.9', marginBottom: '0.5rem' }}>다른 플레이어를 기다리는 중...</div>
                <div style={{ fontSize: '0.7rem', opacity: '0.7' }}>모든 플레이어가 완료하면 결과가 표시됩니다</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'countdown-pulse 0.5s ease-in-out infinite' }}>🔴</div>
                <div style={{ fontSize: '2rem', textShadow: '2px 2px 0px #0d0d0d', marginBottom: '0.5rem' }}>지금 클릭!</div>
                <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>화면을 클릭하거나 스페이스바를 누르세요</div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return null;
}
