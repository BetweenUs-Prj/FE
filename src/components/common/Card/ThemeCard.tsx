import React from 'react';

interface ThemeCardProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
  padding?: 'small' | 'medium' | 'large';
  borderRadius?: 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  interactive?: boolean;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  borderRadius = 'medium',
  shadow = 'medium',
  className = '',
  style = {},
  onClick,
  interactive = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#6a856f',
          border: '4px solid #0d0d0d',
          boxShadow: '8px 8px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      case 'secondary':
        return {
          backgroundColor: '#c19454',
          border: '4px solid #0d0d0d',
          boxShadow: '8px 8px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      case 'success':
        return {
          backgroundColor: '#6a856f',
          border: '4px solid #0d0d0d',
          boxShadow: '8px 8px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      case 'warning':
        return {
          backgroundColor: '#c19454',
          border: '4px solid #0d0d0d',
          boxShadow: '8px 8px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      case 'danger':
        return {
          backgroundColor: '#9d2929',
          border: '4px solid #0d0d0d',
          boxShadow: '8px 8px 0px #0d0d0d',
          color: '#f2e9e4'
        };
      case 'default':
      default:
        return {
          backgroundColor: '#4a4e69',
          border: '4px solid #0d0d0d',
          boxShadow: '8px 8px 0px #0d0d0d',
          color: '#f2e9e4'
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'small':
        return { padding: '1rem' };
      case 'medium':
        return { padding: '2rem' };
      case 'large':
        return { padding: '3rem' };
      default:
        return { padding: '2rem' };
    }
  };

  const baseStyles: React.CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    position: 'relative',
    overflow: 'hidden',
    cursor: interactive ? 'pointer' : 'default',
    transition: interactive ? 'transform 0.1s linear, box-shadow 0.1s linear' : 'none',
    textShadow: '2px 2px 0px #0d0d0d',
    ...getVariantStyles(),
    ...getPaddingStyles(),
    ...style
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactive) {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '12px 12px 0px #0d0d0d';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactive) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '8px 8px 0px #0d0d0d';
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      `}</style>
      <div
        className={`theme-card theme-card--${variant} theme-card--${padding} ${interactive ? 'theme-card--interactive' : ''} ${className}`}
        style={baseStyles}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </>
  );
};

export default ThemeCard;
