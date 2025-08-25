import React from 'react';
import FadeIn from '../FadeIn';
import styles from './HowItWorksSection.module.css';

const HowItWorksSection: React.FC = () => {
  return (
    <section className={styles.howItWorksSection}>
      <div className={styles.howItWorksContent}>
        <FadeIn delay={0.2} direction="up">
          <h2 className={styles.howItWorksTitle}>사용법</h2>
        </FadeIn>
        <div className={styles.stepsContainer}>
          <FadeIn delay={0.3} direction="left">
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>친구 추가</h3>
                <p>만나고 싶은 친구를 추가하고 위치를 설정하세요</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.4} direction="right">
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>목적 선택</h3>
                <p>만나는 목적을 선택하면 맞춤형 장소를 추천해드려요</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.5} direction="left">
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>게임으로 결정</h3>
                <p>재미있는 게임으로 최종 만남 장소를 결정하세요</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.6} direction="right">
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3>일정 공유</h3>
                <p>막차시간과 일정을 공유해서 완벽한 만남을 준비하세요</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
