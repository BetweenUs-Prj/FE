import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo" onClick={() => window.location.reload()}>
        </div>
        <nav className="nav-menu">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            소개페이지
          </Link>
        </nav>
        <button className="kakao-login-button">
          카카오로 시작하기
        </button>
      </div>
    </header>
  );
};

export default Header;
