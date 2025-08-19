import React from 'react';
import './FeaturesSection.css';

const FeaturesSection: React.FC = () => {
  return (
    <section className="features-section">
      <div className="features-content">
        <h2 className="features-title">주요 기능</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>친구 관리</h3>
            <p>친구를 맺고 저장해서 언제든 불러올 수 있어요</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>중간 장소 추천</h3>
            <p>카카오맵 API로 정확한 중간 지점을 찾아드려요</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3>게임으로 장소 정하기</h3>
            <p>재미있는 게임으로 중간 장소를 결정해보세요</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚇</div>
            <h3>막차시간 공유</h3>
            <p>개개인의 막차시간을 공유해서 일정을 맞춰요</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍👩‍👧‍👦</div>
            <h3>다중 인원 지원</h3>
            <p>1대1뿐만 아니라 여러 명이 함께 사용할 수 있어요</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>목적별 추천</h3>
            <p>만나는 목적에 따라 최적의 장소를 추천해드려요</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
