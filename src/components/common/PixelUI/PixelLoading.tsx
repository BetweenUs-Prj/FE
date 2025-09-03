import React from 'react';

interface PixelLoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  variant?: 'default' | 'game' | 'waiting' | 'loading';
  showSpinner?: boolean;
  fullScreen?: boolean;
}

export const PixelLoading: React.FC<PixelLoadingProps> = ({
  message = 'LOADING',
  size = 'medium',
  className = '',
  variant = 'default',
  showSpinner = true,
  fullScreen = false
}) => {
  const sizeStyles = {
    small: { width: '30px', height: '30px' },
    medium: { width: '60px', height: '60px' },
    large: { width: '90px', height: '90px' }
  };

  const textSizes = {
    small: '0.8rem',
    medium: '1.2rem', 
    large: '1.5rem'
  };

  const variants = {
    default: {
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffd6a5',
      boxClass: 'pixel-box'
    },
    game: {
      bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      textColor: '#2d3748',
      boxClass: 'pixel-box game'
    },
    waiting: {
      bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      textColor: '#4a5568',
      boxClass: 'pixel-box waiting'
    },
    loading: {
      bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      textColor: '#2d3748',
      boxClass: 'pixel-box loading'
    }
  };

  const currentVariant = variants[variant];

  const containerStyle: React.CSSProperties = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: currentVariant.bg,
    zIndex: 9999
  } : {};

  return (
    <div style={containerStyle}>
      <div className={`${currentVariant.boxClass} ${className}`} style={{ 
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%'
      }}>
        {showSpinner && (
          <div 
            className="loading-spinner" 
            style={{ 
              ...sizeStyles[size],
              margin: '0 auto 2rem auto' 
            }}
          />
        )}
        
        <h2 style={{ 
          fontSize: textSizes[size], 
          color: currentVariant.textColor,
          margin: 0,
          fontFamily: '"Courier New", monospace',
          fontWeight: 'bold',
          textShadow: '2px 2px 0px rgba(0,0,0,0.3)'
        }}>
          {message}
          <span className="blinking-cursor">_</span>
        </h2>
        
        {/* 게임 전용 추가 UI */}
        {variant === 'game' && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: currentVariant.textColor
          }}>
            🎮 게임이 곧 시작됩니다...
          </div>
        )}

        {/* 대기 상태 전용 추가 UI */}
        {variant === 'waiting' && (
          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <div className="dot-pulse" />
            <div className="dot-pulse" style={{animationDelay: '0.15s'}} />
            <div className="dot-pulse" style={{animationDelay: '0.3s'}} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PixelLoading;