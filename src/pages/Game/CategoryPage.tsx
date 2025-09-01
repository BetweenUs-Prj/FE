import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// 이 컴포넌트는 API 함수들이 있다고 가정합니다.
// 실제 환경에서는 해당 경로에 파일이 있어야 합니다.
// import { listCategories, startQuizRound } from '../../api/game';

// API 함수의 가짜(mock) 구현
const listCategories = async () => {
  return ["일반상식", "역사", "과학", "영화", "음악", "스포츠", "IT", "애니메이션"];
};

const startQuizRound = async (sessionId, selectedCategory) => {
  console.log(`Starting round for session ${sessionId} with category ${selectedCategory}`);
  // 실제 API 호출 시 반환될 것으로 예상되는 데이터 구조
  return { roundId: 'round123', /* ... other data */ };
};


export default function CategoryPage() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.title = '카테고리 선택';
    listCategories().then(setCategories);
  }, []);

  async function confirm(e) {
    e.preventDefault();
    if (!sessionId || !selected) return;
    
    console.info('[quiz] start', { sessionId, category: selected });
    
    try {
      const result = await startQuizRound(sessionId, selected);
      console.info('[quiz] startRound ok', result);
      nav(`/game/quiz/${sessionId}/${result.roundId}`, { 
        state: result 
      });
    } catch (error) {
      console.error('[quiz] startRound error', error);
      nav(`/game/quiz/${sessionId}?category=${encodeURIComponent(selected)}`);
    }
  }

  // 마우스 이벤트 핸들러
  const handleMouseOver = (e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
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
    e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
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
          margin: 0;
        }

        .category-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          justify-content: center;
          max-width: 800px;
          width: 100%;
        }

        .pixel-button {
            font-family: 'Press Start 2P', cursive;
            color: #f2e9e4;
            border: 4px solid #0d0d0d;
            box-shadow: 4px 4px 0px #0d0d0d;
            padding: 1rem 1.5rem;
            cursor: pointer;
            transition: transform 0.1s linear, box-shadow 0.1s linear;
            text-align: center;
            background-color: #4a4e69;
        }
        
        .pixel-button.selected {
            background-color: #9a8c98;
            color: #fdffb6;
        }

        .pixel-button.confirm {
            margin-top: 3rem;
            background-color: #6a856f; /* Greenish */
        }
        
        .pixel-button:disabled {
            background-color: #3b3d51;
            color: #6e6f7a;
            cursor: not-allowed;
            box-shadow: 4px 4px 0px #0d0d0d;
            transform: translateY(0);
        }

      `}</style>
      <div className="pixel-game-body">
        <div className="pixel-container">
          <div className="pixel-header">
            <h1 className="pixel-title">CATEGORY</h1>
          </div>
          
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`pixel-button ${selected === cat ? 'selected' : ''}`}
                onMouseEnter={handleMouseOver}
                onMouseLeave={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            disabled={!selected}
            onClick={confirm}
            className="pixel-button confirm"
            style={{ fontSize: '1.2rem', padding: '1.5rem 3rem' }}
            onMouseEnter={!selected ? null : handleMouseOver}
            onMouseLeave={!selected ? null : handleMouseOut}
            onMouseDown={!selected ? null : handleMouseDown}
            onMouseUp={!selected ? null : handleMouseUp}
          >
            시작하기
          </button>
        </div>
      </div>
    </>
  );
}
