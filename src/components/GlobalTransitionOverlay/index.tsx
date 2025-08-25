import React, { useEffect, useState } from 'react';
import { useTransition } from '../../contexts/TransitionContext';
import styles from './GlobalTransitionOverlay.module.css';

const GlobalTransitionOverlay: React.FC = () => {
  const { isTransitioning, endTransition } = useTransition();
  const [showLogo, setShowLogo] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      // 로고 나타남
      setTimeout(() => {
        setShowLogo(true);
      }, 100);

      // 2초 후 fadeout 시작
      setTimeout(() => {
        setFadeOut(true);
      }, 2000);

      // 3.5초 후 전환 완료
      setTimeout(() => {
        endTransition();
        setShowLogo(false);
        setFadeOut(false);
      }, 3500);
    } else {
      // 초기화
      setShowLogo(false);
      setFadeOut(false);
    }
  }, [isTransitioning, endTransition]);

  if (!isTransitioning) return null;

  return (
    <div className={`${styles.globalTransitionOverlay} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.logoContainer}>
        <div className={`${styles.transitionLogo} ${showLogo ? styles.show : ''}`}>
          <div className={styles.transitionLogoImage}></div>
        </div>
      </div>
    </div>
  );
};

export default GlobalTransitionOverlay;
