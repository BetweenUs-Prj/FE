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

  // 에러 상태 렌더링
  if (error) {
    return (
      <GameContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>오류 발생</h2>
          <p style={{ marginBottom: '2rem' }}>{error}</p>
          <ThemeButton variant="primary" onClick={handleGiveUp}>
            게임 홈으로 돌아가기
          </ThemeButton>
        </div>
      </GameContainer>
    );
  }

  // 로딩/로비 상태 렌더링
  if (isLoading || gameState === GameLifecycleState.LOBBY || gameState === GameLifecycleState.PREPARING) {
    return (
      <GameContainer>
        <LoadingCard message={loadingMessage} variant="primary" spinnerColor="white" />
        
        {gameState === GameLifecycleState.LOBBY && session?.hostUid === userUid && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ marginBottom: '1rem' }}>
              준비된 플레이어: {readyCount}/{totalPlayers}
            </p>
            <ThemeButton
              variant="primary"
              onClick={handleStartGame}
              disabled={readyCount < 2}
            >
              {readyCount >= 2 ? '게임 시작' : '플레이어 대기 중'}
            </ThemeButton>
          </div>
        )}
      </GameContainer>
    );
  }

  // 대기 상태 렌더링
  if (gameState === GameLifecycleState.READY_CHECK || 
      (gameState === GameLifecycleState.IN_PROGRESS && gameStatus === 'WAITING')) {
    return (
      <GameContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>⚡ 반응속도 게임 준비 중</h2>
          <p style={{ marginBottom: '1rem' }}>{loadingMessage}</p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '0.5rem',
            marginTop: '2rem'
          }}>
            {Array.from({ length: totalPlayers }, (_, i) => (
              <div
                key={i}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: i < readyCount ? '#10B981' : 'rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </GameContainer>
    );
  }

  // 메인 게임 진행 상태 렌더링
  return (
    <GameContainer>
      <GameHeader
        title="⚡ 반응속도 게임 ⚡"
        onGiveUp={handleGiveUp}
        backPath="/game"
      />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
        {/* 참가자 수 표시 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)',
          borderRadius: '20px',
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: '600'
        }}>
          참가자: {totalPlayers}명
        </div>
        
        {/* 게임 상태 표시 */}
        {(gameStatus === 'WAITING' || gameStatus === 'READY' || gameStatus === 'GO') && (
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: gameStatus === 'GO' ? '#ef4444' : '#10B981'
          }}>
            {loadingMessage}
          </div>
        )}

        {/* 메인 게임 영역 */}
        <ReactionGameArea
          status={gameStatus}
          onGameClick={handleGameClick}
          myResult={myResult ? {
            reactionTimeMs: myResult.reactionTimeMs,
            isFalseStart: myResult.isFalseStart,
            rank: myResult.rank
          } : undefined}
          style={{ marginBottom: '2rem' }}
        />

        {/* 결과 표시 */}
        {gameStatus === 'FINISHED' && myResult && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: myResult.isFalseStart ? 
              'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
              'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '20px',
            color: 'white',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>
              {myResult.isFalseStart ? '❌ False Start!' : '✅ 완료!'}
            </h3>
            {!myResult.isFalseStart && (
              <>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {myResult.reactionTimeMs}ms
                </p>
                <p style={{ fontSize: '1.2rem' }}>
                  순위: {myResult.rank}등
                </p>
              </>
            )}
          </div>
        )}

        {/* 하단 버튼 */}
        <div style={{ textAlign: 'center' }}>
          <ThemeButton variant="primary" onClick={handleGiveUp}>
            홈으로
          </ThemeButton>
        </div>

        {/* 개발용 디버그 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '0.8rem',
            zIndex: 1000
          }}>
            <div>Game State: {gameState}</div>
            <div>Game Status: {gameStatus}</div>
            <div>Session: {session?.sessionId}</div>
            <div>Round: {currentRound?.roundId}</div>
            <div>Clicked: {hasClicked ? 'Y' : 'N'}</div>
            <div>Ready: {readyCount}/{totalPlayers}</div>
          </div>
        )}
      </div>
    </GameContainer>
  );
}