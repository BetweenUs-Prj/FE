import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import Toast from '../Toast';

const Header: React.FC = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userProfileImage, setUserProfileImage] = useState<string>('');
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



  // 로그인 후 쿠키에서 JWT 토큰 읽기
  const getJwtToken = () => {
    console.log('🔍 getJwtToken 함수 실행');
    console.log('🍪 document.cookie:', document.cookie);
    
    const cookies = document.cookie.split(';');
    console.log('🍪 분리된 쿠키들:', cookies);
    
    for (let cookie of cookies) {
      const trimmedCookie = cookie.trim();
      console.log('🍪 처리 중인 쿠키:', trimmedCookie);
      
      const [name, value] = trimmedCookie.split('=');
      console.log('🍪 쿠키 이름:', name, '값:', value);
      
      if (name === 'jwt_token') {
        console.log('✅ jwt_token 쿠키 발견:', value);
        return value;
      }
    }
    
    console.log('❌ jwt_token 쿠키를 찾을 수 없음');
    return null;
  };

  // JWT 토큰에서 사용자 정보 추출
  const parseJwtToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      console.log('JWT 토큰 파싱 결과:', payload);
      return payload;
    } catch (error) {
      console.error('JWT 토큰 파싱 실패:', error);
      return null;
    }
  };

  // JWT 토큰 만료 확인
  const isTokenExpired = (tokenPayload: any) => {
    if (!tokenPayload || !tokenPayload.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초)
    const expirationTime = tokenPayload.exp; // 토큰 만료 시간 (초)
    
    console.log('🔍 토큰 만료 확인:');
    console.log('  - 현재 시간:', currentTime);
    console.log('  - 만료 시간:', expirationTime);
    console.log('  - 만료 여부:', currentTime >= expirationTime);
    
    return currentTime >= expirationTime;
  };

  // 로그아웃 처리
  const handleLogout = () => {
    // 쿠키 삭제
    document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 상태 초기화
    setIsLoggedIn(false);
    setUserName('');
    setUserProfileImage('');
    setShowProfileMenu(false);
    
    console.log('로그아웃 완료');
  };

  // 로그인 상태 확인 및 설정
  const checkLoginStatus = () => {
    console.log('🔍 로그인 상태 확인 시작');
    console.log('🍪 현재 쿠키:', document.cookie);
    
    const jwtToken = getJwtToken();
    console.log('🔍 JWT 토큰:', jwtToken);
    
    if (jwtToken) {
      const tokenPayload = parseJwtToken(jwtToken);
      console.log('🔍 토큰 페이로드:', tokenPayload);
      
      if (tokenPayload) {
        // 토큰 만료 확인
        if (isTokenExpired(tokenPayload)) {
          console.log('❌ JWT 토큰이 만료되었습니다.');
          handleLogout();
          showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
          return;
        }
        
        setIsLoggedIn(true);
        setUserName(tokenPayload.name || '사용자');
        setUserProfileImage(tokenPayload.profileImage || '');
        console.log('✅ 로그인 성공:', tokenPayload);
        showToast('카카오 로그인이 성공했습니다!', 'success');
      }
    } else {
      console.log('⚠️ JWT 토큰을 찾을 수 없습니다.');
    }
  };

  const handleLoginClick = () => {
    console.log('카카오 로그인 버튼 클릭됨');
    // 백엔드의 OAuth2 엔드포인트로 리다이렉트 (프록시 사용)
    window.location.href = '/oauth2/authorization/kakao';
  };

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    checkLoginStatus();
  }, []);

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

  // 프로필 수정 API 호출
  const updateUserProfile = async (profileData: { name?: string; profileImage?: string }) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('JWT 토큰이 없습니다.');
      }

      // 토큰 만료 확인
      const tokenPayload = parseJwtToken(jwtToken);
      if (tokenPayload && isTokenExpired(tokenPayload)) {
        console.log('❌ API 호출 시 토큰 만료 확인됨');
        handleLogout();
        showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
        throw new Error('JWT 토큰이 만료되었습니다.');
      }

      const response = await fetch('/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.status === 401) {
        // 인증 실패 시 로그아웃 처리
        console.log('❌ API 인증 실패 (401)');
        handleLogout();
        showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
        throw new Error('인증에 실패했습니다.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('프로필 수정 성공:', result);
      
      // 로컬 상태 업데이트
      if (profileData.name) {
        setUserName(profileData.name);
      }
      if (profileData.profileImage) {
        setUserProfileImage(profileData.profileImage);
      }
      
      showToast('프로필이 성공적으로 수정되었습니다!', 'success');
      return result;
      
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      if (error instanceof Error && error.message !== 'JWT 토큰이 만료되었습니다.' && error.message !== '인증에 실패했습니다.') {
        showToast('프로필 수정 중 오류가 발생했습니다.', 'error');
      }
      throw error;
    }
  };

  const handleProfileEditClick = () => {
    if (!isLoggedIn) {
      showToast('회원 전용 기능입니다. 로그인 후 이용해주세요.', 'warning');
      return;
    }
    
    // 임시로 이름만 수정하는 예시 (실제로는 모달이나 폼을 사용)
    const newName = prompt('새로운 이름을 입력하세요:', userName);
    if (newName && newName.trim() !== '') {
      updateUserProfile({ name: newName.trim() });
    }
    setShowProfileMenu(false);
  };

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
              <span className={styles.profileName}>{userName || '사용자'}</span>
              <span className={styles.profileEmail}>프로필 설정</span>
            </div>
            {userProfileImage && (
              <div className={styles.profileImageContainer}>
                <img 
                  src={userProfileImage} 
                  alt="프로필" 
                  className={styles.profileImage}
                />
              </div>
            )}
            <button 
              className={styles.logoutButton}
              onClick={() => {
                setIsLoggedIn(false);
                setShowProfileMenu(false);
                showToast('로그아웃되었습니다.', 'info');
              }}
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
          >
            카카오로 시작하기
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
