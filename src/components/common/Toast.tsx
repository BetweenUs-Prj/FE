import React, { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyle = {
      fontFamily: "'Press Start 2P', cursive",
      fontSize: '0.8rem',
      padding: '1rem',
      border: '4px solid #0d0d0d',
      boxShadow: '4px 4px 0px #0d0d0d',
      color: '#f2e9e4',
      textShadow: '2px 2px 0px #0d0d0d',
      transition: 'all 0.3s ease'
    };
    
    switch (type) {
      case 'success': 
        return { ...baseStyle, backgroundColor: '#6a856f' };
      case 'error': 
        return { ...baseStyle, backgroundColor: '#9d2929' };
      case 'info': 
      default: 
        return { ...baseStyle, backgroundColor: '#4a4e69' };
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      `}</style>
      <div
        className="fixed top-4 right-4 z-[9999]"
        style={{
          ...getToastStyles(),
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-1rem) scale(0.95)',
        }}
      >
        {message}
      </div>
    </>
  );
};

// Toast container component to manage multiple toasts
export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Add this to window for global access
  useEffect(() => {
    (window as any).showToast = (message: string, type?: 'success' | 'error' | 'info', duration?: number) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    return () => {
      delete (window as any).showToast;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast, index) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Helper function for showing toasts
export const showToast = (message: string, type?: 'success' | 'error' | 'info', duration?: number) => {
  console.log('[TOAST] Showing toast:', { message, type, duration });
  if ((window as any).showToast) {
    (window as any).showToast(message, type, duration);
  } else {
    console.warn('[TOAST] showToast function not available on window');
    // Fallback: use console.log for debugging
    console.log(`[TOAST] ${type?.toUpperCase() || 'INFO'}: ${message}`);
  }
};