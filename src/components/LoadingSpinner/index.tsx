import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  isLoading?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  isLoading = true,
  size = 'medium', 
  color = '#54AE57', 
  text = '로딩 중...',
  overlay = false 
}) => {
  // isLoading이 false이면 아무것도 렌더링하지 않음
  if (!isLoading) {
    return null;
  }
  const spinnerContent = (
    <div className={`${styles.spinnerContainer} ${styles[size]}`}>
      <div 
        className={styles.spinner} 
        style={{ borderTopColor: color }}
      ></div>
      {text && <div className={styles.loadingText}>{text}</div>}
    </div>
  );

  if (overlay) {
    return (
      <div className={styles.overlay}>
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
