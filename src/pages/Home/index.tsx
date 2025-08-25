import React, { useState, useEffect } from 'react';
import styles from './Home.module.css';
import Header from '../../components/Header';
import FadeIn from '@/components/FadeIn';
import KakaoMap from '../../components/KakaoMap';
import { KAKAO_MAP_APP_KEY } from '../../constants/config';
import PaperDrawer from '@/components/PaperDrawer';
import FloatingNav from '@/components/FloatingNav';
import MiddlePlaceRecommendCard from '@/components/MiddlePlaceRecommendCard';
import { getAllStations, getPlacesByStationId, getStationById } from '@/constants/stationData';


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
  const [showHomeContent, setShowHomeContent] = useState(true);
  const [currentView, setCurrentView] = useState<'stations' | 'places'>('stations');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [cards, setCards] = useState<MiddlePlaceCard[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [mapMarkers, setMapMarkers] = useState<Array<{
    id: string;
    position: { lat: number; lng: number };
    title: string;
    type: 'station' | 'place';
    isHighlighted?: boolean;
    isVisible?: boolean;
  }>>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  


  // 컴포넌트가 마운트될 때만 랜덤 좌표 생성
  useEffect(() => {
    setRandomLocation(generateRandomLocation());
  }, []);



  // 역 목록 생성
  const generateStationCards = (): MiddlePlaceCard[] => {
    const stations = getAllStations();
    return stations.map(station => ({
      id: station.id,
      title: station.name,
      duration: station.duration,
      type: "station" as const
    }));
  };

  // 추천 장소 목록 생성
  const generatePlaceCards = (stationId: number): MiddlePlaceCard[] => {
    const station = getStationById(stationId);
    if (!station) return [];

    const places = getPlacesByStationId(stationId);
    const placeCards = places.map(place => ({
      id: place.id,
      title: place.title,
      duration: place.duration,
      type: "place" as const
    }));

    // 뒤로가기 카드 추가 (고유한 ID 부여)
    const backCard = {
      id: 9999, // 고유한 ID로 설정
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
    setShowHomeContent(false); // homeContent 숨기기
    
    // 모든 역들의 마커 표시
    const allStations = getAllStations();
    const stationMarkers = allStations.map(station => ({
      id: `station-${station.id}`,
      position: { lat: station.lat, lng: station.lng },
      title: station.name,
      type: 'station' as const,
      isVisible: true,
      isHighlighted: false
    }));
    setMapMarkers(stationMarkers);
  };

  const handleHideCards = () => {
    console.log('카드 숨기기');
    setShowCardList(false);
    setShowHomeContent(true); // homeContent 다시 표시
    setCurrentView('stations');
    setSelectedStation('');
    setSelectedCardId(null); // 선택된 카드 초기화
    
    // MiddlePlaceRecommendCard의 선택 상태도 리셋
    if ((window as any).resetMiddlePlaceCardSelection) {
      (window as any).resetMiddlePlaceCardSelection();
    }
    
    // 마커 제거
    setMapMarkers([]);
  };



  const handleCardClick = (cardId: number) => {
    const clickedCard = cards.find(card => card.id === cardId);
    
    if (!clickedCard) return;

    if (currentView === 'stations') {
      // 역 선택 시 추천 장소로 변경
      if (clickedCard.type === 'station') {
        const station = getStationById(clickedCard.id);
        if (station) {
          setSelectedStation(station.name);
          setSelectedStationId(station.id);
          setMapCenter({ lat: station.lat, lng: station.lng });
          
          // 역 마커와 해당 역의 모든 추천 장소 마커 추가
          const places = getPlacesByStationId(station.id);
          const placeMarkers = places.map(place => ({
            id: `place-${place.id}`,
            position: { lat: place.lat, lng: place.lng },
            title: place.title,
            type: 'place' as const
          }));
          
          const allMarkers = [
            {
              id: `station-${station.id}`,
              position: { lat: station.lat, lng: station.lng },
              title: station.name,
              type: 'station' as const,
              isVisible: true,
              isHighlighted: false
            },
            ...placeMarkers.map(place => ({
              ...place,
              isVisible: true,
              isHighlighted: false
            }))
          ];
          setMapMarkers(allMarkers);
          
          const placeCards = generatePlaceCards(clickedCard.id);
          setCards(placeCards);
          setCurrentView('places');
          console.log(`${clickedCard.title} 추천 장소로 변경`);
        }
      }
    } else {
      // 추천 장소 선택 시 처리
      if (clickedCard.type === 'back') {
        // 뒤로가기
        const stationCards = generateStationCards();
        setCards(stationCards);
        setCurrentView('stations');
        setSelectedStation('');
        setSelectedStationId(null);
        setSelectedCardId(null); // 선택된 카드 초기화
        setMapCenter({ lat: 37.5665, lng: 126.9780 }); // 서울시청으로 초기화
        // 마커 완전히 제거
        setMapMarkers([]);
        console.log('역 선택으로 돌아가기');
      } else if (clickedCard.type === 'place') {
        // 이미 선택된 카드를 다시 클릭하면 원상복귀
        if (selectedCardId === clickedCard.id) {
          setSelectedCardId(null);
          // 모든 마커 표시하고 강조 해제
          setMapMarkers(prevMarkers => 
            prevMarkers.map(marker => ({
              ...marker,
              isHighlighted: false,
              isVisible: true
            }))
          );
          console.log(`추천 장소 ${clickedCard.title} 선택 해제됨`);
        } else {
          // 새로운 장소 선택 - 맵 중심을 해당 장소로 이동
          const places = getPlacesByStationId(selectedStationId || 0);
          const selectedPlace = places.find(place => place.id === clickedCard.id);
          if (selectedPlace) {
            setMapCenter({ lat: selectedPlace.lat, lng: selectedPlace.lng });
            setSelectedCardId(clickedCard.id); // 선택된 카드 ID 저장
            
            // 선택된 장소만 강조하고 다른 장소 마커들은 숨김
            setMapMarkers(prevMarkers => 
              prevMarkers.map(marker => ({
                ...marker,
                isHighlighted: marker.id === `place-${selectedPlace.id}`,
                isVisible: marker.id === `place-${selectedPlace.id}` || marker.type === 'station'
              }))
            );
            console.log(`추천 장소 ${clickedCard.title} 선택됨 - 맵 중심 이동`);
          }
        }
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
          center={mapCenter}
          level={5}
          zoomable={false}
          scrollwheel={false}
          disableDoubleClickZoom={true}
          disableDoubleTapZoom={true}
          draggable={false}
          appKey={KAKAO_MAP_APP_KEY}
          className={styles.homeMapContainer}
          markers={mapMarkers}
          onMarkerClick={(markerId) => {
            console.log('마커 클릭:', markerId);
            
            // 마커 ID에서 장소 ID 추출
            if (markerId.startsWith('place-')) {
              const placeId = parseInt(markerId.replace('place-', ''));
              
              // 현재 추천 장소 카드 목록에서 해당 장소 찾기
              const placeCard = cards.find(card => card.id === placeId && card.type === 'place');
              if (placeCard) {
                // 해당 장소 카드 클릭과 동일한 동작 수행
                handleCardClick(placeId);
              }
            } else if (markerId.startsWith('station-')) {
              const stationId = parseInt(markerId.replace('station-', ''));
              
              // 현재 역 카드 목록에서 해당 역 찾기
              const stationCard = cards.find(card => card.id === stationId && card.type === 'station');
              if (stationCard) {
                // 해당 역 카드 클릭과 동일한 동작 수행
                handleCardClick(stationId);
              }
            }
          }}
        />
      </div>
      {showHomeContent && (
        <div className={styles.homeContent}>
          <FadeIn delay={0.2} direction="up">
            <h1 className={styles.homeTitle}>우리 사이</h1>
            <p className={styles.mapDescription}>
              친구들과의 만남 장소를 쉽게 찾아보세요
            </p>
          </FadeIn>
        </div>
      )}
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
        selectedCardId={selectedCardId}
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
