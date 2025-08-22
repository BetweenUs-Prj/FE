import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          우리사이
        </Link>
        <nav className="nav-menu">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            홈
          </Link>
        </nav>
        <button className="login-button">로그인</button>
      </div>
    </header>
  );
};

export default Header;
