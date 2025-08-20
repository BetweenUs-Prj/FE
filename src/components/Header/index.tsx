import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo">우리사이</h1>
        <button className="login-button">로그인</button>
      </div>
    </header>
  );
};

export default Header;
