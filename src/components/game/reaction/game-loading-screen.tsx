import React from 'react';
import { PixelLoading } from '../../common/PixelUI/PixelLoading';
import { PixelButton } from '../../common/PixelUI/PixelButton';

interface GameLoadingScreenProps {
  loadingMessage: string;
  onManualStart?: () => void;
  isDevelopment?: boolean;
}

export function GameLoadingScreen({
  loadingMessage,
  onManualStart,
  isDevelopment = false
}: GameLoadingScreenProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <PixelLoading 
        message={loadingMessage}
        variant="game"
        size="large"
        fullScreen={false}
      />

      {/* 수동 테스트 버튼 (개발용) */}
      {isDevelopment && onManualStart && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '2px dashed rgba(255, 255, 255, 0.3)'
        }}>
          <p style={{
            margin: '0 0 1rem 0',
            fontSize: '0.9rem',
            color: '#666',
            textAlign: 'center',
            fontFamily: 'monospace'
          }}>
            🧪 Development Mode
          </p>
          <PixelButton
            onClick={onManualStart}
            variant="warning"
            size="medium"
          >
            수동 게임 시작 테스트
          </PixelButton>
        </div>
      )}
    </div>
  );
}