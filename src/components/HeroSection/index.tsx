import React from 'react';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">우리사이</h1>
        <p className="hero-subtitle">함께하는 공간, 우리만의 이야기</p>
      </div>
    </section>
  );
};

export default HeroSection;
