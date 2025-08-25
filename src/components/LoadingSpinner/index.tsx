import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = '#54AE57', 
  text = '로딩 중...',
  overlay = false 
}) => {
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
