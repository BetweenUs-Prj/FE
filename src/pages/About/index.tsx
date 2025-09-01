export default function About() {
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
    .pixel-text { 
      font-size: 0.9rem; 
      color: #c9c9c9; 
      line-height: 1.6; 
      text-shadow: 1px 1px 0px #0d0d0d; 
      margin-bottom: 2rem; 
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
      font-size: 0.9rem; 
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
            <h1 className="pixel-title">ABOUT BETWEENUS</h1>
            <p className="pixel-text">
              우리사이는 함께하는 공간을 만들기 위한 프로젝트입니다.<br />
              친한 친구들과 미니게임을 즐기며 서로의 이야기를 나누고,<br />
              특별한 벌칙으로 추억을 쌓아보세요<span className="blinking-cursor">_</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="pixel-button"
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
    </>
  );
}