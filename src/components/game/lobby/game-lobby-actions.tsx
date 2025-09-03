import React from 'react';
import { PixelButton, PixelAlert } from '../../common/PixelUI';
import { PIXEL_COLORS, PIXEL_SHADOWS } from '../../../styles/pixelStyles';

interface GameLobbyActionsProps {
  isHost: boolean;
  playerCount: number;
  minPlayers?: number;
  isGameStarting?: boolean;
  onStartGame?: () => void;
  onLeaveSession?: () => void;
  onInvitePlayer?: () => void;
  showInvite?: boolean;
}

export function GameLobbyActions({
  isHost,
  playerCount,
  minPlayers = 2,
  isGameStarting = false,
  onStartGame,
  onLeaveSession,
  onInvitePlayer,
  showInvite = true
}: GameLobbyActionsProps) {
  const canStartGame = playerCount >= minPlayers && !isGameStarting;
  
  return (
    <div style={{
      backgroundColor: PIXEL_COLORS.boxBg,
      border: `4px solid ${PIXEL_COLORS.border}`,
      boxShadow: PIXEL_SHADOWS.box.large,
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* 최소 인원 안내 */}
      {playerCount < minPlayers && (
        <PixelAlert variant="warning">
          <div style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            fontFamily: "'Press Start 2P', cursive"
          }}>
            ⚠️ 게임 시작을 위해 최소 {minPlayers}명이 필요합니다.<br/>
            (현재 {playerCount}명)
          </div>
        </PixelAlert>
      )}

      {/* 호스트 전용 액션 */}
      {isHost && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <PixelButton
            variant="game"
            onClick={onStartGame}
            disabled={!canStartGame}
            size="large"
            style={{
              minWidth: '160px',
              fontSize: '1rem'
            }}
          >
            {isGameStarting ? '🔄 시작 중...' : '🚀 게임 시작'}
          </PixelButton>

          {showInvite && onInvitePlayer && (
            <PixelButton
              variant="join"
              onClick={onInvitePlayer}
              size="medium"
              style={{
                minWidth: '120px'
              }}
            >
              👥 초대하기
            </PixelButton>
          )}
        </div>
      )}

      {/* 공통 액션 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem'
      }}>
        <PixelButton
          variant="danger"
          onClick={onLeaveSession}
          size="medium"
        >
          🚪 로비 나가기
        </PixelButton>
      </div>
    </div>
  );
}