import React, { useState, useEffect } from 'react';
import styles from './Home.module.css';
import Header from '../../components/Header';
import FadeIn from '@/components/FadeIn';
import KakaoMap from '../../components/KakaoMap';
import { KAKAO_MAP_APP_KEY } from '../../constants/config';
import PaperDrawer from '@/components/PaperDrawer';
import FloatingNav from '@/components/FloatingNav';
import MiddlePlaceRecommendCard from '@/components/MiddlePlaceRecommendCard';

interface MiddlePlaceCard {
  id: number;
  title: string;
  duration: string;
  type: 'station' | 'place' | 'back';
}

// 랜덤 좌표 생성 함수
const generateRandomLocation = () => {
  const lat = 37.4 + Math.random() * 0.4;
  const lng = 126.8 + Math.random() * 0.4;
  return { lat, lng };
};

const Home = () => {
  const [randomLocation, setRandomLocation] = useState({ lat: 37.5665, lng: 126.9780 }); // 기본값: 서울시청
  const [showCardList, setShowCardList] = useState(false);
  const [currentView, setCurrentView] = useState<'stations' | 'places'>('stations');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [cards, setCards] = useState<MiddlePlaceCard[]>([]);

  // 컴포넌트가 마운트될 때만 랜덤 좌표 생성
  useEffect(() => {
    setRandomLocation(generateRandomLocation());
  }, []);

  // 역 목록 생성
  const generateStationCards = (): MiddlePlaceCard[] => {
    return [
      { id: 1, title: "강남역", duration: "15분", type: "station" },
      { id: 2, title: "홍대입구역", duration: "25분", type: "station" },
      { id: 3, title: "신촌역", duration: "20분", type: "station" },
      { id: 4, title: "이대역", duration: "18분", type: "station" },
      { id: 5, title: "아현역", duration: "22분", type: "station" },
      { id: 6, title: "충정로역", duration: "12분", type: "station" }
    ];
  };

  // 추천 장소 목록 생성
  const generatePlaceCards = (stationName: string): MiddlePlaceCard[] => {
    const placeTypes = [
      { title: "카페", duration: "도보 3분" },
      { title: "식당", duration: "도보 5분" },
      { title: "공원", duration: "도보 8분" },
      { title: "쇼핑몰", duration: "도보 10분" },
      { title: "문화시설", duration: "도보 7분" }
    ];

    const placeCards = placeTypes.map((place, index) => ({
      id: index + 1,
      title: `${stationName} ${place.title}`,
      duration: place.duration,
      type: "place" as const
    }));

    // 뒤로가기 카드 추가
    const backCard = {
      id: placeCards.length + 1,
      title: "뒤로가기",
      duration: "역 선택으로 돌아가기",
      type: "back" as const
    };

    return [...placeCards, backCard];
  };

  const handleFriendClick = () => {
    console.log('친구 메뉴 클릭');
    // TODO: 친구 관리 페이지로 이동
  };

  const handleScheduleClick = () => {
    console.log('일정 메뉴 클릭');
    // TODO: 일정 관리 페이지로 이동
  };

  const handleMeetingClick = () => {
    console.log('만남 메뉴 클릭');
    // TODO: 만남 관리 페이지로 이동
  };

  const handleFindMiddle = async () => {
    console.log('중간거리 찾기 버튼 클릭됨');
    // 역 목록 표시
    const stationCards = generateStationCards();
    setCards(stationCards);
    setCurrentView('stations');
    setSelectedStation('');
    setShowCardList(true);
  };

  const handleHideCards = () => {
    console.log('카드 숨기기');
    setShowCardList(false);
    setCurrentView('stations');
    setSelectedStation('');
    
    // MiddlePlaceRecommendCard의 선택 상태도 리셋
    if ((window as any).resetMiddlePlaceCardSelection) {
      (window as any).resetMiddlePlaceCardSelection();
    }
  };

  const handleCardClick = (cardId: number) => {
    const clickedCard = cards.find(card => card.id === cardId);
    
    if (!clickedCard) return;

    if (currentView === 'stations') {
      // 역 선택 시 추천 장소로 변경
      if (clickedCard.type === 'station') {
        setSelectedStation(clickedCard.title);
        const placeCards = generatePlaceCards(clickedCard.title);
        setCards(placeCards);
        setCurrentView('places');
        console.log(`${clickedCard.title} 추천 장소로 변경`);
      }
    } else {
      // 추천 장소 선택 시 처리
      if (clickedCard.type === 'back') {
        // 뒤로가기
        const stationCards = generateStationCards();
        setCards(stationCards);
        setCurrentView('stations');
        setSelectedStation('');
        console.log('역 선택으로 돌아가기');
      } else if (clickedCard.type === 'place') {
        // 장소 선택 - 카드 목록은 그대로 유지
        console.log(`추천 장소 ${clickedCard.title} 선택됨`);
        // TODO: 선택된 장소에 대한 상세 정보 표시
        // 카드 목록을 변경하지 않음 - 선택된 카드가 유지됨
      }
    }
  };

  return (
    <div className={styles.homePage}>
      <Header />
      <div className={styles.mapBackground}>
        <KakaoMap
          containerId="home-map"
          center={randomLocation}
          level={5}
          zoomable={false}
          scrollwheel={false}
          disableDoubleClickZoom={true}
          disableDoubleTapZoom={true}
          draggable={false}
          appKey={KAKAO_MAP_APP_KEY}
          className={styles.homeMapContainer}
        />
      </div>
      <div className={styles.homeContent}>
          <FadeIn delay={0.2} direction="up">
            <h1 className={styles.homeTitle}>우리 사이</h1>
            <p className={styles.mapDescription}>
              친구들과의 만남 장소를 쉽게 찾아보세요
            </p>
          </FadeIn>
        </div>
      <PaperDrawer 
        onFindMiddle={handleFindMiddle} 
        onHideCards={handleHideCards}
      />
      <MiddlePlaceRecommendCard
        isVisible={showCardList}
        onCardClick={handleCardClick}
        onResetSelection={() => {
          if ((window as any).resetMiddlePlaceCardSelection) {
            (window as any).resetMiddlePlaceCardSelection();
          }
        }}
        cards={cards}
        currentView={currentView}
      />
      <FloatingNav
        onFriendClick={handleFriendClick}
        onScheduleClick={handleScheduleClick}
        onMeetingClick={handleMeetingClick}
      />
    </div>
  );
};

export default Home;
