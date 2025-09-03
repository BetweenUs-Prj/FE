import { useEffect, useState, useRef } from 'react';
import HeroSection from '../../components/HeroSection';
import FeaturesSection from '../../components/FeaturesSection';
import HowItWorksSection from '../../components/HowItWorksSection';
import UseCaseSection from '../../components/UseCaseSection';
import MapPreviewSection from '../../components/MapPreviewSection';
import GamePreviewSection from '../../components/GamePreviewSection';
import ScheduleSection from '../../components/ScheduleSection';
import styles from './Landing.module.css';

const Landing = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const totalSections = 7; // CTASection 제거로 7개로 복원
  const isScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef(0);

  useEffect(() => {
    const app = document.querySelector('.App');
    
    if (app) {
      const sections = document.querySelectorAll('section');
      
      const scrollToSection = (index: number) => {
        if (index >= 0 && index < sections.length && !isScrollingRef.current) {
          isScrollingRef.current = true;
          setCurrentSection(index);
          
          // 더 부드럽고 느린 스크롤을 위해 커스텀 애니메이션 사용
          const targetSection = sections[index];
          const startPosition = app.scrollTop;
          const targetPosition = targetSection.offsetTop;
          const distance = targetPosition - startPosition;
          const duration = 1500; // 1.5초
          const startTime = performance.now();
          
          const animateScroll = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // easeInOutQuart 함수로 자연스러운 가속/감속
            const easeProgress = progress < 0.5 
              ? 8 * progress * progress * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 4) / 2;
            
            app.scrollTop = startPosition + distance * easeProgress;
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            } else {
              // 스크롤 완료 시 바로 잠금 해제
              isScrollingRef.current = false;
            }
          };
          
          requestAnimationFrame(animateScroll);
        }
      };
      
      const handleWheel = (e: Event) => {
        const wheelEvent = e as WheelEvent;
        e.preventDefault();
        
        const now = Date.now();
        
        // 스크롤 중이거나 너무 빠른 연속 스크롤 방지
        if (isScrollingRef.current || now - lastScrollTimeRef.current < 100) {
          return;
        }
        
        lastScrollTimeRef.current = now;
        
        // 스크롤 방향만 확인하고 양은 무시
        if (wheelEvent.deltaY > 0) {
          // 아래로 스크롤 - 다음 섹션으로
          scrollToSection(currentSection + 1);
        } else if (wheelEvent.deltaY < 0) {
          // 위로 스크롤 - 이전 섹션으로
          scrollToSection(currentSection - 1);
        }
      };
      
      app.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        app.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentSection]);

  const handleDotClick = (index: number) => {
    if (index !== currentSection) {
      const app = document.querySelector('.App');
      if (app) {
        const sections = document.querySelectorAll('section');
        
        // 부드러운 이동 모션 유지 (스크롤 잠금 없이)
        const targetSection = sections[index];
        const startPosition = app.scrollTop;
        const targetPosition = targetSection.offsetTop;
        const distance = targetPosition - startPosition;
        const duration = 1500;
        const startTime = performance.now();
        
        setCurrentSection(index);
        
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          const easeProgress = progress < 0.5 
            ? 8 * progress * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 4) / 2;
          
          app.scrollTop = startPosition + distance * easeProgress;
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };
        
        requestAnimationFrame(animateScroll);
      }
    }
  };

  return (
    <div className={styles.landingPage}>
      <main className={styles.main}>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <UseCaseSection />
        <MapPreviewSection />
        <GamePreviewSection />
        <ScheduleSection />
      </main>
      
      {/* 플로팅 네비게이션 점들 */}
      <div className={styles.floatingNav}>
        {Array.from({ length: totalSections }, (_, index) => (
          <button
            key={index}
            className={`${styles.navDot} ${index === currentSection ? styles.active : ''}`}
            onClick={() => handleDotClick(index)}
            aria-label={`섹션 ${index + 1}로 이동`}
          />
        ))}
      </div>
    </div>
  );
};

export default Landing;
