import React from 'react';
import { useNavigate } from 'react-router-dom';
import FadeIn from '../FadeIn';
import styles from './HeroSection.module.css';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/BetweenUs');
  };

  return (
    <section className={styles.heroSection}>
      {/* 바로 시작하기 버튼 */}
      <div className={styles.startButtonContainer}>
        <button className={styles.startButton} onClick={handleStartClick}>
          바로 시작하기
        </button>
      </div>
      
      <div className={styles.heroContent}>
        <FadeIn delay={0.2} direction="up">
          <h1 className={styles.heroTitle}>우리사이</h1>
        </FadeIn>
        <FadeIn delay={0.4} direction="up">
          <p className={styles.heroSubtitle}>함께하는 공간, 우리만의 이야기</p>
        </FadeIn>
      </div>
    </section>
  );
};

export default HeroSection;
