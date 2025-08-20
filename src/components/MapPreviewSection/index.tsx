import React from 'react';
import FadeIn from '../FadeIn';
import './MapPreviewSection.css';

const MapPreviewSection: React.FC = () => {
  return (
    <section className="map-preview-section">
      <div className="map-preview-content">
        <FadeIn delay={0.2} direction="up">
          <h2 className="map-preview-title">카카오맵 API 연동</h2>
        </FadeIn>
        <div className="map-preview-container">
          <FadeIn delay={0.3} direction="left">
            <div className="map-info">
              <h3>정확한 중간 지점 찾기</h3>
              <p>카카오맵 API를 활용하여 여러 사람의 위치를 분석하고 최적의 중간 만남 장소를 추천해드립니다.</p>
              <div className="map-features">
                <FadeIn delay={0.4} direction="up">
                  <div className="map-feature">
                    <div className="feature-icon">📍</div>
                    <span>실시간 위치 추적</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.5} direction="up">
                  <div className="map-feature">
                    <div className="feature-icon">🎯</div>
                    <span>정확한 중간점 계산</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.6} direction="up">
                  <div className="map-feature">
                    <div className="feature-icon">🚇</div>
                    <span>대중교통 정보</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.7} direction="up">
                  <div className="map-feature">
                    <div className="feature-icon">🏪</div>
                    <span>주변 시설 정보</span>
                  </div>
                </FadeIn>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.4} direction="right">
            <div className="map-placeholder">
              <div className="map-mock">
                <div className="map-header">
                  <span>카카오맵</span>
                </div>
                <div className="map-content">
                  <div className="location-marker marker-1">📍</div>
                  <div className="location-marker marker-2">📍</div>
                  <div className="meeting-point">🎯</div>
                  <div className="map-text">중간 만남 지점</div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default MapPreviewSection;
