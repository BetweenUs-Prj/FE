import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const location = useLocation();

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
        <button className={styles.kakaoLoginButton}>
          카카오로 시작하기
        </button>
      </div>
    </header>
  );
};

export default Header;
