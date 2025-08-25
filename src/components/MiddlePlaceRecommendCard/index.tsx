import React, { useState, useEffect } from 'react';
import styles from './MiddlePlaceRecommendCard.module.css';

interface MiddlePlaceCard {
  id: number;
  title: string;
  duration: string;
  type: 'station' | 'place' | 'back';
}

interface MiddlePlaceRecommendCardProps {
  isVisible: boolean;
  onCardClick: (cardId: number) => void;
  onCardHover?: (cardId: number | null) => void;
  onResetSelection?: () => void;
  cards: MiddlePlaceCard[];
  currentView: 'stations' | 'places';
  selectedCardId?: number | null;
}

const MiddlePlaceRecommendCard: React.FC<MiddlePlaceRecommendCardProps> = ({
  isVisible,
  onCardClick,
  onCardHover,
  onResetSelection,
  cards,
  currentView,
  selectedCardId: externalSelectedCardId
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [internalSelectedCardId, setInternalSelectedCardId] = useState<number | null>(null);
  
  // 외부에서 전달된 selectedCardId를 내부 상태와 동기화
  const selectedCardId = externalSelectedCardId !== undefined ? externalSelectedCardId : internalSelectedCardId;

  // onResetSelection이 호출될 때 선택 상태 리셋
  useEffect(() => {
    if (onResetSelection) {
      const resetSelection = () => {
        setInternalSelectedCardId(null);
      };
      
      // onResetSelection 함수를 호출할 수 있도록 전역에 등록
      (window as any).resetMiddlePlaceCardSelection = resetSelection;
      
      return () => {
        delete (window as any).resetMiddlePlaceCardSelection;
      };
    }
  }, [onResetSelection]);

  const handleCardClick = (cardId: number) => {
    if (currentView === 'places' && cards.find(card => card.id === cardId)?.type === 'place') {
      // 외부에서 전달된 selectedCardId가 있으면 그것을 기준으로, 없으면 내부 상태를 기준으로
      const currentSelectedId = externalSelectedCardId !== undefined ? externalSelectedCardId : internalSelectedCardId;
      
      if (currentSelectedId === cardId) {
        // 이미 선택된 카드를 다시 클릭하면 원상복귀
        setInternalSelectedCardId(null);
        // 외부 상태도 리셋하기 위해 onCardClick 호출
        onCardClick(cardId);
      } else {
        // 새로운 추천 장소 선택 시 애니메이션 시작
        setInternalSelectedCardId(cardId);
        // 추천 장소 클릭 시에도 onCardClick 호출 (맵 중심 이동 등을 위해)
        onCardClick(cardId);
      }
    } else {
      // 역 선택이나 뒤로가기는 바로 실행
      onCardClick(cardId);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.cardList}>
      {cards.map((card) => (
        <div
          key={card.id}
          className={`
            ${styles.card}
            ${styles[card.type]}
            ${hoveredCard === card.id ? styles.hovered : ''}
            ${selectedCardId && selectedCardId !== card.id ? styles.slideOut : ''}
            ${selectedCardId === card.id ? styles.selected : ''}
          `}
          onClick={() => handleCardClick(card.id)}
          onMouseEnter={() => {
            // 호버 상태만 업데이트 (마커 변경 없음)
            if (!selectedCardId || selectedCardId === card.id) {
              setHoveredCard(card.id);
            }
          }}
          onMouseLeave={() => {
            // 호버 상태만 업데이트 (마커 변경 없음)
            if (!selectedCardId || selectedCardId === card.id) {
              setHoveredCard(null);
            }
          }}
        >
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{card.title}</div>
            <div className={styles.cardDuration}>{card.duration}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MiddlePlaceRecommendCard;
