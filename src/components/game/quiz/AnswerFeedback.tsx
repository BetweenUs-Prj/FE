import React from 'react';

interface AnswerFeedbackProps {
  isCorrect: boolean;
  onComplete: () => void;
}

const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({ isCorrect, onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000); // 3초 후 완료

    return () => clearTimeout(timer);
  }, [onComplete]);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    
    .answer-feedback-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Press Start 2P', cursive;
    }
    
    .answer-feedback-content {
      text-align: center;
      animation: feedbackBounce 0.8s ease-out;
    }
    
    .feedback-icon {
      font-size: 8rem;
      margin-bottom: 2rem;
      animation: iconPulse 2s ease-in-out infinite;
    }
    
    .feedback-text {
      font-size: 2rem;
      margin-bottom: 1rem;
      text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.8);
      animation: textGlow 2s ease-in-out infinite alternate;
    }
    
    .feedback-message {
      font-size: 1rem;
      opacity: 0.9;
      animation: fadeInUp 1s ease-out 0.5s both;
    }
    
    .correct {
      color: #10b981;
    }
    
    .incorrect {
      color: #ef4444;
    }
    
    @keyframes feedbackBounce {
      0% { 
        transform: scale(0) rotate(180deg);
        opacity: 0;
      }
      50% { 
        transform: scale(1.2) rotate(-10deg);
        opacity: 1;
      }
      100% { 
        transform: scale(1) rotate(0deg);
        opacity: 1;
      }
    }
    
    @keyframes iconPulse {
      0%, 100% { 
        transform: scale(1);
      }
      50% { 
        transform: scale(1.1);
      }
    }
    
    @keyframes textGlow {
      0% { 
        text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.8);
      }
      100% { 
        text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.8), 
                     0 0 20px currentColor;
      }
    }
    
    @keyframes fadeInUp {
      0% {
        opacity: 0;
        transform: translateY(20px);
      }
      100% {
        opacity: 0.9;
        transform: translateY(0);
      }
    }
    
    /* 파티클 효과 */
    .particles {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    
    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: currentColor;
      animation: particleFloat 3s ease-out infinite;
    }
    
    @keyframes particleFloat {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(-100px) scale(0);
      }
    }
  `;

  // 파티클 생성
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        color: isCorrect ? '#10b981' : '#ef4444'
      }}
    />
  ));

  return (
    <>
      <style>{styles}</style>
      <div className="answer-feedback-overlay">
        {/* 파티클 효과 */}
        <div className="particles">
          {particles}
        </div>
        
        <div className="answer-feedback-content">
          <div className={`feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '🎉' : '💥'}
          </div>
          <div className={`feedback-text ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '정답입니다!' : '오답입니다!'}
          </div>
          <div className={`feedback-message ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '훌륭해요!' : '다음엔 더 잘할 수 있어요!'}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnswerFeedback;