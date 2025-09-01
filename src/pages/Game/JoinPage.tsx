import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ensureJoin, getSessionByCode } from '../../api/session';
import { showToast } from '../../components/common/Toast';

// User UID utility - ensures user has a unique identifier
function ensureUserUid(): string {
  const STORAGE_KEY = 'betweenUs_userUid';
  
  // Try localStorage first
  let userUid = localStorage.getItem(STORAGE_KEY);
  
  if (!userUid) {
    // Generate random UID for development
    const randomNum = Math.floor(Math.random() * 1000);
    userUid = `dev-user-${randomNum}`;
    localStorage.setItem(STORAGE_KEY, userUid);
  }
  
  return userUid;
}

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
      handleJoinSession(code);
    }
  }, [searchParams]);

  const handleJoinSession = async (code: string) => {
    setIsLoading(true);
    setIsJoining(true);
    
    try {
      // Ensure user has a UID
      const userUid = ensureUserUid();

      // Get session info first
      const sessionInfo = await getSessionByCode(code);
      
      // Try to join the session using ensureJoin
      const joinResponse = await ensureJoin(Number(sessionInfo.sessionId));
      
      // 게임이 이미 진행 중인 경우 리다이렉트 처리
      if (joinResponse.shouldRedirect && joinResponse.redirectPath) {
        console.log('[JOIN] Game already in progress, redirecting to:', joinResponse.redirectPath);
        navigate(joinResponse.redirectPath, { replace: true });
        return;
      }
      
      // Redirect to appropriate lobby based on game type
      if (sessionInfo.gameType === 'QUIZ') {
        navigate(`/game/quiz/lobby/${sessionInfo.sessionId}`, { replace: true });
      } else if (sessionInfo.gameType === 'REACTION') {
        navigate(`/game/reaction/lobby/${sessionInfo.sessionId}`, { replace: true });
      } else {
        navigate('/game', { replace: true });
      }

      showToast('세션에 참여했습니다!', 'success');

    } catch (err: any) {
      console.error('Join failed:', err);
      
      try {
        if (err.response?.status === 409) {
          const errorCode = err.response?.data?.code;
          
          if (errorCode === 'ALREADY_JOINED') {
            // User already joined, redirect to lobby
            const sessionInfo = await getSessionByCode(code);
            if (sessionInfo.gameType === 'QUIZ') {
              navigate(`/game/quiz/lobby/${sessionInfo.sessionId}`, { replace: true });
            } else if (sessionInfo.gameType === 'REACTION') {
              navigate(`/game/reaction/lobby/${sessionInfo.sessionId}`, { replace: true });
            }
            showToast('이미 참여중인 세션입니다.', 'success');
            return;
          } else if (errorCode === 'SESSION_FULL') {
            showToast('정원이 가득 찼습니다 (10/10)', 'error');
          } else {
            showToast('세션 참여에 실패했습니다.', 'error');
          }
        } else if (err.response?.status === 404) {
          showToast('로비를 찾을 수 없습니다.', 'error');
        } else {
          const errorMessage = err?.response?.data?.message || '세션 참여 중 오류가 발생했습니다.';
          showToast(errorMessage, 'error');
        }
      } catch (lookupErr) {
        console.error('Session lookup failed:', lookupErr);
        showToast('세션 정보 조회에 실패했습니다.', 'error');
      }

      setError('세션 참여에 실패했습니다.');
      setIsLoading(false);
      setIsJoining(false);
    }
  };

  const handleManualJoin = () => {
    if (!inviteCode.trim()) {
      showToast('초대 코드를 입력해주세요.', 'error');
      return;
    }
    handleJoinSession(inviteCode.trim());
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    .pixel-game-body { 
      font-family: 'Press Start 2P', cursive; 
      background-color: #2c2d3c; 
      color: #f2e9e4; 
      background-image: linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px); 
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
      text-align: center; 
    }
    .pixel-box { 
      background-color: #4a4e69; 
      padding: 2rem; 
      border: 4px solid #0d0d0d; 
      box-shadow: 8px 8px 0px #0d0d0d; 
      width: 100%; 
      max-width: 500px; 
      margin-bottom: 2rem; 
    }
    .pixel-title { 
      font-size: 2rem; 
      color: #ffd6a5; 
      text-shadow: 3px 3px 0px #0d0d0d; 
      margin: 0 0 1.5rem 0; 
    }
    .pixel-subtitle { 
      font-size: 1rem; 
      color: #c9c9c9; 
      margin-bottom: 1.5rem; 
    }
    .pixel-input { 
      font-family: 'Press Start 2P', cursive; 
      width: calc(100% - 2rem); 
      padding: 1rem; 
      border: 4px solid #0d0d0d; 
      background-color: #22223b; 
      color: #f2e9e4; 
      font-size: 0.9rem; 
      margin-bottom: 1.5rem; 
      outline: none; 
      box-sizing: border-box;
    }
    .pixel-input::placeholder { 
      color: #6e6f7a; 
    }
    .pixel-button { 
      font-family: 'Press Start 2P', cursive; 
      color: #f2e9e4; 
      border: 4px solid #0d0d0d; 
      box-shadow: 4px 4px 0px #0d0d0d; 
      padding: 1rem 2rem; 
      cursor: pointer; 
      transition: transform 0.1s linear, box-shadow 0.1s linear; 
      text-align: center; 
      background-color: #6a856f; 
      font-size: 1rem; 
      margin: 0.5rem; 
    }
    .pixel-button:disabled { 
      background-color: #3b3d51; 
      color: #6e6f7a; 
      cursor: not-allowed; 
    }
    .back-button { 
      background-color: #c19454; 
    }
    @keyframes blink { 50% { opacity: 0; } }
    .blinking-cursor { animation: blink 1s step-end infinite; }
  `;

  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
    } 
  };
  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(0)'; 
      e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; 
    } 
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(2px)'; 
      e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; 
    } 
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
    } 
  };

  // 초대 코드 입력 폼 표시
  if (!isJoining && !isLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div className="pixel-box">
              <h1 className="pixel-title">🔗 게임 참여하기</h1>
              <p className="pixel-subtitle">
                초대 코드를 입력해주세요<span className="blinking-cursor">_</span>
              </p>

              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="초대 코드를 입력하세요"
                className="pixel-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualJoin();
                  }
                }}
              />

              <button
                onClick={handleManualJoin}
                disabled={isJoining || !inviteCode.trim()}
                className="pixel-button"
                onMouseEnter={handleMouseOver}
                onMouseLeave={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                {isJoining ? '🔄 참여 중...' : '🎮 게임 참여하기'}
              </button>

              <button
                onClick={() => navigate('/')}
                className="pixel-button back-button"
                onMouseEnter={handleMouseOver}
                onMouseLeave={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                ← 메인으로
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div className="pixel-box">
              <h1 className="pixel-title">🔄 참여 중...</h1>
              <p className="pixel-subtitle">
                게임에 참여하는 중입니다<span className="blinking-cursor">_</span>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div className="pixel-box" style={{backgroundColor: '#9d2929'}}>
              <h1 className="pixel-title">❌ 참여 실패</h1>
              <p className="pixel-subtitle" style={{color: '#f2e9e4'}}>
                {error}
              </p>
              <button
                onClick={() => navigate('/')}
                className="pixel-button back-button"
                onMouseEnter={handleMouseOver}
                onMouseLeave={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                메인으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}