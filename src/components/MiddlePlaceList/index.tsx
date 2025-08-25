import React, { useState, useEffect } from 'react';
import styles from './MiddlePlaceList.module.css';

interface PlaceCard {
  id: number;
  title: string;
  description: string;
  icon: string;
  type?: 'station' | 'place' | 'back'; // 카드 타입 추가
}

interface MiddlePlaceListProps {
  isVisible: boolean;
  onCardClick: (cardId: number) => void;
  placeCards?: PlaceCard[]; // 카드 데이터를 props로 받기
  currentView?: 'stationTypes' | 'places'; // 현재 뷰 타입 추가
}

const MiddlePlaceList: React.FC<MiddlePlaceListProps> = ({ 
  isVisible, 
  onCardClick, 
  placeCards = [], // 기본값으로 빈 배열
  currentView = 'stationTypes'
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isReversing, setIsReversing] = useState(false);

  // isVisible이 변경될 때 selectedCardId 초기화
  useEffect(() => {
    if (isVisible) {
      setSelectedCardId(null);
      setIsReversing(false);
      // 첫 번째 카드가 있으면 첫 번째 카드로, 없으면 null로 리셋
      setHoveredCard(placeCards.length > 0 ? placeCards[0].id : null);
    }
  }, [isVisible, placeCards]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (selectedCardId && !target.closest(`.${styles.placeList}`)) {
        setIsReversing(true);
        setTimeout(() => {
          setSelectedCardId(null);
          setIsReversing(false);
          // 첫 번째 카드가 있으면 첫 번째 카드로, 없으면 null로 리셋
          setHoveredCard(placeCards.length > 0 ? placeCards[0].id : null);
        }, 700);
      }
    };

    if (selectedCardId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedCardId, styles.placeList, placeCards]);

  // 기본 카드 데이터 (props로 전달되지 않았을 때 사용)
  // TODO: API 연동 시 이 부분을 삭제하고 API 응답 데이터만 사용
  const defaultPlaceCards: PlaceCard[] = [
    {
      id: 1,
      title: "가장 가까운",
      description: "모든 사람이 가장 적게 이동하는 지점",
      icon: "",
      type: "station"
    },
    {
      id: 2,
      title: "대중교통",
      description: "지하철, 버스 등 대중교통이 편리한 곳",
      icon: "",
      type: "station"
    },
    {
      id: 3,
      title: "카페/식당",
      description: "맛집과 카페가 많은 지역",
      icon: "",
      type: "place"
    },
    {
      id: 4,
      title: "공원/야외",
      description: "자연 속에서 만날 수 있는 곳",
      icon: "",
      type: "place"
    },
    {
      id: 5,
      title: "쇼핑몰",
      description: "쇼핑과 놀이가 가능한 곳",
      icon: "",
      type: "place"
    }
  ];

  // props로 전달된 카드가 있으면 사용, 없으면 기본 카드 사용
  // TODO: API 연동 시 이 부분을 수정하여 항상 API 응답 데이터 사용
  const cardsToShow = placeCards.length > 0 ? placeCards : defaultPlaceCards;

  const handleCardClick = (cardId: number) => {
    // 역 종류 뷰에서는 카드 확장하지 않음
    if (currentView === 'stationTypes') {
      onCardClick(cardId);
      return;
    }
    
    // 뒤로가기 카드 클릭 시 확장하지 않음
    const clickedCard = cardsToShow.find(card => card.id === cardId);
    if (clickedCard?.type === 'back') {
      onCardClick(cardId);
      return;
    }
    
    // 추천 장소 뷰에서만 카드 확장
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
      {cardsToShow.map((card, index) => {
        const cardType = card.type || (currentView === 'stationTypes' ? 'station' : 'place');
        
        return (
          <div
            key={card.id}
            className={`
              ${styles.placeCard} 
              ${styles[`card${index + 1}`]} 
              ${styles[cardType]} // 카드 타입별 스타일 적용
              ${isVisible ? styles.show : ''} 
              ${hoveredCard === card.id ? styles.expanded : ''} 
              ${selectedCardId && selectedCardId !== card.id ? (isReversing ? styles.slideIn : styles.slideOut) : ''} 
              ${selectedCardId === card.id ? (isReversing ? styles.reverse : styles.selected) : ''}
            `}
            onClick={() => handleCardClick(card.id)}
            onMouseEnter={() => handleCardHover(card.id)}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardTitle}>{card.title}</div>
              <div className={styles.cardDescription}>{card.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MiddlePlaceList;
