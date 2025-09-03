import React from 'react';

interface PixelBoxProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PixelBox: React.FC<PixelBoxProps> = ({ 
  children, 
  className = '',
  style = {}
}) => {
  return (
    <div className={`pixel-box ${className}`} style={style}>
      {children}
    </div>
  );
};

export default PixelBox;