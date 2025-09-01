import React from 'react';
import Spinner from './Spinner';
import ThemeCard from '../Card/ThemeCard';

interface LoadingCardProps {
  message?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
  spinnerSize?: 'small' | 'medium' | 'large';
  spinnerColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'white';
  className?: string;
  style?: React.CSSProperties;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
  message = '로딩 중...',
  variant = 'primary',
  spinnerSize = 'large',
  spinnerColor = 'white',
  className = '',
  style = {}
}) => {
  return (
    <ThemeCard
      variant={variant}
      padding="large"
      className={`loading-card ${className}`}
      style={{
        textAlign: 'center',
        ...style
      }}
    >
      <Spinner
        size={spinnerSize}
        color={spinnerColor}
        style={{
          margin: '0 auto 1rem',
          display: 'block'
        }}
      />
      <div
        style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '0.9rem',
          color: '#f2e9e4',
          textShadow: '2px 2px 0px #0d0d0d'
        }}
      >
        {message}
      </div>
    </ThemeCard>
  );
};

export default LoadingCard;
