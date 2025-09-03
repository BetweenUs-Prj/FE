import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FadeIn from '../FadeIn';
import { useTransition } from '../../contexts/TransitionContext';
import styles from './ScheduleSection.module.css';

const ScheduleSection: React.FC = () => {
  const navigate = useNavigate();
  const { startTransition } = useTransition();
  const [showPapers, setShowPapers] = useState(false);
  const [isFalling, setIsFalling] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [envelopeHovered, setEnvelopeHovered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const lastWheelTime = useRef(0);
  const fallingTimeoutRef = useRef<number | null>(null);

  // 종이 상태 초기화
  const resetPaperState = () => {
    setShowPapers(false);
    setIsFalling(false);
  };

  // 타임아웃 정리
  const clearFallingTimeout = () => {
    if (fallingTimeoutRef.current) {
      clearTimeout(fallingTimeoutRef.current);
      fallingTimeoutRef.current = null;
    }
  };

  // 종이 애니메이션 시작
  const startPaperAnimation = () => {
    setShowPapers(true);
    setIsFalling(false);
  };

  // 역순 애니메이션 시작
  const startReverseAnimation = () => {
    setIsFalling(true);
    
    // 2초 후에 종이들을 숨김
    clearFallingTimeout();
    fallingTimeoutRef.current = window.setTimeout(() => {
      resetPaperState();
    }, 2000);
  };

  // 편지봉투 호버 핸들러
  const handleEnvelopeHover = () => {
    setEnvelopeHovered(true);
    // 툴팁 메시지 표시
    const envelope = document.querySelector(`.${styles.envelope}`);
    if (envelope) {
      envelope.setAttribute('title', '클릭해보세요');
    }
  };

  const handleEnvelopeLeave = () => {
    setEnvelopeHovered(false);
  };

  // 편지봉투 클릭 핸들러
  const handleEnvelopeClick = () => {
    startTransition();
    setTimeout(() => {
      navigate('/BetweenUs');
    }, 1500);
  };

  // Intersection Observer 설정
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (!entry.isIntersecting) {
          resetPaperState();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    if (!isInView) return;

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTime.current < 100) return; // 디바운싱
      lastWheelTime.current = now;

      if (e.deltaY > 0 && !showPapers && !isFalling) {
        // 아래로 스크롤 - 종이들 나타남
        startPaperAnimation();
      } else if (e.deltaY < 0 && showPapers && !isFalling) {
        // 위로 스크롤 - 종이들 사라짐
        startReverseAnimation();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
      clearFallingTimeout();
    };
  }, [isInView, showPapers, isFalling]);

  // 종이 요소들 생성
  const renderPapers = () => {
    const papers = [];
    for (let i = 1; i <= 20; i++) {
      papers.push(
        <div 
          key={i} 
          className={`${styles.paper} ${styles[`paper${i}`]} ${isFalling ? styles.falling : ''}`}
        >
        </div>
      );
    }
    // 편지봉투 추가
    papers.push(
      <div 
        key="envelope" 
        className={`${styles.envelope} ${styles.envelope1} ${isFalling ? styles.falling : ''} ${envelopeHovered ? styles.hovered : ''}`}
        onClick={handleEnvelopeClick}
        onMouseEnter={handleEnvelopeHover}
        onMouseLeave={handleEnvelopeLeave}
        style={{ cursor: 'pointer' }}
        title="클릭해보세요"
      >
        <div className={styles.envelopeTooltip}>클릭해보세요</div>
      </div>
    );
    return papers;
  };

  return (
    <section ref={sectionRef} className={styles.scheduleSection}>
      <div className={styles.scheduleContent}>
        <FadeIn delay={0.2} direction="up">
          <h2 className={styles.scheduleTitle}>지금 시작해보세요</h2>
        </FadeIn>
        <FadeIn delay={0.3} direction="up">
          <p className={styles.scheduleSubtitle}>
            친구들과의 만남을 더욱 쉽고 편리하게 만들어보세요
          </p>
        </FadeIn>
        
        <div className={styles.scheduleFeatures}>
          <FadeIn delay={0.4} direction="up">
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📍</div>
              <div className={styles.featureText}>
                <h3>중간 거리 찾기</h3>
                <p>친구들의 위치를 입력하면 최적의 만남 장소를 자동으로 찾아줍니다</p>
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.5} direction="up">
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🚇</div>
              <div className={styles.featureText}>
                <h3>교통 정보 제공</h3>
                <p>각 친구별로 역까지의 경로와 소요시간을 실시간으로 계산합니다</p>
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.6} direction="up">
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🎯</div>
              <div className={styles.featureText}>
                <h3>추천 장소</h3>
                <p>역 주변의 카페, 식당, 놀이공원 등 다양한 장소를 추천합니다</p>
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.7} direction="up">
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📅</div>
              <div className={styles.featureText}>
                <h3>약속 관리</h3>
                <p>선택한 장소와 시간으로 약속을 생성하고 친구들에게 초대장을 보낼 수 있습니다</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
      <FadeIn delay={0.8} direction="down">
            <div className={styles.bottomArrow}>
              <div className={styles.arrowIcon}>↓</div>
              <div className={styles.arrowText}>지금 시작하기</div>
            </div>
          </FadeIn>
      {/* 종이 효과 */}
      {showPapers && (
        <div className={styles.paperContainer}>
          {renderPapers()}
        </div>
      )}


    </section>
  );
};

export default ScheduleSection;
