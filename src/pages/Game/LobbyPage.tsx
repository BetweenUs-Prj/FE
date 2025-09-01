import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLobbySnapshot } from '../../api/session';
import type { LobbySnapshot } from '../../api/session';
import { MAX_PLAYERS } from '../../constants/session';
import { showToast } from '../../components/common/Toast';

export default function LobbyPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [lobby, setLobby] = useState<LobbySnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);

    const userUid = localStorage.getItem('userUid') || 'anonymous-user';

    const loadLobby = useCallback(async () => {
        if (!sessionId) return;
        try {
            // setLoading(true); // Polling 시 깜빡임 방지를 위해 초기 로드 시에만 사용
            const snapshot = await getLobbySnapshot(Number(sessionId));
            setLobby(snapshot);
            setIsHost(snapshot.hostUid === userUid);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load lobby:', err);
            const errorMessage = err?.response?.data?.message || '로비 정보를 불러오는데 실패했습니다.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
            if (err?.response?.status === 404) {
                setTimeout(() => navigate('/game', { replace: true }), 2000);
            }
        } finally {
            setLoading(false);
        }
    }, [sessionId, userUid, navigate]);

    const handleStartGame = async () => {
        if (!lobby || !isHost) return;
        const canStartCondition = lobby.total >= 2 && lobby.total <= MAX_PLAYERS;
        if (!canStartCondition) {
            showToast('최소 2명 이상의 참가자가 필요합니다.', 'error');
            return;
        }
        try {
            const response = await fetch(`/api/mini-games/sessions/${lobby.sessionId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-USER-UID': userUid }
            });
            if (response.ok) {
                const result = await response.json();
                showToast('게임을 시작합니다!', 'success');
                navigate(`/game/quiz/${lobby.sessionId}`, { replace: true });
            } else {
                const errorData = await response.json();
                showToast(errorData.message || '게임 시작에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('[LOBBY] Error starting game:', error);
            showToast('게임 시작 중 오류가 발생했습니다.', 'error');
        }
    };

    useEffect(() => {
        if (sessionId) {
            loadLobby();
        } else {
            showToast('잘못된 접근입니다.', 'error');
            navigate('/game', { replace: true });
        }
    }, [sessionId, loadLobby, navigate]);

    useEffect(() => {
        if (!sessionId || !lobby) return; // 로비 정보가 있을 때만 폴링 시작
        const interval = setInterval(() => loadLobby(), 5000);
        return () => clearInterval(interval);
    }, [sessionId, lobby, loadLobby]);

    // --- 스타일 및 렌더링 ---
    const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };
    const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; } };
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; } };
    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };
    
    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      .pixel-game-body { font-family: 'Press Start 2P', cursive; background-color: #2c2d3c; color: #f2e9e4; background-image: linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px); background-size: 4px 4px; image-rendering: pixelated; min-height: 100vh; }
      .pixel-container { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; padding: 2rem; text-align: center; }
      .pixel-box { background-color: #4a4e69; padding: 1.5rem; border: 4px solid #0d0d0d; box-shadow: 8px 8px 0px #0d0d0d; width: 100%; margin-bottom: 2rem; box-sizing: border-box; }
      .pixel-title { font-size: 1.8rem; color: #ffd6a5; text-shadow: 3px 3px 0px #0d0d0d; margin: 0 0 1.5rem 0; }
      .pixel-button { font-family: 'Press Start 2P', cursive; color: #f2e9e4; border: 4px solid #0d0d0d; box-shadow: 4px 4px 0px #0d0d0d; padding: 1rem; cursor: pointer; transition: transform 0.1s linear, box-shadow 0.1s linear; text-align: center; background-color: #9a8c98; }
      .pixel-button:disabled { background-color: #3b3d51; color: #6e6f7a; cursor: not-allowed; }
      .member-list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background-color: #22223b; border: 4px solid #0d0d0d; margin-bottom: 1rem; }
      @keyframes blink { 50% { opacity: 0; } }
      .blinking-cursor { animation: blink 1s step-end infinite; }
    `;

    if (loading && !lobby) {
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

    if (error) {
        return (
            <>
                <style>{styles}</style>
                <div className="pixel-game-body">
                    <div className="pixel-container" style={{ justifyContent: 'center' }}>
                        <div className="pixel-box" style={{backgroundColor: '#9d2929'}}>
                             <h1 className="pixel-title" style={{color: '#f2e9e4'}}>ERROR</h1>
                             <p style={{fontSize: '1rem', marginBottom: '2rem', wordBreak: 'break-all'}}>{error}</p>
                        </div>
                        <button onClick={() => navigate('/game')} className="pixel-button" onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut}>
                            홈으로
                        </button>
                    </div>
                </div>
            </>
        );
    }
    
    if (!lobby) return null;

    const isFull = lobby.total >= lobby.capacity;
    const canStart = lobby.total >= 2 && lobby.total <= MAX_PLAYERS && isHost;
    // 준비 상태 로직이 있다면 아래와 같이 수정:
    // const canStart = lobby.total >= 2 && lobby.total <= MAX_PLAYERS && lobby.readyCount === lobby.total && isHost;

    return (
        <>
            <style>{styles}</style>
            <div className="pixel-game-body">
                <div className="pixel-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="pixel-box" style={{ position: 'sticky', top: '1rem', zIndex: 10, backgroundColor: isFull ? '#9d2929' : '#4a4e69' }}>
                        <h1 className="pixel-title" style={{ marginBottom: 0, fontSize: '1.5rem' }}>
                            {isFull ? `FULL (${lobby.total}/${lobby.capacity})` : `PLAYERS: ${lobby.total}/${lobby.capacity}`}
                        </h1>
                    </div>

                    <div className="pixel-box">
                        <h2 className="pixel-title" style={{ fontSize: '1.2rem' }}>GAME INFO</h2>
                        <p style={{fontSize: '0.9rem', marginBottom: '0.5rem'}}>GAME: {lobby.gameType}</p>
                        <p style={{fontSize: '0.9rem', marginBottom: '0.5rem'}}>HOST: {lobby.hostUid.substring(0, 12)}</p>
                        <p style={{fontSize: '0.9rem', marginBottom: '0'}}>READY: {lobby.readyCount}/{lobby.total}</p>
                    </div>

                    <div className="pixel-box">
                        <h2 className="pixel-title" style={{ fontSize: '1.2rem' }}>MEMBERS</h2>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '1rem' }}>
                            {lobby.members.map((member) => (
                                <div key={member.userUid} className="member-list-item">
                                    <span style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
                                        {member.userUid.substring(0, 12)}
                                        {member.userUid === lobby.hostUid && ' [[HOST]]'}
                                    </span>
                                    <span style={{color: member.isReady ? '#a7c957' : '#e5e5e5', fontSize: '0.9rem', backgroundColor: member.isReady ? '#6a856f' : '#3b3d51', padding: '0.25rem 0.5rem', border: '2px solid #0d0d0d' }}>
                                        {member.isReady ? 'READY' : 'WAITING'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', width: '100%' }}>
                        {isHost && (
                            <button onClick={handleStartGame} disabled={!canStart} className="pixel-button" style={{ backgroundColor: '#9d2929', fontSize: '1rem', flex: 1 }} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut}>
                                GAME START
                            </button>
                        )}
                        <button onClick={() => navigate('/game')} className="pixel-button" style={{flex: 1}} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut}>
                            나가기
                        </button>
                    </div>

                    {isFull && (
                        <div className="pixel-box" style={{ marginTop: '2rem', backgroundColor: '#c19454' }}>
                            <p style={{fontSize: '0.9rem'}}>정원이 모두 찼습니다. 추가 입장이 불가합니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

