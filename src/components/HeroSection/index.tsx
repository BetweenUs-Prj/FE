import React from 'react';
import { useNavigate } from 'react-router-dom';
import FadeIn from '../FadeIn';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/BetweenUs');
  };

  return (
    <section className="hero-section">
      {/* 바로 시작하기 버튼 */}
      <div className="start-button-container">
        <button className="start-button" onClick={handleStartClick}>
          바로 시작하기
        </button>
      </div>
      
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
