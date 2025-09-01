import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewQuizSession } from '../../api/game';
import { 
  GameContainer, 
  ThemeCard, 
  ThemeButton 
} from '../../components';
import { CategorySelect } from '../../components/quiz/CategorySelect';
import { PenaltySelect } from '../../components/quiz/PenaltySelect';
import { type Penalty } from '../../api/meta';

export default function QuizLobbyPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('');
  const [rounds, setRounds] = useState<number>(5);
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleCreateSession = async () => {
    if (!category) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    setIsCreating(true);
    
    try {
      const result = await createNewQuizSession({
        category,
        rounds,
        inviteOnly: false,
        penaltyId: selectedPenalty?.id
      });
      
      if (result.success) {
        // 생성된 세션의 로비로 이동
        navigate(`/game/quiz/lobby/${result.sessionId}`, {
          state: { 
            sessionId: result.sessionId,
            category,
            rounds,
            penalty: selectedPenalty,
            isHost: true
          }
        });
      }
    } catch (error) {
      console.error('Failed to create quiz session:', error);
      alert('세션 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // --- 스타일 및 렌더링 ---
  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };
  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; } };
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; } };
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };
  
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    .pixel-game-body { font-family: 'Press Start 2P', cursive; background-color: #2c2d3c; color: #f2e9e4; background-image: linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px); background-size: 4px 4px; image-rendering: pixelated; min-height: 100vh; }
    .pixel-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; }
    .pixel-box { background-color: #4a4e69; padding: 1.5rem; border: 4px solid #0d0d0d; box-shadow: 8px 8px 0px #0d0d0d; width: 100%; max-width: 800px; margin-bottom: 2rem; box-sizing: border-box; }
    .pixel-title { font-size: 2rem; color: #ffd6a5; text-shadow: 3px 3px 0px #0d0d0d; margin: 0 0 1.5rem 0; }
    .pixel-subtitle { font-size: 1rem; color: #c9c9c9; margin-bottom: 1.5rem; }
    .round-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .round-button { font-family: 'Press Start 2P', cursive; color: #f2e9e4; border: 4px solid #0d0d0d; box-shadow: 4px 4px 0px #0d0d0d; padding: 1rem; cursor: pointer; transition: transform 0.1s linear, box-shadow 0.1s linear; text-align: center; background-color: #22223b; font-size: 0.9rem; }
    .round-button.selected { background-color: #9a8c98; color: #fdffb6; }
    .pixel-button { font-family: 'Press Start 2P', cursive; color: #f2e9e4; border: 4px solid #0d0d0d; box-shadow: 4px 4px 0px #0d0d0d; padding: 1rem 2rem; cursor: pointer; transition: transform 0.1s linear, box-shadow 0.1s linear; text-align: center; background-color: #9a8c98; font-size: 1rem; margin: 0.5rem; }
    .pixel-button:disabled { background-color: #3b3d51; color: #6e6f7a; cursor: not-allowed; transform: translateY(0); box-shadow: 4px 4px 0px #0d0d0d;}
    @keyframes blink { 50% { opacity: 0; } }
    .blinking-cursor { animation: blink 1s step-end infinite; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="pixel-game-body">
        <div className="pixel-container">
          <div className="pixel-box" style={{padding: '2rem'}}>
            <h1 className="pixel-title">퀴즈 게임 만들기</h1>
            <p className="pixel-subtitle">
              게임 설정을 선택해주세요<span className="blinking-cursor">_</span>
            </p>

            <CategorySelect
              onSelect={setCategory}
              loading={isCreating}
            />

            <div className="pixel-box" style={{ marginTop: '2rem' }}>
              <h3 className="pixel-title" style={{ fontSize: '1.5rem' }}>🔢 라운드 수 선택</h3>
              <div className="round-grid">
                {[3, 5, 7, 10].map((roundCount) => (
                  <button
                    key={roundCount}
                    onClick={() => setRounds(roundCount)}
                    className={`round-button ${rounds === roundCount ? 'selected' : ''}`}
                    onMouseEnter={handleMouseOver}
                    onMouseLeave={handleMouseOut}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                  >
                    {roundCount} 라운드
                  </button>
                ))}
              </div>
            </div>

            <PenaltySelect
              onSelect={setSelectedPenalty}
              selectedPenalty={selectedPenalty}
            />
            
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
              <button
                onClick={handleCreateSession}
                disabled={!category || isCreating}
                className="pixel-button"
                style={{backgroundColor: '#6a856f'}}
                onMouseEnter={handleMouseOver}
                onMouseLeave={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                {isCreating ? '생성 중...' : '🎮 게임 생성'}
              </button>
              
              <button
                onClick={() => navigate('/game')}
                className="pixel-button"
                style={{backgroundColor: '#c19454'}}
                onMouseEnter={handleMouseOver}
                onMouseLeave={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                ← 뒤로가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

