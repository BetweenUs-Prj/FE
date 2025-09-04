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

    const isHost = sessionDetails?.hostUid === currentUserUid;
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
                hostUid: details.hostUid,
                participants: details.participants || [],
                totalRounds: details.totalRounds || 5
            };
            setSessionDetails(gameSession);
            if (lobbyData && lobbyData.members) {
                const members: LobbyMember[] = lobbyData.members.map((m: any) => ({
                    uid: m.userUid,
                    role: m.userUid === details.hostUid ? 'HOST' : 'MEMBER',
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
        const inviteUrl = `${window.location.origin}/join?code=${sessionDetails.inviteCode}`;
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
            <style>{PIXEL_STYLES}</style>
            <div className="pixel-lobby-body">
                <TopBar 
                    title="퀴즈 게임 로비" 
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
                                🧠 퀴즈 게임 로비
                            </h1>
                            <p style={{ 
                                fontSize: '0.8rem',
                                marginBottom: '1rem',
                                color: '#d1d5db'
                            }}>
                                지식으로 승부하는 퀴즈 게임!
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
                                {memberCount}/10명 참여
                            </div>
                            {session?.category && (
                                <div style={{
                                    display: 'block',
                                    fontSize: '0.7rem',
                                    color: '#9ca3af'
                                }}>
                                    카테고리: <span style={{ color: '#fbbf24' }}>{getCategoryLabel(session.category)}</span>
                                </div>
                            )}
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
                                {lobbyMembers.length > 0 ? lobbyMembers.map((member, index) => (
                                    <div key={member.uid} style={{
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
                                                {member.uid === currentUserUid ? '>>> 나' : member.uid.substring(0, 12)}
                                            </span>
                                            {member.role === 'HOST' && (
                                                <span style={{
                                                    fontSize: '0.6rem',
                                                    color: '#fbbf24',
                                                    fontWeight: 'bold'
                                                }}>
                                                    👑 방장
                                                </span>
                                            )}
                                        </div>
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
                                style={{ fontSize: '0.8rem' }}
                            >
                                초대 링크 복사
                            </PixelButton>
                        </div>

                        {/* 게임 시작 버튼 - 방장만 표시 */}
                        {isHost && (
                            <div style={{ textAlign: 'center' }}>
                                <PixelButton
                                    onClick={handleStartGame}
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
                                        시작하려면 최소 2명이 필요합니다
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
                                    게임이 시작되면 자동으로 퀴즈 게임 페이지로 이동합니다
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

