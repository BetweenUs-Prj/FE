import React from 'react';
import FadeIn from '../FadeIn';
import styles from './GamePreviewSection.module.css';

const GamePreviewSection: React.FC = () => {
  return (
    <section className={styles.gamePreviewSection}>
      <div className={styles.gamePreviewContent}>
        <FadeIn delay={0.2} direction="up">
          <h2 className={styles.gamePreviewTitle}>편리한 약속 관리</h2>
        </FadeIn>
        <div className={styles.gamePreviewContainer}>
          <FadeIn delay={0.3} direction="left">
            <div className={styles.gameInfo}>
              <h3>약속 생성 및 관리</h3>
              <p>선택한 장소와 시간으로 약속을 생성하고 친구들에게 초대장을 보낼 수 있습니다. 모든 정보가 정리되어 한눈에 확인할 수 있어요.</p>
              <div className={styles.gameTypes}>
                <FadeIn delay={0.4} direction="up">
                  <div className={styles.gameType}>
                    <div className={styles.gameIcon}>📅</div>
                    <span>약속 정보 정리</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.5} direction="up">
                  <div className={styles.gameType}>
                    <div className={styles.gameIcon}>📧</div>
                    <span>초대장 발송</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.6} direction="up">
                  <div className={styles.gameType}>
                    <div className={styles.gameIcon}>🚇</div>
                    <span>교통 정보 포함</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.7} direction="up">
                  <div className={styles.gameType}>
                    <div className={styles.gameIcon}>⏰</div>
                    <span>소요시간 계산</span>
                  </div>
                </FadeIn>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.4} direction="right">
            <div className={styles.gameDemo}>
              <div className={styles.gameMock}>
                <div className={styles.gameHeader}>
                  <span>약속 관리</span>
                </div>
                <div className={styles.gameContent}>
                  <div className={styles.scheduleInfo}>
                    <div className={styles.scheduleItem}>
                      <span className={styles.scheduleLabel}>장소:</span>
                      <span className={styles.scheduleValue}>스타벅스 강남점</span>
                    </div>
                    <div className={styles.scheduleItem}>
                      <span className={styles.scheduleLabel}>시간:</span>
                      <span className={styles.scheduleValue}>오후 2시</span>
                    </div>
                    <div className={styles.scheduleItem}>
                      <span className={styles.scheduleLabel}>참여자:</span>
                      <span className={styles.scheduleValue}>3명</span>
                    </div>
                  </div>
                  <div className={styles.gameStatus}>약속 생성 완료</div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default GamePreviewSection;
