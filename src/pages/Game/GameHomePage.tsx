import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 이 컴포넌트는 useGameStore 훅이 있다고 가정합니다.
// 실제 환경에서는 해당 경로에 파일이 있어야 합니다.
// import { useGameStore } from '../../hooks/useGameStore';

// useGameStore 훅의 가짜(mock) 구현
const useGameStore = () => ({
  resetGame: () => console.log('Game state reset'),
});

// --- Pixel Art 아이콘 컴포넌트 ---
const PixelBrainIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
    <path d="M28 12H36V16H28V12ZM24 16H28V20H24V16ZM36 16H40V20H36V16ZM20 20H24V24H20V20ZM40 20H44V24H40V20ZM16 24H20V32H16V24ZM44 24H48V32H44V24ZM20 28H24V32H20V28ZM40 28H44V32H40V28ZM24 32H28V36H24V32ZM36 32H40V36H36V32ZM28 36H36V40H28V36ZM24 40H28V44H24V40ZM36 40H40V44H36V40ZM28 44H32V48H28V44Z" fill="#f2e9e4"/>
    <path d="M28 16H36V20H28V16ZM24 20H28V24H24V20ZM36 20H40V24H36V20ZM20 24H24V28H20V24ZM40 24H44V28H40V24ZM24 28H28V32H24V28ZM36 28H40V32H36V28ZM28 32H36V36H28V32ZM24 36H28V40H24V36ZM36 36H40V40H36V36Z" fill="#ffadad"/>
  </svg>
);

const PixelBoltIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
    <path d="M36 12L28 28H36L28 48L40 28H32L36 12Z" fill="#ffd6a5"/>
    <path d="M32 12L24 28H32L24 48L36 28H28L32 12Z" fill="#fdffb6"/>
  </svg>
);

export default function GameHomePage() {
  const navigate = useNavigate();
  const { resetGame } = useGameStore();

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleGameSelect = (gameType) => {
    if (gameType === 'QUIZ') {
      navigate('/game/quiz/lobby');
    } else {
      navigate('/game/reaction/lobby');
    }
  };

  // 마우스 이벤트 핸들러
  const handleMouseOver = (e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '8px 8px 0px #0d0d0d';
  };
  const handleMouseOut = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d';
  };
  const handleMouseDown = (e) => {
    e.currentTarget.style.transform = 'translateY(2px)';
    e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d';
  };
  const handleMouseUp = (e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '8px 8px 0px #0d0d0d';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .pixel-game-body {
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
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
        }

        .pixel-header {
          background-color: #4a4e69;
          padding: 2rem 3rem;
          border: 4px solid #0d0d0d;
          box-shadow: 8px 8px 0px #0d0d0d;
          margin-bottom: 3rem;
          max-width: 700px;
          width: 100%;
        }

        .pixel-title {
          font-size: 2.5rem;
          color: #ffd6a5;
          text-shadow: 4px 4px 0px #0d0d0d;
          margin-bottom: 1rem;
        }

        .pixel-subtitle {
          font-size: 1rem;
          color: #c9c9c9;
          line-height: 1.5;
        }
        
        .pixel-card {
            border: 4px solid #0d0d0d;
            box-shadow: 4px 4px 0px #0d0d0d;
            padding: 2.5rem;
            cursor: pointer;
            transition: transform 0.1s linear, box-shadow 0.1s linear;
            width: 100%;
            max-width: 350px;
            min-width: 280px;
            font-family: 'Press Start 2P', cursive;
        }

        @keyframes icon-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }

        .icon-container {
            margin-bottom: 1.5rem;
            animation: icon-bob 2s ease-in-out infinite;
        }
      `}</style>
      <div className="pixel-game-body">
        <div className="pixel-container">
        
          <div className="pixel-header">
            <h1 className="pixel-title">SELECT GAME</h1>
            <p className="pixel-subtitle">플레이할 게임을 선택해주세요</p>
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '800px' }}>
            
            {/* 퀴즈 게임 카드 */}
            <div
              className="pixel-card"
              style={{ backgroundColor: '#4a4e69' }}
              onClick={() => handleGameSelect('QUIZ')}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
                <div className="icon-container" style={{animationDelay: '0s'}}>
                    <PixelBrainIcon />
                </div>
                <h2 style={{ fontSize: '1.5rem', color: '#ffadad', marginBottom: '1rem', textShadow: '2px 2px 0px #0d0d0d' }}>퀴즈 게임</h2>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#c9c9c9' }}>
                    다양한 카테고리의 퀴즈!<br/>지식과 재미를 동시에!
                </p>
            </div>

            {/* 반응속도 게임 카드 */}
            <div
              className="pixel-card"
              style={{ backgroundColor: '#4a4e69' }}
              onClick={() => handleGameSelect('REACTION')}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
                <div className="icon-container" style={{animationDelay: '1s'}}>
                    <PixelBoltIcon />
                </div>
                <h2 style={{ fontSize: '1.5rem', color: '#fdffb6', marginBottom: '1rem', textShadow: '2px 2px 0px #0d0d0d' }}>반응속도 게임</h2>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#c9c9c9' }}>
                    빠른 반응속도를 테스트!<br/>집중력과 순발력 대결!
                </p>
            </div>
          </div>
            
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => navigate('/game')}
            className="pixel-card"
            style={{ 
                marginTop: '3rem', 
                backgroundColor: '#9a8c98',
                color: '#f2e9e4',
                fontSize: '1rem',
                padding: '1.25rem 2rem'
            }}
            onMouseEnter={handleMouseOver}
            onMouseLeave={handleMouseOut}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            ← 메인으로 돌아가기
          </button>
        </div>
      </div>
    </>
  );
}