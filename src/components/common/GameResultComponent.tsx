import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface GameResultData {
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

interface GameResultComponentProps {
  result: GameResultData;
  onClose: () => void;
}

export default function GameResultComponent({ result, onClose }: GameResultComponentProps) {
  const navigate = useNavigate(); // useNavigate 훅은 그대로 유지

  // --- 스타일 및 렌더링 ---
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

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    .pixel-game-body { 
      font-family: 'Press Start 2P', cursive; 
    }
    .pixel-modal-overlay { 
      position: fixed; 
      top: 0; 
      left: 0; 
      right: 0; 
      bottom: 0; 
      background: rgba(0, 0, 0, 0.8); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      z-index: 1000; 
      padding: 1rem; 
    }
    .pixel-modal-content { 
      font-family: 'Press Start 2P', cursive; 
      background-color: #2c2d3c; 
      color: #f2e9e4; 
      padding: 1.5rem; 
      border: 4px solid #0d0d0d; 
      box-shadow: 8px 8px 0px #0d0d0d; 
      width: 100%; 
      max-width: 700px; 
      max-height: 90vh; 
      overflow-y: auto; 
      position: relative; 
    }
    .pixel-box { 
      background-color: #4a4e69; 
      padding: 1.5rem; 
      border: 4px solid #0d0d0d; 
      box-shadow: 8px 8px 0px #0d0d0d; 
      width: 100%; 
      margin-bottom: 2rem; 
      box-sizing: border-box; 
    }
    .pixel-title { 
      font-size: 2rem; 
      color: #ffd6a5; 
      text-shadow: 3px 3px 0px #0d0d0d; 
      margin: 0 0 1.5rem 0; 
      text-align: center; 
      word-break: break-all; 
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
      margin-top: 1rem; 
    }
    .rank-item { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 1rem; 
      border: 4px solid #0d0d0d; 
      margin-bottom: 1rem; 
    }
  `;

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd6a5'; // Gold
    if (rank === 2) return '#c9c9c9'; // Silver
    if (rank === 3) return '#a1683a'; // Bronze
    return '#4a4e69';
  };

  const winner = result.finalScores.find(p => p.rank === 1);

  return (
    <>
      <style>{styles}</style>
      <div className="pixel-modal-overlay">
        <div className="pixel-modal-content">
          <button
            onClick={onClose}
            className="pixel-button"
            style={{ 
              position: 'absolute', 
              top: '0.5rem', 
              right: '0.5rem', 
              padding: '0.5rem', 
              fontSize: '1rem', 
              backgroundColor: '#9d2929' 
            }}
            onMouseEnter={handleMouseOver}
            onMouseLeave={handleMouseOut}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            X
          </button>

          <div className="pixel-box">
            <h1 className="pixel-title" style={{fontSize: '1.8rem'}}>GAME OVER</h1>
            <h2 style={{fontSize: '1rem', color: '#a7c957', textShadow: '2px 2px 0px #0d0d0d', wordBreak: 'break-all'}}>
              WINNER: {winner?.displayName || '...'}
            </h2>
          </div>

          <div className="pixel-box">
            <h3 className="pixel-title" style={{fontSize: '1.5rem'}}>FINAL SCORE</h3>
            <div style={{maxHeight: '30vh', overflowY: 'auto', paddingRight: '1rem'}}>
              {result.finalScores.map((player, index) => (
                <div key={player.userUid} className="rank-item" style={{backgroundColor: getRankColor(player.rank)}}>
                  <span style={{fontSize: '0.8rem', wordBreak: 'break-all'}}>#{player.rank} {player.displayName}</span>
                  <span style={{fontSize: '0.8rem'}}>{player.score} PTS</span>
                </div>
              ))}
            </div>
          </div>

          {result.penaltyInfo && (
            <div className="pixel-box" style={{backgroundColor: '#9d2929'}}>
              <h3 className="pixel-title" style={{color: '#f2e9e4'}}>PENALTY</h3>
              <p style={{fontSize: '1.1rem', color: '#ffd6a5', marginBottom: '0.5rem', wordBreak: 'break-all'}}>
                {result.penaltyInfo.loserNickname || result.penaltyInfo.loserUid}
              </p>
              <p style={{fontSize: '1rem', lineHeight: '1.5'}}>{result.penaltyInfo.penaltyText}</p>
            </div>
          )}
          
          <button 
            onClick={onClose} 
            className="pixel-button" 
            style={{backgroundColor: '#6a856f', width: '100%'}}
            onMouseEnter={handleMouseOver} 
            onMouseLeave={handleMouseOut}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            확인
          </button>
        </div>
      </div>
    </>
  );
}
