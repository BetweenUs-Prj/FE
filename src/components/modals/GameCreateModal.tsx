import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GameCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameCreateModal({ isOpen, onClose }: GameCreateModalProps) {
  const navigate = useNavigate();
  const [selectedGameType, setSelectedGameType] = useState<'QUIZ' | 'REACTION' | null>(null);

  // 픽셀 게임 스타일 함수들
  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { 
    if (!e.currentTarget.classList.contains('disabled')) {
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
    }
  };
  const handleMouseOut = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { 
    if (!e.currentTarget.classList.contains('disabled')) {
      e.currentTarget.style.transform = 'translateY(0)'; 
      e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; 
    }
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { 
    if (!e.currentTarget.classList.contains('disabled')) {
      e.currentTarget.style.transform = 'translateY(2px)'; 
      e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; 
    }
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => { 
    if (!e.currentTarget.classList.contains('disabled')) {
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
    }
  };

  const handleGameTypeSelect = (gameType: 'QUIZ' | 'REACTION') => {
    setSelectedGameType(gameType);
  };

  const handleCreateGame = () => {
    if (!selectedGameType) return;
    
    onClose(); // 모달 닫기
    
    if (selectedGameType === 'QUIZ') {
      navigate('/game/quiz/lobby');
    } else {
      navigate('/game/reaction/lobby');
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
    }
    
    .modal-content {
      background-color: #2c2d3c;
      border: 4px solid #0d0d0d;
      box-shadow: 8px 8px 0px #0d0d0d;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      font-family: 'Press Start 2P', cursive;
      animation: modalSlideIn 0.3s ease-out;
      background-image: linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px);
      background-size: 4px 4px;
      image-rendering: pixelated;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 3px solid #4a4e69;
      padding-bottom: 1rem;
    }
    
    .modal-title {
      font-size: 1.2rem;
      color: #ffd6a5;
      text-shadow: 2px 2px 0px #0d0d0d;
      margin: 0;
    }
    
    .close-button {
      background: #e76f51;
      color: #f2e9e4;
      border: 3px solid #0d0d0d;
      box-shadow: 4px 4px 0px #0d0d0d;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: 'Press Start 2P', cursive;
      font-size: 10px;
    }
    
    .game-options {
      display: grid;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .game-option {
      background-color: #4a4e69;
      border: 4px solid #0d0d0d;
      box-shadow: 4px 4px 0px #0d0d0d;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: center;
    }
    
    .game-option.selected {
      background-color: #a7c957;
      color: #0d0d0d;
    }
    
    .game-option.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .game-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
    }
    
    .game-title {
      font-size: 1rem;
      color: #f2e9e4;
      margin-bottom: 0.5rem;
    }
    
    .game-option.selected .game-title {
      color: #0d0d0d;
    }
    
    .game-description {
      font-size: 0.7rem;
      color: #9ca3af;
      line-height: 1.6;
    }
    
    .game-option.selected .game-description {
      color: #0d0d0d;
    }
    
    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    
    .action-button {
      font-family: 'Press Start 2P', cursive;
      color: #f2e9e4;
      border: 3px solid #0d0d0d;
      box-shadow: 4px 4px 0px #0d0d0d;
      padding: 1rem 2rem;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: center;
      font-size: 0.8rem;
    }
    
    .action-button.primary {
      background-color: #a7c957;
      color: #0d0d0d;
    }
    
    .action-button.secondary {
      background-color: #4a4e69;
    }
    
    .action-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes modalSlideIn {
      from {
        transform: scale(0.9) translateY(-20px);
        opacity: 0;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }
    
    @media (max-width: 768px) {
      .modal-content {
        width: 95%;
        padding: 1.5rem;
      }
      
      .modal-title {
        font-size: 1rem;
      }
      
      .game-icon {
        font-size: 2.5rem;
      }
      
      .action-button {
        padding: 0.8rem 1.5rem;
        font-size: 0.7rem;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">🎮 게임 생성</h2>
            <button 
              className="close-button"
              onClick={onClose}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              ✕
            </button>
          </div>

          <div className="game-options">
            <div 
              className={`game-option ${selectedGameType === 'QUIZ' ? 'selected' : ''}`}
              onClick={() => handleGameTypeSelect('QUIZ')}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              <span className="game-icon">🧠</span>
              <div className="game-title">퀴즈 게임</div>
              <div className="game-description">
                다양한 주제의 문제를 풀고<br />
                가장 많은 점수를 획득하세요!
              </div>
            </div>

            <div 
              className={`game-option ${selectedGameType === 'REACTION' ? 'selected' : ''}`}
              onClick={() => handleGameTypeSelect('REACTION')}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              <span className="game-icon">⚡</span>
              <div className="game-title">반응속도 게임</div>
              <div className="game-description">
                빨간 신호가 켜지면 최대한<br />
                빠르게 반응하세요!
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="action-button secondary"
              onClick={onClose}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              취소
            </button>
            <button 
              className={`action-button primary ${!selectedGameType ? 'disabled' : ''}`}
              onClick={handleCreateGame}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              disabled={!selectedGameType}
            >
              게임 생성
            </button>
          </div>
        </div>
      </div>
    </>
  );
}