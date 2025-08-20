import React, { useEffect } from 'react';
import './CustomAlert.css';

interface CustomAlertProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  message,
  isVisible,
  onClose
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // 2초 후 자동으로 닫힘

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="custom-alert-overlay">
      <div className="custom-alert">
        <div className="alert-content">
          <div className="alert-icon">💌</div>
          <div className="alert-message">{message}</div>
        </div>
        <button className="alert-close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default CustomAlert;
