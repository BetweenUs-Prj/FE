import React from 'react';

interface GameSessionInfoProps {
  sessionInfo: any;
  participants?: any[];
}

export function GameSessionInfo({ sessionInfo, participants = [] }: GameSessionInfoProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '2rem',
      color: '#FFFFFF',
      boxShadow: '0 4px 16px rgba(20, 119, 129, 0.3)'
    }}>
      <h3 style={{
        fontSize: '1.3rem',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        🎯 퀴즈 게임 세션
      </h3>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '1rem'
      }}>
        <div>
          <span style={{ opacity: 0.8 }}>참가자: </span>
          <strong>{participants?.length || 0}명</strong>
        </div>
        
        {sessionInfo?.category && (
          <div>
            <span style={{ opacity: 0.8 }}>카테고리: </span>
            <strong>{sessionInfo.category}</strong>
          </div>
        )}
        
        <div>
          <span style={{ opacity: 0.8 }}>상태: </span>
          <strong>{sessionInfo?.status || 'IN_PROGRESS'}</strong>
        </div>
      </div>
    </div>
  );
}