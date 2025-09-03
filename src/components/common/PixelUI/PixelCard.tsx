import React from 'react';

interface PixelCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  variant?: 'default' | 'game' | 'join' | 'header' | 'success' | 'warning' | 'danger';
  className?: string;
  style?: React.CSSProperties;
}

export const PixelCard: React.FC<PixelCardProps> = ({
  children,
  onClick,
  icon,
  title,
  description,
  variant = 'default',
  className = '',
  style = {}
}) => {
  const handleMouseEvents = onClick ? {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '12px 12px 0px #0d0d0d';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '8px 8px 0px #0d0d0d';
    },
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'translateY(4px)';
      e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d';
    },
    onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '12px 12px 0px #0d0d0d';
    }
  } : {};

  const variantStyles = {
    default: {},
    game: { backgroundColor: '#6a856f' },
    join: { backgroundColor: '#c19454' },
    header: { 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff'
    },
    success: { 
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      color: '#2d3748'
    },
    warning: { 
      background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
      color: '#ffffff'
    },
    danger: { 
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
      color: '#ffffff'
    }
  };

  return (
    <div
      className={`menu-card ${className}`}
      onClick={onClick}
      style={{
        ...variantStyles[variant],
        ...style,
        cursor: onClick ? 'pointer' : 'default'
      }}
      {...handleMouseEvents}
    >
      {icon && <div className="menu-icon">{icon}</div>}
      {title && <h2 className="menu-title">{title}</h2>}
      {description && <p className="menu-description">{description}</p>}
      {children}
    </div>
  );
};

export default PixelCard;