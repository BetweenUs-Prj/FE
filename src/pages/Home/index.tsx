import React, { useState, useEffect } from 'react';
import styles from './Home.module.css';
import Header from '../../components/Header';
import FadeIn from '@/components/FadeIn';
import KakaoMap from '../../components/KakaoMap';
import { KAKAO_MAP_APP_KEY } from '../../constants/config';
import PaperDrawer from '@/components/PaperDrawer';
import FloatingNav from '@/components/FloatingNav';
import MiddlePlaceList from '@/components/MiddlePlaceList';

// PlaceCard 타입 정의
interface PlaceCard {
  id: number;
  title: string;
  description: string;
  icon: string;
  type?: 'station' | 'place' | 'back';
}

// 랜덤 좌표 생성 함수
const generateRandomLocation = () => {
  // 서울 지역 내 랜덤 좌표 (위도: 37.4~37.7, 경도: 126.8~127.2)
  const lat = 37.4 + Math.random() * 0.3;
  const lng = 126.8 + Math.random() * 0.4;
  return { lat, lng };
};

const Home = () => {
  const [showPlaceList, setShowPlaceList] = useState(false);
  const [randomLocation, setRandomLocation] = useState({ lat: 37.5665, lng: 126.9780 }); // 기본값: 서울시청
  const [placeCards, setPlaceCards] = useState<PlaceCard[]>([]); // 동적 카드 데이터
  const [currentView, setCurrentView] = useState<'stationTypes' | 'places'>('stationTypes'); // 현재 보여주는 뷰
  const [selectedStationType, setSelectedStationType] = useState<string>(''); // 선택된 역 종류

  // 컴포넌트가 마운트될 때만 랜덤 좌표 생성
  useEffect(() => {
    setRandomLocation(generateRandomLocation());
  }, []);

  // 역 종류 목록 생성 (1단계)
  const generateStationTypeCards = () => {
    // TODO: API 연동 시 이 부분을 실제 역 종류 API 호출로 대체
    const stationTypes = [
      {
        id: 1,
        title: "2호선",
        description: "강남, 홍대, 잠실 등 주요 역",
        icon: "🚇",
        type: "station" as const
      },
      {
        id: 2,
        title: "1호선",
        description: "종로, 용산, 영등포 등 주요 역",
        icon: "🚇",
        type: "station" as const
      },
      {
        id: 3,
        title: "3호선",
        description: "고속터미널, 교대, 양재 등 주요 역",
        icon: "🚇",
        type: "station" as const
      },
      {
        id: 4,
        title: "4호선",
        description: "명동, 동대문, 창동 등 주요 역",
        icon: "🚇",
        type: "station" as const
      },
      {
        id: 5,
        title: "5호선",
        description: "김포공항, 여의도, 강동 등 주요 역",
        icon: "🚇",
        type: "station" as const
      }
    ];

    return stationTypes;
  };

  // 선택된 역 종류의 추천 장소 생성 (2단계)
  const generatePlaceCards = (stationType: string) => {
    // TODO: API 연동 시 이 부분을 실제 추천 장소 API 호출로 대체
    // 예시: 카카오 장소 검색 API, 네이버 지도 API
    const placeTypes = [
      { title: "카페", description: "맛있는 커피와 디저트" },
      { title: "식당", description: "다양한 음식점" },
      { title: "공원", description: "산책하기 좋은 공원" },
      { title: "쇼핑몰", description: "쇼핑과 놀이" },
      { title: "문화시설", description: "박물관, 영화관" }
    ];

    const placeCards = placeTypes.map((place, index) => ({
      id: index + 1,
      title: `${stationType} ${place.title}`,
      description: place.description,
      icon: "📍",
      type: "place" as const
    }));

    // 뒤로가기 카드 추가 (최하단)
    const backCard = {
      id: placeCards.length + 1,
      title: "뒤로가기",
      description: "역 선택으로 돌아가기",
      icon: "⬅️",
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

  const handlePlaceCardClick = (cardId: number) => {
    console.log(`카드 ${cardId} 클릭됨`);
    
    if (currentView === 'stationTypes') {
      // 1단계: 역 종류 선택 시 해당 역 종류의 추천 장소로 변경
      const stationTypeCards = placeCards;
      const selectedStationTypeCard = stationTypeCards.find(card => card.id === cardId);
      
      if (selectedStationTypeCard) {
        setSelectedStationType(selectedStationTypeCard.title);
        const newPlaceCards = generatePlaceCards(selectedStationTypeCard.title);
        setPlaceCards(newPlaceCards);
        setCurrentView('places');
        
        console.log(`${selectedStationTypeCard.title} 추천 장소로 변경`);
      }
    } else {
      // 2단계: 추천 장소 선택 시 처리
      const currentPlaceCards = placeCards;
      const clickedCard = currentPlaceCards.find(card => card.id === cardId);
      
      if (clickedCard?.type === 'back') {
        // 뒤로가기 카드 클릭 시 역 선택 단계로 돌아가기
        const stationTypeCards = generateStationTypeCards();
        setPlaceCards(stationTypeCards);
        setCurrentView('stationTypes');
        setSelectedStationType('');
        console.log('역 선택 단계로 돌아가기');
      } else {
        // 일반 추천 장소 카드 클릭 시 카드 확장 (상세 정보 표시)
        console.log(`추천 장소 ${cardId} 선택됨 - 카드 확장`);
        // TODO: API 연동 시 선택된 장소의 상세 정보를 가져오는 API 호출
        // 카드 확장은 MiddlePlaceList 컴포넌트에서 처리됨
      }
    }
  };

  const handleFindMiddle = async () => {
    // TODO: API 연동 시 이 부분을 실제 API 호출로 대체
    // 예시:
    // try {
    //   const response = await fetch('/api/find-middle', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ locations: friends.map(f => f.location) })
    //   });
    //   const data = await response.json();
    //   setPlaceCards(data.stationTypeCards); // 역 종류 목록
    //   setCurrentView('stationTypes');
    //   setShowPlaceList(true);
    // } catch (error) {
    //   console.error('중간거리 찾기 실패:', error);
    // }
    
    // 중간거리 찾기 - 역 종류 목록 표시 (1단계)
    const stationTypeCards = generateStationTypeCards();
    setPlaceCards(stationTypeCards);
    setCurrentView('stationTypes');
    setSelectedStationType('');
    setShowPlaceList(true);
  };

  const handleHideCards = () => {
    // 카드들 숨기기 및 상태 리셋
    setShowPlaceList(false);
    setCurrentView('stationTypes');
    setSelectedStationType('');
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
      <MiddlePlaceList 
        isVisible={showPlaceList}
        onCardClick={handlePlaceCardClick}
        placeCards={placeCards}
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
