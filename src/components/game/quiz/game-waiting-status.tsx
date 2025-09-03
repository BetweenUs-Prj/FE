import React from 'react';
import { PIXEL_COLORS, PIXEL_SHADOWS } from '../../../styles/pixelStyles';

interface GameWaitingStatusProps {
  submittedCount?: number;
  expectedParticipants?: number;
  message?: string;
}

export function GameWaitingStatus({
  submittedCount,
  expectedParticipants,
  message = '다른 플레이어들을 기다리는 중...'
}: GameWaitingStatusProps) {
  return (
    <div className="pixel-box" style={{
      backgroundColor: PIXEL_COLORS.cardBg,
      border: `4px solid ${PIXEL_COLORS.border}`,
      boxShadow: PIXEL_SHADOWS.box.large,
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h3 style={{
        fontSize: '1.3rem',
        color: PIXEL_COLORS.primary,
        textShadow: PIXEL_SHADOWS.text.large,
        marginBottom: '1rem',
        fontFamily: "'Press Start 2P', cursive"
      }}>
        ⏳ {message}
      </h3>
      
      {submittedCount !== undefined && expectedParticipants !== undefined && (
        <>
          <div style={{
            fontSize: '1rem',
            color: PIXEL_COLORS.accent,
            marginBottom: '1rem',
            fontFamily: "'Press Start 2P', cursive",
            textShadow: PIXEL_SHADOWS.text.medium
          }}>
            답변 완료: {submittedCount}/{expectedParticipants}
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            {Array.from({ length: expectedParticipants }, (_, i) => (
              <div
                key={i}
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: i < submittedCount ? PIXEL_COLORS.success : PIXEL_COLORS.textMuted,
                  border: `2px solid ${PIXEL_COLORS.border}`,
                  boxShadow: PIXEL_SHADOWS.box.small
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* 로딩 애니메이션 */}
      <div style={{
        marginTop: '1.5rem',
        fontSize: '1.5rem',
        color: PIXEL_COLORS.textSecondary
      }}>
        <span className="blinking-cursor">...</span>
      </div>
    </div>
  );
}