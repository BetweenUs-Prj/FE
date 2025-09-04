import React from 'react';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestionCardProps {
  question: string;
  options: QuizOption[];
  selectedOption: string | null;
  onOptionSelect: (optionId: string) => void;
  isAnswered: boolean;
  category?: string;
  roundNo?: number;
  className?: string;
  style?: React.CSSProperties;
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  options,
  selectedOption,
  onOptionSelect,
  isAnswered,
  category,
  roundNo,
  className = '',
  style = {}
}) => {
  const pixelStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    
    .pixel-quiz-card {
      font-family: 'Press Start 2P', cursive;
      background-color: #4a4e69;
      border: 4px solid #0d0d0d;
      box-shadow: 6px 6px 0px #0d0d0d;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    
    .pixel-option-button {
      font-family: 'Press Start 2P', cursive;
      background-color: #9a8c98;
      color: #f2e9e4;
      border: 4px solid #0d0d0d;
      box-shadow: 4px 4px 0px #0d0d0d;
      padding: 1rem 1.5rem;
      margin-bottom: 1rem;
      cursor: pointer;
      transition: all 0.1s linear;
      font-size: 0.8rem;
      text-align: left;
      width: 100%;
    }
    
    .pixel-option-button:hover {
      transform: translateY(-2px);
      box-shadow: 6px 6px 0px #0d0d0d;
    }
    
    .pixel-option-button:active {
      transform: translateY(2px);
      box-shadow: 2px 2px 0px #0d0d0d;
    }
    
    .pixel-option-button.selected {
      background-color: #fdffb6;
      color: #0d0d0d;
      border-color: #ffd6a5;
    }
    
    .pixel-option-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: 2px 2px 0px #0d0d0d;
      background-color: #6b7280 !important;
      color: #9ca3af !important;
      border-color: #4b5563 !important;
    }
    
    .pixel-option-button:disabled.selected {
      background-color: #10b981 !important;
      color: #ffffff !important;
      border-color: #059669 !important;
      opacity: 0.9;
    }
  `;

  return (
    <>
      <style>{pixelStyles}</style>
      <div className={`pixel-quiz-card ${className}`} style={style}>
        {/* 헤더 정보 */}
        {(category || roundNo) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '3px solid #0d0d0d'
          }}>
            {category && (
              <div style={{
                fontSize: '0.8rem',
                color: '#ffd6a5',
                textShadow: '2px 2px 0px #0d0d0d'
              }}>
                CATEGORY: {category.toUpperCase()}
              </div>
            )}
            {roundNo && (
              <div style={{
                fontSize: '0.8rem',
                color: '#ffadad',
                textShadow: '2px 2px 0px #0d0d0d'
              }}>
                ROUND {roundNo}
              </div>
            )}
          </div>
        )}

        {/* 문제 */}
        <h2 style={{
          fontSize: '1.2rem',
          color: '#f2e9e4',
          textShadow: '3px 3px 0px #0d0d0d',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          {question}
        </h2>

        {/* 보기 */}
        <div>
          {options.map((option, index) => {
            const isSelected = selectedOption === option.id;
            const isDisabled = isAnswered;
            const optionLabels = ['A', 'B', 'C', 'D'];

            return (
              <button
                key={option.id}
                onClick={() => !isDisabled && onOptionSelect(option.id)}
                disabled={isDisabled}
                className={`pixel-option-button ${isSelected ? 'selected' : ''}`}
              >
                <span style={{
                  fontWeight: 'bold',
                  marginRight: '1rem',
                  color: isSelected ? '#0d0d0d' : '#ffd6a5'
                }}>
                  {optionLabels[index]}.
                </span>
                {option.text}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default QuizQuestionCard;
