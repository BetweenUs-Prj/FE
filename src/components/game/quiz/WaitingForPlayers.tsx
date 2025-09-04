import React from 'react';

interface WaitingForPlayersProps {
  submittedCount: number;
  expectedParticipants: number;
}

const WaitingForPlayers: React.FC<WaitingForPlayersProps> = ({ 
  submittedCount, 
  expectedParticipants 
}) => {
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    
    .waiting-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #2c2d3c 0%, #1a1b29 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: 'Press Start 2P', cursive;
    }
    
    .waiting-content {
      text-align: center;
      max-width: 600px;
      padding: 2rem;
    }
    
    .waiting-icon {
      font-size: 6rem;
      margin-bottom: 2rem;
      animation: waitingBounce 2s ease-in-out infinite;
    }
    
    .waiting-title {
      font-size: 1.5rem;
      color: #ffd6a5;
      margin-bottom: 1.5rem;
      text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8);
    }
    
    .waiting-message {
      font-size: 1rem;
      color: #a7c957;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    
    .progress-container {
      background: rgba(13, 13, 13, 0.4);
      border: 4px solid #4a4e69;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    
    .progress-title {
      font-size: 0.9rem;
      color: #f2e9e4;
      margin-bottom: 1.5rem;
    }
    
    .progress-bar {
      width: 100%;
      height: 20px;
      background: rgba(13, 13, 13, 0.6);
      border: 3px solid #0d0d0d;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 1rem;
      position: relative;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #a7c957 0%, #caffbf 100%);
      transition: width 0.3s ease;
      position: relative;
    }
    
    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
      animation: shimmer 2s ease-in-out infinite;
    }
    
    .progress-text {
      font-size: 0.8rem;
      color: #caffbf;
      font-weight: bold;
    }
    
    .player-status {
      display: flex;
      justify-content: space-around;
      margin-top: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .player-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background: rgba(74, 78, 105, 0.3);
      border: 2px solid #4a4e69;
      border-radius: 8px;
      min-width: 100px;
    }
    
    .player-indicator.completed {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }
    
    .player-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .player-label {
      font-size: 0.6rem;
      color: #9ca3af;
    }
    
    .dots {
      animation: loadingDots 1.5s ease-in-out infinite;
    }
    
    @keyframes waitingBounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-20px);
      }
      60% {
        transform: translateY(-10px);
      }
    }
    
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
    
    @keyframes loadingDots {
      0%, 20% {
        color: inherit;
        text-shadow: 0.25em 0 0 transparent,
                     0.5em 0 0 transparent;
      }
      40% {
        color: inherit;
        text-shadow: 0.25em 0 0 inherit,
                     0.5em 0 0 transparent;
      }
      60% {
        text-shadow: 0.25em 0 0 inherit,
                     0.5em 0 0 inherit;
      }
    }
  `;

  const progressPercentage = (submittedCount / expectedParticipants) * 100;

  return (
    <>
      <style>{styles}</style>
      <div className="waiting-overlay">
        <div className="waiting-content">
          <div className="waiting-icon">⏳</div>
          
          <h2 className="waiting-title">
            답변 제출 완료!
          </h2>
          
          <p className="waiting-message">
            다른 플레이어들의 답변을 기다리는 중<span className="dots">...</span>
          </p>
          
          <div className="progress-container">
            <div className="progress-title">
              제출 현황
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <div className="progress-text">
              {submittedCount} / {expectedParticipants} 플레이어 완료
            </div>
            
            <div className="player-status">
              {Array.from({ length: expectedParticipants }, (_, i) => (
                <div 
                  key={i}
                  className={`player-indicator ${i < submittedCount ? 'completed' : ''}`}
                >
                  <div className="player-icon">
                    {i < submittedCount ? '✅' : '⏳'}
                  </div>
                  <div className="player-label">
                    플레이어 {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <p style={{ 
            fontSize: '0.7rem', 
            color: '#6b7280',
            marginTop: '2rem'
          }}>
            모든 플레이어가 답변을 제출하면 다음 문제로 넘어갑니다
          </p>
        </div>
      </div>
    </>
  );
};

export default WaitingForPlayers;