import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GameResultComponent from '../../components/common/GameResultComponent';
import { useGameStore } from '../../hooks/useGameStore';

// GameResultData 타입을 직접 정의
interface GameResultData {
  gameType: 'QUIZ' | 'REACTION';
  finalScores: Array<{
    userUid: string;
    displayName: string;
    score: number;
    rank: number;
  }>;
  penaltyInfo?: {
    loserUid: string;
    loserNickname?: string;
    penaltyText: string;
  };
  sessionId: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showGameResult, setShowGameResult] = useState<GameResultData | null>(null);
  const { resetGame } = useGameStore();

  // 메인 홈페이지에 진입하면 이전 게임 상태 정리
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // URL 파라미터나 state에서 게임 결과 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const gameResult = urlParams.get('gameResult');
    
    if (gameResult) {
      try {
        const result = JSON.parse(decodeURIComponent(gameResult));
        setShowGameResult(result);
        // URL에서 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Failed to parse game result:', error);
      }
    }
  }, [location]);

  const handleGameResultClose = () => {
    setShowGameResult(null);
  };

  // 픽셀 게임 스타일 함수들
  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => { 
    e.currentTarget.style.transform = 'translateY(-8px)'; 
    e.currentTarget.style.boxShadow = '12px 12px 0px #0d0d0d'; 
  };
  const handleMouseOut = (e: React.MouseEvent<HTMLDivElement>) => { 
    e.currentTarget.style.transform = 'translateY(0)'; 
    e.currentTarget.style.boxShadow = '8px 8px 0px #0d0d0d'; 
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => { 
    e.currentTarget.style.transform = 'translateY(4px)'; 
    e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; 
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => { 
    e.currentTarget.style.transform = 'translateY(-8px)'; 
    e.currentTarget.style.boxShadow = '12px 12px 0px #0d0d0d'; 
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
      max-width: 600px; 
      margin-bottom: 2rem; 
    }
    .pixel-title { 
      font-size: 2.5rem; 
      color: #ffd6a5; 
      text-shadow: 4px 4px 0px #0d0d0d; 
      margin: 0 0 1rem 0; 
    }
    .pixel-subtitle { 
      font-size: 1rem; 
      color: #c9c9c9; 
      text-shadow: 2px 2px 0px #0d0d0d; 
      margin: 0; 
    }
    .menu-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
      gap: 2rem; 
      width: 100%; 
      max-width: 800px; 
      margin: 2rem 0; 
    }
    .menu-card { 
      background-color: #9a8c98; 
      border: 4px solid #0d0d0d; 
      box-shadow: 8px 8px 0px #0d0d0d; 
      padding: 2rem; 
      cursor: pointer; 
      transition: transform 0.1s linear, box-shadow 0.1s linear; 
      text-align: center; 
      position: relative; 
      overflow: hidden; 
    }
    .menu-card:hover { 
      transform: translateY(-8px); 
      box-shadow: 12px 12px 0px #0d0d0d; 
    }
    .menu-card:active { 
      transform: translateY(4px); 
      box-shadow: 4px 4px 0px #0d0d0d; 
    }
    .menu-icon { 
      font-size: 3rem; 
      margin-bottom: 1.5rem; 
      filter: drop-shadow(2px 2px 0px #0d0d0d); 
    }
    .menu-title { 
      font-size: 1.2rem; 
      color: #f2e9e4; 
      text-shadow: 2px 2px 0px #0d0d0d; 
      margin-bottom: 1rem; 
    }
    .menu-description { 
      font-size: 0.8rem; 
      color: #c9c9c9; 
      line-height: 1.4; 
      text-shadow: 1px 1px 0px #0d0d0d; 
    }
    .game-card { 
      background-color: #6a856f; 
    }
    .join-card { 
      background-color: #c19454; 
    }
    .info-box { 
      background-color: #22223b; 
      border: 4px solid #0d0d0d; 
      padding: 1rem; 
      margin-top: 2rem; 
    }
    .info-text { 
      color: #a1a1a1; 
      font-size: 0.7rem; 
      line-height: 1.4; 
      text-shadow: 1px 1px 0px #0d0d0d; 
    }
    @keyframes blink { 50% { opacity: 0; } }
    .blinking-cursor { animation: blink 1s step-end infinite; }
    @keyframes float { 
      0%, 100% { transform: translateY(0px); } 
      50% { transform: translateY(-10px); } 
    }
    .floating-pixel { 
      position: absolute; 
      width: 8px; 
      height: 8px; 
      background-color: #ffd6a5; 
      animation: float 3s ease-in-out infinite; 
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="pixel-game-body">
        {/* 배경 픽셀 장식 */}
        <div className="floating-pixel" style={{ top: '10%', left: '10%', animationDelay: '0s' }}></div>
        <div className="floating-pixel" style={{ top: '20%', right: '15%', animationDelay: '1s' }}></div>
        <div className="floating-pixel" style={{ bottom: '30%', left: '20%', animationDelay: '2s' }}></div>
        <div className="floating-pixel" style={{ bottom: '20%', right: '25%', animationDelay: '0.5s' }}></div>
        
        <div className="pixel-container">
          {/* 메인 헤더 */}
          <div className="pixel-box">
            <h1 className="pixel-title">🎮 BETWEENUS</h1>
            <p className="pixel-subtitle">
              친구들과 함께 즐기는 미니게임 플랫폼<span className="blinking-cursor">_</span>
            </p>
          </div>

          {/* 메뉴 카드들 */}
          <div className="menu-grid">
            {/* 게임 만들기 카드 */}
            <div 
              className="menu-card game-card"
              onClick={() => navigate('/game/choice')}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              <div className="menu-icon">🎮</div>
              <h2 className="menu-title">게임 만들기</h2>
              <p className="menu-description">
                새로운 게임을 생성하고<br />
                친구들을 초대해보세요!
              </p>
            </div>

            {/* 게임 참여하기 카드 */}
            <div 
              className="menu-card join-card"
              onClick={() => navigate('/game/join')}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              <div className="menu-icon">🔗</div>
              <h2 className="menu-title">게임 참여하기</h2>
              <p className="menu-description">
                초대 링크로 게임에<br />
                참여해보세요!
              </p>
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="pixel-box info-box">
            <p className="info-text">
              BETWEENUS - 친구들과 함께하는 미니게임<br />
              퀴즈 게임 • 반응속도 게임 • 벌칙 시스템<span className="blinking-cursor">_</span>
            </p>
          </div>
        </div>
      </div>

      {/* 게임 결과 모달 */}
      {showGameResult && (
        <GameResultComponent 
          result={showGameResult} 
          onClose={handleGameResultClose} 
        />
      )}
    </>
  );
}