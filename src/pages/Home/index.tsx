import { useState, useEffect } from 'react';
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

// 수도권 주요 역 주변 지역 랜덤 좌표 생성 함수 + 삼육대학교 이스터 에그
const generateRandomLocation = () => {
  // 삼육대학교 이스터 에그 (1% 확률)
  if (Math.random() < 0.01) {
    console.log('🎉 삼육대학교 이스터 에그 발견! 🎉');
    return { lat: 37.6447, lng: 127.1053 }; // 삼육대학교 좌표
  }
  
  // 수도권 주요 역 주변 지역들의 좌표 범위들 (역이 있는 도시 중심 지역)
  const stationAreas = [
    // 서울 강남/홍대/강북 지역 (주요 역 밀집 지역)
    { lat: { min: 37.50, max: 37.58 }, lng: { min: 126.90, max: 127.08 } },
    // 서울 강남/서초 지역
    { lat: { min: 37.48, max: 37.52 }, lng: { min: 127.00, max: 127.08 } },
    // 서울 홍대/마포 지역
    { lat: { min: 37.54, max: 37.58 }, lng: { min: 126.90, max: 126.98 } },
    // 서울 강북/노원 지역
    { lat: { min: 37.60, max: 37.66 }, lng: { min: 127.00, max: 127.08 } },
    // 경기도 성남/분당 지역
    { lat: { min: 37.34, max: 37.38 }, lng: { min: 127.08, max: 127.16 } },
    // 경기도 수원/안양 지역
    { lat: { min: 37.26, max: 37.30 }, lng: { min: 126.98, max: 127.08 } },
    // 인천 부평/계양 지역
    { lat: { min: 37.46, max: 37.50 }, lng: { min: 126.68, max: 126.76 } }
  ];
  
  // 랜덤하게 역 주변 지역 선택
  const randomArea = stationAreas[Math.floor(Math.random() * stationAreas.length)];
  
  // 선택된 지역 내에서 랜덤 좌표 생성
  const lat = randomArea.lat.min + Math.random() * (randomArea.lat.max - randomArea.lat.min);
  const lng = randomArea.lng.min + Math.random() * (randomArea.lng.max - randomArea.lng.min);
  
  console.log('랜덤 위치 생성:', { lat, lng }, '지역:', randomArea);
  return { lat, lng };
};

const Home = () => {
  const [showCardList, setShowCardList] = useState(false);
  const [showHomeContent, setShowHomeContent] = useState(true);
  const [isHomeContentFading, setIsHomeContentFading] = useState(false);
  const [currentView, setCurrentView] = useState<'stations' | 'places'>('stations');

  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [cards, setCards] = useState<MiddlePlaceCard[]>([]);
  const [mapCenter, setMapCenter] = useState(() => generateRandomLocation()); // 초기값을 랜덤 좌표로 설정
  const [mapLevel, setMapLevel] = useState(2); // 맵 레벨 상태 추가
  const [mapMarkers, setMapMarkers] = useState<Array<{
    id: string;
    position: { lat: number; lng: number };
    title: string;
    type: 'station' | 'place' | 'friend';
    isHighlighted?: boolean;
    isVisible?: boolean;
  }>>([]);
  
  // 지도 상호작용 상태 추가
  const [mapInteraction, setMapInteraction] = useState({
    zoomable: false,
    scrollwheel: false,
    draggable: false,
    disableDoubleClickZoom: true,
    disableDoubleTapZoom: true
  });
  
  // 경로 상태 추가
  const [mapRoutes, setMapRoutes] = useState<Array<{
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
    color?: string;
  }>>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showEasterEgg, setShowEasterEgg] = useState(false); // 삼육대학교 이스터 에그 상태
  const [friends, setFriends] = useState<Array<{
    id: number;
    name: string;
    location: string;
    coordinates?: { lat: number; lng: number };
  }>>([]); // 사용자 입력 친구 데이터
  


  // 컴포넌트가 마운트될 때 삼육대학교 이스터 에그 체크
  useEffect(() => {
    // 초기 맵 중심점이 삼육대학교인지 확인
    if (mapCenter.lat === 37.6447 && mapCenter.lng === 127.1053) {
      setShowEasterEgg(true);
      setTimeout(() => setShowEasterEgg(false), 5000); // 5초 후 숨기기
    }
  }, [mapCenter]);

  // homeContent를 3초 후 자동으로 숨기기
  useEffect(() => {
    if (showHomeContent) {
      const timer = setTimeout(() => {
        setIsHomeContentFading(true); // 페이드아웃 시작
        setTimeout(() => {
          setShowHomeContent(false); // 애니메이션 완료 후 숨기기
          setIsHomeContentFading(false);
        }, 500); // 0.5초 후 완전히 숨기기
      }, 3000); // 3초 후 페이드아웃 시작

      return () => clearTimeout(timer);
    }
  }, [showHomeContent]);



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

  // 사용자 입력 친구 데이터를 마커로 변환
  const convertFriendsToMarkers = (friendsData: Array<{
    id: number;
    name: string;
    location: string;
    coordinates?: { lat: number; lng: number };
  }>) => {
    console.log('convertFriendsToMarkers 호출됨:', friendsData);
    console.log('convertFriendsToMarkers - 각 친구의 좌표 정보:', friendsData.map(f => ({ id: f.id, name: f.name, coordinates: f.coordinates })));
    
    const markers = friendsData.map(friend => {
      const position = friend.coordinates || { lat: 37.5665, lng: 126.9780 };
      console.log(`친구 ${friend.id} (${friend.name}) 마커 위치:`, position);
      
      return {
        id: `friend-${friend.id}`,
        position: position,
        title: `${friend.name}: ${friend.location || '위치 미입력'}`,
        type: 'friend' as const,
        isHighlighted: false,
        isVisible: true
      };
    });
    
    console.log('생성된 마커들:', markers);
    return markers;
  };

  // 친구들의 위치 데이터가 변경될 때 마커 업데이트
  useEffect(() => {
    console.log('friends 상태 변경 감지:', friends);
    
    // 중간거리 찾기 모드일 때는 마커를 덮어쓰지 않음 (handleFindMiddle에서 처리)
    if (showCardList) {
      console.log('중간거리 찾기 모드이므로 useEffect에서 마커 업데이트 건너뜀');
      return;
    }
    
    // friends가 비어있지 않으면 마커 생성 (좌표가 없어도 기본 마커 생성)
    if (friends.length > 0) {
      const friendMarkers = friends.map(friend => ({
        id: `friend-${friend.id}`,
        position: friend.coordinates || { lat: 37.5665, lng: 126.9780 }, // 기본값: 서울시청
        title: `${friend.name}: ${friend.location || '위치 미입력'}`,
        type: 'friend' as const,
        isHighlighted: false,
        isVisible: true
      }));
      
      console.log('useEffect - 생성된 친구 마커:', friendMarkers);
      setMapMarkers(friendMarkers);
      console.log(`마커 ${friendMarkers.length}개 설정 완료`);
    } else {
      console.log('friends가 비어있음');
    }
  }, [friends, showCardList]);

  // TODO: 향후 기능 구현 예정
  const handleFriendClick = () => {};
  const handleScheduleClick = () => {};
  const handleMeetingClick = () => {};

  const handleFindMiddle = async (friendsData?: Array<{
    id: number;
    name: string;
    location: string;
    coordinates?: { lat: number; lng: number };
  }>) => {
    console.log('중간거리 찾기 버튼 클릭됨');
    
    // 친구 데이터가 전달되면 상태 업데이트
    if (friendsData) {
      console.log('전달받은 친구 데이터:', friendsData);
      setFriends(friendsData);
    }
    
    // 홈 컨텐츠 숨기기 (우리 사이 텍스트 사라짐)
    setShowHomeContent(false);
    
    // 지도 상호작용 활성화
    setMapInteraction({
      zoomable: true,
      scrollwheel: true,
      draggable: true,
      disableDoubleClickZoom: false,
      disableDoubleTapZoom: false
    });
    
    // 역 목록 카드 표시
    const stationCards = generateStationCards();
    setCards(stationCards);
    setCurrentView('stations');
            setSelectedStationId(null);
    setSelectedCardId(null);
    setShowCardList(true);
    
    // 역 마커와 친구 마커를 함께 표시 (항상 표시되도록 보장)
    const allStations = getAllStations();
    const stationMarkers = allStations.map(station => ({
      id: `station-${station.id}`,
      position: { lat: station.lat, lng: station.lng },
      title: station.name,
      type: 'station' as const,
      isVisible: true,
      isHighlighted: false
    }));
    
    console.log('handleFindMiddle - friends 상태:', friends);
    console.log('handleFindMiddle - friends 좌표 정보:', friends.map(f => ({ id: f.id, name: f.name, location: f.location, coordinates: f.coordinates })));
    
    // 친구 마커 생성 (convertFriendsToMarkers 함수 사용하여 최신 좌표 반영)
    const friendMarkers = convertFriendsToMarkers(friends);
    
    console.log('handleFindMiddle - 생성된 친구 마커:', friendMarkers);
    console.log('handleFindMiddle - 마커 위치 정보:', friendMarkers.map(m => ({ id: m.id, position: m.position, title: m.title })));
    
    const allMarkers = [...friendMarkers, ...stationMarkers];
    console.log('handleFindMiddle - 전체 마커:', allMarkers);
    setMapMarkers(allMarkers);
    setMapRoutes([]); // 초기 경로 제거
    
    console.log('역 목록 표시 - 친구 마커:', friendMarkers.length, '개, 역 마커:', stationMarkers.length, '개');
    
    // 맵 중심을 모든 역과 친구들의 중앙으로 설정하고 적절한 레벨 설정
    const allPoints = [
      ...allStations.map(station => ({ lat: station.lat, lng: station.lng })),
      ...friendMarkers.map(marker => marker.position) // 친구 마커의 위치 사용
    ];
    
    if (allPoints.length > 0) {
      const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
      const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
      setMapCenter({ lat: centerLat, lng: centerLng });
      setMapLevel(6); // 역들과 친구들이 모두 보이도록 더 넓은 레벨 설정
      console.log('맵 중심 설정:', { lat: centerLat, lng: centerLng }, '레벨:', 6);
    }
  };

  const handleHideCards = () => {
    console.log('handleHideCards 함수 호출됨');
    setShowCardList(false);
    // setShowHomeContent(true); // homeContent 다시 표시 제거 - 한 번만 표시되도록
    setCurrentView('stations');

    setSelectedCardId(null); // 선택된 카드 초기화
    
    // MiddlePlaceRecommendCard의 선택 상태도 리셋
    if ((window as any).resetMiddlePlaceCardSelection) {
      (window as any).resetMiddlePlaceCardSelection();
    }
    
    // 모든 마커 제거 (친구 마커, 역 마커, 장소 마커 모두)
    console.log('마커 제거 전 개수:', mapMarkers.length);
    setMapMarkers([]);
    
    // 모든 경로 제거
    console.log('경로 제거 전 개수:', mapRoutes.length);
    setMapRoutes([]);
    
    console.log('다른 곳에서 만날래? 클릭 - 모든 마커와 경로 제거 완료');
  };



  const handleCardClick = (cardId: number) => {
    const clickedCard = cards.find(card => card.id === cardId);
    
    if (!clickedCard) return;

    if (currentView === 'stations') {
      // 역 선택 시 추천 장소로 변경
      if (clickedCard.type === 'station') {
        const station = getStationById(clickedCard.id);
        if (station) {
                  setSelectedStationId(station.id);
          setMapCenter({ lat: station.lat, lng: station.lng });
          setMapLevel(4); // 역 선택 시 적절한 레벨로 설정
          
          // 역 마커와 해당 역의 모든 추천 장소 마커 추가
          const places = getPlacesByStationId(station.id);
          const placeMarkers = places.map(place => ({
            id: `place-${place.id}`,
            position: { lat: place.lat, lng: place.lng },
            title: place.title,
            type: 'place' as const
          }));
          
          // 친구 마커와 역/장소 마커를 합쳐서 설정 (항상 표시되도록 보장)
          const friendMarkers = convertFriendsToMarkers(friends);
          const allMarkers = [
            ...friendMarkers, // 친구 마커를 먼저 추가
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
          
          // 역을 클릭했을 때 친구들과 역 사이의 경로 생성 (마커의 정확한 위치 사용)
          const routes = friendMarkers.map(friendMarker => ({
            from: { 
              ...friendMarker.position, // 마커의 정확한 위치 사용
              id: friendMarker.id // 친구 ID 추가
            },
            to: { lat: station.lat, lng: station.lng },
            color: '#FF6B6B' // 빨간색 경로
          }));
          setMapRoutes(routes);
          
          console.log('역 선택 - 친구 마커:', friendMarkers.length, '개, 역 마커: 1개, 장소 마커:', placeMarkers.length, '개, 경로:', routes.length, '개');
          
          const placeCards = generatePlaceCards(clickedCard.id);
          setCards(placeCards);
          setCurrentView('places');
        }
      }
    } else {
      // 추천 장소 선택 시 처리
      if (clickedCard.type === 'back') {
        // 뒤로가기
        const stationCards = generateStationCards();
        setCards(stationCards);
        setCurrentView('stations');
        setSelectedStationId(null);
        setSelectedCardId(null); // 선택된 카드 초기화
        
        // 모든 역 마커와 친구 마커 다시 표시 (항상 표시되도록 보장)
        const allStations = getAllStations();
        const stationMarkers = allStations.map(station => ({
          id: `station-${station.id}`,
          position: { lat: station.lat, lng: station.lng },
          title: station.name,
          type: 'station' as const,
          isVisible: true,
          isHighlighted: false
        }));
        
        const friendMarkers = convertFriendsToMarkers(friends);
        const allMarkers = [...friendMarkers, ...stationMarkers];
        setMapMarkers(allMarkers);
        setMapRoutes([]); // 경로 제거
        
        console.log('뒤로가기 - 친구 마커:', friendMarkers.length, '개, 역 마커:', stationMarkers.length, '개');
        
        // 맵 중심을 모든 역과 친구들의 중앙으로 설정
        const allPoints = [
          ...allStations.map(station => ({ lat: station.lat, lng: station.lng })),
          ...friends.filter(friend => friend.coordinates).map(friend => friend.coordinates!)
        ];
        
        if (allPoints.length > 0) {
          const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
          const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
          setMapCenter({ lat: centerLat, lng: centerLng });
          setMapLevel(7); // 역들과 친구들이 모두 보이도록 적절한 레벨 설정
        }
      } else if (clickedCard.type === 'place') {
        // 이미 선택된 카드를 다시 클릭하면 원상복귀
        if (selectedCardId === clickedCard.id) {
          setSelectedCardId(null);
          
          // 역 위치로 맵 중심 복원
          const station = getStationById(selectedStationId || 0);
          if (station) {
            setMapCenter({ lat: station.lat, lng: station.lng });
          }
          
          // 역 마커, 장소 마커, 친구 마커 모두 표시하고 강조 해제
          const currentStation = getStationById(selectedStationId || 0);
          if (currentStation) {
            const places = getPlacesByStationId(currentStation.id);
            const placeMarkers = places.map(place => ({
              id: `place-${place.id}`,
              position: { lat: place.lat, lng: place.lng },
              title: place.title,
              type: 'place' as const,
              isVisible: true,
              isHighlighted: false
            }));
            
            const friendMarkers = convertFriendsToMarkers(friends);
            const stationMarker = {
              id: `station-${currentStation.id}`,
              position: { lat: currentStation.lat, lng: currentStation.lng },
              title: currentStation.name,
              type: 'station' as const,
              isVisible: true,
              isHighlighted: false
            };
            
            const allMarkers = [...friendMarkers, stationMarker, ...placeMarkers];
            setMapMarkers(allMarkers);
          }
        } else {
          // 새로운 장소 선택 - 선택된 장소와 친구들 간의 길찾기 처리
          const places = getPlacesByStationId(selectedStationId || 0);
          const selectedPlace = places.find(place => place.id === clickedCard.id);
          if (selectedPlace) {

            
            // 선택된 장소와 역의 위치를 고려한 맵 중심 계산
            const selectedStation = getStationById(selectedStationId || 0);
            if (selectedStation) {
              // 역을 중심으로 설정
              setMapCenter({ lat: selectedStation.lat, lng: selectedStation.lng });
              setMapLevel(2); // 역과 선택된 장소가 더 자세히 보이도록 레벨 설정
            } else {
              // 역 정보가 없으면 선택된 장소를 중심으로 설정
              setMapCenter({ lat: selectedPlace.lat, lng: selectedPlace.lng });
              setMapLevel(2); // 선택된 장소가 더 자세히 보이도록 레벨 설정
            }
            
            setSelectedCardId(clickedCard.id); // 선택된 카드 ID 저장
            
            // 선택된 장소를 강조하고, 친구 마커와 선택된 장소 마커만 표시
            setMapMarkers(prevMarkers => 
              prevMarkers.map(marker => {
                const isSelectedPlace = marker.id === `place-${selectedPlace.id}`;
                const isFriend = marker.type === 'friend';
                
                return {
                  ...marker,
                  isHighlighted: isSelectedPlace,
                  isVisible: isSelectedPlace || isFriend
                };
              })
            );
            
            // 선택된 장소와 역 간의 경로 생성 (친구들은 역을 통해 이동)
            const currentStation = getStationById(selectedStationId || 0);
            if (currentStation) {
              const routes = [{
                from: { 
                  lat: currentStation.lat, 
                  lng: currentStation.lng,
                  id: `station-${currentStation.id}`
                },
                to: { lat: selectedPlace.lat, lng: selectedPlace.lng },
                color: '#4A90E2' // 대중교통용 파란색
              }];
              setMapRoutes(routes);
            }
            
            // 길찾기 정보를 콘솔에 출력 (나중에 API 연동 시 사용)
            console.log('길찾기 정보:', {
              destination: {
                name: selectedPlace.title,
                coordinates: { lat: selectedPlace.lat, lng: selectedPlace.lng }
              },
              origins: friends.filter(friend => friend.coordinates).map(friend => ({
                name: friend.name,
                location: friend.location,
                coordinates: friend.coordinates
              }))
            });
          }
        }
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
          level={mapLevel}
          zoomable={mapInteraction.zoomable}
          scrollwheel={mapInteraction.scrollwheel}
          disableDoubleClickZoom={mapInteraction.disableDoubleClickZoom}
          disableDoubleTapZoom={mapInteraction.disableDoubleTapZoom}
          draggable={mapInteraction.draggable}
          appKey={KAKAO_MAP_APP_KEY}
          className={styles.homeMapContainer}
          markers={mapMarkers}
          routes={mapRoutes}
          disableAutoCenter={false} // 자동 중심 조정 활성화 (마커들이 적절히 보이도록)
          onMarkerClick={(markerId) => {
            console.log('KakaoMap에 전달된 markers:', mapMarkers);
            // 친구 마커 클릭 처리
            if (markerId.startsWith('friend-')) {
              const friendId = parseInt(markerId.replace('friend-', ''));
              const friend = friends.find(f => f.id === friendId);
              if (friend) {
                console.log(`친구 마커 클릭: ${friend.name} - ${friend.location}`);
                
                // 경로는 유지 (기존 경로가 있으면 그대로 유지)
                console.log('친구 마커 클릭 - 기존 경로 유지, 현재 경로 개수:', mapRoutes.length);
                
                // 경로가 사라지지 않도록 명시적으로 다시 설정 (같은 경로)
                if (mapRoutes.length > 0) {
                  console.log('기존 경로 유지를 위해 경로 재설정');
                  setMapRoutes([...mapRoutes]); // 같은 경로를 다시 설정하여 유지
                }
              }
              return;
            }
            
            // 기존 역/장소 마커 클릭 처리 (현재 비활성화됨)
            if (markerId.startsWith('place-')) {
              const placeId = parseInt(markerId.replace('place-', ''));
              const placeCard = cards.find(card => card.id === placeId && card.type === 'place');
              if (placeCard) {
                handleCardClick(placeId);
              }
            } else if (markerId.startsWith('station-')) {
              const stationId = parseInt(markerId.replace('station-', ''));
              const stationCard = cards.find(card => card.id === stationId && card.type === 'station');
              if (stationCard) {
                handleCardClick(stationId);
              }
            }
          }}
        />
      </div>
      {showHomeContent && (
        <div className={`${styles.homeContent} ${isHomeContentFading ? styles.fadeOut : ''}`}>
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
      
      {/* 삼육대학교 이스터 에그 */}
      {showEasterEgg && (
        <div className={styles.easterEgg}>
          <div className={styles.easterEggContent}>
            <div className={styles.easterEggIcon}>🎓</div>
            <div className={styles.easterEggTitle}>삼육대학교 발견!</div>
            <div className={styles.easterEggMessage}>
              개발자의 모교를 찾으셨네요! 🎉
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
