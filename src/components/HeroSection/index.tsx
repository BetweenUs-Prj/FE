import React from 'react';
import FadeIn from '../FadeIn';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <FadeIn delay={0.2} direction="up">
          <h1 className="hero-title">우리사이</h1>
        </FadeIn>
        <FadeIn delay={0.4} direction="up">
          <p className="hero-subtitle">함께하는 공간, 우리만의 이야기</p>
        </FadeIn>
      </div>
    </section>
  );
};

export default HeroSection;
