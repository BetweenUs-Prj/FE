import React from 'react';
import ThemeCard from '../../common/Card/ThemeCard';

interface QuizTimerProps {
  timeLeft: number;
  totalTime?: number;
  className?: string;
  style?: React.CSSProperties;
}

const QuizTimer: React.FC<QuizTimerProps> = ({
  timeLeft,
  totalTime = 30,
  className = '',
  style = {}
}) => {
  // 디버깅을 위한 로그
  console.log('[QuizTimer] Rendering with timeLeft:', timeLeft, 'totalTime:', totalTime);
  
  const progress = (timeLeft / totalTime) * 100;
  const isWarning = timeLeft <= 10;
  const isDanger = timeLeft <= 5;

  const getProgressColor = () => {
    if (isDanger) return '#F96D3C';
    if (isWarning) return '#FCB422';
    return '#147781';
  };

  return (
    <ThemeCard
      variant="primary"
      className={`quiz-timer ${className}`}
      style={{
        marginBottom: '1rem',
        ...style
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}
      >
        <div
          style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#FFFFFF',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
          }}
        >
          ⏰ 남은 시간
        </div>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: getProgressColor(),
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
          }}
        >
          {timeLeft}초
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div
        style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${getProgressColor()} 0%, ${getProgressColor()}80 100%)`,
            borderRadius: '4px',
            transition: 'width 1s linear',
            boxShadow: `0 0 8px ${getProgressColor()}40`
          }}
        />
      </div>

      {/* 경고 메시지 */}
      {isWarning && (
        <div
          style={{
            fontSize: '0.9rem',
            color: isDanger ? '#F96D3C' : '#FCB422',
            fontWeight: '600',
            textAlign: 'center',
            marginTop: '0.5rem',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            animation: isDanger ? 'pulse 1s infinite' : 'none'
          }}
        >
          {isDanger ? '🚨 시간이 얼마 남지 않았습니다!' : '⚠️ 시간이 부족합니다!'}
        </div>
      )}
    </ThemeCard>
  );
};

export default QuizTimer;
