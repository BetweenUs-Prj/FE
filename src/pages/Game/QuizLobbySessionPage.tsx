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
    const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };
    const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; } };
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; } };
    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };
    
    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      .pixel-game-body { font-family: 'Press Start 2P', cursive; background-color: #2c2d3c; color: #f2e9e4; background-image: linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px); background-size: 4px 4px; image-rendering: pixelated; min-height: 100vh; }
      .pixel-container { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; padding: 2rem; text-align: center; }
      .pixel-box { background-color: #4a4e69; padding: 1.5rem; border: 4px solid #0d0d0d; box-shadow: 8px 8px 0px #0d0d0d; width: 100%; margin-bottom: 2rem; }
      .pixel-title { font-size: 1.8rem; color: #ffd6a5; text-shadow: 3px 3px 0px #0d0d0d; margin: 0; }
      .pixel-button { font-family: 'Press Start 2P', cursive; color: #f2e9e4; border: 4px solid #0d0d0d; box-shadow: 4px 4px 0px #0d0d0d; padding: 1rem; cursor: pointer; transition: transform 0.1s linear, box-shadow 0.1s linear; text-align: center; background-color: #9a8c98; }
      .pixel-button:disabled { background-color: #3b3d51; color: #6e6f7a; cursor: not-allowed; box-shadow: 4px 4px 0px #0d0d0d; transform: translateY(0); }
      .status-indicator { position: fixed; top: 20px; right: 20px; padding: 0.5rem; border: 4px solid #0d0d0d; font-size: 0.8rem; z-index: 10; }
      .member-list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background-color: #22223b; border: 4px solid #0d0d0d; margin-bottom: 1rem; }
      @keyframes blink { 50% { opacity: 0; } }
      .blinking-cursor { animation: blink 1s step-end infinite; }
    `;

    if (isLoading) {
        return (
            <>
                <style>{styles}</style>
                <div className="pixel-game-body">
                    <div className="pixel-container" style={{ justifyContent: 'center' }}>
                        <h1 className="pixel-title" style={{ fontSize: '1.5rem' }}>LOADING<span className="blinking-cursor">_</span></h1>
                    </div>
                </div>
            </>
        );
    }

    if (!sessionDetails) {
        return (
            <>
                <style>{styles}</style>
                <div className="pixel-game-body">
                    <div className="pixel-container" style={{ justifyContent: 'center' }}>
                        <div className="pixel-box" style={{backgroundColor: '#9d2929'}}>
                             <h1 className="pixel-title" style={{color: '#f2e9e4'}}>ERROR</h1>
                             <p style={{fontSize: '1rem', marginBottom: '2rem'}}>로비를 찾을 수 없습니다.</p>
                        </div>
                        <button onClick={() => navigate('/game')} className="pixel-button" onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut}>
                            게임 홈으로
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{styles}</style>
            <div className="pixel-game-body">
                {/* TopBar는 현재 픽셀 스타일과 맞지 않을 수 있어 주석 처리했습니다. */}
                {/* <TopBar title="퀴즈 로비" onQuit={createLeaveSessionHandler(sessionId)} showQuit={!!sessionId} /> */}
                
                <div className="pixel-container" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '4rem' }}>
                    <div className="status-indicator" style={{ backgroundColor: stompConnected ? '#6a856f' : '#c19454' }}>
                        {stompConnected ? '실시간 연결' : '폴링 모드'}
                    </div>

                    <div style={{ width: '100%', marginBottom: '2rem' }}>
                        <div className="pixel-box" style={{ padding: '1rem' }}>
                            <h1 className="pixel-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>퀴즈 로비</h1>
                            <p style={{ fontSize: '0.9rem', color: '#c9c9c9', margin: 0 }}>
                                카테고리: <span style={{ color: '#fdffb6' }}>{getCategoryLabel(session?.category)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="pixel-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', textShadow: '2px 2px 0px #0d0d0d', margin: 0 }}>참가자 ({memberCount}/10)</h2>
                            <button onClick={fetchLobby} className="pixel-button" style={{ padding: '0.5rem', fontSize: '0.7rem', backgroundColor: '#22223b' }}>새로고침</button>
                        </div>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '1rem' }}>
                            {lobbyMembers.length > 0 ? lobbyMembers.map((member) => (
                                <div key={member.uid} className="member-list-item">
                                    <span style={{ wordBreak: 'break-all' }}>{member.uid === currentUserUid ? '>>> 나' : member.uid.substring(0, 12)}</span>
                                    <span>{member.role === 'HOST' ? '[[방장]]' : ''}</span>
                                </div>
                            )) : <p>참가자를 기다리는 중...</p>}
                        </div>
                    </div>

                    <div className="pixel-box">
                        <h2 style={{ fontSize: '1rem', textShadow: '2px 2px 0px #0d0d0d', marginBottom: '1rem' }}>초대 코드</h2>
                        <p style={{ fontSize: '1.5rem', color: '#fdffb6', wordBreak: 'break-all', marginBottom: '1.5rem' }}>{sessionDetails?.inviteCode}</p>
                        <button onClick={copyInviteLink} className="pixel-button" onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>링크 복사</button>
                    </div>

                    {isHost && (
                        <div style={{ width: '100%', marginTop: '1rem' }}>
                            <button onClick={handleStartGame} disabled={isStarting || !canStart} className="pixel-button" style={{ backgroundColor: '#9d2929', fontSize: '1.2rem', padding: '1.2rem' }} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                                {isStarting ? '시작 중...' : '게임 시작'}
                            </button>
                            {!canStart && <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#a1a1a1' }}>시작하려면 최소 2명이 필요합니다</p>}
                        </div>
                    )}

                    {!isHost && (
                        <div className="pixel-box">
                            <p>방장이 시작할 때까지 대기 중<span className="blinking-cursor">_</span></p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

