import React from 'react';

interface GameDebugPanelProps {
  status: string;
  sessionId: number | null;
  hasClicked: boolean;
  currentRoundId: number | null;
  isLoading: boolean;
  isWaitingForPlayers: boolean;
  isHost: boolean;
  participants: number;
}

export function GameDebugPanel({
  status,
  sessionId,
  hasClicked,
  currentRoundId,
  isLoading,
  isWaitingForPlayers,
  isHost,
  participants
}: GameDebugPanelProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)',
        borderRadius: '12px',
        fontSize: '0.8rem',
        opacity: 0.8,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        color: '#FFFFFF',
        zIndex: 1000
      }}
    >
      <div>Status: {status}</div>
      <div>Session: {sessionId}</div>
      <div>Clicked: {hasClicked ? 'Y' : 'N'}</div>
      <div>Round: {currentRoundId || 'None'}</div>
      <div>Loading: {isLoading ? 'Y' : 'N'}</div>
      <div>Waiting: {isWaitingForPlayers ? 'Y' : 'N'}</div>
      <div>Host: {isHost ? 'Y' : 'N'}</div>
      <div>Players: {participants}</div>
    </div>
  );
}