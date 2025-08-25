import React, { useState } from 'react';
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
  const [isClosing, setIsClosing] = useState(false);

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
    onCardClick(cardId);
  };

  if (!isVisible && !isClosing) return null;

  return (
    <div className={styles.placeList}>
      {placeCards.map((card, index) => (
        <div
          key={card.id}
          className={`${styles.placeCard} ${styles[`card${index + 1}`]} ${isVisible && !isClosing ? styles.show : ''} ${isClosing ? styles.closing : ''}`}
          onClick={() => handleCardClick(card.id)}
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
