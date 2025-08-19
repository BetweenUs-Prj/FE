import React, { useState, useEffect, useRef } from 'react';
import './ScheduleSection.css';

const ScheduleSection: React.FC = () => {
  const [showPapers, setShowPapers] = useState(false);
  const [isFalling, setIsFalling] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  const sectionRef = useRef<HTMLElement>(null);
  const lastWheelTime = useRef(0);
  const fallingTimeoutRef = useRef<number | null>(null);

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

  // 종이 요소들 생성
  const renderPapers = () => {
    const papers = [];
    for (let i = 1; i <= 20; i++) {
      papers.push(
        <div 
          key={i} 
          className={`paper paper-${i} ${isFalling ? 'falling' : ''}`}
        >
          {i}
        </div>
      );
    }
    return papers;
  };

  return (
    <section ref={sectionRef} className="schedule-section">
      <div className="schedule-content">
        <h2 className="schedule-title">일정 공유 & 막차시간 관리</h2>
        <p className="schedule-subtitle">
          개개인의 막차시간과 일정을 공유하여 아무도 뒤처지지 않는 완벽한 만남을 계획해보세요
        </p>
        
        <div className="schedule-features">
          <div className="feature">
            <div className="feature-icon">🚇</div>
            <div className="feature-text">
              <h3>막차시간 공유</h3>
              <p>개인별 막차시간을 설정하고 안전한 만남을 보장합니다</p>
            </div>
          </div>
          
          <div className="feature">
            <div className="feature-icon">📅</div>
            <div className="feature-text">
              <h3>일정 동기화</h3>
              <p>모든 참여자의 일정을 한눈에 확인하고 최적의 시간을 찾습니다</p>
            </div>
          </div>
          
          <div className="feature">
            <div className="feature-icon">⏰</div>
            <div className="feature-text">
              <h3>알림 설정</h3>
              <p>중요한 시간을 놓치지 않도록 스마트한 알림을 제공합니다</p>
            </div>
          </div>
          
          <div className="feature">
            <div className="feature-icon">📱</div>
            <div className="feature-text">
              <h3>실시간 업데이트</h3>
              <p>일정 변경사항을 실시간으로 공유하여 혼선을 방지합니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* 종이 효과 */}
      {showPapers && (
        <div className="paper-container">
          {renderPapers()}
        </div>
      )}
    </section>
  );
};

export default ScheduleSection;
