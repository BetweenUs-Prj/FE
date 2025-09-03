import React from 'react';

interface GameHostControlsProps {
  readyPlayers: string[];
  totalPlayers: number;
  onStartGame: () => void;
}

export function GameHostControls({
  readyPlayers,
  totalPlayers,
  onStartGame
}: GameHostControlsProps) {
  const canStartGame = readyPlayers.length >= 2;

  return (
    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
      <p style={{
        fontSize: '0.9rem',
        color: '#FFFFFF',
        opacity: 0.8,
        marginBottom: '1rem'
      }}>
        호스트: 모든 플레이어가 준비되면 자동으로 게임이 시작됩니다
      </p>
      
      <button
        onClick={onStartGame}
        disabled={!canStartGame}
        style={{
          background: canStartGame 
            ? 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)' 
            : 'rgba(255, 255, 255, 0.2)',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          padding: '0.8rem 1.5rem',
          fontSize: '0.9rem',
          cursor: canStartGame ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          opacity: canStartGame ? 1 : 0.6
        }}
        onMouseEnter={(e) => {
          if (canStartGame) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 119, 129, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (canStartGame) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {canStartGame ? '🚀 지금 게임 시작' : '⏳ 플레이어 대기 중'}
      </button>
    </div>
  );
}