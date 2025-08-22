import React, { useState } from 'react';
import styles from './FloatingNav.module.css';

interface FloatingNavProps {
  onFriendClick?: () => void;
  onScheduleClick?: () => void;
  onMeetingClick?: () => void;
}

const FloatingNav: React.FC<FloatingNavProps> = ({
  onFriendClick,
  onScheduleClick,
  onMeetingClick
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleFriendClick = () => {
    onFriendClick?.();
    setIsOpen(false);
  };

  const handleScheduleClick = () => {
    onScheduleClick?.();
    setIsOpen(false);
  };

  const handleMeetingClick = () => {
    onMeetingClick?.();
    setIsOpen(false);
  };

  return (
    <div className={styles.floatingNav}>
      {/* 메뉴 아이템들 */}
      <div className={`${styles.navItem} ${styles.friendItem} ${isOpen ? styles.show : ''}`} onClick={handleFriendClick}>
        <div className={styles.navIcon}>👥</div>
        <span className={styles.navText}>친구</span>
      </div>
      
      <div className={`${styles.navItem} ${styles.scheduleItem} ${isOpen ? styles.show : ''}`} onClick={handleScheduleClick}>
        <div className={styles.navIcon}>📅</div>
        <span className={styles.navText}>일정</span>
      </div>
      
      <div className={`${styles.navItem} ${styles.meetingItem} ${isOpen ? styles.show : ''}`} onClick={handleMeetingClick}>
        <div className={styles.navIcon}>🤝</div>
        <span className={styles.navText}>만남</span>
      </div>

      {/* 플로팅 버튼 */}
      <div className={`${styles.floatingButton} ${isOpen ? styles.open : ''}`} onClick={handleToggle}>
        <div className={styles.buttonIcon}>
          <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
          <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
          <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
        </div>
      </div>
    </div>
  );
};

export default FloatingNav;
