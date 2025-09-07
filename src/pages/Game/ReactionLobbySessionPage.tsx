import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../hooks/useGameStore';
import { getLobbySnapshot, getSessionDetails, ensureJoin, startSession } from '../../api/session';
import { TopBar } from '../../components/common/TopBar';
import { createLeaveSessionHandler } from '../../api/session';
import type { LobbySnapshot, SessionDetails } from '../../api/session';
import { http } from '../../api/http';
import { PIXEL_STYLES } from '../../styles/pixelStyles';
import { PixelButton } from '../../components/common/PixelUI';

export default function ReactionLobbySessionPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { setPlayers, session, setSessionDetails: setStoreSession } = useGameStore();
  
  const [lobby, setLobby] = useState<LobbySnapshot | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const jumpedRef = useRef(false);
  const sessionStatusRef = useRef<string>('WAITING');
  const isStartingRef = useRef(false);
  const startedRef = useRef(false);

  const currentUserUid = localStorage.getItem('betweenUs_userUid') || '';
  const isHost = sessionDetails?.hostId === Number(currentUserUid);
  const headCount = lobby?.total ?? lobby?.members?.length ?? 0;
  const sessionStatus = sessionDetails?.status || 'WAITING';
  
  // 세션 상태 ref 업데이트
  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);
  const readyCount = lobby?.readyCount ?? lobby?.members?.filter(m => m.isReady).length ?? 0;
  const canStart = isHost && sessionStatus === 'WAITING' && headCount >= 2;

  // 게임 페이지로 이동 (중복 방지)
  const goToGamePage = () => {
    if (jumpedRef.current || !sessionId) return;
    jumpedRef.current = true;
    console.log('[LOBBY] 🎮 Navigating to game page for session:', sessionId);
    console.log('[LOBBY] 🎮 Passing state:', {
      sessionId: Number(sessionId),
      isHost: isHost,
      gameType: 'REACTION',
      lobby: lobby,
      sessionDetails: sessionDetails
    });
    
    // REST 기반 반응속도 게임 페이지로 이동
    navigate(`/game/reaction/play/${sessionId}`, { 
      state: { 
        sessionId: Number(sessionId),
        isHost: isHost,
        gameType: 'REACTION',
        lobby: lobby,
        sessionDetails: sessionDetails,
        players: lobby?.members || []
      } 
    });
  };

  // 내 ready 상태 조회
  const getMyReady = async (sessionId: number, myUid: string): Promise<boolean> => {
    try {
      const response = await http.get(`/mini-games/sessions/${sessionId}/lobby`);
      const snap = response.data;
      const me = snap.members?.find((m: any) => m.userUid === myUid || m.uid === myUid);
      return !!me?.isReady;
    } catch (error) {
      console.error('[LOBBY] Failed to get my ready state:', error);
      return false;
    }
  };

  // 원하는 상태로 설정 (현재 상태와 다를 때만 토글)
  const setReady = async (sessionId: number, desired: boolean, myUid: string) => {
    // 게임 시작 후 ready 상태 변경 방지 (409 에러 방지)
    if (sessionStatusRef.current !== 'WAITING') {
      console.log(`[LOBBY] 🚫 Preventing ready call - session status is ${sessionStatusRef.current}, not WAITING`);
      return;
    }
    
    try {
      const currentReady = await getMyReady(sessionId, myUid);
      console.log(`[LOBBY] Current ready: ${currentReady}, desired: ${desired}`);
      
      if (currentReady !== desired) {
        await http.post(`/mini-games/sessions/${sessionId}/ready`); // 서버는 토글만 제공
        console.log(`[LOBBY] Toggled ready state from ${currentReady} to ${desired}`);
      } else {
        console.log(`[LOBBY] Already in desired state (${desired}), skipping toggle`);
      }
    } catch (error: any) {
      // 409 Conflict는 게임 시작 후 ready 변경 시도로, 정상적인 상황이므로 무시
      if (error?.response?.status === 409) {
        console.log(`[LOBBY] ✅ Ignoring 409 Conflict - game already started, ready change rejected (expected)`);
        return;
      }
      console.error(`[LOBBY] Failed to set ready state to ${desired}:`, error);
    }
  };

  const fetchLobby = async () => {
    if (!sessionId) return;
    
    try {
      // ensureJoin으로 참가 상태 보장
      if (!hasJoined) {
        const joinResult = await ensureJoin(Number(sessionId));
        setHasJoined(true);
        
        // 게임이 이미 진행 중이면 리다이렉트
        if (joinResult.shouldRedirect && joinResult.redirectPath) {
          console.log('[LOBBY] Redirecting to:', joinResult.redirectPath);
          navigate(joinResult.redirectPath);
          return;
        }
      }
      
      const [snapshot, details] = await Promise.all([
        getLobbySnapshot(Number(sessionId)),
        getSessionDetails(Number(sessionId))
      ]);
      
      setLobby(snapshot);
      setSessionDetails(details);
      
      // 세션 정보를 전역 store에 저장
      const gameSession = {
        sessionId: details.sessionId,
        category: 'REACTION',
        hostUid: details.hostId,
        participants: details.participants || [],
        totalRounds: details.totalRounds || 5
      };
      setStoreSession(gameSession);
      
      // 플레이어 목록 업데이트
      const playerList = snapshot.members.map(member => ({
        id: member.userUid,
        name: String(member.userUid).substring(0, 8),
        score: 0,
      }));
      setPlayers(playerList);
    } catch (error) {
      console.error('Failed to fetch lobby:', error);
      alert('로비 정보를 가져오지 못했습니다.');
      navigate('/game');
    }
  };

  const handleStartGame = async () => {
    if (!sessionId || !lobby) return;
    
    // 중복 시작 방지
    if (isStarting || sessionStatusRef.current !== 'WAITING') {
      console.log('[REACTION-LOBBY] 🚫 Preventing duplicate start - isStarting:', isStarting, 'status:', sessionStatusRef.current);
      return;
    }

    setIsStarting(true);
    isStartingRef.current = true;                        // ✅ ref도 같이 올려줌
    
    try {
      console.log('[REACTION-LOBBY] 🚀 호스트: POST /sessions/{id}/start 성공 후에만 이동');
      console.log('[REACTION-LOBBY] 🚀 Starting game session:', sessionId);
      console.log('[REACTION-LOBBY] 🚀 Lobby state:', lobby);
      console.log('[REACTION-LOBBY] 🚀 Session details:', sessionDetails);
      
      // 호스트: 게임 시작 API 호출
      const response = await http.post(`/mini-games/sessions/${sessionId}/start`, {});
      console.log('[REACTION-LOBBY] ✅ Game session started successfully:', response.data);
      
      // ✅ 낙관적 전이: 언마운트 전에 상태를 IN_PROGRESS로 바꿔 cleanup에서 ready=false를 안 보내게 함
      sessionStatusRef.current = 'IN_PROGRESS';
      setSessionDetails((prev) => prev ? { ...prev, status: 'IN_PROGRESS' } : prev);
      
      // 호스트는 낙관적 이동 허용 (게스트는 이벤트로 이동)
      startedRef.current = true; // ✅
      console.log('[REACTION-LOBBY] 🎮 HOST: Navigating to game page after successful start');
      goToGamePage();
      
    } catch (error: any) {
      console.error('[REACTION-LOBBY] ❌ Failed to start game:', error);
      console.error('[REACTION-LOBBY] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // 더 구체적인 에러 메시지 표시
      let errorMessage = '게임을 시작할 수 없습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      setIsStarting(false);
      isStartingRef.current = false; // 에러 시 ref도 리셋
    }
  };


  const copyInviteLink = async () => {
    if (!sessionDetails?.inviteCode) return;
    
    const inviteUrl = `${window.location.origin}/game/join?code=${sessionDetails.inviteCode}`;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
        alert('초대 링크가 복사되었습니다!');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = inviteUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          alert('초대 링크가 복사되었습니다!');
        } catch (err) {
          alert('클립보드 복사에 실패했습니다.');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Copy failed:', err);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (!sessionId) {
      navigate('/game');
      return;
    }

    fetchLobby().finally(() => setIsLoading(false));

    // 3초마다 로비 상태 폴링 (더 자주 업데이트)
    const interval = setInterval(() => {
      fetchLobby();
    }, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, [sessionId]);

  // 로비에서 ready 상태 자동 설정
  useEffect(() => {
    if (!sessionId || !currentUserUid || isLoading || !hasJoined) return; // ✅ hasJoined 추가
    
    console.log('[LOBBY] Setting ready state for user:', currentUserUid);
    setReady(Number(sessionId), true, currentUserUid);
    
    return () => {
      // 언마운트 시 ready 상태 해제 (WAITING 상태일 때만)
      console.log('[LOBBY] Cleaning up ready state for user:', currentUserUid);

      // ✅ 게임 시작 중이거나 이미 IN_PROGRESS면 ready=false 보내지 않음
      if (startedRef.current || isStartingRef.current || sessionStatusRef.current !== 'WAITING') {
        console.log('[LOBBY] 🚫 Skipping ready cleanup - started or isStarting or not WAITING:', {
          started: startedRef.current, isStarting: isStartingRef.current, status: sessionStatusRef.current
        });
        return;
      }

      setReady(Number(sessionId), false, currentUserUid);
    };
  }, [sessionId, currentUserUid, isLoading, hasJoined]); // ✅ hasJoined 의존성 추가



  // 게임 시작 이벤트 감지 (폴링 기반)
  useEffect(() => {
    if (!sessionId || jumpedRef.current) return;
    
    console.log('[LOBBY] 🎯 Starting session status polling');
    
    const checkGameStarted = async () => {
      try {
        const details = await getSessionDetails(parseInt(sessionId));
        if (details.status === 'IN_PROGRESS' && !startedRef.current) {
          console.log('[LOBBY] 🚀 Game started, navigating to game page');
          startedRef.current = true;
          goToGamePage();
        }
      } catch (error) {
        console.error('[LOBBY] Error checking session status:', error);
      }
    };
    
    // 1초마다 상태 체크
    const intervalId = setInterval(checkGameStarted, 1000);
    
    return () => {
      console.log('[LOBBY] 🧹 Stopping session status polling');
      clearInterval(intervalId);
    };
  }, [sessionId]);




  if (isLoading) {
    return (
      <>
        <style>{PIXEL_STYLES}</style>
        <div className="pixel-lobby-body">
          <div className="pixel-container">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '2rem', animation: 'pulse 2s ease-in-out infinite' }}>⏳</div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f2e9e4' }}>로딩 중...</h2>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>로비 정보를 불러오고 있습니다</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!lobby) {
    return (
      <>
        <style>{PIXEL_STYLES}</style>
        <div className="pixel-lobby-body">
          <div className="pixel-container">
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#ef4444', marginBottom: '1.5rem', fontSize: '1rem' }}>로비를 찾을 수 없습니다.</p>
              <PixelButton 
                onClick={() => navigate('/game')}
                variant="warning"
                size="medium"
              >
                게임 홈으로 돌아가기
              </PixelButton>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .pixel-reaction-lobby-body {
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
          justify-content: flex-start;
          min-height: 100vh;
          padding: 2rem;
          padding-top: 110px;
        }

        .pixel-header {
          background-color: #4a4e69;
          padding: 2rem 3rem;
          border: 4px solid #0d0d0d;
          box-shadow: 8px 8px 0px #0d0d0d;
          margin-bottom: 2rem;
          max-width: 700px;
          width: 100%;
        }

        .pixel-card {
          border: 4px solid #0d0d0d;
          box-shadow: 4px 4px 0px #0d0d0d;
          transition: transform 0.1s linear, box-shadow 0.1s linear;
          font-family: 'Press Start 2P', cursive;
        }

        .pixel-card:hover {
          transform: translateY(-4px);
          box-shadow: 8px 8px 0px #0d0d0d;
        }

        .pixel-member-card {
          border: 4px solid #0d0d0d;
          background-color: #4a4e69;
          padding: 1rem;
          margin-bottom: 0.5rem;
          transition: all 0.1s linear;
        }

        .pixel-member-card:hover {
          transform: translateX(4px);
          background-color: #565b78;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes lightning {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-4px) rotate(-5deg); }
          75% { transform: translateY(4px) rotate(5deg); }
        }
      `}</style>
      <div className="pixel-reaction-lobby-body">
        <TopBar 
          title="반응속도 게임 로비" 
          onQuit={createLeaveSessionHandler(sessionId)} 
          showQuit={!!sessionId}
        />
        
        <div className="pixel-container">
          {/* 게임 헤더 */}
          <div className="pixel-header" style={{ textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              color: '#fdffb6',
              textShadow: '4px 4px 0px #0d0d0d',
              marginBottom: '1rem',
              animation: 'lightning 2s ease-in-out infinite'
            }}>
              REACTION LOBBY
            </h1>
            <p style={{ 
              fontSize: '1rem',
              color: '#c9c9c9',
              lineHeight: '1.5',
              marginBottom: '1rem'
            }}>
              집중력과 순발력 대결!
            </p>
            <div style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#fdffb6',
              color: '#0d0d0d',
              fontSize: '1rem',
              fontWeight: 'bold',
              border: '3px solid #0d0d0d',
              boxShadow: '3px 3px 0px #0d0d0d'
            }}>
              {lobby.total}/{lobby.capacity}명
            </div>
          </div>

          {/* 게임 규칙 카드 */}
          <div className="pixel-card" style={{
            backgroundColor: '#4a4e69',
            padding: '2rem',
            marginBottom: '2rem',
            maxWidth: '700px',
            width: '100%'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#caffbf',
              textShadow: '2px 2px 0px #0d0d0d',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              GAME RULES
            </h2>
            <div style={{
              fontSize: '0.9rem',
              lineHeight: '2',
              color: '#f2e9e4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>• GREEN SIGNAL = GET READY!</p>
              <p style={{ marginBottom: '0.5rem' }}>• WAIT 1.5-4 SECONDS</p>
              <p style={{ marginBottom: '0.5rem' }}>• RED SIGNAL = CLICK NOW!</p>
              <p style={{ color: '#ffadad' }}>• EARLY CLICK = FALSE START</p>
            </div>
          </div>


          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '900px' }}>
            {/* 참가자 목록 카드 */}
            <div className="pixel-card" style={{
              backgroundColor: '#4a4e69',
              padding: '2rem',
              flex: '1',
              minWidth: '350px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  color: '#ffd6a5',
                  textShadow: '2px 2px 0px #0d0d0d'
                }}>
                  PLAYERS
                </h2>
                <button
                  onClick={fetchLobby}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#9a8c98',
                    color: '#f2e9e4',
                    border: '3px solid #0d0d0d',
                    boxShadow: '2px 2px 0px #0d0d0d',
                    fontSize: '0.7rem',
                    fontFamily: 'Press Start 2P',
                    cursor: 'pointer',
                    transition: 'all 0.1s linear'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d';
                  }}
                >
                  REFRESH
                </button>
              </div>
              
              <div style={{
                fontSize: '0.9rem',
                color: '#caffbf',
                marginBottom: '1rem',
                textAlign: 'center',
                padding: '0.5rem',
                backgroundColor: '#0d0d0d',
                border: '2px solid #caffbf'
              }}>
                READY: {lobby?.members?.filter(m => m.isReady).length || 0}/{lobby?.total || 0}
              </div>
              
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {lobby.members.length > 0 ? lobby.members.map((member, index) => (
                  <div key={member.userUid} className="pixel-member-card">
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <span style={{
                        fontSize: '1.2rem',
                        color: '#fdffb6',
                        fontWeight: 'bold'
                      }}>
                        #{index + 1}
                      </span>
                      <span style={{
                        fontSize: '0.9rem',
                        color: '#f2e9e4',
                        flex: '1'
                      }}>
                        {member.userUid === Number(currentUserUid) ? '> YOU' : String(member.userUid).substring(0, 8)}
                      </span>
                      {member.userUid === session?.hostUid && (
                        <span style={{
                          fontSize: '0.7rem',
                          color: '#ffd6a5',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#0d0d0d',
                          border: '2px solid #ffd6a5'
                        }}>
                          HOST
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.7rem',
                        color: member.isReady ? '#caffbf' : '#ffadad',
                        fontWeight: 'bold'
                      }}>
                        {member.isReady ? 'READY' : 'WAIT'}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p style={{ 
                    fontSize: '0.9rem', 
                    color: '#c9c9c9', 
                    textAlign: 'center',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    Waiting for players...
                  </p>
                )}
              </div>
            </div>

            {/* 초대 코드 카드 */}
            <div className="pixel-card" style={{
              backgroundColor: '#4a4e69',
              padding: '2rem',
              flex: '1',
              minWidth: '350px'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fdffb6',
                textShadow: '2px 2px 0px #0d0d0d',
                marginBottom: '1.5rem'
              }}>
                INVITE CODE
              </h2>
              <div style={{
                backgroundColor: '#0d0d0d',
                padding: '1.5rem',
                border: '3px solid #fdffb6',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{ 
                  fontSize: '1.5rem', 
                  color: '#fdffb6', 
                  wordBreak: 'break-all',
                  fontWeight: 'bold',
                  letterSpacing: '2px'
                }}>
                  {sessionDetails?.inviteCode}
                </p>
              </div>
              <button
                onClick={copyInviteLink}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#fdffb6',
                  color: '#0d0d0d',
                  border: '4px solid #0d0d0d',
                  boxShadow: '4px 4px 0px #0d0d0d',
                  fontSize: '0.9rem',
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
                COPY LINK
              </button>
            </div>
          </div>


          {/* 게임 시작/대기 영역 */}
          <div style={{ 
            marginTop: '2rem',
            width: '100%',
            maxWidth: '700px',
            textAlign: 'center'
          }}>
            {isHost ? (
              <>
                <button
                  onClick={() => {
                    console.log('[REACTION-LOBBY] 🎯 Game start button clicked');
                    console.log('[REACTION-LOBBY] 🎯 Current state:', {
                      sessionId,
                      isHost,
                      sessionStatus,
                      headCount,
                      readyCount,
                      canStart,
                      lobby,
                      sessionDetails
                    });
                    handleStartGame();
                  }}
                  disabled={isStarting || !canStart}
                  style={{
                    padding: '1.5rem 3rem',
                    backgroundColor: canStart ? '#caffbf' : '#9a8c98',
                    color: '#0d0d0d',
                    border: '4px solid #0d0d0d',
                    boxShadow: canStart ? '6px 6px 0px #0d0d0d' : '3px 3px 0px #0d0d0d',
                    fontSize: '1.2rem',
                    fontFamily: 'Press Start 2P',
                    cursor: canStart ? 'pointer' : 'not-allowed',
                    opacity: canStart ? 1 : 0.6,
                    transition: 'all 0.1s linear'
                  }}
                  onMouseEnter={(e) => {
                    if (canStart) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '10px 10px 0px #0d0d0d';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canStart) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
                    }
                  }}
                >
                  {isStarting ? 'STARTING...' : 'START GAME'}
                </button>
                {!canStart && (
                  <p style={{
                    fontSize: '0.8rem',
                    marginTop: '1rem',
                    color: '#c9c9c9'
                  }}>
                    {sessionStatus !== 'WAITING'
                      ? 'Game in progress'
                      : headCount < 2
                      ? 'Need at least 2 players'
                      : 'Cannot start game'
                    }
                  </p>
                )}
              </>
            ) : (
              <div className="pixel-card" style={{
                backgroundColor: '#4a4e69',
                padding: '2rem'
              }}>
                <p style={{
                  fontSize: '1rem',
                  color: '#ffd6a5',
                  marginBottom: '1rem',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  WAITING FOR HOST
                </p>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#c9c9c9',
                  lineHeight: '1.5'
                }}>
                  The game will start automatically<br/>when the host begins
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
