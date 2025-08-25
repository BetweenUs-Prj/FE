import React, { useState, useEffect } from 'react';
import styles from './MiddlePlaceList.module.css';

interface PlaceCard {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface MiddlePlaceListProps {
  isVisible: boolean;
  onCardClick: (cardId: number) => void;
}

const MiddlePlaceList: React.FC<MiddlePlaceListProps> = ({ isVisible, onCardClick }) => {
  const [hoveredCard, setHoveredCard] = useState(1); // 기본적으로 첫 번째 카드가 커진 상태
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isReversing, setIsReversing] = useState(false);

  // isVisible이 변경될 때 selectedCardId 초기화
  useEffect(() => {
    if (isVisible) {
      setSelectedCardId(null);
      setIsReversing(false);
      setHoveredCard(1); // 1번 카드로 리셋
    }
  }, [isVisible]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (selectedCardId && !target.closest(`.${styles.placeList}`)) {
        setIsReversing(true);
        setTimeout(() => {
          setSelectedCardId(null);
          setIsReversing(false);
          setHoveredCard(1); // 1번 카드로 리셋
        }, 700);
      }
    };

    if (selectedCardId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedCardId, styles.placeList]);

  const placeCards: PlaceCard[] = [
    {
      id: 1,
      title: "가장 가까운",
      description: "모든 사람이 가장 적게 이동하는 지점",
      icon: ""
    },
    {
      id: 2,
      title: "대중교통",
      description: "지하철, 버스 등 대중교통이 편리한 곳",
      icon: ""
    },
    {
      id: 3,
      title: "카페/식당",
      description: "맛집과 카페가 많은 지역",
      icon: ""
    },
    {
      id: 4,
      title: "공원/야외",
      description: "자연 속에서 만날 수 있는 곳",
      icon: ""
    },
    {
      id: 5,
      title: "쇼핑몰",
      description: "쇼핑과 놀이가 가능한 곳",
      icon: ""
    }
  ];

  const handleCardClick = (cardId: number) => {
    setSelectedCardId(cardId);
    // 애니메이션 완료 후 콜백 실행
    setTimeout(() => {
      onCardClick(cardId);
    }, 500);
  };

  const handleCardHover = (cardId: number) => {
    setHoveredCard(cardId);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.placeList}>
      {placeCards.map((card, index) => (
        <div
          key={card.id}
          className={`${styles.placeCard} ${styles[`card${index + 1}`]} ${isVisible ? styles.show : ''} ${hoveredCard === card.id ? styles.expanded : ''} ${selectedCardId && selectedCardId !== card.id ? (isReversing ? styles.slideIn : styles.slideOut) : ''} ${selectedCardId === card.id ? (isReversing ? styles.reverse : styles.selected) : ''}`}
          onClick={() => handleCardClick(card.id)}
          onMouseEnter={() => handleCardHover(card.id)}
        >
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{card.title}</div>
            <div className={styles.cardDescription}>{card.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MiddlePlaceList;
