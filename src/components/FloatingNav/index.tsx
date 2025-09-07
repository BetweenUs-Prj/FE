import React, { useState } from 'react';
import styles from './FloatingNav.module.css';
import { API_BASE_URLS } from '../../constants/config';

interface Meeting {
  meetingId: number;
  title: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  host: {
    userId: number;
    name: string;
  };
  place: {
    placeId: number;
    placeName: string;
    address: string;
  };
  scheduledAt: string;
  participants: {
    userId: number;
    role: 'HOST' | 'PARTICIPANT';
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'LEFT';
  }[];
}

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
  const [isClosing, setIsClosing] = useState(false);

  const handleToggle = () => {
    if (isOpen) {
      // 닫을 때 바로 X로 바뀌고 순차적으로 사라지도록
      setIsOpen(false);
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
      }, 600); // 모든 애니메이션이 끝날 시간
    } else {
      setIsOpen(true);
    }
  };

  const handleFriendClick = () => {
    onFriendClick?.();
    // 메뉴 클릭 시에는 닫히지 않도록 handleToggle() 제거
  };

  const handleScheduleClick = () => {
    // 여기서 정보를 적재
    // 근데 어떻게? 사용자 정보는 토큰밖에 없는데?
    onScheduleClick?.();
    // 메뉴 클릭 시에는 닫히지 않도록 handleToggle() 제거
  };

  const handleMeetingClick = () => {
    onMeetingClick?.();
    // 메뉴 클릭 시에는 닫히지 않도록 handleToggle() 제거
  };

  return (
    <div className={styles.floatingNav}>
      {/* 메뉴 아이템들 */}
      <div className={`${styles.navItem} ${styles.friendItem} ${isOpen && !isClosing ? styles.show : ''} ${isClosing ? styles.closing : ''}`} onClick={handleFriendClick}>
        <div className={styles.navIcon}>👥</div>
        <span className={styles.navText}>친구</span>
      </div>
      
      <div className={`${styles.navItem} ${styles.scheduleItem} ${isOpen && !isClosing ? styles.show : ''} ${isClosing ? styles.closing : ''}`} onClick={handleScheduleClick}>
        <div className={styles.navIcon}>📅</div>
        <span className={styles.navText}>일정</span>
      </div>
      
      <div className={`${styles.navItem} ${styles.meetingItem} ${isOpen && !isClosing ? styles.show : ''} ${isClosing ? styles.closing : ''}`} onClick={handleMeetingClick}>
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
