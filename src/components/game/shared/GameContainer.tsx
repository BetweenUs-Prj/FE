import React from 'react';

interface GameContainerProps {
  children: React.ReactNode;
  background?: string;
  paddingTop?: number;
  className?: string;
  style?: React.CSSProperties;
}

const GameContainer: React.FC<GameContainerProps> = ({
  children,
  background = '#FFFFFF',
  paddingTop = 80,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`game-container ${className}`}
      style={{
        minHeight: '100vh',
        background,
        position: 'relative',
        overflow: 'hidden',
        color: '#333333',
        ...style
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: `${paddingTop}px`,
          minHeight: '100vh',
          padding: '2rem'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default GameContainer;
