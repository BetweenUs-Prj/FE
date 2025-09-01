import React from 'react';

interface ThemeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  className = '',
  style = {}
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#6a856f',
          border: '4px solid #0d0d0d',
          boxShadow: '4px 4px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      case 'secondary':
        return {
          backgroundColor: '#c19454',
          border: '4px solid #0d0d0d',
          boxShadow: '4px 4px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      case 'success':
        return {
          backgroundColor: '#6a856f',
          border: '4px solid #0d0d0d',
          boxShadow: '4px 4px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      case 'warning':
        return {
          backgroundColor: '#c19454',
          border: '4px solid #0d0d0d',
          boxShadow: '4px 4px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      case 'danger':
        return {
          backgroundColor: '#9d2929',
          border: '4px solid #0d0d0d',
          boxShadow: '4px 4px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      default:
        return {
          backgroundColor: '#9a8c98',
          border: '4px solid #0d0d0d',
          boxShadow: '4px 4px 0px #0d0d0d',
          color: '#f2e9e4'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.7rem'
        };
      case 'medium':
        return {
          padding: '1rem 2rem',
          fontSize: '0.9rem'
        };
      case 'large':
        return {
          padding: '1.5rem 3rem',
          fontSize: '1.1rem'
        };
      default:
        return {
          padding: '1rem 2rem',
          fontSize: '0.9rem'
        };
    }
  };

  const baseStyles: React.CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 0.1s linear, box-shadow 0.1s linear',
    position: 'relative',
    overflow: 'hidden',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    textShadow: '2px 2px 0px #0d0d0d',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d';
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translateY(2px)';
      e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      `}</style>
      <button
        className={`theme-button theme-button--${variant} theme-button--${size} ${className}`}
        style={baseStyles}
        onClick={disabled ? undefined : onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        disabled={disabled}
      >
        {children}
      </button>
    </>
  );
};

export default ThemeButton;
