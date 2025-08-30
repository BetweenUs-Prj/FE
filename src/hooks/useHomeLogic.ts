import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // 지도 상호작용 상태 (동적 제어)
  const [mapInteraction, setMapInteraction] = useState({
    zoomable: false,
    scrollwheel: false,
    draggable: false,
    disableDoubleClickZoom: true,
    disableDoubleTapZoom: true
  });

  // 맵 상호작용 제어 함수
  const enableMapInteraction = useCallback(() => {
    setMapInteraction({
      zoomable: true,
      scrollwheel: true,
      draggable: true,
      disableDoubleClickZoom: false,
      disableDoubleTapZoom: false
    });
  }, []);

  const disableMapInteraction = useCallback(() => {
    setMapInteraction({
      zoomable: false,
      scrollwheel: false,
      draggable: false,
      disableDoubleClickZoom: true,
      disableDoubleTapZoom: true
    });
  }, []);

  // 지도 중심 설정 함수 (디바운싱 적용)
  const setMapCenterDebounced = useCallback((center: { lat: number; lng: number }) => {
    setMapCenter(center);
  }, []);

  // 지도 레벨 설정 함수 (디바운싱 적용)
  const setMapLevelDebounced = useCallback((level: number) => {
    console.log('setMapLevelDebounced 호출됨:', level);
    setMapLevel(level);
  }, []);


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
      // 카드가 표시되면 맵 상호작용 활성화
      enableMapInteraction();
      
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
                setMapCenterDebounced({ lat: centerLat, lng: centerLng });
                setMapLevelDebounced(6);
              }
    } catch (error) {
      console.error('중간거리 찾기 중 오류 발생:', error);
      showToast('중간거리 찾기 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsFindingMiddle(false);
    }
  }, [lastFindMiddleTime, isFindingMiddle, generateStationCards, convertFriendsToMarkers, showToast, enableMapInteraction]);

  const handleHideCards = useCallback(() => {
    setShowCardList(false);
    setCurrentView('stations');
    setSelectedCardId(null);
    
    if ((window as any).resetMiddlePlaceCardSelection) {
      (window as any).resetMiddlePlaceCardSelection();
    }
    
    // 카드가 숨겨지면 맵 상호작용 비활성화
    disableMapInteraction();
    
    setMapMarkers([]);
    setMapRoutes([]);
  }, [disableMapInteraction]);

  const handleCardClick = useCallback((cardId: number) => {
    // 연속 클릭 방지 (1.2초)
    const now = Date.now();
    if (now - (handleCardClick as any).lastClickTime < 1200) {
      console.log('중복 클릭 방지');
      return;
    }
    (handleCardClick as any).lastClickTime = now;
    
    // 처리 중 상태 확인
    if ((handleCardClick as any).isProcessing) {
      console.log('이미 처리 중인 클릭이 있습니다');
      return;
    }
    (handleCardClick as any).isProcessing = true;
    
    const clickedCard = cards.find(card => card.id === cardId);
    if (!clickedCard) return;

    if (currentView === 'stations') {
      if (clickedCard.type === 'station') {
        const station = getStationById(clickedCard.id);
        if (station) {
          setSelectedStationId(station.id);
          
          // 🎯 역 클릭 시: 친구들에서 역으로의 경로를 바로 생성
          const friendMarkers = convertFriendsToMarkers(friends);
          const stationMarker = {
            id: `station-${station.id}`,
            position: { lat: station.lat, lng: station.lng },
            title: station.name,
            type: 'station' as const,
            isVisible: true,
            isHighlighted: true // 선택된 역은 강조 표시
          };
          
          // 상태 업데이트 최적화 (배치 처리)
          const allMarkers = [...friendMarkers, stationMarker];
          const friendRoutes = friends.map(friend => ({
            from: { lat: friend.coordinates?.lat || 37.5665, lng: friend.coordinates?.lng || 126.9780 },
            to: { lat: station.lat, lng: station.lng },
            color: '#4A90E2' // 파란색 (대중교통 경로)
          }));
          
          const allPoints = [
            ...friendMarkers.map(marker => marker.position),
            stationMarker.position
          ];
          
          // React 18의 자동 배치 업데이트 활용
          React.startTransition(() => {
            // 맵 상호작용 활성화
            enableMapInteraction();
            
            // 맵 관련 상태 업데이트
            setMapMarkers(allMarkers);
            setMapRoutes(friendRoutes);
            
            if (allPoints.length > 0) {
              const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
              const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
              setMapCenterDebounced({ lat: centerLat, lng: centerLng });
              setMapLevelDebounced(6);
            }
            
            // UI 관련 상태 업데이트
            setSelectedStationInfo({
              name: station.name,
              position: { lat: station.lat, lng: station.lng }
            });
            setShowTransportModal(true);
            
            // 추천 장소 카드로 변경
            const placeCards = generatePlaceCards(clickedCard.id);
            setCards(placeCards);
            setCurrentView('places');
          });
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
        
        const allPoints = [
          ...allStations.map(station => ({ lat: station.lat, lng: station.lng })),
          ...friends.filter(friend => friend.coordinates).map(friend => friend.coordinates!)
        ];
        
        // React 18의 자동 배치 업데이트 활용
        React.startTransition(() => {
          // 맵 상호작용 활성화
          enableMapInteraction();
          
          setMapMarkers(allMarkers);
          setMapRoutes([]);
          
          if (allPoints.length > 0) {
            const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
            const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
            setMapCenterDebounced({ lat: centerLat, lng: centerLng });
            setMapLevelDebounced(7);
          }
        });
      } else if (clickedCard.type === 'place') {
        if (selectedCardId === clickedCard.id) {
          // 🎯 이미 선택된 장소를 다시 클릭하면 원상복귀 (친구들에서 역으로의 경로 복원)
          setSelectedCardId(null);
          
          // 친구들과 역, 모든 장소 마커를 다시 표시
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
              isHighlighted: true // 역은 계속 강조 표시
            };
            
            const allMarkers = [...friendMarkers, stationMarker, ...placeMarkers];
            
            // 맵 상호작용 활성화
            enableMapInteraction();
            
            setMapMarkers(allMarkers);
            
            // 친구들에서 역으로의 경로 복원
            const friendRoutes = friends.map(friend => ({
              from: { lat: friend.coordinates?.lat || 37.5665, lng: friend.coordinates?.lng || 126.9780 },
              to: { lat: currentStation.lat, lng: currentStation.lng },
              color: '#4A90E2'
            }));
            
            setMapRoutes(friendRoutes);
            
            // 맵 중심을 친구들과 역의 중앙으로 복원
            const allPoints = [
              ...friendMarkers.map(marker => marker.position),
              stationMarker.position
            ];
            
            if (allPoints.length > 0) {
              const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
              const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
                              setMapCenterDebounced({ lat: centerLat, lng: centerLng });
                setMapLevelDebounced(6);
            }
          }
        } else {
          // 🎯 새로운 장소 선택 시: 역과 해당 장소 간의 경로만 표시
          const places = getPlacesByStationId(selectedStationId || 0);
          const selectedPlace = places.find(place => place.id === clickedCard.id);
          if (selectedPlace) {
            const currentStation = getStationById(selectedStationId || 0);
            if (currentStation && selectedPlace) {
              // 모든 상태를 한 번에 계산
              const stationMarker = {
                id: `station-${currentStation.id}`,
                position: { lat: currentStation.lat, lng: currentStation.lng },
                title: currentStation.name,
                type: 'station' as const,
                isVisible: true,
                isHighlighted: true
              };
              
              const selectedPlaceMarker = {
                id: `place-${selectedPlace.id}`,
                position: { lat: selectedPlace.lat, lng: selectedPlace.lng },
                title: selectedPlace.title,
                type: 'place' as const,
                isVisible: true,
                isHighlighted: true
              };
              
              const friendMarkers = convertFriendsToMarkers(friends);
              const allPoints = [
                ...friendMarkers.map(marker => marker.position),
                stationMarker.position,
                selectedPlaceMarker.position
              ];
              
              const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
              const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
              
              const friendRoutes = friends.map(friend => ({
                from: { lat: friend.coordinates?.lat || 37.5665, lng: friend.coordinates?.lng || 126.9780 },
                to: { lat: currentStation.lat, lng: currentStation.lng },
                color: '#4A90E2'
              }));
              
              const stationToPlaceRoute = {
                from: { lat: currentStation.lat, lng: currentStation.lng },
                to: { lat: selectedPlace.lat, lng: selectedPlace.lng },
                color: '#FF6B6B'
              };
              
              // 상태 업데이트를 배치로 처리
              Promise.resolve().then(() => {
                // 맵 상호작용 활성화
                enableMapInteraction();
                
                setSelectedCardId(clickedCard.id);
                setMapMarkers([...friendMarkers, stationMarker, selectedPlaceMarker]);
                setMapRoutes([...friendRoutes, stationToPlaceRoute]);
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
              });
              
              // 맵 중심과 레벨은 별도로 설정
              Promise.resolve().then(() => {
                setMapCenterDebounced({ lat: centerLat, lng: centerLng });
                setMapLevelDebounced(5);
              });
            }
          }
        }
      }
    }
    
    // 처리 완료 후 상태 리셋
    (handleCardClick as any).isProcessing = false;
  }, [cards, currentView, selectedCardId, selectedStationId, friends, convertFriendsToMarkers, generatePlaceCards, generateStationCards, setMapCenterDebounced, setMapLevelDebounced, enableMapInteraction]);

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
    
    // 디바운싱 함수들
    setMapCenterDebounced,
    setMapLevelDebounced,
    
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
    
    // 맵 상호작용 제어
    enableMapInteraction,
    disableMapInteraction,
    
    // 유틸리티
    generateStationCards,
    generatePlaceCards,
    convertFriendsToMarkers
  };
};
