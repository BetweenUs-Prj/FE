import React from 'react';
import FadeIn from '../FadeIn';
import KakaoMap from '../KakaoMap';
import { KAKAO_MAP_APP_KEY, DEFAULT_MAP_CENTER, DEFAULT_MAP_LEVEL, MAP_PRESETS } from '../../constants/config';
import styles from './MapPreviewSection.module.css';

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
            <div className="map-preview">
              <KakaoMap
                containerId="preview-map"
                center={{ lat: 37.5665, lng: 126.9780 }}  // 서울 시청
                level={6}                                  // 확대 레벨
                draggable={true}                          // 드래그 가능
                zoomable={false}                           // 확대/축소 불가능
                scrollwheel={false}                        // 마우스 휠로 확대/축소 불가능
                disableDoubleClickZoom={true}            // 더블클릭 확대 비활성화
                disableDoubleTapZoom={true}              // 더블탭 확대 비활성화
                appKey={KAKAO_MAP_APP_KEY}
                className="preview-map-container"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default MapPreviewSection;
