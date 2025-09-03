import React from 'react';
import { PIXEL_STYLES } from '../../../styles/pixelStyles';

interface PixelLayoutProps {
  children: React.ReactNode;
  showFloatingPixels?: boolean;
}

export const PixelLayout: React.FC<PixelLayoutProps> = ({ 
  children, 
  showFloatingPixels = true 
}) => {
  return (
    <>
      <style>{PIXEL_STYLES}</style>
      <div className="pixel-game-body">
        {showFloatingPixels && (
          <>
            <div className="floating-pixel" style={{ top: '10%', left: '10%', animationDelay: '0s' }}></div>
            <div className="floating-pixel" style={{ top: '20%', right: '15%', animationDelay: '1s' }}></div>
            <div className="floating-pixel" style={{ bottom: '30%', left: '20%', animationDelay: '2s' }}></div>
            <div className="floating-pixel" style={{ bottom: '20%', right: '25%', animationDelay: '0.5s' }}></div>
          </>
        )}
        <div className="pixel-container">
          {children}
        </div>
      </div>
    </>
  );
};

export default PixelLayout;