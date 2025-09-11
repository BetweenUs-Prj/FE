import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import Toast from '../Toast';

const Header: React.FC = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  const handleLoginClick = async () => {
    if (isLoggedIn) {
      // 로그아웃
      setIsLoggedIn(false);
      setShowProfileMenu(false);
      showToast('로그아웃되었습니다.', 'success');
      return;
    }

    // 로그인 시뮬레이션
    setIsLoggingIn(true);
    showToast('카카오 로그인 중...', 'info');
    
    try {
      // 실제 카카오 로그인 API 호출 시뮬레이션 (2-3초 지연)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      
      setIsLoggedIn(true);
      setIsLoggingIn(false);
      setShowProfileMenu(false);
      showToast('로그인되었습니다!', 'success');
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      setIsLoggingIn(false);
      showToast('로그인에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  const showToast = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleProfileMenuClick = () => {
    if (!isLoggedIn) {
      showToast('회원 전용 기능입니다. 로그인 후 이용해주세요.', 'warning');
      return;
    }
    setShowProfileMenu(!showProfileMenu);
  };

  const handleProfileEditClick = () => {
    if (!isLoggedIn) {
      showToast('회원 전용 기능입니다. 로그인 후 이용해주세요.', 'warning');
      return;
    }
    
    // TODO: 프로필 편집 팝업 구현
    showToast('프로필 편집 기능이 곧 추가될 예정입니다!', 'info');
    setShowProfileMenu(false);
  };

  // const handleMenuClick = (menuName: string) => {
  //   if (!isLoggedIn) {
  //     showToast('회원 전용 기능입니다. 로그인 후 이용해주세요.', 'warning');
  //     return;
  //   }
  //   
  //   // TODO: 각 메뉴별 팝업 구현
  //   showToast(`${menuName} 기능이 곧 추가될 예정입니다!`, 'info');
  //   setShowProfileMenu(false);
  // };

  // 외부 클릭 감지
  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // 프로필 드롭다운 외부 클릭 감지
      if (!target.closest(`.${styles.profileSection}`)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.logo} onClick={() => window.location.reload()}>
        </div>
        <nav className={styles.navMenu}>
          <Link to="/" className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}>
            소개페이지
          </Link>
        </nav>
        {isLoggedIn ? (
          <div className={styles.profileSection}>
            <div 
              className={styles.profileInfo}
              onClick={handleProfileMenuClick}
            >
              <span className={styles.profileName}>한규덕</span>
              <span className={styles.profileEmail}>rbejr456@naver.com</span>
            </div>
            <button 
              className={styles.logoutButton}
              onClick={handleLoginClick}
            >
              로그아웃
            </button>
            
            {/* 프로필 드롭다운 메뉴 */}
            {showProfileMenu && (
              <div className={styles.profileDropdown}>
                <div 
                  className={styles.profileMenuItem}
                  onClick={handleProfileEditClick}
                >
                  <span className={styles.menuIcon}>👤</span>
                  <span className={styles.menuText}>프로필 편집</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            className={styles.kakaoLoginButton}
            onClick={handleLoginClick}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <span className={styles.loadingSpinner}></span>
                로그인 중...
              </>
            ) : (
              '카카오로 시작하기'
            )}
          </button>
        )}
      </div>
      
      {/* 토스트 메시지 */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
        duration={3000}
      />
    </header>
  );
};

export default Header;
