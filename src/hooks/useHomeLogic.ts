import { useState, useEffect, useCallback } from 'react';
import { getAllStations, getPlacesByStationId, getStationById } from '@/constants/stationData';

interface MiddlePlaceCard {
  id: number;
  title: string;
  duration: string;
  type: 'station' | 'place' | 'back';
}

interface Friend {
  id: number;
  name: string;
  location: string;
  coordinates?: { lat: number; lng: number };
}

interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  type: 'station' | 'place' | 'friend';
  isHighlighted?: boolean;
  isVisible?: boolean;
}

interface MapRoute {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  color?: string;
}

interface StationInfo {
  name: string;
  position: { lat: number; lng: number };
  placePosition?: { lat: number; lng: number };
  placeInfo?: {
    title: string;
    category: string;
    description?: string;
    duration: string;
  };
}

// 수도권 주요 역 주변 지역 랜덤 좌표 생성 함수 + 삼육대학교 이스터 에그
const generateRandomLocation = () => {
  // 삼육대학교 이스터 에그 (1% 확률)
  if (Math.random() < 0.01) {
    console.log('🎉 삼육대학교 이스터 에그 발견! 🎉');
    return { lat: 37.6447, lng: 127.1053 }; // 삼육대학교 좌표
  }
  
  // 수도권 주요 역 주변 지역들의 좌표 범위들
  const stationAreas = [
    { lat: { min: 37.50, max: 37.58 }, lng: { min: 126.90, max: 127.08 } },
    { lat: { min: 37.48, max: 37.52 }, lng: { min: 127.00, max: 127.08 } },
    { lat: { min: 37.54, max: 37.58 }, lng: { min: 126.90, max: 126.98 } },
    { lat: { min: 37.60, max: 37.66 }, lng: { min: 127.00, max: 127.08 } },
    { lat: { min: 37.34, max: 37.38 }, lng: { min: 127.08, max: 127.16 } },
    { lat: { min: 37.26, max: 37.30 }, lng: { min: 126.98, max: 127.08 } },
    { lat: { min: 37.46, max: 37.50 }, lng: { min: 126.68, max: 126.76 } }
  ];
  
  const randomArea = stationAreas[Math.floor(Math.random() * stationAreas.length)];
  const lat = randomArea.lat.min + Math.random() * (randomArea.lat.max - randomArea.lat.min);
  const lng = randomArea.lng.min + Math.random() * (randomArea.lng.max - randomArea.lng.min);
  
  return { lat, lng };
};

export const useHomeLogic = () => {
  // 상태 관리
  const [showCardList, setShowCardList] = useState(false);
  const [showHomeContent, setShowHomeContent] = useState(true);
  const [isHomeContentFading, setIsHomeContentFading] = useState(false);
  const [currentView, setCurrentView] = useState<'stations' | 'places'>('stations');
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [cards, setCards] = useState<MiddlePlaceCard[]>([]);
  const [mapCenter, setMapCenter] = useState(() => generateRandomLocation());
  const [mapLevel, setMapLevel] = useState(2);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [mapRoutes, setMapRoutes] = useState<MapRoute[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isFindingMiddle, setIsFindingMiddle] = useState(false);
  const [lastFindMiddleTime, setLastFindMiddleTime] = useState(0);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [selectedStationInfo, setSelectedStationInfo] = useState<StationInfo | null>(null);

  // 지도 상호작용 상태
  const [mapInteraction, setMapInteraction] = useState({
    zoomable: false,
    scrollwheel: false,
    draggable: false,
    disableDoubleClickZoom: true,
    disableDoubleTapZoom: true
  });

  // 토스트 메시지 상태
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  // 모달 상태
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // 유틸리티 함수들
  const generateStationCards = useCallback((): MiddlePlaceCard[] => {
    const stations = getAllStations();
    return stations.map(station => ({
      id: station.id,
      title: station.name,
      duration: station.duration,
      type: "station" as const
    }));
  }, []);

  const generatePlaceCards = useCallback((stationId: number): MiddlePlaceCard[] => {
    const station = getStationById(stationId);
    if (!station) return [];

    const places = getPlacesByStationId(stationId);
    const placeCards = places.map(place => ({
      id: place.id,
      title: place.title,
      duration: place.duration,
      type: "place" as const
    }));

    const backCard = {
      id: 9999,
      title: "뒤로가기",
      duration: "역 선택으로 돌아가기",
      type: "back" as const
    };

    return [...placeCards, backCard];
  }, []);

  const convertFriendsToMarkers = useCallback((friendsData: Friend[]): MapMarker[] => {
    return friendsData.map(friend => {
      const position = friend.coordinates || { lat: 37.5665, lng: 126.9780 };
      return {
        id: `friend-${friend.id}`,
        position: position,
        title: `${friend.name}: ${friend.location || '위치 미입력'}`,
        type: 'friend' as const,
        isHighlighted: false,
        isVisible: true
      };
    });
  }, []);

  // 이벤트 핸들러들
  const showToast = useCallback((message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const handleFriendClick = useCallback(() => {
    setShowFriendsModal(true);
  }, []);

  const handleScheduleClick = useCallback(() => {
    setShowScheduleModal(true);
  }, []);

  const handleMeetingClick = useCallback(() => {
    setShowMeetingModal(true);
  }, []);

  const handleFindMiddle = useCallback(async (
    friendsData?: Friend[]
  ) => {
    const now = Date.now();
    
    if (now - lastFindMiddleTime < 200) {
      return;
    }
    
    if (isFindingMiddle) {
      return;
    }
    
    setLastFindMiddleTime(now);
    setIsFindingMiddle(true);
    
    try {
      if (friendsData) {
        setFriends(friendsData);
      }
      
      setShowHomeContent(false);
      setMapInteraction({
        zoomable: true,
        scrollwheel: true,
        draggable: true,
        disableDoubleClickZoom: false,
        disableDoubleTapZoom: false
      });
      
      const stationCards = generateStationCards();
      setCards(stationCards);
      setCurrentView('stations');
      setSelectedStationId(null);
      setSelectedCardId(null);
      setShowCardList(true);
      
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
      setMapRoutes([]);
      
      const allPoints = [
        ...allStations.map(station => ({ lat: station.lat, lng: station.lng })),
        ...friendMarkers.map(marker => marker.position)
      ];
      
      if (allPoints.length > 0) {
        const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
        const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
        setMapCenter({ lat: centerLat, lng: centerLng });
        setMapLevel(6);
      }
    } catch (error) {
      console.error('중간거리 찾기 중 오류 발생:', error);
      showToast('중간거리 찾기 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsFindingMiddle(false);
    }
  }, [lastFindMiddleTime, isFindingMiddle, generateStationCards, convertFriendsToMarkers, showToast]);

  const handleHideCards = useCallback(() => {
    setShowCardList(false);
    setCurrentView('stations');
    setSelectedCardId(null);
    
    if ((window as any).resetMiddlePlaceCardSelection) {
      (window as any).resetMiddlePlaceCardSelection();
    }
    
    setMapMarkers([]);
    setMapRoutes([]);
  }, []);

  const handleCardClick = useCallback((cardId: number) => {
    const clickedCard = cards.find(card => card.id === cardId);
    if (!clickedCard) return;

    if (currentView === 'stations') {
      if (clickedCard.type === 'station') {
        const station = getStationById(clickedCard.id);
        if (station) {
          setSelectedStationId(station.id);
          setMapCenter({ lat: station.lat, lng: station.lng });
          setMapLevel(4);
          
          const places = getPlacesByStationId(station.id);
          const placeMarkers = places.map(place => ({
            id: `place-${place.id}`,
            position: { lat: place.lat, lng: place.lng },
            title: place.title,
            type: 'place' as const
          }));
          
          const friendMarkers = convertFriendsToMarkers(friends);
          const allMarkers = [
            ...friendMarkers,
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
          
          setSelectedStationInfo({
            name: station.name,
            position: { lat: station.lat, lng: station.lng }
          });
          setShowTransportModal(true);
          
          const placeCards = generatePlaceCards(clickedCard.id);
          setCards(placeCards);
          setCurrentView('places');
        }
      }
    } else {
      if (clickedCard.type === 'back') {
        const stationCards = generateStationCards();
        setCards(stationCards);
        setCurrentView('stations');
        setSelectedStationId(null);
        setSelectedCardId(null);
        
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
        setMapRoutes([]);
        
        const allPoints = [
          ...allStations.map(station => ({ lat: station.lat, lng: station.lng })),
          ...friends.filter(friend => friend.coordinates).map(friend => friend.coordinates!)
        ];
        
        if (allPoints.length > 0) {
          const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
          const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
          setMapCenter({ lat: centerLat, lng: centerLng });
          setMapLevel(7);
        }
      } else if (clickedCard.type === 'place') {
        if (selectedCardId === clickedCard.id) {
          setSelectedCardId(null);
          
          const station = getStationById(selectedStationId || 0);
          if (station) {
            setMapCenter({ lat: station.lat, lng: station.lng });
          }
          
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
          const places = getPlacesByStationId(selectedStationId || 0);
          const selectedPlace = places.find(place => place.id === clickedCard.id);
          if (selectedPlace) {
            const selectedStation = getStationById(selectedStationId || 0);
            if (selectedStation) {
              setMapCenter({ lat: selectedStation.lat, lng: selectedStation.lng });
              setMapLevel(2);
            } else {
              setMapCenter({ lat: selectedPlace.lat, lng: selectedPlace.lng });
              setMapLevel(2);
            }
            
            setSelectedCardId(clickedCard.id);
            
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
            
            const currentStation = getStationById(selectedStationId || 0);
            if (currentStation && selectedPlace) {
              const stationToPlaceRoute = {
                from: { lat: currentStation.lat, lng: currentStation.lng },
                to: { lat: selectedPlace.lat, lng: selectedPlace.lng },
                color: '#4A90E2'
              };
              
              setMapRoutes([stationToPlaceRoute]);
              
              setSelectedStationInfo({
                name: `${currentStation.name} → ${selectedPlace.title}`,
                position: { lat: currentStation.lat, lng: currentStation.lng },
                placePosition: { lat: selectedPlace.lat, lng: selectedPlace.lng },
                placeInfo: {
                  title: selectedPlace.title,
                  category: selectedPlace.category,
                  description: `${selectedPlace.title}는 ${selectedPlace.category} 카테고리의 장소입니다.`,
                  duration: selectedPlace.duration
                }
              });
              setShowTransportModal(true);
            }
          }
        }
      }
    }
  }, [cards, currentView, selectedCardId, selectedStationId, friends, convertFriendsToMarkers, generatePlaceCards, generateStationCards]);

  // Effects
  useEffect(() => {
    if (mapCenter.lat === 37.6447 && mapCenter.lng === 127.1053) {
      setShowEasterEgg(true);
      setTimeout(() => setShowEasterEgg(false), 5000);
    }
  }, [mapCenter]);

  useEffect(() => {
    if (showHomeContent) {
      const timer = setTimeout(() => {
        setIsHomeContentFading(true);
        setTimeout(() => {
          setShowHomeContent(false);
          setIsHomeContentFading(false);
        }, 500);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showHomeContent]);

  useEffect(() => {
    if (friends.length > 0 && !showCardList) {
      const friendMarkers = friends.map(friend => ({
        id: `friend-${friend.id}`,
        position: friend.coordinates || { lat: 37.5665, lng: 126.9780 },
        title: `${friend.name}: ${friend.location || '위치 미입력'}`,
        type: 'friend' as const,
        isHighlighted: false,
        isVisible: true
      }));
      
      setMapMarkers(friendMarkers);
    }
  }, [friends, showCardList]);

  return {
    // 상태
    showCardList,
    showHomeContent,
    isHomeContentFading,
    currentView,
    selectedStationId,
    cards,
    mapCenter,
    mapLevel,
    mapMarkers,
    mapRoutes,
    selectedCardId,
    showEasterEgg,
    friends,
    mapInteraction,
    toast,
    showTransportModal,
    selectedStationInfo,
    showFriendsModal,
    showScheduleModal,
    showMeetingModal,
    
    // 액션
    setShowCardList,
    setMapCenter,
    setMapLevel,
    setMapMarkers,
    setMapRoutes,
    setSelectedCardId,
    setFriends,
    setShowTransportModal,
    setSelectedStationInfo,
    setShowFriendsModal,
    setShowScheduleModal,
    setShowMeetingModal,
    
    // 핸들러
    showToast,
    hideToast,
    handleFriendClick,
    handleScheduleClick,
    handleMeetingClick,
    handleFindMiddle,
    handleHideCards,
    handleCardClick,
    
    // 유틸리티
    generateStationCards,
    generatePlaceCards,
    convertFriendsToMarkers
  };
};
