import React from 'react';
import ThemeButton from '../../common/Button/ThemeButton';

interface GameErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function GameErrorDisplay({
  error,
  onRetry,
  onGoHome
}: GameErrorDisplayProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
      borderRadius: '16px',
      padding: '2rem',
      textAlign: 'center',
      color: '#FFFFFF',
      boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)'
    }}>
      <h3 style={{
        fontSize: '1.5rem',
        marginBottom: '1rem'
      }}>
        ❌ 오류가 발생했습니다
      </h3>
      
      <p style={{
        fontSize: '1rem',
        marginBottom: '2rem',
        opacity: 0.9
      }}>
        {error}
      </p>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {onRetry && (
          <ThemeButton variant="secondary" onClick={onRetry}>
            다시 시도
          </ThemeButton>
        )}
        
        {onGoHome && (
          <ThemeButton variant="primary" onClick={onGoHome}>
            홈으로 이동
          </ThemeButton>
        )}
      </div>
    </div>
  );
}