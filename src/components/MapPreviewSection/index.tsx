import React from 'react';
import FadeIn from '../FadeIn';
import KakaoMap from '../KakaoMap';
import { KAKAO_MAP_APP_KEY } from '../../constants/config';
import styles from './MapPreviewSection.module.css';

const MapPreviewSection: React.FC = () => {
  return (
    <section className={styles.mapPreviewSection}>
      <div className={styles.mapPreviewContent}>
        <FadeIn delay={0.2} direction="up">
          <h2 className={styles.mapPreviewTitle}>카카오맵 API 연동</h2>
        </FadeIn>
        <div className={styles.mapPreviewContainer}>
          <FadeIn delay={0.3} direction="left">
            <div className={styles.mapInfo}>
              <h3>정확한 중간 지점 찾기</h3>
              <p>카카오맵 API를 활용하여 여러 사람의 위치를 분석하고 최적의 중간 만남 장소를 추천해드립니다.</p>
              <div className={styles.mapFeatures}>
                <FadeIn delay={0.4} direction="up">
                  <div className={styles.mapFeature}>
                    <div className={styles.featureIcon}>📍</div>
                    <span>실시간 위치 추적</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.5} direction="up">
                  <div className={styles.mapFeature}>
                    <div className={styles.featureIcon}>🎯</div>
                    <span>정확한 중간점 계산</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.6} direction="up">
                  <div className={styles.mapFeature}>
                    <div className={styles.featureIcon}>🚇</div>
                    <span>대중교통 정보</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.7} direction="up">
                  <div className={styles.mapFeature}>
                    <div className={styles.featureIcon}>🏪</div>
                    <span>주변 시설 정보</span>
                  </div>
                </FadeIn>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.4} direction="right">
            <div className={styles.mapPreview}>
              <KakaoMap
                containerId="preview-map"
                center={{ lat: 37.5665, lng: 126.9780 }}
                level={6}
                draggable={true}
                zoomable={false}
                appKey={KAKAO_MAP_APP_KEY}
                className={styles.previewMapContainer}

              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default MapPreviewSection;
