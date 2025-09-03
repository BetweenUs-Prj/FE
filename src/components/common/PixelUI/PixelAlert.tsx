import React from 'react';

interface PixelAlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}

export const PixelAlert: React.FC<PixelAlertProps> = ({
  children,
  variant = 'info',
  className = '',
  style = {},
  icon
}) => {
  const defaultIcons = {
    success: '✅',
    danger: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`alert ${variant} ${className}`} style={style}>
      {(icon || defaultIcons[variant]) && (
        <span style={{ marginRight: '0.5rem' }}>
          {icon || defaultIcons[variant]}
        </span>
      )}
      {children}
    </div>
  );
};

export default PixelAlert;