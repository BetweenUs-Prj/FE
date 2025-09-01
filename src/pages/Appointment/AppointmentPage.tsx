import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface PenaltyInfo {
  loserUid: string;
  loserNickname?: string;
  penaltyText: string;
}

interface AppointmentState {
  penalty?: PenaltyInfo;
  gameType?: string;
  sessionId?: string;
}

export default function AppointmentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as AppointmentState;


  // 기본 벌칙 정보 (state가 없을 때 사용)
  const defaultPenalty: PenaltyInfo = {
    loserUid: 'dev-user-173',
    loserNickname: 'dev-user-173',
    penaltyText: '커피 한 잔 사기'
  };

  const penaltyInfo = state?.penalty || defaultPenalty;

  const handleGoHome = () => {
    navigate('/game');
  };

  const handleCreateGame = () => {
    // 게임 생성 페이지로 이동
    navigate('/game/create');
  };



    // 픽셀 게임 스타일 함수들
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
      padding: 1.5rem; 
      border: 4px solid #0d0d0d; 
      box-shadow: 8px 8px 0px #0d0d0d; 
      width: 100%; 
      max-width: 600px; 
      margin-bottom: 2rem; 
    }
    .pixel-title { 
      font-size: 1.8rem; 
      color: #ffd6a5; 
      text-shadow: 3px 3px 0px #0d0d0d; 
      margin: 0 0 1rem 0; 
    }
    .pixel-button { 
      font-family: 'Press Start 2P', cursive; 
      color: #f2e9e4; 
      border: 4px solid #0d0d0d; 
      box-shadow: 4px 4px 0px #0d0d0d; 
      padding: 1rem; 
      cursor: pointer; 
      transition: transform 0.1s linear, box-shadow 0.1s linear; 
      text-align: center; 
      background-color: #9a8c98; 
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
    .penalty-section { 
      background-color: #9d2929; 
      border: 4px solid #0d0d0d; 
      margin-bottom: 1rem; 
    }
    .penalty-title { 
      color: #ffd6a5; 
      font-size: 1.2rem; 
      text-shadow: 2px 2px 0px #0d0d0d; 
      margin-bottom: 1rem; 
    }
    .penalty-content { 
      background-color: #22223b; 
      border: 2px solid #0d0d0d; 
      padding: 1rem; 
      margin-bottom: 1rem; 
    }
    .penalty-label { 
      color: #fdffb6; 
      font-size: 0.9rem; 
      margin-bottom: 0.5rem; 
    }
    .penalty-text { 
      color: #f2e9e4; 
      font-size: 1rem; 
      word-break: break-all; 
    }
    .info-box { 
      background-color: #6a856f; 
      border: 4px solid #0d0d0d; 
      padding: 1rem; 
    }
    .info-text { 
      color: #f2e9e4; 
      font-size: 0.8rem; 
      line-height: 1.4; 
    }
    @keyframes blink { 50% { opacity: 0; } }
    .blinking-cursor { animation: blink 1s step-end infinite; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="pixel-game-body">
        <div className="pixel-container">
          {/* 헤더 */}
          <div className="pixel-box">
            <h1 className="pixel-title">📅 약속 페이지</h1>
            <p style={{ fontSize: '1rem', color: '#c9c9c9', marginBottom: '0.5rem' }}>
              게임이 완료되었습니다!
            </p>
            <p style={{ fontSize: '0.9rem', color: '#a1a1a1' }}>
              아래 벌칙을 확인하고 수행해주세요<span className="blinking-cursor">_</span>
            </p>
          </div>

          {/* 벌칙 정보 카드 */}
          <div className="pixel-box penalty-section">
            <h2 className="penalty-title">😈 벌칙 정보</h2>
            
            <div className="penalty-content">
              <div className="penalty-label">🎯 벌칙 대상자</div>
              <div className="penalty-text">
                {penaltyInfo.loserNickname || penaltyInfo.loserUid}
              </div>
            </div>

            <div className="penalty-content">
              <div className="penalty-label">📋 벌칙 내용</div>
              <div className="penalty-text">
                {penaltyInfo.penaltyText}
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <button
              onClick={handleCreateGame}
              className="pixel-button"
              style={{ backgroundColor: '#6a856f' }}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              🎮 새 게임 만들기
            </button>

            <button
              onClick={handleGoHome}
              className="pixel-button"
              style={{ backgroundColor: '#9a8c98' }}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              🏠 게임 홈으로
            </button>

            <button
              onClick={() => window.print()}
              className="pixel-button"
              style={{ backgroundColor: '#c19454' }}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              🖨️ 벌칙 인쇄
            </button>
          </div>

          {/* 추가 정보 */}
          <div className="pixel-box info-box">
            <p className="info-text">
              💡 "새 게임 만들기" 버튼을 클릭하면 게임 생성 페이지로 이동하여 카테고리와 설정을 직접 선택할 수 있습니다<span className="blinking-cursor">_</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
