import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewReactionSession } from '../../api/game';
import { PenaltySelect } from '../../components/quiz/PenaltySelect';
import { type Penalty } from '../../api/meta';

export default function ReactionLobbyPage() {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<number>(5);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);

  const handleCreateSession = async () => {
    if (!selectedPenalty) {
      alert('벌칙을 선택해주세요!');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const result = await createNewReactionSession({
        rounds,
        inviteOnly: false,
        penaltyId: selectedPenalty.id
      });
      
      if (result.success) {
        // sessionStorage에 안전하게 저장
        const sessionId = result.sessionId;
        sessionStorage.setItem('reaction.sessionId', sessionId.toString());
        
        // 생성된 세션의 로비로 이동
        navigate(`/game/reaction/lobby/${sessionId}`, {
          state: { 
            sessionId,
            rounds,
            isHost: true
          }
        });
      }
    } catch (error) {
      console.error('Failed to create reaction session:', error);
      alert('세션 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 픽셀 게임 스타일 함수들
  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { 
    e.currentTarget.style.transform = 'translateY(-4px)'; 
    e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
  };
  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => { 
    e.currentTarget.style.transform = 'translateY(0)'; 
    e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; 
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { 
    e.currentTarget.style.transform = 'translateY(2px)'; 
    e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; 
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => { 
    e.currentTarget.style.transform = 'translateY(-4px)'; 
    e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
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
      margin-bottom: 1.5rem; 
    }
    .game-rules { 
      background-color: #22223b; 
      border: 2px solid #0d0d0d; 
      padding: 1.5rem; 
      margin-bottom: 2rem; 
    }
    .rules-title { 
      color: #fdffb6; 
      font-size: 1rem; 
      text-shadow: 2px 2px 0px #0d0d0d; 
      margin-bottom: 1rem; 
    }
    .rules-text { 
      color: #c9c9c9; 
      font-size: 0.8rem; 
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
    .create-button { 
      background-color: #6a856f; 
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
            <h1 className="pixel-title">⚡ 반응속도 게임 로비</h1>
            <p className="pixel-subtitle">
              빠른 반응속도로 승부하세요<span className="blinking-cursor">_</span>
            </p>

            {/* 게임 설명 */}
            <div className="game-rules">
              <h3 className="rules-title">🎯 게임 규칙</h3>
              <p className="rules-text">
                화면이 변할 때 가장 빠르게 클릭하세요!<br />
                빠른 반응속도가 승리의 열쇠입니다.
              </p>
            </div>
            
            {/* 벌칙 선택 */}
            <PenaltySelect 
              onSelect={setSelectedPenalty}
              selectedPenalty={selectedPenalty}
            />

            {/* 게임 생성 버튼 */}
            <button
              onClick={handleCreateSession}
              disabled={isCreating || !selectedPenalty}
              className="pixel-button create-button"
              onMouseEnter={(isCreating || !selectedPenalty) ? undefined : handleMouseOver}
              onMouseLeave={(isCreating || !selectedPenalty) ? undefined : handleMouseOut}
              onMouseDown={(isCreating || !selectedPenalty) ? undefined : handleMouseDown}
              onMouseUp={(isCreating || !selectedPenalty) ? undefined : handleMouseUp}
            >
              {isCreating ? '🔄 생성 중...' : !selectedPenalty ? '🎯 벌칙을 선택해주세요' : '🎮 게임 생성하기'}
            </button>

            {/* 뒤로가기 버튼 */}
            <button
              onClick={() => navigate('/game')}
              className="pixel-button back-button"
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              ← 게임 선택으로
            </button>
          </div>
        </div>
      </div>
    </>
  );
}