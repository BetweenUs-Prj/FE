import React, { useState, useEffect } from 'react';
import styles from './StationCardList.module.css';

interface StationCard {
  id: number;
  title: string;
  duration: string;
  type: 'station' | 'place' | 'back';
}

interface StationCardListProps {
  isVisible: boolean;
  onCardClick: (cardId: number) => void;
  onResetSelection?: () => void;
  cards: StationCard[];
  currentView: 'stations' | 'places';
}

const StationCardList: React.FC<StationCardListProps> = ({
  isVisible,
  onCardClick,
  onResetSelection,
  cards,
  currentView
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // onResetSelection이 호출될 때 선택 상태 리셋
  useEffect(() => {
    if (onResetSelection) {
      const resetSelection = () => {
        setSelectedCardId(null);
        setIsAnimating(false);
      };
      
      // onResetSelection 함수를 호출할 수 있도록 전역에 등록
      (window as any).resetStationCardSelection = resetSelection;
      
      return () => {
        delete (window as any).resetStationCardSelection;
      };
    }
  }, [onResetSelection]);

  const handleCardClick = (cardId: number) => {
    if (currentView === 'places' && cards.find(card => card.id === cardId)?.type === 'place') {
      if (selectedCardId === cardId) {
        // 이미 선택된 카드를 다시 클릭하면 원상복귀
        setSelectedCardId(null);
        setIsAnimating(false);
      } else {
        // 새로운 추천 장소 선택 시 애니메이션 시작
        setSelectedCardId(cardId);
        setIsAnimating(true);
      }
    } else {
      // 역 선택이나 뒤로가기는 바로 실행
      onCardClick(cardId);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.cardList}>
      {cards.map((card, index) => (
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
          onMouseEnter={() => setHoveredCard(card.id)}
          onMouseLeave={() => setHoveredCard(null)}
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

export default StationCardList;
