import React from 'react';
import ThemeCard from '../../common/Card/ThemeCard';

interface ReactionGameAreaProps {
  status: 'WAITING' | 'READY' | 'GO' | 'FINISHED';
  onGameClick: () => void;
  myResult?: {
    reactionTimeMs: number;
    isFalseStart: boolean;
    rank: number;
  };
  className?: string;
  style?: React.CSSProperties;
}

const ReactionGameArea: React.FC<ReactionGameAreaProps> = ({
  status,
  onGameClick,
  myResult,
  className = '',
  style = {}
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'WAITING':
        return {
          text: '게임 시작을 기다리는 중...',
          color: '#147781',
          emoji: '⏳'
        };
      case 'READY':
        return {
          text: '준비...',
          color: '#FCB422',
          emoji: '🟡'
        };
      case 'GO':
        return {
          text: '클릭하세요!',
          color: '#F96D3C',
          emoji: '🔴'
        };
      case 'FINISHED':
        return {
          text: myResult?.isFalseStart ? 'False Start!' : '클릭 완료!',
          color: myResult?.isFalseStart ? '#F96D3C' : '#147781',
          emoji: myResult?.isFalseStart ? '❌' : '✅'
        };
      default:
        return {
          text: '대기 중...',
          color: '#147781',
          emoji: '⏳'
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const isClickable = status === 'GO';
  const isFinished = status === 'FINISHED';

  return (
    <ThemeCard
      variant="primary"
      className={`reaction-game-area ${className}`}
      style={{
        textAlign: 'center',
        cursor: isClickable ? 'pointer' : 'default',
        ...style
      }}
      onClick={isClickable ? onGameClick : undefined}
      interactive={isClickable}
    >
      {/* 상태 표시 */}
      <div
        style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          color: statusDisplay.color,
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
        }}
      >
        {statusDisplay.emoji}
      </div>

      <h2
        style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: '#FFFFFF',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          marginBottom: '1rem'
        }}
      >
        {statusDisplay.text}
      </h2>

      {/* 결과 표시 */}
      {isFinished && myResult && (
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: myResult.isFalseStart ? '#F96D3C' : '#FCB422',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            marginTop: '1rem'
          }}
        >
          {myResult.isFalseStart ? (
            '실격'
          ) : (
            `${myResult.reactionTimeMs}ms (${myResult.rank}등)`
          )}
        </div>
      )}

      {/* 클릭 안내 */}
      {isClickable && (
        <div
          style={{
            fontSize: '1rem',
            color: '#FFFFFF',
            opacity: 0.8,
            marginTop: '1rem',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
          }}
        >
          빨간 신호가 나타나면 빠르게 클릭하세요!
        </div>
      )}
    </ThemeCard>
  );
};

export default ReactionGameArea;
