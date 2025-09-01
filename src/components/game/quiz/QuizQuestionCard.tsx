import React from 'react';
import ThemeCard from '../../common/Card/ThemeCard';

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
  return (
    <ThemeCard
      variant="primary"
      className={`quiz-question-card ${className}`}
      style={{
        marginBottom: '2rem',
        ...style
      }}
    >
      {/* 헤더 정보 */}
      {(category || roundNo) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {category && (
            <div
              style={{
                fontSize: '1rem',
                color: '#FCB422',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}
            >
              📚 {category}
            </div>
          )}
          {roundNo && (
            <div
              style={{
                fontSize: '1rem',
                color: '#FCB422',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}
            >
              🔢 {roundNo}라운드
            </div>
          )}
        </div>
      )}

      {/* 문제 */}
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#FFFFFF',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem',
          lineHeight: '1.4'
        }}
      >
        {question}
      </h2>

      {/* 보기 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isDisabled = isAnswered;

          return (
            <button
              key={option.id}
              onClick={() => !isDisabled && onOptionSelect(option.id)}
              disabled={isDisabled}
              style={{
                padding: '1rem 1.5rem',
                background: isSelected
                  ? 'rgba(252, 180, 34, 0.3)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: isSelected
                  ? '2px solid #FCB422'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '1rem',
                fontWeight: '500',
                textAlign: 'left',
                cursor: isDisabled ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                opacity: isDisabled ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.background = isSelected
                    ? 'rgba(252, 180, 34, 0.4)'
                    : 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.background = isSelected
                    ? 'rgba(252, 180, 34, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    </ThemeCard>
  );
};

export default QuizQuestionCard;
