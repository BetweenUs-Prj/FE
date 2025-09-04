/**
 * 안정적인 반응속도 게임 페이지
 * 30년차 시니어의 전체 생명주기 관리
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { GameLifecycleManager } from '../../services/GameLifecycleManager';
import { GameLifecycleState, GameType, type GameSession } from '../../types/gameLifecycle';
import { showToast } from '../../components/common/Toast';
import { getSessionIdSync } from '../../utils/sessionUtils';
import {
  GameHeader,
  GameContainer,
  ReactionGameArea,
  LoadingCard,
  ThemeButton
} from '../../components';

interface ReactionRoundData {
  roundId: number;
  roundNumber: number;
  status: 'READY' | 'RED' | 'FINISHED';
  redAt?: number;
}

interface ReactionResult {
  userUid: string;
  reactionTimeMs: number;
  isFalseStart: boolean;
  rank: number;
  clickedAt?: number;
}

type GameStatus = 'WAITING' | 'READY' | 'GO' | 'FINISHED';

export default function StableReactionPage() {
  const params = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 게임 생명주기 관리
  const [lifecycleManager, setLifecycleManager] = useState<GameLifecycleManager | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameLifecycleState>(GameLifecycleState.LOBBY);
  
  // 반응속도 게임 상태
  const [currentRound, setCurrentRound] = useState<ReactionRoundData | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('WAITING');
  const [hasClicked, setHasClicked] = useState(false);
  const [myResult, setMyResult] = useState<ReactionResult | null>(null);
  const [allResults, setAllResults] = useState<ReactionResult[]>([]);
  const [readyCount, setReadyCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  
  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('게임을 초기화하는 중...');
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const redSignalTimeRef = useRef<number | null>(null);
  const clickTimeRef = useRef<number | null>(null);
  const initializationRef = useRef(false);
  const roundSubscriptionRef = useRef<any>(null);
  
  const userUid = localStorage.getItem('betweenUs_userUid') || '';

  /**
   * 생명주기 관리자 초기화
   */
  const initializeLifecycleManager = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;
    
    try {
      const resolvedSessionId = getSessionIdSync(params, location);
      if (!resolvedSessionId) {
        throw new Error('세션 ID를 찾을 수 없습니다');
      }

      console.log('[REACTION] Initializing lifecycle manager for session:', resolvedSessionId);
      
      const manager = new GameLifecycleManager(
        userUid,
        handleSessionStateChange,
        handleGameError
      );
      
      // 세션 조인
      const gameSession = await manager.joinSession(resolvedSessionId);
      setSession(gameSession);
      setGameState(gameSession.state);
      setTotalPlayers(gameSession.participants.length);
      
      // WebSocket 연결
      await manager.connectWebSocket();
      
      // 이벤트 리스너 설정
      setupEventListeners(manager);
      
      // 플레이어 준비 신호 발송
      await manager.announceReady();
      
      setLifecycleManager(manager);
      setIsLoading(false);
      
      console.log('[REACTION] Lifecycle manager initialized successfully');
      
    } catch (error) {
      console.error('[REACTION] Failed to initialize:', error);
      setError(error instanceof Error ? error.message : '초기화에 실패했습니다');
      setIsLoading(false);
    }
  }, [params, location, userUid]);

  /**
   * 이벤트 리스너 설정
   */
  const setupEventListeners = useCallback((manager: GameLifecycleManager) => {
    manager.on('ready-update', (payload: any) => {
      console.log('[REACTION] Ready update received:', payload);
      setReadyCount(payload.readyCount || 0);
      setTotalPlayers(payload.total || 0);
      
      // 모든 플레이어가 준비되면 게임 UI로 전환
      if (payload.readyCount === payload.total && payload.total >= 2) {
        setGameStatus('WAITING');
        setLoadingMessage('게임이 시작됩니다...');
      }
    });

    manager.on('reaction-round-start', (payload: any) => {
      console.log('[REACTION] Round start received:', payload);
      handleRoundStart(payload);
    });

    manager.on('reaction-red-signal', (payload: any) => {
      console.log('[REACTION] Red signal received:', payload);
      handleRedSignal(payload);
    });

    manager.on('reaction-results', (payload: any) => {
      console.log('[REACTION] Results received:', payload);
      handleRoundResults(payload);
    });

    manager.on('game-end', (payload: any) => {
      console.log('[REACTION] Game ended:', payload);
      handleGameEnd(payload);
    });

    manager.on('state-change', ({ from, to, session: updatedSession }: any) => {
      console.log(`[REACTION] State changed: ${from} → ${to}`);
      setGameState(to);
      setSession(updatedSession);
      updateLoadingMessage(to);
    });
  }, []);

  /**
   * 세션 상태 변경 핸들러
   */
  const handleSessionStateChange = useCallback((updatedSession: GameSession) => {
    setSession(updatedSession);
    setGameState(updatedSession.state);
  }, []);

  /**
   * 게임 에러 핸들러
   */
  const handleGameError = useCallback((error: any) => {
    console.error('[REACTION] Game error:', error);
    setError(error.message);
    
    if (!error.recoverable) {
      showToast('복구할 수 없는 오류가 발생했습니다', 'error');
      setTimeout(() => navigate('/game'), 3000);
    }
  }, [navigate]);

  /**
   * 라운드 시작 처리
   */
  const handleRoundStart = useCallback((roundData: any) => {
    const round: ReactionRoundData = {
      roundId: roundData.roundId || Date.now(),
      roundNumber: roundData.roundNumber || 1,
      status: 'READY'
    };
    
    setCurrentRound(round);
    setGameStatus('READY');
    setHasClicked(false);
    setMyResult(null);
    redSignalTimeRef.current = null;
    clickTimeRef.current = null;
    
    console.log('[REACTION] Round started - waiting for RED signal');
    setLoadingMessage('준비하세요... 빨간 신호를 기다리세요!');
    
  }, []);

  /**
   * 빨간 신호 처리
   */
  const handleRedSignal = useCallback((redData: any) => {
    if (!currentRound) return;
    
    const redTime = redData.redAt || Date.now();
    redSignalTimeRef.current = redTime;
    
    setCurrentRound(prev => prev ? { ...prev, status: 'RED', redAt: redTime } : null);
    setGameStatus('GO');
    
    console.log('[REACTION] RED signal received - click now!');
    setLoadingMessage('클릭하세요!');
  }, [currentRound]);

  /**
   * 클릭 핸들러
   */
  const handleGameClick = useCallback(async () => {
    if (gameStatus !== 'GO' || hasClicked || !currentRound || !lifecycleManager) {
      return;
    }
    
    const clickTime = Date.now();
    clickTimeRef.current = clickTime;
    setHasClicked(true);
    
    // 반응 시간 계산
    const reactionTime = redSignalTimeRef.current ? clickTime - redSignalTimeRef.current : -1;
    const isFalseStart = reactionTime < 0 || !redSignalTimeRef.current;
    
    console.log('[REACTION] Click registered:', { 
      reactionTime, 
      isFalseStart, 
      clickTime, 
      redTime: redSignalTimeRef.current 
    });
    
    setLoadingMessage(
      isFalseStart 
        ? '너무 빨랐습니다! (False Start)' 
        : `반응시간: ${reactionTime}ms`
    );
    
    try {
      // 서버에 클릭 결과 전송
      const response = await fetch(`/api/mini-games/reaction/rounds/${currentRound.roundId}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-USER-UID': userUid
        },
        body: JSON.stringify({
          userUid,
          reactionTimeMs: Math.max(0, reactionTime),
          clickedAt: clickTime
        })
      });
      
      if (response.ok) {
        console.log('[REACTION] Click result sent successfully');
        
        // 임시 결과 표시
        const tempResult: ReactionResult = {
          userUid,
          reactionTimeMs: Math.max(0, reactionTime),
          isFalseStart,
          rank: 0, // 서버에서 계산된 랭킹을 받을 때까지 임시
          clickedAt: clickTime
        };
        
        setMyResult(tempResult);
        setLoadingMessage('결과를 기다리는 중...');
      } else {
        throw new Error('클릭 결과 전송 실패');
      }
    } catch (error) {
      console.error('[REACTION] Failed to send click result:', error);
      showToast('결과 전송에 실패했습니다', 'error');
    }
  }, [gameStatus, hasClicked, currentRound, userUid, lifecycleManager]);

  /**
   * 라운드 결과 처리
   */
  const handleRoundResults = useCallback((resultsData: any) => {
    console.log('[REACTION] Round results received:', resultsData);
    
    if (resultsData.results && Array.isArray(resultsData.results)) {
      setAllResults(resultsData.results);
      
      // 내 결과 찾기 및 업데이트
      const myUpdatedResult = resultsData.results.find((r: ReactionResult) => r.userUid === userUid);
      if (myUpdatedResult) {
        setMyResult(myUpdatedResult);
      }
    }
    
    setGameStatus('FINISHED');
    setLoadingMessage('결과를 확인하세요!');
    
    // 잠시 후 게임 종료 처리
    setTimeout(() => {
      if (lifecycleManager) {
        const fakeEndData = {
          sessionId: session?.sessionId,
          results: resultsData.results || [],
          ranking: resultsData.results?.sort((a: ReactionResult, b: ReactionResult) => a.rank - b.rank) || [],
          winner: resultsData.results?.[0] || null
        };
        handleGameEnd(fakeEndData);
      }
    }, 3000);
  }, [userUid, session, lifecycleManager]);

  /**
   * 게임 종료 처리
   */
  const handleGameEnd = useCallback((endData: any) => {
    console.log('[REACTION] Game completed with results:', endData);
    
    // 결과를 localStorage에 저장
    localStorage.setItem('reactionGameResults', JSON.stringify({
      sessionId: session?.sessionId,
      gameType: 'REACTION',
      completedAt: Date.now(),
      myResult: myResult,
      allResults: allResults,
      ranking: endData.ranking || allResults,
      winner: endData.winner || (allResults.length > 0 ? allResults[0] : null)
    }));
    
    // 결과 페이지로 이동
    navigate(`/game/reaction/result/${session?.sessionId}`, {
      state: {
        gameType: 'REACTION',
        sessionId: session?.sessionId,
        results: endData
      },
      replace: true
    });
  }, [session, myResult, allResults, navigate]);

  /**
   * 로딩 메시지 업데이트
   */
  const updateLoadingMessage = useCallback((state: GameLifecycleState) => {
    const messages = {
      [GameLifecycleState.LOBBY]: '로비에서 대기 중...',
      [GameLifecycleState.PREPARING]: '게임을 준비하는 중...',
      [GameLifecycleState.READY_CHECK]: '플레이어 준비 상태 확인 중...',
      [GameLifecycleState.IN_PROGRESS]: '게임이 시작됩니다...',
      [GameLifecycleState.ROUND_ACTIVE]: '반응하세요!',
      [GameLifecycleState.ROUND_END]: '결과를 처리하는 중...',
      [GameLifecycleState.CALCULATING]: '최종 결과를 계산하는 중...',
      [GameLifecycleState.ERROR]: '오류가 발생했습니다...',
      [GameLifecycleState.RECOVERING]: '연결을 복구하는 중...'
    };
    
    setLoadingMessage(messages[state] || '처리 중...');
  }, []);

  /**
   * 게임 시작 (호스트 전용)
   */
  const handleStartGame = useCallback(async () => {
    if (!lifecycleManager || !lifecycleManager.isHost()) {
      return;
    }
    
    try {
      await lifecycleManager.startGame();
    } catch (error) {
      console.error('[REACTION] Failed to start game:', error);
      showToast('게임 시작에 실패했습니다', 'error');
    }
  }, [lifecycleManager]);

  /**
   * 게임 포기
   */
  const handleGiveUp = useCallback(() => {
    if (lifecycleManager) {
      lifecycleManager.cleanup();
    }
    navigate('/game');
  }, [lifecycleManager, navigate]);

  // 초기화
  useEffect(() => {
    initializeLifecycleManager();
    
    return () => {
      if (lifecycleManager) {
        lifecycleManager.cleanup();
      }
    };
  }, [initializeLifecycleManager, lifecycleManager]);

  // 픽셀 아트 스타일
  const pixelStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    
    .pixel-reaction-body {
      font-family: 'Press Start 2P', cursive;
      background-color: #2c2d3c;
      color: #f2e9e4;
      background-image: 
        linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px);
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
    
    .pixel-card {
      border: 4px solid #0d0d0d;
      box-shadow: 4px 4px 0px #0d0d0d;
      transition: transform 0.1s linear, box-shadow 0.1s linear;
      font-family: 'Press Start 2P', cursive;
    }
    
    @keyframes pixel-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    @keyframes lightning-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px) rotate(-2deg); }
      75% { transform: translateX(4px) rotate(2deg); }
    }
    
    .game-area {
      width: 100%;
      max-width: 800px;
      height: 500px;
      border: 4px solid #0d0d0d;
      box-shadow: 8px 8px 0px #0d0d0d;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s linear;
    }
    
    .game-area:active {
      transform: translateY(4px);
      box-shadow: 4px 4px 0px #0d0d0d;
    }
  `;

  // 에러 상태 렌더링
  if (error) {
    return (
      <>
        <style>{pixelStyles}</style>
        <div className="pixel-reaction-body">
          <div className="pixel-container">
            <div className="pixel-card" style={{
              backgroundColor: '#4a4e69',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem',
                color: '#ffadad',
                textShadow: '2px 2px 0px #0d0d0d',
                marginBottom: '1rem'
              }}>
                ERROR
              </h2>
              <p style={{ 
                fontSize: '0.8rem',
                color: '#c9c9c9',
                marginBottom: '2rem',
                lineHeight: '1.5'
              }}>
                {error}
              </p>
              <button
                onClick={handleGiveUp}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#fdffb6',
                  color: '#0d0d0d',
                  border: '4px solid #0d0d0d',
                  boxShadow: '4px 4px 0px #0d0d0d',
                  fontSize: '0.8rem',
                  fontFamily: 'Press Start 2P',
                  cursor: 'pointer',
                  transition: 'all 0.1s linear'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '8px 8px 0px #0d0d0d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d';
                }}
              >
                GO HOME
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 로딩/로비 상태 렌더링
  if (isLoading || gameState === GameLifecycleState.LOBBY || gameState === GameLifecycleState.PREPARING) {
    return (
      <>
        <style>{pixelStyles}</style>
        <div className="pixel-reaction-body">
          <div className="pixel-container">
            <div className="pixel-card" style={{
              backgroundColor: '#4a4e69',
              padding: '3rem',
              textAlign: 'center',
              minWidth: '400px'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '2rem',
                animation: 'lightning-shake 2s ease-in-out infinite'
              }}>
                ⚡
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                color: '#fdffb6',
                textShadow: '3px 3px 0px #0d0d0d',
                marginBottom: '1rem'
              }}>
                REACTION GAME
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: '#c9c9c9',
                marginBottom: '2rem',
                animation: 'pixel-pulse 2s ease-in-out infinite'
              }}>
                {loadingMessage}
              </p>
              
              {gameState === GameLifecycleState.LOBBY && session?.hostUid === userUid && (
                <div>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: readyCount >= 2 ? '#caffbf' : '#9a8c98',
                    color: '#0d0d0d',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    border: '3px solid #0d0d0d',
                    boxShadow: '3px 3px 0px #0d0d0d',
                    marginBottom: '1.5rem'
                  }}>
                    READY: {readyCount}/{totalPlayers}
                  </div>
                  <br />
                  <button
                    onClick={handleStartGame}
                    disabled={readyCount < 2}
                    style={{
                      padding: '1rem 2rem',
                      backgroundColor: readyCount >= 2 ? '#caffbf' : '#9a8c98',
                      color: '#0d0d0d',
                      border: '4px solid #0d0d0d',
                      boxShadow: readyCount >= 2 ? '6px 6px 0px #0d0d0d' : '3px 3px 0px #0d0d0d',
                      fontSize: '0.9rem',
                      fontFamily: 'Press Start 2P',
                      cursor: readyCount >= 2 ? 'pointer' : 'not-allowed',
                      opacity: readyCount >= 2 ? 1 : 0.6,
                      transition: 'all 0.1s linear'
                    }}
                    onMouseEnter={(e) => {
                      if (readyCount >= 2) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '10px 10px 0px #0d0d0d';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (readyCount >= 2) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
                      }
                    }}
                  >
                    {readyCount >= 2 ? 'START GAME' : 'WAITING...'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // 대기 상태 렌더링
  if (gameState === GameLifecycleState.READY_CHECK || 
      (gameState === GameLifecycleState.IN_PROGRESS && gameStatus === 'WAITING')) {
    return (
      <>
        <style>{pixelStyles}</style>
        <div className="pixel-reaction-body">
          <div className="pixel-container">
            <div className="pixel-card" style={{
              backgroundColor: '#4a4e69',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '2rem',
                color: '#fdffb6',
                textShadow: '3px 3px 0px #0d0d0d',
                marginBottom: '2rem',
                animation: 'lightning-shake 2s ease-in-out infinite'
              }}>
                GET READY!
              </h2>
              <p style={{
                fontSize: '1rem',
                color: '#c9c9c9',
                marginBottom: '2rem'
              }}>
                {loadingMessage}
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '1rem',
                marginTop: '2rem'
              }}>
                {Array.from({ length: totalPlayers }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: i < readyCount ? '#caffbf' : '#4a4e69',
                      border: '3px solid #0d0d0d',
                      boxShadow: '2px 2px 0px #0d0d0d',
                      animation: i < readyCount ? 'pixel-pulse 1s ease-in-out infinite' : 'none',
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <p style={{
                fontSize: '0.8rem',
                color: '#9ca3af',
                marginTop: '1.5rem'
              }}>
                Players Ready: {readyCount}/{totalPlayers}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 메인 게임 진행 상태 렌더링
  return (
    <>
      <style>{pixelStyles}</style>
      <div className="pixel-reaction-body">
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={handleGiveUp}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#9a8c98',
              color: '#f2e9e4',
              border: '3px solid #0d0d0d',
              boxShadow: '3px 3px 0px #0d0d0d',
              fontSize: '0.7rem',
              fontFamily: 'Press Start 2P',
              cursor: 'pointer',
              transition: 'all 0.1s linear'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '5px 5px 0px #0d0d0d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '3px 3px 0px #0d0d0d';
            }}
          >
            ← HOME
          </button>
        </div>
        
        <div className="pixel-container">
          <div style={{ width: '100%', maxWidth: '900px' }}>
            {/* 게임 헤더 */}
            <div style={{
              backgroundColor: '#4a4e69',
              border: '4px solid #0d0d0d',
              boxShadow: '6px 6px 0px #0d0d0d',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h1 style={{
                fontSize: '2rem',
                color: '#fdffb6',
                textShadow: '4px 4px 0px #0d0d0d',
                marginBottom: '1rem',
                animation: 'lightning-shake 3s ease-in-out infinite'
              }}>
                REACTION SPEED
              </h1>
              <div style={{
                display: 'inline-block',
                padding: '0.5rem 1.5rem',
                backgroundColor: '#fdffb6',
                color: '#0d0d0d',
                fontSize: '1rem',
                fontWeight: 'bold',
                border: '3px solid #0d0d0d',
                boxShadow: '2px 2px 0px #0d0d0d'
              }}>
                PLAYERS: {totalPlayers}
              </div>
            </div>
            
            {/* 게임 상태 표시 */}
            {(gameStatus === 'WAITING' || gameStatus === 'READY' || gameStatus === 'GO') && (
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <p style={{
                  fontSize: '1.2rem',
                  color: gameStatus === 'GO' ? '#ffadad' : '#caffbf',
                  textShadow: '2px 2px 0px #0d0d0d',
                  animation: gameStatus === 'GO' ? 'pixel-pulse 0.5s ease-in-out infinite' : 'none'
                }}>
                  {loadingMessage}
                </p>
              </div>
            )}

            {/* 메인 게임 영역 */}
            <div 
              className="game-area"
              onClick={handleGameClick}
              style={{
                backgroundColor: gameStatus === 'READY' ? '#2c5f2d' : 
                                gameStatus === 'GO' ? '#dc2626' : 
                                '#4a4e69',
                marginBottom: '2rem',
                position: 'relative'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                {gameStatus === 'WAITING' && (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                    <p style={{ fontSize: '1rem', color: '#c9c9c9' }}>WAITING...</p>
                  </>
                )}
                {gameStatus === 'READY' && (
                  <>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🟢</div>
                    <p style={{ fontSize: '1.2rem', color: '#f2e9e4' }}>GET READY!</p>
                    <p style={{ fontSize: '0.8rem', color: '#c9c9c9', marginTop: '1rem' }}>Wait for RED signal...</p>
                  </>
                )}
                {gameStatus === 'GO' && !hasClicked && (
                  <>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'pixel-pulse 0.3s ease-in-out infinite' }}>🔴</div>
                    <p style={{ fontSize: '1.5rem', color: '#f2e9e4', textShadow: '2px 2px 0px #0d0d0d' }}>CLICK NOW!</p>
                  </>
                )}
                {gameStatus === 'GO' && hasClicked && myResult && (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <p style={{ fontSize: '1.2rem', color: '#f2e9e4' }}>CLICKED!</p>
                    {!myResult.isFalseStart && (
                      <p style={{ fontSize: '1.5rem', color: '#caffbf', marginTop: '1rem', fontWeight: 'bold' }}>
                        {myResult.reactionTimeMs}ms
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 결과 표시 */}
            {gameStatus === 'FINISHED' && myResult && (
              <div className="pixel-card" style={{
                backgroundColor: myResult.isFalseStart ? '#dc2626' : '#4a4e69',
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  color: myResult.isFalseStart ? '#f2e9e4' : '#caffbf',
                  textShadow: '2px 2px 0px #0d0d0d',
                  marginBottom: '1rem'
                }}>
                  {myResult.isFalseStart ? 'FALSE START!' : 'SUCCESS!'}
                </h3>
                {!myResult.isFalseStart && (
                  <>
                    <p style={{ 
                      fontSize: '2rem', 
                      color: '#fdffb6',
                      marginBottom: '1rem',
                      fontWeight: 'bold'
                    }}>
                      {myResult.reactionTimeMs}ms
                    </p>
                    <p style={{ 
                      fontSize: '1rem',
                      color: '#f2e9e4'
                    }}>
                      RANK: #{myResult.rank}
                    </p>
                  </>
                )}
              </div>
            )}

            <div style={{
              textAlign: 'center',
              marginTop: '2rem',
              fontSize: '0.7rem',
              color: '#9ca3af'
            }}>
              <p>Press SPACE or CLICK when you see RED signal</p>
            </div>
          </div>
        </div>
        
        {/* 개발용 디버그 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            padding: '0.75rem',
            backgroundColor: '#0d0d0d',
            border: '2px solid #4a4e69',
            color: '#c9c9c9',
            fontSize: '0.6rem',
            fontFamily: 'Press Start 2P',
            zIndex: 1000
          }}>
            <div>State: {gameState}</div>
            <div>Status: {gameStatus}</div>
            <div>Session: {session?.sessionId}</div>
            <div>Ready: {readyCount}/{totalPlayers}</div>
          </div>
        )}
      </div>
    </>
  );
}