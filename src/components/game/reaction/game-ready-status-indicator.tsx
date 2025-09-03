import React from 'react';

interface GameReadyStatusIndicatorProps {
  readyPlayers: string[];
  totalPlayers: number;
}

export function GameReadyStatusIndicator({
  readyPlayers,
  totalPlayers
}: GameReadyStatusIndicatorProps) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '15px',
      padding: '1.5rem',
      marginBottom: '1rem'
    }}>
      <div style={{
        fontSize: '1.1rem',
        color: '#FFFFFF',
        marginBottom: '0.5rem'
      }}>
        준비된 플레이어: {readyPlayers.length}/{totalPlayers}
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '1rem'
      }}>
        {Array.from({ length: totalPlayers }, (_, i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: i < readyPlayers.length ? '#10B981' : 'rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
}