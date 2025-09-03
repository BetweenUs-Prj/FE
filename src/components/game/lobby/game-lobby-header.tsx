import React from 'react';
import { PIXEL_COLORS, PIXEL_SHADOWS } from '../../../styles/pixelStyles';

interface GameLobbyHeaderProps {
  gameType: string;
  category?: string;
  penalty?: any;
}

export function GameLobbyHeader({
  gameType,
  category,
  penalty
}: GameLobbyHeaderProps) {
  const getGameIcon = () => {
    if (gameType?.toLowerCase().includes('퀴즈') || gameType === 'QUIZ') return '🧠';
    if (gameType?.toLowerCase().includes('반응') || gameType === 'REACTION') return '⚡';
    return '🎮';
  };

  const getGameTitle = () => {
    if (gameType?.toLowerCase().includes('퀴즈') || gameType === 'QUIZ') return '퀴즈 게임';
    if (gameType?.toLowerCase().includes('반응') || gameType === 'REACTION') return '반응속도 게임';
    return gameType || '미니 게임';
  };

  return (
    <div style={{
      backgroundColor: PIXEL_COLORS.cardBg,
      border: `4px solid ${PIXEL_COLORS.border}`,
      boxShadow: PIXEL_SHADOWS.box.large,
      padding: '2rem',
      textAlign: 'center',
      marginBottom: 0
    }}>
      <h1 style={{
        fontSize: '2rem',
        color: PIXEL_COLORS.primary,
        textShadow: PIXEL_SHADOWS.text.xlarge,
        marginBottom: '1rem',
        fontFamily: "'Press Start 2P', cursive"
      }}>
        {getGameIcon()} {getGameTitle()}
      </h1>
      
      {category && (
        <p style={{
          fontSize: '1rem',
          color: PIXEL_COLORS.textSecondary,
          textShadow: PIXEL_SHADOWS.text.medium,
          marginBottom: '0.5rem',
          fontFamily: "'Press Start 2P', cursive"
        }}>
          📂 카테고리: {category}
        </p>
      )}
      
      {penalty && (
        <p style={{
          fontSize: '0.9rem',
          color: PIXEL_COLORS.accent,
          textShadow: PIXEL_SHADOWS.text.small,
          fontFamily: "'Press Start 2P', cursive",
          margin: 0
        }}>
          🎯 벌칙: {penalty.text}
        </p>
      )}
    </div>
  );
}