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
  const isHost = lobby?.hostUid === currentUserUid;
  const headCount = lobby?.total ?? lobby?.members?.length ?? 0;
  const sessionStatus = sessionDetails?.status || 'WAITING';
  
  // 세션 상태 ref 업데이트
  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);
  const readyCount = lobby?.readyCount ?? lobby?.members?.filter(m => m.isReady).length ?? 0;
  const canStart = isHost && sessionStatus === 'WAITING' && headCount >= 2 && readyCount >= 2;

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
        hostUid: details.hostUid,
        participants: details.participants || [],
        totalRounds: details.totalRounds || 5
      };
      setStoreSession(gameSession);
      
      // 플레이어 목록 업데이트
      const playerList = snapshot.members.map(member => ({
        id: member.userUid,
        name: member.userUid.substring(0, 8),
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
    
    const inviteUrl = `${window.location.origin}/join?code=${sessionDetails.inviteCode}`;
    
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
      <style>{PIXEL_STYLES}</style>
      <div className="pixel-lobby-body">
        <TopBar 
          title="반응속도 게임 로비" 
          onQuit={createLeaveSessionHandler(sessionId)} 
          showQuit={!!sessionId}
        />
        
        <div style={{
          paddingTop: '80px',
          minHeight: '100vh',
          padding: '2rem'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* 게임 정보 */}
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '3px solid #fbbf24',
              boxShadow: '6px 6px 0px #0d0d0d',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h1 style={{ 
                fontSize: '1.8rem', 
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#fbbf24',
                textShadow: '2px 2px 0px #0d0d0d'
              }}>
                ⚡ 반응속도 게임 로비
              </h1>
              <p style={{ 
                fontSize: '0.8rem',
                marginBottom: '1rem',
                color: '#d1d5db'
              }}>
                빠른 반응속도를 테스트해보세요!
              </p>
              <div style={{
                display: 'inline-block',
                fontSize: '0.8rem',
                padding: '0.5rem 1rem',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid #10b981',
                color: '#10b981',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                {lobby.total}/{lobby.capacity}명 참여
              </div>
            </div>

            {/* 게임 규칙 */}
            <div style={{
              background: 'rgba(13, 13, 13, 0.4)',
              border: '2px solid #4b5563',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                marginBottom: '1rem',
                textAlign: 'center',
                color: '#fbbf24'
              }}>
                🎯 게임 규칙
              </h3>
              <div style={{
                fontSize: '0.7rem',
                lineHeight: '1.8',
                color: '#d1d5db'
              }}>
                <p>🟢 초록 신호가 나타나면 준비하세요!</p>
                <p>⏱️ 1.5~4초 후 빨간 신호가 나타납니다</p>
                <p>🔴 빨간 신호가 나타나면 즉시 클릭하세요!</p>
                <p>⚠️ 빨간 신호 전에 클릭하면 False Start입니다</p>
              </div>
            </div>

            {/* 준비 상태 요약 */}
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '2px solid #fbbf24',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: '#fbbf24',
                marginBottom: '0.5rem'
              }}>
                준비된 플레이어: {lobby?.members?.filter(m => m.isReady).length || 0}/{lobby?.total || 0}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#9ca3af'
              }}>
                {lobby?.members?.filter(m => m.isReady).length === lobby?.total && lobby?.total >= 2 
                  ? '🚀 모든 플레이어가 준비되었습니다!' 
                  : '최소 2명의 플레이어가 필요합니다'}
              </div>
            </div>

            {/* 참가자 목록 */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '3px solid #10b981',
              boxShadow: '6px 6px 0px #0d0d0d',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#10b981',
                  textShadow: '2px 2px 0px #0d0d0d',
                  margin: 0
                }}>
                  👥 참가자 목록
                </h3>
                <PixelButton 
                  onClick={fetchLobby}
                  variant="default"
                  size="small"
                  style={{
                    fontSize: '0.6rem',
                    backgroundColor: '#4b5563',
                    color: '#f2e9e4'
                  }}
                >
                  새로고침
                </PixelButton>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '250px',
                overflowY: 'auto'
              }}>
                {lobby.members.length > 0 ? lobby.members.map((member, index) => (
                  <div key={member.userUid} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(13, 13, 13, 0.4)',
                    border: '2px solid #4b5563'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        minWidth: '2rem',
                        color: '#f2e9e4'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{
                        fontSize: '0.8rem',
                        color: '#f2e9e4',
                        wordBreak: 'break-all'
                      }}>
                        {member.userUid === currentUserUid ? '>>> 나' : member.userUid.substring(0, 12)}
                      </span>
                      {member.userUid === session?.hostUid && (
                        <span style={{
                          fontSize: '0.6rem',
                          color: '#fbbf24',
                          fontWeight: 'bold'
                        }}>
                          👑 호스트
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      color: member.isReady ? '#10b981' : '#fcd34d',
                      fontWeight: 'bold'
                    }}>
                      {member.isReady ? '✅ 준비완료' : '⏳ 대기중'}
                    </span>
                  </div>
                )) : (
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center' }}>참가자를 기다리는 중...</p>
                )}
              </div>
            </div>

            {/* 초대 링크 */}
            <div style={{
              background: 'rgba(13, 13, 13, 0.4)',
              border: '2px solid #4b5563',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#d1d5db'
              }}>
                🔗 초대 링크
              </h3>
              <p style={{ 
                fontSize: '1.2rem', 
                color: '#fbbf24', 
                wordBreak: 'break-all', 
                marginBottom: '1.5rem',
                fontWeight: 'bold'
              }}>
                {sessionDetails?.inviteCode}
              </p>
              <PixelButton
                onClick={copyInviteLink}
                variant="warning"
                size="medium"
                style={{
                  fontSize: '0.8rem'
                }}
              >
                초대 링크 복사
              </PixelButton>
            </div>


            {/* 게임 시작 버튼 - 방장만 표시 */}
            {isHost && (
              <div style={{ textAlign: 'center' }}>
                
                <PixelButton
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
                  variant={canStart ? 'success' : 'default'}
                  style={{
                    fontSize: '0.9rem',
                    padding: '1rem 3rem',
                    width: '100%',
                    maxWidth: '300px',
                    backgroundColor: canStart ? '#10b981' : '#4b5563',
                    color: canStart ? '#0d0d0d' : '#9ca3af',
                    opacity: canStart ? 1 : 0.7
                  }}
                >
                  {isStarting ? '게임 시작 중...' : '🚀 게임 시작'}
                </PixelButton>
                {!canStart && (
                  <p style={{
                    fontSize: '0.7rem',
                    marginTop: '0.5rem',
                    color: '#9ca3af'
                  }}>
                    {!isHost 
                      ? '방장만 게임을 시작할 수 있습니다.'
                      : sessionStatus !== 'WAITING'
                      ? '게임이 이미 진행 중이거나 종료되었습니다.'
                      : headCount < 2
                      ? '최소 2명 이상 참가해야 게임을 시작할 수 있습니다.'
                      : readyCount < 2
                      ? '모든 플레이어가 준비 상태여야 게임을 시작할 수 있습니다.'
                      : '게임을 시작할 수 없습니다.'
                    }
                  </p>
                )}
              </div>
            )}

            {/* 참가자용 대기 메시지 */}
            {!isHost && (
              <div style={{
                background: 'rgba(13, 13, 13, 0.4)',
                border: '2px solid #4b5563',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#d1d5db',
                  marginBottom: '0.5rem'
                }}>
                  ⏳ 방장이 게임을 시작할 때까지 기다려주세요
                </p>
                <p style={{
                  fontSize: '0.7rem',
                  color: '#9ca3af'
                }}>
                  게임이 시작되면 자동으로 반응속도 게임 페이지로 이동합니다
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
