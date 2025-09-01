import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeButton from '../../common/Button/ThemeButton';

interface GameHeaderProps {
  title: string;
  showBackButton?: boolean;
  showGiveUpButton?: boolean;
  onGiveUp?: () => void;
  backPath?: string;
  className?: string;
  style?: React.CSSProperties;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  showBackButton = true,
  showGiveUpButton = true,
  onGiveUp,
  backPath,
  className = '',
  style = {}
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  const handleGiveUp = () => {
    if (onGiveUp) {
      onGiveUp();
    } else {
      navigate('/game');
    }
  };

  return (
    <div
      className={`game-header ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {showBackButton && (
          <ThemeButton
            variant="secondary"
            size="small"
            onClick={handleBack}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF'
            }}
          >
            ← 뒤로
          </ThemeButton>
        )}
      </div>

      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#FFFFFF',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          margin: 0
        }}
      >
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {showGiveUpButton && (
          <ThemeButton
            variant="danger"
            size="small"
            onClick={handleGiveUp}
            style={{
              background: 'rgba(220, 38, 38, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF'
            }}
          >
            포기
          </ThemeButton>
        )}
      </div>
    </div>
  );
};

export default GameHeader;
