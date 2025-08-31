import React, { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export interface ToastProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  onClose?: () => void;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose, 
  isVisible 
}) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(() => {
          onClose?.();
        }, 400); // 애니메이션 완료 후 제거
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isShowing) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${isShowing ? styles.show : styles.hide}`}>
      <div className={styles.toastContent}>
        <span className={styles.toastIcon}>{getIcon()}</span>
        <span className={styles.toastMessage}>{message}</span>
        <button 
          className={styles.toastClose} 
          onClick={() => {
            setIsShowing(false);
            setTimeout(() => onClose?.(), 400);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
