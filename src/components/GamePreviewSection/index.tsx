import React from 'react';
import FadeIn from '../FadeIn';
import './GamePreviewSection.css';

const GamePreviewSection: React.FC = () => {
  return (
    <section className="game-preview-section">
      <div className="game-preview-content">
        <FadeIn delay={0.2} direction="up">
          <h2 className="game-preview-title">게임으로 장소 정하기</h2>
        </FadeIn>
        <div className="game-preview-container">
          <FadeIn delay={0.3} direction="left">
            <div className="game-info">
              <h3>재미있는 게임으로 결정</h3>
              <p>단순한 투표가 아닌 재미있는 미니게임을 통해 만남 장소를 결정해보세요. 더욱 특별하고 기억에 남는 만남이 될 거예요.</p>
              <div className="game-types">
                <FadeIn delay={0.4} direction="up">
                  <div className="game-type">
                    <div className="game-icon">🎲</div>
                    <span>랜덤 룰렛</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.5} direction="up">
                  <div className="game-type">
                    <div className="game-icon">🎯</div>
                    <span>정확도 게임</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.6} direction="up">
                  <div className="game-type">
                    <div className="game-icon">⚡</div>
                    <span>스피드 게임</span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.7} direction="up">
                  <div className="game-type">
                    <div className="game-icon">🧩</div>
                    <span>퍼즐 게임</span>
                  </div>
                </FadeIn>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.4} direction="right">
            <div className="game-demo">
              <div className="game-mock">
                <div className="game-header">
                  <span>장소 결정 게임</span>
                </div>
                <div className="game-content">
                  <div className="game-wheel">
                    <div className="wheel-center">🎯</div>
                    <div className="wheel-option option-1">카페</div>
                    <div className="wheel-option option-2">식당</div>
                    <div className="wheel-option option-3">공원</div>
                    <div className="wheel-option option-4">영화관</div>
                  </div>
                  <div className="game-status">게임 진행 중...</div>
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
