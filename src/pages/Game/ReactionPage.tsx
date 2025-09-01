import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useReactionStore } from '../../hooks/useReactionStore';
import { http } from '../../api/http';
import { showToast } from '../../components/common/Toast';
import { createLeaveSessionHandler, ensureJoin } from '../../api/session';
import { getSessionIdSync, setSessionId } from '../../utils/sessionUtils';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { 
  GameHeader, 
  GameContainer, 
  ReactionGameArea, 
  ThemeButton, 
  LoadingCard 
} from '../../components';

// 게임 상태 정의
type GameStatus = 'WAITING' | 'READY' | 'GO' | 'FINISHED';

// 반응 속도 결과 타입
type ReactionResult = {
  userUid: string;
  reactionTimeMs: number;
  isFalseStart: boolean;
  rank: number;
};

export default function ReactionPage() {
  const params = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { resetGame } = useReactionStore();
  
  // 세션 관리 상태
  const [sessionId, setSessionIdState] = useState<number | null>(null);
  const [session, setSession] = useState<{status: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('세션 정보를 확인하는 중...');
  const [readyCount, setReadyCount] = useState(0);
  const [isWaitingForPlayers, setIsWaitingForPlayers] = useState(false);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  
  // 게임 상태
  const [status, setStatus] = useState<GameStatus>('WAITING');
  const [hasClicked, setHasClicked] = useState(false);
  const [myResult, setMyResult] = useState<ReactionResult | null>(null);
  const [allResults, setAllResults] = useState<ReactionResult[]>([]);
  const [participants, setParticipants] = useState<number>(0);
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);
  
  // 타이밍 관련 refs
  const startTimeRef = useRef<number | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const roundSubscriptionRef = useRef<any>(null);
  const syncedRef = useRef(false);
  const syncingRef = useRef(false);
  const sessionIdRef = useRef<number | null>(null);
  
  const userUid = localStorage.getItem('betweenUs_userUid') || '';
  const isHost = location.state?.isHost || false;
  
  // 🔒 syncOnce 게이트: effectiveStatus로 완화된 게이트
  const syncOnce = async (sid?: number, force = false) => {
    const useSessionId = typeof sid === 'number' ? sid : sessionIdRef.current; // ✅

    if (syncedRef.current || syncingRef.current) {
      console.log('[REACTION] 🚫 syncOnce: already synced or syncing');
      return;
    }
    if (!useSessionId || !userUid) {
      console.log('[REACTION] 🚫 syncOnce: missing sessionId or userUid');
      return;
    }
    
    // ✅ force가 아니면만 게이트 체크
    if (!force) {
      const effectiveStatus = 
        session?.status ?? 
        location.state?.sessionDetails?.status ?? 
        'WAITING';
      
      if (effectiveStatus !== 'IN_PROGRESS') {
        console.log('[REACTION] 🚫 syncOnce: effectiveStatus', effectiveStatus, '- blocking sync');
        return;
      }
    }
    
    console.log('[REACTION] 🔄 syncOnce: attempting sync for session', useSessionId);
    syncingRef.current = true;
    
    try {
      await http.post(`/mini-games/reaction/${useSessionId}/sync`); // 헤더로 X-USER-UID 붙음
      syncedRef.current = true;
      console.log('[REACTION] ✅ syncOnce: ok');
    } catch (e: any) {
      console.warn('[REACTION] ⚠️ syncOnce failed:', e?.message);
    } finally {
      syncingRef.current = false;
    }
  };
  
  // 📡 게임페이지 도착 알림 발행
  const announceReady = (client: Client) => {
    const sid = sessionIdRef.current;
    if (!sid || !userUid) {
      console.warn('[REACTION] 🚫 announceReady: missing sessionId or userUid');
      return;
    }
    
    console.log('[REACTION] 📡 announceReady: publishing ready signal for', userUid);
    
    try {
      // STOMP 연결·구독 완료 이후에 1회 발행
      client.publish({
        destination: `/app/reaction/${sid}/ready`,
        body: JSON.stringify({ uid: userUid }),
      });
      console.log('[REACTION] ✅ announceReady: ready signal sent');
    } catch (error) {
      console.error('[REACTION] ❌ announceReady: failed to send ready signal:', error);
    }
  };

  // 🎮 1단계: 모든 플레이어가 준비되었을 때 게임 시작
  const startGameWhenAllReady = async (sessionId: number) => {
    if (!isHost) return;
    
    try {
      console.log('[REACTION] 🚀 All players ready, starting game as host');
      const startResponse = await http.post(`/mini-games/sessions/${sessionId}/start`, {});
      console.log('[REACTION] ✅ Game started successfully:', startResponse.data);
    } catch (error) {
      console.error('[REACTION] ❌ Failed to start game:', error);
      showToast('게임 시작에 실패했습니다.', 'error');
    }
  };

  // 🎮 2단계: 게임 시작 이벤트 처리
  const handleGameStart = () => {
    console.log('[REACTION] 🎮 Game start event received');
    setIsWaitingForPlayers(false);
    setStatus('WAITING'); // 초기 대기 상태
    setLoadingMessage('게임이 시작되었습니다...');
    
    // 게임 시작 후 즉시 로딩 상태 해제
    setIsLoading(false);
  };

  // 🎮 3단계: 라운드 시작 이벤트 처리
  const handleRoundStart = (roundData: any) => {
    console.log('[REACTION] 🎯 Round start event received:', roundData);
    
    setCurrentRoundId(roundData.roundId);
    setStatus('READY'); // "준비하세요..." 상태
    setHasClicked(false);
    setMyResult(null);
    startTimeRef.current = null;
    
    console.log('[REACTION] 🟢 READY state - waiting for RED signal...');
  };

  // 🎮 3단계: RED 신호 수신 처리
  const handleRedSignal = (redData: any) => {
    console.log('[REACTION] 🔴 RED signal received:', redData);
    
    setStatus('GO'); // "클릭!" 상태
    startTimeRef.current = redData.redAt || Date.now();
    
    console.log('[REACTION] 🔴 GO state - click now!');
  };

  // 🎮 3단계: 클릭 핸들러
  const handleClick = () => {
    if (status !== 'GO' || hasClicked) return;
    
    const clickTime = Date.now();
    const reactionTime = startTimeRef.current ? clickTime - startTimeRef.current : 0;
    
    console.log('[REACTION] 🖱️ Click registered:', { 
      reactionTime, 
      clickTime, 
      startTime: startTimeRef.current 
    });
    
    setHasClicked(true);
    
    // 서버에 클릭 결과 전송
    if (currentRoundId) {
      http.post(`/mini-games/reaction/rounds/${currentRoundId}/click`, {
        userUid,
        reactionTimeMs: reactionTime
      }).then(() => {
        console.log('[REACTION] ✅ Click result sent successfully');
      }).catch(error => {
        console.error('[REACTION] ❌ Failed to send click result:', error);
      });
    }
  };

  // 🎮 4단계: 라운드 결과 처리
  const handleRoundResults = (resultsData: any) => {
    console.log('[REACTION] 🏆 Round results received:', resultsData);
    
    if (resultsData.results) {
      setAllResults(resultsData.results);
      
      // 내 결과 찾기
      const myResult = resultsData.results.find((r: ReactionResult) => r.userUid === userUid);
      if (myResult) {
        setMyResult(myResult);
        setStatus('FINISHED');
        console.log('[REACTION] 🎯 My result:', myResult);
      }
    }
  };

  // 🎮 4단계: 게임 종료 처리
  const handleGameEnd = (endData: any) => {
    console.log('[REACTION] 🏁 Game end received:', endData);
    
    // 게임 결과를 localStorage에 저장
    localStorage.setItem('reactionGameResults', JSON.stringify({
      sessionId: sessionId,
      gameType: 'REACTION',
      completedAt: Date.now(),
      overallRanking: endData.overallRanking || [],
      penalty: endData.penalty || null
    }));
    
    // 결과 페이지로 이동
    navigate(`/game/reaction/result/${sessionId}`, {
      state: {
        gameType: 'REACTION',
        sessionId: sessionId
      },
      replace: true
    });
  };

  // 홈으로 이동
  const handleGoHome = () => {
    resetGame();
    navigate('/game');
  };

  // 포기 처리
  const handleGiveUp = () => {
    resetGame();
    navigate('/game');
  };

  // 세션 초기화
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('[REACTION] 🔄 Initializing session...');
        console.log('[REACTION] 🔄 Location state:', location.state);
        
        const resolvedSessionId = getSessionIdSync(params, location);
        
        if (!resolvedSessionId) {
          console.error('[REACTION] ❌ No session ID found');
          showToast('세션 정보를 찾을 수 없습니다.', 'error');
          navigate('/game');
          return;
        }
        
        setSessionIdState(resolvedSessionId);
        setSessionId(resolvedSessionId);          // 기존 로컬스토리지 유틸
        sessionIdRef.current = resolvedSessionId; // ✅ ref에도 즉시 반영
        
        // 게스트가 직접 URL로 들어와도 멤버십 보장(멱등)
        try {
          await http.post(`/mini-games/sessions/${resolvedSessionId}/join`);
          console.log('[REACTION] ✅ Join request sent (idempotent)');
        } catch (joinError) {
          console.log('[REACTION] 📊 Join request failed (probably already joined):', joinError);
        }
        
        // 세션 상태 로드 + 폴백 처리
        const load = async () => {
          try {
            const sessionResponse = await http.get(`/mini-games/sessions/${resolvedSessionId}`);
            const sessionData = sessionResponse.data;
            
            // ✅ 세션 정보를 store와 ref에 즉시 갱신
            setSession({ status: sessionData.status });
            
            console.log('[REACTION] 📊 Session data loaded:', sessionData);
            
            // ✅ IN_PROGRESS면 바로 syncOnce() 호출 (status가 확실해졌으니 지체없이 동기화)
            if (sessionData.status === 'IN_PROGRESS') {
              console.log('[REACTION] 🔄 IN_PROGRESS, syncOnce(force)');
              await syncOnce(resolvedSessionId, true); // ✅
            }
            
            return sessionData;
          } catch (error) {
            console.warn('[REACTION] ⚠️ Failed to load session, using fallback');
            setSession({ status: 'WAITING' });
            return { status: 'WAITING', total: 2, gameType: 'REACTION' };
          }
        };
        
        const sessionData = await load();
        
        // 로비에서 전달된 상태가 있으면 참가자 수만 세팅
        if (location.state?.lobby) {
          console.log('[REACTION] 📊 Using lobby state from navigation');
          const lobbyState = location.state.lobby;
          setParticipants(lobbyState.total || 0);
          setTotalPlayers(lobbyState.total || 0);
          // ❌ 상태 덮어쓰기/return 하지 마세요
        }
        
        // 로비에서 전달된 플레이어 정보가 있으면 사용
        if (location.state?.players) {
          console.log('[REACTION] 👥 Using players from navigation state');
          setParticipants(location.state.players.length);
          setTotalPlayers(location.state.players.length);
        }
        
        // 세션 참가 확인 (기존 ensureJoin 대신 위에서 처리됨)
        // const joinResult = await ensureJoin(resolvedSessionId);
        // console.log('[REACTION] ✅ Session joined:', joinResult);
        
        if (sessionData.gameType && sessionData.gameType !== 'REACTION') {
          console.error('[REACTION] ❌ Invalid game type:', sessionData.gameType);
          showToast('잘못된 게임 타입입니다.', 'error');
          navigate('/game');
          return;
        }
        
        // 세션 상태 확인
        if (sessionData.status === 'FINISHED') {
          console.log('[REACTION] 🏁 Session already finished, navigating to results');
          navigate(`/game/reaction/result/${resolvedSessionId}`, { replace: true });
          return;
        }
        
        // UI 상태 설정 (마운트 직후 자동 sync() 제거)
        setParticipants(sessionData.total || 2);
        setTotalPlayers(sessionData.total || 2);
        
        if (sessionData.status === 'IN_PROGRESS') {
          console.log('[REACTION] 🎮 Game already IN_PROGRESS, showing game UI');
          setIsWaitingForPlayers(false);
          setStatus('WAITING');
        } else {
          console.log('[REACTION] 💭 Game in WAITING state, showing waiting UI');
          setIsWaitingForPlayers(true);
          setLoadingMessage('다른 플레이어들을 기다리는 중...');
        }
        
        setIsLoading(false);
        console.log('[REACTION] ✅ Session initialized successfully');
        
      } catch (error) {
        console.error('[REACTION] ❌ Failed to initialize session:', error);
        showToast('세션 초기화에 실패했습니다.', 'error');
        navigate('/game');
      }
    };
    
    initializeSession();
  }, [params.sessionId, location.state, navigate]);

  // WebSocket 연결 및 구독 설정
  useEffect(() => {
    if (!sessionId || isLoading) return;

    console.log('[REACTION-STOMP] 🔌 Connecting to WebSocket for session:', sessionId);
    
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('[REACTION-STOMP]', str);
      }
    });

    client.onConnect = () => {
      const sid = sessionIdRef.current;               // ✅ 최신 세션ID
      if (!sid) { console.warn('No sid yet'); return; }
      
      console.log('[REACTION-STOMP] ✅ Connected to WebSocket for session:', sid);
      stompClientRef.current = client;
      
      // 모든 구독 설정
      const subscriptions: any[] = [];
      
      // 게임 시작 이벤트 구독
      subscriptions.push(client.subscribe(`/topic/reaction/${sid}/start`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          console.log('[REACTION-STOMP] 🚀 Game start event received:', payload);
          console.log('[REACTION-STOMP] 🚀 Raw message body:', message.body);
          
          // 세션 상태를 IN_PROGRESS로 업데이트
          setSession(s => s ? {...s, status: 'IN_PROGRESS'} : {status: 'IN_PROGRESS'} as any);
          
          handleGameStart();
          
          // ✅ STOMP 이벤트에서는 무조건 syncOnce() 실행 (상태 체크 없이 바로)
          console.log('[REACTION-STOMP] 🔄 Game start event received, triggering syncOnce');
          syncOnce(sid, true);                                 // ✅
        } catch (error) {
          console.error('[REACTION-STOMP] Failed to parse start event:', error);
        }
      }));

      // 라운드 시작 이벤트 구독
      subscriptions.push(client.subscribe(`/topic/reaction/${sid}/round`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          console.log('[REACTION-STOMP] 🎯 Round event received:', payload);
          
          if (payload.type === 'ROUND_START') {
            // 세션 상태를 IN_PROGRESS로 업데이트
            setSession(s => s ? {...s, status: 'IN_PROGRESS'} : {status: 'IN_PROGRESS'} as any);
            
            // ✅ STOMP 이벤트에서는 무조건 syncOnce() 실행 (상태 체크 없이 바로)
            console.log('[REACTION-STOMP] 🔄 ROUND_START received, triggering syncOnce');
            syncOnce(sid, true);                               // ✅
            
            handleRoundStart(payload);
            
            // 라운드별 상태 이벤트 구독 (RED 신호)
            if (roundSubscriptionRef.current) {
              roundSubscriptionRef.current.unsubscribe();
            }
            
            roundSubscriptionRef.current = client.subscribe(`/topic/reaction/${payload.roundId}/state`, (stateMsg) => {
              try {
                const statePayload = JSON.parse(stateMsg.body);
                console.log('[REACTION-STOMP] 🔴 Round state received:', statePayload);
                
                if (statePayload.status === 'RED') {
                  handleRedSignal(statePayload);
                }
              } catch (error) {
                console.error('[REACTION-STOMP] ❌ Error parsing state message:', error);
              }
            });
          }
        } catch (error) {
          console.error('[REACTION-STOMP] Failed to parse round event:', error);
        }
      }));

      // Ready 상태 구독 (게임페이지 도착 신호 처리)
      subscriptions.push(client.subscribe(`/topic/reaction/${sid}/ready`, (message) => {
        try {
          const ev = JSON.parse(message.body);
          console.log('[REACTION-STOMP] 📡 Ready event received:', ev);
          setReadyCount(ev.readyCount ?? 0);
          
          // 게임이 시작된 후 readyCount가 total과 같으면 동기화 실행
          const effectiveStatus = 
            session?.status ?? 
            location.state?.sessionDetails?.status ?? 
            'WAITING';
          
          if (effectiveStatus === 'IN_PROGRESS' && ev.readyCount === ev.total) {
            console.log('[REACTION-STOMP] 🔄 Game IN_PROGRESS and all players ready, triggering syncOnce');
            syncOnce(sid, true);                               // ✅
          }
          
          // 🚨 임시 해결책: 서버가 ROUND_START를 발행하지 않으므로 클라이언트에서 자동 시작
          if (ev.readyCount === ev.total && ev.total >= 2) {
            console.log('[REACTION-STOMP] 🚨 Auto-starting game (server ROUND_START not received)');
            setTimeout(() => {
              console.log('[REACTION-STOMP] 🎮 Auto-starting game after delay');
              setStatus('WAITING');
              setIsWaitingForPlayers(false);
              setIsLoading(false);
              // 첫 라운드 시작 시뮬레이션
              handleRoundStart({
                type: 'ROUND_START',
                roundId: 'auto-round-1',
                roundNumber: 1
              });
            }, 2000); // 2초 후 자동 시작
          }
        } catch (error) {
          console.error('[REACTION-STOMP] Failed to parse ready event:', error);
        }
      }));

      // 라운드 결과 구독
      subscriptions.push(client.subscribe(`/topic/reaction/${sid}/round-results`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          console.log('[REACTION-STOMP] 🏆 Round results received:', payload);
          handleRoundResults(payload);
        } catch (error) {
          console.error('[REACTION-STOMP] Failed to parse round results:', error);
        }
      }));

      // 게임 종료 구독
      subscriptions.push(client.subscribe(`/topic/reaction/${sid}/game-end`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          console.log('[REACTION-STOMP] 🏁 Game end event received:', payload);
          handleGameEnd(payload);
        } catch (error) {
          console.error('[REACTION-STOMP] Failed to parse game end event:', error);
        }
      }));

      // ✅ 모든 구독을 잡은 뒤에 "도착" 알림 (재연결 시에도 호출)
      console.log('[REACTION-STOMP] 📡 All subscriptions completed, announcing ready');
      announceReady(client);

      // 구독 정리 함수 저장
      return () => {
        console.log('[REACTION-STOMP] 🧹 Cleaning up subscriptions');
        subscriptions.forEach(sub => sub.unsubscribe());
      };
    };

    client.onDisconnect = () => {
      console.log('[REACTION-STOMP] ❌ Disconnected from WebSocket');
      stompClientRef.current = null;
    };

    client.onStompError = (frame) => {
      console.error('[REACTION-STOMP] Error:', frame);
    };

    client.activate();

    return () => {
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [sessionId, isLoading, navigate, userUid, isHost, totalPlayers]);
  
  // ❌ 마운트 직후 자동 sync() 제거: syncOnce()만 사용
  // useEffect(() => {
  //   if (!sessionId || !userUid || session?.status !== 'IN_PROGRESS' || hasSyncedRef.current) {
  //     return;
  //   }
  //   
  //   console.log('[REACTION] 🔄 Session is IN_PROGRESS, sending sync request');
  //   hasSyncedRef.current = true;
  //   
  //   http.post(`/mini-games/reaction/${sessionId}/sync`, { uid: userUid })
  //     .then(() => {
  //       console.log('[REACTION] ✅ Sync request sent successfully');
  //     })
  //     .catch(error => {
  //       console.warn('[REACTION] ⚠️ Failed to send sync request:', error);
  //       // 필요하면 재시도
  //       hasSyncedRef.current = false;
  //     });
  // }, [sessionId, userUid, session?.status]);

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div 
        style={{
          background: '#FFFFFF',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#333333'
        }}
      >
        <div style={{
          fontSize: '1.2rem',
          color: '#666666',
          marginBottom: '1rem'
        }}>
          {loadingMessage}
        </div>
        
        {/* 🧪 수동 테스트 버튼 (개발용) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={() => {
              console.log('[REACTION] 🧪 Manual game start test');
              setStatus('WAITING');
              setIsWaitingForPlayers(false);
              setIsLoading(false);
              // 첫 라운드 시작 시뮬레이션
              handleRoundStart({
                type: 'ROUND_START',
                roundId: 'manual-round-1',
                roundNumber: 1
              });
            }}
            style={{
              background: 'rgba(249, 109, 60, 0.8)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            🧪 수동 게임 시작 테스트
          </button>
        )}
      </div>
    );
  }

  // 플레이어 대기 상태 표시
  if (isWaitingForPlayers) {
    return (
      <GameContainer>
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #FCB422 0%, #F97B25 100%)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(252, 180, 34, 0.3)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              color: '#FFFFFF',
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              ⚡ 반응속도 게임 준비 중
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#FFFFFF',
              marginBottom: '2rem',
              opacity: 0.9
            }}>
              다른 플레이어들이 게임 페이지에 도착할 때까지 기다려주세요
            </p>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '1.1rem',
                color: '#FFFFFF',
                marginBottom: '0.5rem'
              }}>
                준비된 플레이어: {readyPlayers.length}/{totalPlayers}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '1rem'
              }}>
                {Array.from({ length: totalPlayers }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: i < readyPlayers.length ? '#10B981' : 'rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {isHost && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#FFFFFF',
                  opacity: 0.8,
                  marginBottom: '1rem'
                }}>
                  호스트: 모든 플레이어가 준비되면 자동으로 게임이 시작됩니다
                </p>
                
                <button
                  onClick={() => startGameWhenAllReady(sessionId!)}
                  disabled={readyPlayers.length < 2}
                  style={{
                    background: readyPlayers.length >= 2 
                      ? 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)' 
                      : 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '0.8rem 1.5rem',
                    fontSize: '0.9rem',
                    cursor: readyPlayers.length >= 2 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    opacity: readyPlayers.length >= 2 ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if (readyPlayers.length >= 2) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 119, 129, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (readyPlayers.length >= 2) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {readyPlayers.length >= 2 ? '🚀 지금 게임 시작' : '⏳ 플레이어 대기 중'}
                </button>
              </div>
            )}
          </div>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer>
      <GameHeader 
        title="⚡ 반응속도 게임 ⚡"
        onGiveUp={handleGiveUp}
        backPath="/game"
      />
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* 참가자 수 표시 */}
        <div 
          style={{
            marginBottom: '2rem',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(20, 119, 129, 0.3)',
            color: '#FFFFFF',
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: '600',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
          }}
        >
          참가자: {participants}명
        </div>

        {/* 메인 게임 영역 */}
        <ReactionGameArea
          status={status}
          onGameClick={handleClick}
          myResult={myResult ? {
            reactionTimeMs: myResult.reactionTimeMs,
            isFalseStart: myResult.isFalseStart,
            rank: myResult.rank
          } : undefined}
          style={{
            marginBottom: '2rem'
          }}
        />

        {/* 하단 버튼들 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <ThemeButton
            variant="primary"
            onClick={handleGoHome}
          >
            홈으로
          </ThemeButton>
        </div>

        {/* 게임 상태 디버그 정보 (개발용) */}
        {process.env.NODE_ENV === 'development' && (
          <div 
            style={{
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)',
              borderRadius: '12px',
              fontSize: '0.8rem',
              opacity: 0.8,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              color: '#FFFFFF',
              zIndex: 1000
            }}
          >
            <div>Status: {status}</div>
            <div>Session: {sessionId}</div>
            <div>Clicked: {hasClicked ? 'Y' : 'N'}</div>
            <div>Round: {currentRoundId || 'None'}</div>
            <div>Loading: {isLoading ? 'Y' : 'N'}</div>
            <div>Waiting: {isWaitingForPlayers ? 'Y' : 'N'}</div>
            <div>Host: {isHost ? 'Y' : 'N'}</div>
            <div>Players: {participants}</div>
          </div>
        )}
      </div>
    </GameContainer>
  );
}