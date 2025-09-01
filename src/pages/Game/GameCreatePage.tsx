import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GameCreatePage() {
  const navigate = useNavigate();
  const [selectedGameType, setSelectedGameType] = useState<'QUIZ' | 'REACTION' | null>(null);

  // 픽셀 게임 스타일 함수들
  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { 
    e.currentTarget.style.transform = 'translateY(-4px)'; 
    e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
  };
  const handleMouseOut = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { 
    e.currentTarget.style.transform = 'translateY(0)'; 
    e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; 
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { 
    e.currentTarget.style.transform = 'translateY(2px)'; 
    e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; 
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { 
    e.currentTarget.style.transform = 'translateY(-4px)'; 
    e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
  };

  const handleGameTypeSelect = (gameType: 'QUIZ' | 'REACTION') => {
    setSelectedGameType(gameType);
  };

  const handleCreateGame = () => {
    if (!selectedGameType) return;
    
    if (selectedGameType === 'QUIZ') {
      navigate('/game/quiz/lobby');
    } else {
      navigate('/game/reaction/lobby');
    }
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
      font-size: 2rem; 
      color: #ffd6a5; 
      text-shadow: 3px 3px 0px #0d0d0d; 
      margin: 0 0 1.5rem 0; 
    }
    .pixel-subtitle { 
      font-size: 1rem; 
      color: #c9c9c9; 
      text-shadow: 2px 2px 0px #0d0d0d; 
      margin-bottom: 2rem; 
    }
    .game-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
      gap: 1.5rem; 
      width: 100%; 
      margin-bottom: 2rem; 
    }
    .game-card { 
      background-color: #9a8c98; 
      border: 4px solid #0d0d0d; 
      box-shadow: 4px 4px 0px #0d0d0d; 
      padding: 1.5rem; 
      cursor: pointer; 
      transition: transform 0.1s linear, box-shadow 0.1s linear; 
      text-align: center; 
      position: relative; 
    }
    .game-card.selected { 
      background-color: #6a856f; 
      border-color: #fdffb6; 
    }
    .game-icon { 
      font-size: 2.5rem; 
      margin-bottom: 1rem; 
      filter: drop-shadow(2px 2px 0px #0d0d0d); 
    }
    .game-title { 
      font-size: 1.1rem; 
      color: #f2e9e4; 
      text-shadow: 2px 2px 0px #0d0d0d; 
      margin-bottom: 0.5rem; 
    }
    .game-description { 
      font-size: 0.7rem; 
      color: #c9c9c9; 
      line-height: 1.4; 
      text-shadow: 1px 1px 0px #0d0d0d; 
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
      background-color: #9a8c98; 
      font-size: 1rem; 
      width: 100%; 
      margin-bottom: 1rem; 
    }
    .pixel-button:disabled { 
      background-color: #3b3d51; 
      color: #6e6f7a; 
      cursor: not-allowed; 
      box-shadow: 4px 4px 0px #0d0d0d; 
      transform: translateY(0); 
    }
    .back-button { 
      background-color: #c19454; 
    }
    @keyframes blink { 50% { opacity: 0; } }
    .blinking-cursor { animation: blink 1s step-end infinite; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="pixel-game-body">
        <div className="pixel-container">
          <div className="pixel-box">
            <h1 className="pixel-title">CREATE GAME</h1>
            <p className="pixel-subtitle">
              만들고 싶은 게임을 선택해주세요<span className="blinking-cursor">_</span>
            </p>
            
            <div className="game-grid">
              {/* 퀴즈 게임 카드 */}
              <div 
                className={`game-card ${selectedGameType === 'QUIZ' ? 'selected' : ''}`}
                onClick={() => handleGameTypeSelect('QUIZ')}
                onMouseEnter={handleMouseOver}
                onMouseLeave={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                <div className="game-icon">🧠</div>
                <div className="game-title">퀴즈 게임</div>
                <div className="game-description">
                  다양한 카테고리의<br />
                  퀴즈로 지식 대결!
                </div>
              </div>

              {/* 반응속도 게임 카드 */}
              <div 
                className={`game-card ${selectedGameType === 'REACTION' ? 'selected' : ''}`}
                onClick={() => handleGameTypeSelect('REACTION')}
                onMouseEnter={handleMouseOver}
                onMouseLeave={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                <div className="game-icon">⚡</div>
                <div className="game-title">반응속도 게임</div>
                <div className="game-description">
                  빠른 반응속도로<br />
                  순발력 대결!
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateGame}
              disabled={!selectedGameType}
              className="pixel-button"
              onMouseEnter={!selectedGameType ? undefined : handleMouseOver}
              onMouseLeave={!selectedGameType ? undefined : handleMouseOut}
              onMouseDown={!selectedGameType ? undefined : handleMouseDown}
              onMouseUp={!selectedGameType ? undefined : handleMouseUp}
            >
              {selectedGameType ? '게임 만들기' : '게임을 선택해주세요'}
            </button>

            <button
              onClick={() => navigate('/appointment')}
              className="pixel-button back-button"
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              ← 약속으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
