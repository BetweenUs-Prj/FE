import React, { useState } from 'react';
import './PaperDrawer.css';

interface PaperDrawerProps {
  children?: React.ReactNode;
  className?: string;
}

const PaperDrawer: React.FC<PaperDrawerProps> = ({ children, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`paper-drawer ${isExpanded ? 'expanded' : ''} ${className}`}>
      <div className="paper-drawer-content">
        <div className="paper-drawer-header" onClick={handleToggle}>
          <div className="paper-tab">
            <div className="paper-tab-icon">📅</div>
            <div className="paper-tab-text">우리의 어디서 만날까 ?</div>
          </div>
        </div>
        <div className="paper-drawer-body">
          {children || (
            <div className="default-content">
              <h3>작업 공간</h3>
              <p>여기에 작업할 내용을 넣어주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperDrawer;
