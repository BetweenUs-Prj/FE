import React from 'react';
import FadeIn from '../FadeIn';
import styles from './UseCaseSection.module.css';

const UseCaseSection: React.FC = () => {
  return (
    <section className={styles.useCaseSection}>
      <div className={styles.useCaseContent}>
        <FadeIn delay={0.2} direction="up">
          <h2 className={styles.useCaseTitle}>다양한 만남 시나리오</h2>
        </FadeIn>
        <div className={styles.useCasesGrid}>
          <FadeIn delay={0.3} direction="up">
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIcon}>💕</div>
              <h3>1대1 데이트</h3>
              <p>연인과의 특별한 만남, 로맨틱한 장소를 추천받아보세요</p>
              <div className={styles.useCaseFeatures}>
                <span>로맨틱 장소</span>
                <span>분위기 좋은 카페</span>
                <span>데이트 코스</span>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.4} direction="up">
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIcon}>👥</div>
              <h3>친구 모임</h3>
              <p>오랜만에 만나는 친구들과 즐거운 시간을 보내세요</p>
              <div className={styles.useCaseFeatures}>
                <span>다중 인원 지원</span>
                <span>활동적인 장소</span>
                <span>공통 관심사</span>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.5} direction="up">
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIcon}>🍺</div>
              <h3>술자리</h3>
              <p>막차시간을 고려한 완벽한 술자리를 계획해보세요</p>
              <div className={styles.useCaseFeatures}>
                <span>막차시간 공유</span>
                <span>술집 추천</span>
                <span>일정 관리</span>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.6} direction="up">
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIcon}>💼</div>
              <h3>업무 미팅</h3>
              <p>비즈니스 미팅에 최적화된 장소를 찾아보세요</p>
              <div className={styles.useCaseFeatures}>
                <span>조용한 환경</span>
                <span>미팅룸</span>
                <span>프로페셔널</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default UseCaseSection;
