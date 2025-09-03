import React from 'react';
import type { ReactNode } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import styles from './FadeIn.module.css';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  threshold?: number;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.6,
  threshold = 0.1,
}) => {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    triggerOnce: false,
  });

  return (
    <div
      ref={elementRef as React.Ref<HTMLDivElement>}
      className={`${styles.fadeIn} ${className} ${isIntersecting ? styles.animate : ''}`}
      style={{
        '--animation-delay': `${delay}s`,
        '--animation-duration': `${duration}s`,
        '--animation-direction': direction,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default FadeIn;
