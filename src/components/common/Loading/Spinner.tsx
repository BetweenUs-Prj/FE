import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'white';
  className?: string;
  style?: React.CSSProperties;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
  style = {}
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: '24px',
          height: '24px',
          borderWidth: '2px'
        };
      case 'medium':
        return {
          width: '40px',
          height: '40px',
          borderWidth: '3px'
        };
      case 'large':
        return {
          width: '60px',
          height: '60px',
          borderWidth: '4px'
        };
      default:
        return {
          width: '40px',
          height: '40px',
          borderWidth: '3px'
        };
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case 'primary':
        return {
          borderColor: 'rgba(106, 133, 111, 0.3)',
          borderTopColor: '#6a856f'
        };
      case 'secondary':
        return {
          borderColor: 'rgba(193, 148, 84, 0.3)',
          borderTopColor: '#c19454'
        };
      case 'success':
        return {
          borderColor: 'rgba(106, 133, 111, 0.3)',
          borderTopColor: '#6a856f'
        };
      case 'warning':
        return {
          borderColor: 'rgba(193, 148, 84, 0.3)',
          borderTopColor: '#c19454'
        };
      case 'danger':
        return {
          borderColor: 'rgba(157, 41, 41, 0.3)',
          borderTopColor: '#9d2929'
        };
      case 'white':
        return {
          borderColor: 'rgba(242, 233, 228, 0.3)',
          borderTopColor: '#f2e9e4'
        };
      default:
        return {
          borderColor: 'rgba(74, 78, 105, 0.3)',
          borderTopColor: '#4a4e69'
        };
    }
  };

  const baseStyles: React.CSSProperties = {
    border: '4px solid #0d0d0d',
    backgroundColor: getColorStyles().borderTopColor,
    animation: 'pixel-blink 1s ease-in-out infinite',
    fontFamily: "'Press Start 2P', cursive",
    color: '#f2e9e4',
    textShadow: '2px 2px 0px #0d0d0d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size === 'small' ? '0.5rem' : size === 'large' ? '0.8rem' : '0.6rem',
    ...getSizeStyles(),
    ...style
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes pixel-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>
      <div
        className={`pixel-spinner pixel-spinner--${size} pixel-spinner--${color} ${className}`}
        style={baseStyles}
      >
        ...
      </div>
    </>
  );
};

export default Spinner;
