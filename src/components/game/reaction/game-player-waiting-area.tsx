import React from 'react';
import GameContainer from '../shared/GameContainer';
import { GameReadyStatusIndicator } from './game-ready-status-indicator';
import { GameHostControls } from './game-host-controls';

interface GamePlayerWaitingAreaProps {
  readyPlayers: string[];
  totalPlayers: number;
  isHost: boolean;
  onStartGame: () => void;
}

export function GamePlayerWaitingArea({
  readyPlayers,
  totalPlayers,
  isHost,
  onStartGame
}: GamePlayerWaitingAreaProps) {
  return (
    <GameContainer>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #FCB422 0%, #F97B25 100%)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(252, 180, 34, 0.3)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#FFFFFF',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            ⚡ 반응속도 게임 준비 중
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#FFFFFF',
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            다른 플레이어들이 게임 페이지에 도착할 때까지 기다려주세요
          </p>
          
          <GameReadyStatusIndicator
            readyPlayers={readyPlayers}
            totalPlayers={totalPlayers}
          />
          
          {isHost && (
            <GameHostControls
              readyPlayers={readyPlayers}
              totalPlayers={totalPlayers}
              onStartGame={onStartGame}
            />
          )}
        </div>
      </div>
    </GameContainer>
  );
}