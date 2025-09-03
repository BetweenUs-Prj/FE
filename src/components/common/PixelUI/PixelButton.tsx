import React from 'react';

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'game' | 'join';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'medium',
  disabled = false,
  className = '',
  style = {},
  type = 'button'
}) => {
  const sizeStyles = {
    small: { fontSize: '0.8rem', padding: '0.75rem 1.5rem' },
    medium: { fontSize: '1rem', padding: '1rem 2rem' },
    large: { fontSize: '1.2rem', padding: '1.5rem 3rem' }
  };

  const handleMouseEvents = {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d';
      }
    },
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        e.currentTarget.style.transform = 'translateY(2px)';
        e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d';
      }
    },
    onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
      }
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`pixel-button ${variant} ${className}`}
      style={{
        ...sizeStyles[size],
        ...style
      }}
      {...handleMouseEvents}
    >
      {children}
    </button>
  );
};

export default PixelButton;