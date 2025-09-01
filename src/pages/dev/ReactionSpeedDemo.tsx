import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GameHeader,
  GameContainer,
  ThemeButton
} from '../../components';

export default function ReactionSpeedDemo() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'go' | 'finished'>('waiting');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFalseStart, setIsFalseStart] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const startGame = () => {
    setGameState('waiting');
    setReactionTime(null);
    setIsFalseStart(false);
    
    // 1-3초 랜덤 대기
    const randomDelay = Math.random() * 2000 + 1000;
    
    timeoutRef.current = setTimeout(() => {
      setGameState('ready');
      
      // 0.5-1초 후 GO 신호
      const goDelay = Math.random() * 500 + 500;
      
      timeoutRef.current = setTimeout(() => {
        setGameState('go');
        setStartTime(Date.now());
      }, goDelay);
    }, randomDelay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      // 펄스 스타트
      setIsFalseStart(true);
      setGameState('finished');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else if (gameState === 'go') {
      // 정상 클릭
      const endTime = Date.now();
      const time = endTime - (startTime || 0);
      setReactionTime(time);
      setGameState('finished');
    }
  };

  const resetGame = () => {
    setGameState('waiting');
    setReactionTime(null);
    setIsFalseStart(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <GameContainer>
      <GameHeader 
        title="반응속도 데모" 
        backPath="/game"
      />
      
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #F97B25 0%, #F96D3C 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          ⚡ 반응속도 테스트
        </h1>

        <div style={{
          width: '400px',
          height: '300px',
          margin: '0 auto 2rem',
          border: '3px solid #147781',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: gameState === 'waiting' || gameState === 'go' ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          backgroundColor: 
            gameState === 'waiting' ? '#f3f4f6' :
            gameState === 'ready' ? '#fef3c7' :
            gameState === 'go' ? '#dcfce7' :
            '#f3f4f6',
          borderColor: 
            gameState === 'waiting' ? '#147781' :
            gameState === 'ready' ? '#f59e0b' :
            gameState === 'go' ? '#16a34a' :
            '#147781'
        }}
        ref={gameAreaRef}
        onClick={handleClick}
      >
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#374151' }}>
          {gameState === 'waiting' && '클릭해서 시작!'}
          {gameState === 'ready' && '준비...'}
          {gameState === 'go' && '지금 클릭!'}
          {gameState === 'finished' && (
            <div>
              {isFalseStart ? (
                <div style={{ color: '#ef4444' }}>
                  펄스 스타트! 😅
                </div>
              ) : (
                <div>
                  <div style={{ color: '#16a34a', marginBottom: '0.5rem' }}>
                    반응시간
                  </div>
                  <div style={{ fontSize: '3rem', color: '#147781' }}>
                    {reactionTime}ms
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {gameState === 'finished' ? (
          <>
            <ThemeButton variant="primary" onClick={resetGame}>
              다시 시작
            </ThemeButton>
            <ThemeButton variant="secondary" onClick={() => navigate('/game')}>
              게임 홈으로
            </ThemeButton>
          </>
        ) : (
          <ThemeButton variant="primary" onClick={startGame}>
            게임 시작
          </ThemeButton>
        )}
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '12px',
        textAlign: 'left'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#374151' }}>게임 방법:</h3>
        <ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
          <li>1. "게임 시작" 버튼을 클릭합니다</li>
          <li>2. 화면이 "준비..." 상태가 되면 기다립니다</li>
          <li>3. "지금 클릭!" 신호가 나오면 빠르게 클릭하세요!</li>
          <li>4. 너무 일찍 클릭하면 펄스 스타트가 됩니다</li>
        </ul>
      </div>
    </GameContainer>
  );
}
