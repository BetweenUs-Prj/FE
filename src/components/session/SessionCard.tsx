import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinBySessionId, type OpenSessionSummary } from '../../api/session';
import { fromNow } from '../../utils/time';

interface SessionCardProps {
  summary: OpenSessionSummary;
  onJoin?: () => void;
}

export default function SessionCard({ summary, onJoin }: SessionCardProps) {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (isJoining) return;
    
    setIsJoining(true);
    try {
      await joinBySessionId(summary.sessionId);
      
      if (summary.gameType === 'QUIZ') {
        navigate(`/game/quiz/${summary.sessionId}/lobby`);
      } else if (summary.gameType === 'REACTION') {
        navigate(`/game/reaction/lobby?sessionId=${summary.sessionId}`);
      }
      
      onJoin?.();
    } catch (error: any) {
      console.error('Join session error:', error);
      
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      const status = error.response?.status;
      
      if (status === 409 && errorCode === 'SESSION_FULL') {
        alert(`정원이 가득 찼습니다 (${summary.memberCount}/${summary.maxPlayers})`);
      } else if (status === 409 && errorCode === 'ALREADY_JOINED') {
        if (summary.gameType === 'QUIZ') {
          navigate(`/game/quiz/${summary.sessionId}/lobby`);
        } else if (summary.gameType === 'REACTION') {
          navigate(`/game/reaction/lobby?sessionId=${summary.sessionId}`);
        }
      } else if (status === 404 && errorCode === 'SESSION_NOT_FOUND') {
        alert('세션을 찾을 수 없습니다.');
        onJoin?.();
      } else if (status === 403 && errorCode === 'INVITE_ONLY') {
        alert('초대 링크로만 입장할 수 있어요');
      } else if (status === 409 && !errorCode) {
        if (summary.gameType === 'QUIZ') {
          navigate(`/game/quiz/${summary.sessionId}/lobby`);
        } else if (summary.gameType === 'REACTION') {
          navigate(`/game/reaction/lobby?sessionId=${summary.sessionId}`);
        }
      } else {
        alert(errorMessage || '참가에 실패했습니다.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const isFull = summary.memberCount >= summary.maxPlayers;
  const isInviteOnly = (summary as any).inviteOnly;

  // --- 스타일 및 렌더링 ---
  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { if (!(e.currentTarget as HTMLButtonElement).disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };
  const handleMouseOut = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { if (!(e.currentTarget as HTMLButtonElement).disabled) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; } };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { if (!(e.currentTarget as HTMLButtonElement).disabled) { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; } };
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { if (!(e.currentTarget as HTMLButtonElement).disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };

  const styles = `
    .pixel-card { font-family: 'Press Start 2P', cursive; background-color: #4a4e69; padding: 1.5rem; border: 4px solid #0d0d0d; box-shadow: 4px 4px 0px #0d0d0d; width: 100%; box-sizing: border-box; transition: transform 0.1s linear, box-shadow 0.1s linear; cursor: pointer; }
    .pixel-badge { display: inline-block; padding: 0.5rem 0.75rem; border: 2px solid #0d0d0d; font-size: 0.7rem; margin-right: 0.5rem; margin-bottom: 0.5rem; }
    .pixel-button { font-family: 'Press Start 2P', cursive; color: #f2e9e4; border: 4px solid #0d0d0d; box-shadow: 4px 4px 0px #0d0d0d; padding: 1rem; cursor: pointer; transition: transform 0.1s linear, box-shadow 0.1s linear; text-align: center; background-color: #9a8c98; font-size: 0.9rem; width: 100%; }
    .pixel-button:disabled { background-color: #3b3d51; color: #6e6f7a; cursor: not-allowed; transform: translateY(0); box-shadow: 4px 4px 0px #0d0d0d;}
    @keyframes blink { 50% { opacity: 0; } }
    .blinking-text { animation: blink 1s step-end infinite; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div 
        className="pixel-card"
        onMouseEnter={handleMouseOver}
        onMouseLeave={handleMouseOut}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={isInviteOnly || isFull ? undefined : handleJoin} // 비활성 상태에서는 카드 전체 클릭 방지
      >
        <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="pixel-badge" style={{ backgroundColor: summary.gameType === 'QUIZ' ? '#6a856f' : '#c19454', color: '#f2e9e4' }}>
            {summary.gameType === 'QUIZ' ? '퀴즈' : '반응속도'}
          </span>
          {summary.category && summary.category !== '일반' && (
            <span className="pixel-badge" style={{ backgroundColor: '#22223b' }}>
              {summary.category}
            </span>
          )}
          {isInviteOnly && (
            <span className="pixel-badge" style={{ backgroundColor: '#9d2929' }}>
              초대 전용
            </span>
          )}
        </div>

        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            방 코드: <span style={{ backgroundColor: '#22223b', padding: '0.25rem 0.5rem' }}>{summary.code}</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#c9c9c9' }}>
            호스트: {summary.hostUid}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#a1a1a1' }}>
            {fromNow(summary.createdAt)}
          </div>
          <div style={{ fontSize: '0.8rem', color: isFull ? '#e56b6f' : '#a7c957' }}>
            {summary.memberCount}/{summary.maxPlayers}명
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleJoin(); }}
          disabled={isJoining || isFull || isInviteOnly}
          title={isInviteOnly ? '초대 코드로만 입장 가능' : undefined}
          className="pixel-button"
          style={{ backgroundColor: (isFull || isInviteOnly) ? '' : '#6a856f' }}
        >
          {isJoining ? (
            <span className="blinking-text">참가 중...</span>
          ) : isFull ? '정원 마감' : isInviteOnly ? '초대 전용' : '참가하기'}
        </button>
      </div>
    </>
  );
}

