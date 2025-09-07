import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore, type LobbyMember } from '../../hooks/useGameStore';
import { getLobbySnapshot, getSessionDetails, ensureJoin } from '../../api/session';
import { startQuizSession } from '../../api/http';
import { TopBar } from '../../components/common/TopBar';
import { createLeaveSessionHandler } from '../../api/session';
import type { SessionDetails } from '../../api/session';
import { subscribeLobbyEvents, PollingManager } from '../../services/ws';
import { getCategoryLabel } from '../../constants/session';
import { PIXEL_STYLES } from '../../styles/pixelStyles';
import { PixelButton } from '../../components/common/PixelUI';

export default function QuizLobbySessionPage() {
    const navigate = useNavigate();
    const { sessionId } = useParams<{ sessionId: string }>();

    const lobbyMembers = useGameStore(s => s.lobbyMembers);
    const session = useGameStore(s => s.session);
    const { setSessionDetails, replaceMembers } = useGameStore();

    const [sessionDetails, setSessionDetailsLocal] = useState<SessionDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const [pollingManager, setPollingManager] = useState<PollingManager | null>(null);
    const [stompConnected, setStompConnected] = useState(false);
    const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

    const getUid = () =>
        sessionStorage.getItem('betweenUs_userUid') ||
        localStorage.getItem('betweenUs_userUid') || '';

    const currentUserUid = getUid();

    const isHost = sessionDetails?.hostId === Number(currentUserUid);
    const memberCount = lobbyMembers.length;
    const sessionStatus = sessionDetails?.status || 'WAITING';

    const canStart = useMemo(() => {
        return isHost && sessionStatus === 'WAITING' && memberCount >= 2;
    }, [isHost, memberCount, sessionStatus, lobbyMembers]);

    const fetchLobby = useCallback(async () => {
        if (!sessionId) return;
        try {
            const [lobbyData, details] = await Promise.all([
                getLobbySnapshot(Number(sessionId)),
                getSessionDetails(Number(sessionId)),
            ]);
            if (details.status === 'IN_PROGRESS') {
                navigate(`/game/quiz/${sessionId}`, {
                    replace: true,
                    state: { category: details.category, fromLobby: true }
                });
                return;
            }
            setSessionDetailsLocal(details);
            const gameSession = {
                sessionId: details.sessionId,
                category: details.category || 'default',
                hostUid: details.hostId,
                participants: details.participants || [],
                totalRounds: details.totalRounds || 5
            };
            setSessionDetails(gameSession);
            if (lobbyData && lobbyData.members) {
                const members: LobbyMember[] = lobbyData.members.map((m: any) => ({
                    uid: m.userUid,
                    role: m.userUid === details.hostId ? 'HOST' : 'MEMBER',
                    score: 0,
                    joinedAt: m.joinedAt
                }));
                replaceMembers(members, (lobbyData as any).version);
            }
        } catch (error: any) {
            console.error('Failed to fetch lobby:', error);
            if (error.code === 'ECONNABORTED') {
                console.warn('[QUIZ-LOBBY] 로비 동기화 지연 (timeout)');
                return;
            }
            alert('로비 정보를 가져오지 못했습니다.');
            navigate('/game');
        }
    }, [sessionId, navigate, setSessionDetails, replaceMembers]);

    const handleStartGame = async () => {
        if (!sessionId || !sessionDetails) return;
        setIsStarting(true);
        try {
            await startQuizSession(Number(sessionId), {
                category: session?.category
            });
            navigate(`/game/quiz/${sessionId}`, {
                replace: true,
                state: { category: session?.category, fromLobby: true }
            });
        } catch (error: any) {
            console.error('[QUIZ-LOBBY] Failed to start quiz (after retries):', error);
            alert('게임 시작에 실패했습니다.'); // Simplified error for example
        } finally {
            setIsStarting(false);
        }
    };

    const copyInviteLink = async () => {
        if (!sessionDetails?.inviteCode) return;
        const inviteUrl = `${window.location.origin}/game/join?code=${sessionDetails.inviteCode}`;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            alert('초대 링크가 복사되었습니다!');
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
        let polling: PollingManager;
        let unsub: (() => void) | null = null;
        let disposed = false;
        (async () => {
            try {
                const joinResult = await ensureJoin(Number(sessionId));
                if (joinResult?.shouldRedirect && (joinResult as any).redirectPath) {
                    navigate((joinResult as any).redirectPath, { replace: true });
                    return;
                }
                if (joinResult?.lobbySnapshot) {
                    const { members: raw, version } = joinResult.lobbySnapshot as any;
                    const members: LobbyMember[] = raw.map((m: any) => ({
                        uid: m.uid, role: m.role, score: m.score || 0, joinedAt: m.joinedAt
                    }));
                    replaceMembers(members, version);
                }
                await fetchLobby();
                if (disposed) return;
                polling = new PollingManager({ fetchFunction: fetchLobby, intervalMs: 2500, enabled: true });
                setPollingManager(polling);
                polling.start();
                setStompConnected(true);
                polling.stop();
                unsub = subscribeLobbyEvents({
                    client: null,
                    sessionId,
                    gameType: 'QUIZ',
                    onLobbyUpdate: (data: any) => {
                        const members: LobbyMember[] = data.members.map((m: any) => ({
                            uid: m.uid, role: m.role, score: m.score || 0, joinedAt: m.joinedAt
                        }));
                        replaceMembers(members, data.version);
                    },
                    onGameStart: () => {
                        navigate(`/game/quiz/${sessionId}`, {
                            replace: true,
                            state: { category: session?.category, fromLobby: true }
                        });
                    },
                    onKicked: (data: any) => {
                        alert(data.message || '방장에 의해 강퇴되었습니다.');
                        navigate('/game', { replace: true });
                    }
                });
                setUnsubscribe(() => unsub);
            } catch (error) {
                console.error('[QUIZ-LOBBY] Initialization failed:', error);
                alert('로비 초기화에 실패했습니다.');
                navigate('/game');
            } finally {
                setIsLoading(false);
            }
        })();
        return () => {
            disposed = true;
            unsub?.();
            polling?.cleanup?.();
        };
    }, [sessionId, currentUserUid, fetchLobby, navigate, replaceMembers, session?.category]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && sessionId) {
                fetchLobby();
            }
        };
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted && sessionId) {
                fetchLobby();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pageshow', handlePageShow);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [sessionId, fetchLobby]);


    // --- 스타일 및 렌더링 ---

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

    if (!sessionDetails) {
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
                                style={{ fontSize: '0.8rem' }}
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
                
                .pixel-quiz-lobby-body {
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
            `}</style>
            <div className="pixel-quiz-lobby-body">
                <TopBar 
                    title="퀴즈 게임 로비" 
                    onQuit={createLeaveSessionHandler(sessionId)} 
                    showQuit={!!sessionId}
                />
                
                <div className="pixel-container">
                    {/* 게임 헤더 */}
                    <div className="pixel-header" style={{ textAlign: 'center' }}>
                        <h1 style={{ 
                            fontSize: '2.5rem', 
                            color: '#ffadad',
                            textShadow: '4px 4px 0px #0d0d0d',
                            marginBottom: '1rem'
                        }}>
                            QUIZ LOBBY
                        </h1>
                        <p style={{ 
                            fontSize: '1rem',
                            color: '#c9c9c9',
                            lineHeight: '1.5',
                            marginBottom: '1rem'
                        }}>
                            지식과 재미를 동시에!
                        </p>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#ffadad',
                            color: '#0d0d0d',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            border: '3px solid #0d0d0d',
                            boxShadow: '3px 3px 0px #0d0d0d'
                        }}>
                            {memberCount}/10명
                        </div>
                        {session?.category && (
                            <p style={{
                                fontSize: '0.8rem',
                                color: '#ffd6a5',
                                marginTop: '1rem'
                            }}>
                                카테고리: {getCategoryLabel(session.category)}
                            </p>
                        )}
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
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {lobbyMembers.length > 0 ? lobbyMembers.map((member, index) => (
                                    <div key={member.uid} className="pixel-member-card">
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}>
                                            <span style={{
                                                fontSize: '1.2rem',
                                                color: '#ffadad',
                                                fontWeight: 'bold'
                                            }}>
                                                #{index + 1}
                                            </span>
                                            <span style={{
                                                fontSize: '0.9rem',
                                                color: '#f2e9e4',
                                                flex: '1'
                                            }}>
                                                {member.uid === currentUserUid ? '> YOU' : String(member.uid).substring(0, 8)}
                                            </span>
                                            {member.role === 'HOST' && (
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

                        {/* 게임 정보 및 초대 카드 */}
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
                                    onClick={handleStartGame}
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
                                        Need at least 2 players
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

