import React from 'react';
import { PIXEL_COLORS, PIXEL_SHADOWS } from '../../../styles/pixelStyles';

interface Player {
  uid: string;
  displayName?: string;
  name?: string;
  role?: 'HOST' | 'MEMBER';
  isHost?: boolean;
  isCurrentUser?: boolean;
  isReady?: boolean;
  isOnline?: boolean;
}

interface GamePlayerListProps {
  players: Player[];
  currentUserUid?: string;
  showReadyStatus?: boolean;
  onRefresh?: () => void;
}

export function GamePlayerList({
  players,
  currentUserUid,
  showReadyStatus = false,
  onRefresh
}: GamePlayerListProps) {
  const getPlayerIcon = (player: Player) => {
    if (player.role === 'HOST' || player.isHost) return '👑';
    if (player.uid === currentUserUid || player.isCurrentUser) return '👤';
    return '👥';
  };

  const getReadyStatus = (player: Player) => {
    if (!showReadyStatus) return '';
    return player.isReady ? '✅' : '⏳';
  };

  const getDisplayName = (player: Player, index: number) => {
    return player.displayName || player.name || `플레이어 ${index + 1}`;
  };

  return (
    <div style={{
      backgroundColor: PIXEL_COLORS.boxBg,
      border: `4px solid ${PIXEL_COLORS.border}`,
      boxShadow: PIXEL_SHADOWS.box.large,
      padding: '1.5rem',
      marginBottom: 0
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.3rem',
          color: PIXEL_COLORS.primary,
          textShadow: PIXEL_SHADOWS.text.medium,
          fontFamily: "'Press Start 2P', cursive",
          margin: 0
        }}>
          👥 참가자 ({players.length}명)
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              backgroundColor: PIXEL_COLORS.cardBg,
              border: `2px solid ${PIXEL_COLORS.border}`,
              color: PIXEL_COLORS.text,
              fontSize: '0.7rem',
              padding: '0.5rem',
              cursor: 'pointer',
              fontFamily: "'Press Start 2P', cursive",
              boxShadow: PIXEL_SHADOWS.box.small,
              transition: 'transform 0.1s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = PIXEL_SHADOWS.box.medium;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = PIXEL_SHADOWS.box.small;
            }}
          >
            🔄
          </button>
        )}
      </div>
      
      <div style={{
        display: 'grid',
        gap: '0.75rem'
      }}>
        {players.map((player, index) => {
          const isCurrentUser = player.uid === currentUserUid || player.isCurrentUser;
          const isHost = player.role === 'HOST' || player.isHost;
          
          return (
            <div
              key={player.uid || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: isCurrentUser 
                  ? PIXEL_COLORS.primary
                  : PIXEL_COLORS.infoBg,
                border: `3px solid ${PIXEL_COLORS.border}`,
                color: isCurrentUser ? PIXEL_COLORS.border : PIXEL_COLORS.text,
                fontFamily: "'Press Start 2P', cursive"
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {getPlayerIcon(player)}
                </span>
                
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    textShadow: PIXEL_SHADOWS.text.small
                  }}>
                    {getDisplayName(player, index)}
                  </div>
                  
                  {isHost && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: PIXEL_COLORS.accent,
                      marginTop: '0.2rem',
                      textShadow: PIXEL_SHADOWS.text.small
                    }}>
                      HOST
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {showReadyStatus && (
                  <span style={{ fontSize: '1.1rem' }}>
                    {getReadyStatus(player)}
                  </span>
                )}
                
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: player.isOnline !== false ? PIXEL_COLORS.success : PIXEL_COLORS.danger,
                  border: `2px solid ${PIXEL_COLORS.border}`
                }} />
              </div>
            </div>
          );
        })}
      </div>
      
      {players.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: PIXEL_COLORS.textMuted,
          fontSize: '1rem',
          fontFamily: "'Press Start 2P', cursive",
          textShadow: PIXEL_SHADOWS.text.small
        }}>
          참가자가 없습니다.
        </div>
      )}
    </div>
  );
}