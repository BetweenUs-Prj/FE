import React from 'react';
import ThemeButton from '../../common/Button/ThemeButton';

interface GameAnswerControlsProps {
  selectedOptionId: string | null;
  hasSubmitted: boolean;
  inflight: boolean;
  onSubmit: () => void;
  onSkip: () => void;
  disabled?: boolean;
}

export function GameAnswerControls({
  selectedOptionId,
  hasSubmitted,
  inflight,
  onSubmit,
  onSkip,
  disabled = false
}: GameAnswerControlsProps) {
  const canSubmit = selectedOptionId && !hasSubmitted && !inflight && !disabled;
  const canSkip = !hasSubmitted && !inflight && !disabled;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      gap: '1rem', 
      marginTop: '2rem',
      flexWrap: 'wrap'
    }}>
      <ThemeButton
        variant="primary"
        onClick={onSubmit}
        disabled={!canSubmit}
        style={{
          minWidth: '120px',
          opacity: canSubmit ? 1 : 0.5
        }}
      >
        {inflight ? '제출 중...' : '답변 제출'}
      </ThemeButton>

      <ThemeButton
        variant="secondary"
        onClick={onSkip}
        disabled={!canSkip}
        style={{
          minWidth: '120px',
          opacity: canSkip ? 1 : 0.5
        }}
      >
        건너뛰기
      </ThemeButton>
    </div>
  );
}