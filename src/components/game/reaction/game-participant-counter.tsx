import React from 'react';

interface GameParticipantCounterProps {
  participants: number;
}

export function GameParticipantCounter({ participants }: GameParticipantCounterProps) {
  return (
    <div 
      style={{
        marginBottom: '2rem',
        padding: '1rem 2rem',
        background: 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(20, 119, 129, 0.3)',
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: '1.2rem',
        fontWeight: '600',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
      }}
    >
      참가자: {participants}명
    </div>
  );
}