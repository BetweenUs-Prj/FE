import { useState, useEffect, useCallback, useRef } from 'react';
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
  coords?: { lat: number; lng: number }[]; // 실제 경로 좌표 배열
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
  // ===== 🎯 핵심 데이터 상태 (3개) =====
  // 친구 목록 (위치 정보 포함)
  const [friends, setFriends] = useState<Friend[]>([]);
  
  // 원본 중간지점 데이터 (뒤로가기 시 복원용)
  const [originalMiddlePoints, setOriginalMiddlePoints] = useState<any[]>([]);
  
  // 사용자의 일정 목록
  const [schedules, setSchedules] = useState<any[]>([]);

  // ===== 🎯 UI 상태 통합 (1개 객체) =====
  const [uiState, setUiState] = useState({
    showCardList: false,
    showHomeContent: true,
    currentView: 'stations' as 'stations' | 'places',
    selectedStationId: null as number | null
  });

  // ===== 🎯 지도 상태 통합 (1개 객체) =====
  const [mapState, setMapState] = useState({
    center: generateRandomLocation(),
    level: 2,
    markers: [] as MapMarker[],
    routes: [] as MapRoute[],
    interaction: {
      zoomable: false,
      draggable: false
    }
  });

  // ===== 🎯 모달 상태 통합 (1개 객체) =====
  const [modalState, setModalState] = useState({
    showTransport: false,
    showScheduleConfirm: false,
    showFriends: false,
    showSchedule: false,
    showMeeting: false,
    selectedStationInfo: null as StationInfo | null,
    selectedMiddlePointData: null as any,
    scheduleData: null as any
  });

  // ===== 🎯 토스트 상태 (1개) =====
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  // ===== 🎯 현재 표시되는 카드 목록 (1개) =====
  const [cards, setCards] = useState<MiddlePlaceCard[]>([]);

  // ===== 🎯 ref로 대체 가능한 상태들 =====
  const lastFindMiddleTimeRef = useRef(0);
  const isFindingMiddleRef = useRef(false);

  // ===== 🎯 상태 업데이트 헬퍼 함수들 =====
  const updateUiState = useCallback((updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateMapState = useCallback((updates: Partial<typeof mapState>) => {
    setMapState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateModalState = useCallback((updates: Partial<typeof modalState>) => {
    setModalState(prev => ({ ...prev, ...updates }));
  }, []);

  // 맵 상호작용 제어 함수
  const enableMapInteraction = useCallback(() => {
    console.log('🎯 enableMapInteraction 호출됨 - 맵 상호작용 활성화');
    updateMapState({
      interaction: {
        zoomable: true,
        draggable: true
      }
    });
  }, [updateMapState]);

  const disableMapInteraction = useCallback(() => {
    console.log('🎯 disableMapInteraction 호출됨 - 맵 상호작용 비활성화');
    updateMapState({
      interaction: {
        zoomable: false,
        draggable: false
      }
    });
  }, [updateMapState]);

  // 지도 중심 설정 함수 (디바운싱 적용)
  const setMapCenterDebounced = useCallback((center: { lat: number; lng: number }) => {
    updateMapState({ center });
  }, [updateMapState]);

  // 지도 레벨 설정 함수 (디바운싱 적용)
  const setMapLevelDebounced = useCallback((level: number) => {
    console.log('setMapLevelDebounced 호출됨:', level);
    updateMapState({ level });
  }, [updateMapState]);


  // 🗑️ 중복 제거: 이미 위에서 선언됨
  // const [toast, setToast] = useState<{
  //   isVisible: boolean;
  //   message: string;
  //   type: 'info' | 'warning' | 'error' | 'success';
  // }>({
  //   isVisible: false,
  //   message: '',
  //   type: 'info'
  // });

  // 모달 상태
  // 🗑️ 중복 제거: 이미 위에서 선언됨
  // const [showFriendsModal, setShowFriendsModal] = useState(false);
  // const [showScheduleModal, setShowScheduleModal] = useState(false);
  // const [showMeetingModal, setShowMeetingModal] = useState(false);


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

  const generatePlaceCards = useCallback(async (stationId: number): Promise<MiddlePlaceCard[]> => {
    const station = getStationById(stationId);
    if (!station) return [];

    const places = await getPlacesByStationId(stationId);
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
    return friendsData.map((friend, index) => {
      // 좌표 데이터 검증 및 기본값 설정
      let position;
      if (friend.coordinates && 
          typeof friend.coordinates.lat === 'number' && 
          typeof friend.coordinates.lng === 'number' &&
          friend.coordinates.lat !== 0 && 
          friend.coordinates.lng !== 0) {
        position = friend.coordinates;
      } else {
        // 좌표가 없거나 유효하지 않으면 마커를 생성하지 않음
        console.warn(`⚠️ 친구 ${friend.name}의 좌표가 유효하지 않습니다:`, friend.coordinates);
        return null;
      }
      
      // 첫 번째 친구는 사용자로, 나머지는 친구로 구분
      const isUser = index === 0;
      
      return {
        id: isUser ? `user-${friend.id}` : `friend-${friend.id}`,
        position: position,
        title: isUser ? 
          `⭐ 사용자 ${index + 1}: ${friend.location || '위치 미입력'}` : 
          `친구 ${index + 1}: ${friend.location || '위치 미입력'}`,
        type: 'friend' as const,
        isHighlighted: false,
        isVisible: true
      };
    }).filter(marker => marker !== null) as MapMarker[];
  }, []);


  // 모든 사용자에서 중간지점까지의 경로를 생성하는 함수
  const generateAllUsersToMiddleRoute = useCallback((middlePointData: any): MapRoute[] => {
    const routes: MapRoute[] = [];
    
    // 중간지점 좌표 설정
    let middlePosition;
    if (middlePointData.segments && middlePointData.segments.length > 0) {
      // 마지막 segment의 endX, endY 좌표 사용 (도보 제외)
      let targetSegment = middlePointData.segments[middlePointData.segments.length - 1];
      
      // 마지막 segment가 도보인 경우, 도보가 아닌 마지막 segment 찾기
      if (targetSegment.trafficType === 3) {
        for (let i = middlePointData.segments.length - 1; i >= 0; i--) {
          if (middlePointData.segments[i].trafficType !== 3) {
            targetSegment = middlePointData.segments[i];
            break;
          }
        }
      }
      
      middlePosition = {
        lat: targetSegment.endY,  // endY = 위도
        lng: targetSegment.endX   // endX = 경도
      };
    } else {
      // segment가 없는 경우 기본 좌표 사용
      middlePosition = { 
        lat: middlePointData.latitude || 37.5665, 
        lng: middlePointData.longitude || 126.9780 
      };
    }
    
    // 🎯 모든 사용자(1번, 2번, 3번...)에서 중간지점까지의 경로 생성
    friends.forEach((friend, index) => {
      // 친구 좌표 검증
      if (!friend.coordinates || 
          typeof friend.coordinates.lat !== 'number' || 
          typeof friend.coordinates.lng !== 'number' ||
          friend.coordinates.lat === 0 || friend.coordinates.lng === 0) {
        console.warn(`⚠️ 사용자 ${index + 1}의 좌표가 유효하지 않아 경로를 생성하지 않습니다:`, friend.coordinates);
        return;
      }
      
      // 사용자별 색상 (친구별 색상과 동일)
      const userColor = getFriendColor(index);
      
      // 각 사용자에서 중간지점까지의 경로 생성
      routes.push({
        from: friend.coordinates,
        to: middlePosition,
        color: userColor, // 사용자별 고유 색상
        coords: [friend.coordinates, middlePosition]
      });
      
      console.log(`🎯 사용자 ${index + 1}에서 중간지점까지의 경로 생성:`, {
        userPosition: friend.coordinates,
        middlePosition: middlePosition,
        color: userColor
      });
    });
    
    console.log('🎯 모든 사용자에서 중간지점까지의 경로 생성 완료:', {
      totalUsers: friends.length,
      routeCount: routes.length,
      middlePosition: middlePosition
    });
    
    return routes;
  }, [friends]);

  // segments 데이터를 이용해 실제 경로 생성 (중복 제거 및 친구별 색상 구분)
  const generateRoutesFromSegments = useCallback((middlePoints: any[], friends: Friend[]): MapRoute[] => {
    const routes: MapRoute[] = [];
    const processedSegments = new Set(); // 중복 segment 방지
    
    middlePoints.forEach((middlePoint, middleIndex) => {
      if (!middlePoint.segments || !Array.isArray(middlePoint.segments)) {
        console.log(`🎯 중간지점 ${middleIndex + 1}: segments 데이터 없음`);
        return;
      }
      
      console.log(`🎯 중간지점 ${middleIndex + 1} segments:`, middlePoint.segments);
      
      // 🎯 각 segment별로 개별 경로 생성 (중복 제거)
      middlePoint.segments.forEach((segment: any, segmentIndex: number) => {
        const segmentKey = `${segment.startX}_${segment.startY}_${segment.endX}_${segment.endY}_${segment.trafficTypeName}`;
        
        if (!processedSegments.has(segmentKey)) {
          processedSegments.add(segmentKey);
          
          const segmentCoords = extractSegmentCoordinates(segment);
          
          if (segmentCoords.length > 0) {
            // segment별로 개별 경로 생성
            routes.push({
              from: segmentCoords[0], // segment 시작점
              to: segmentCoords[segmentCoords.length - 1], // segment 끝점
              color: getTransportTypeColor(segment.trafficTypeName || '도보'),
              coords: segmentCoords // segment별 좌표
            });
            
            console.log(`🎯 segment ${segmentIndex + 1} (${segment.trafficTypeName}) 경로 생성:`, {
              transportType: segment.trafficTypeName,
              coordsCount: segmentCoords.length,
              color: getTransportTypeColor(segment.trafficTypeName || '도보')
            });
          }
        }
      });
      
      // 🎯 각 친구별로 도보 경로 생성 (친구별 색상 구분)
      friends.forEach((friend, friendIndex) => {
        // 친구 좌표 검증
        if (!friend.coordinates || 
            typeof friend.coordinates.lat !== 'number' || 
            typeof friend.coordinates.lng !== 'number' ||
            friend.coordinates.lat === 0 || friend.coordinates.lng === 0) {
          console.warn(`⚠️ 친구 ${friend.name}의 좌표가 유효하지 않아 경로를 생성하지 않습니다:`, friend.coordinates);
          return;
        }
        
        // 중간지점 좌표 검증
        if (!middlePoint.latitude || !middlePoint.longitude || 
            typeof middlePoint.latitude !== 'number' || 
            typeof middlePoint.longitude !== 'number' ||
            middlePoint.latitude === 0 || middlePoint.longitude === 0) {
          console.warn(`⚠️ 중간지점의 좌표가 유효하지 않아 경로를 생성하지 않습니다:`, {
            latitude: middlePoint.latitude,
            longitude: middlePoint.longitude
          });
          return;
        }
        
        const friendPosition = friend.coordinates;
        
        // 🎯 실제 최종 목적지 좌표는 마지막 segment의 endX, endY 값 (도보 제외)
        let middlePosition;
        if (middlePoint.segments && middlePoint.segments.length > 0) {
          // 🎯 마지막 segment가 도보(trafficType: 3)인 경우, 도보가 아닌 마지막 segment 찾기
          let targetSegment = middlePoint.segments[middlePoint.segments.length - 1];
          
          // 마지막 segment가 도보인 경우, 도보가 아닌 마지막 segment 찾기
          if (targetSegment.trafficType === 3) {
            for (let i = middlePoint.segments.length - 1; i >= 0; i--) {
              if (middlePoint.segments[i].trafficType !== 3) {
                targetSegment = middlePoint.segments[i];
                break;
              }
            }
          }
          
          middlePosition = {
            lat: targetSegment.endY,  // endY = 위도
            lng: targetSegment.endX   // endX = 경도
          };
        } else {
          // segment가 없는 경우 기본값 사용
          middlePosition = { 
            lat: middlePoint.latitude || 37.5665, 
            lng: middlePoint.longitude || 126.9780 
          };
        }
        
        console.log(`🎯 경로 생성 시 중간지점 좌표 (친구 ${friendIndex + 1}):`, {
          middlePosition: middlePosition,
          lastSegmentEnd: middlePoint.segments && middlePoint.segments.length > 0 ? {
            endX: middlePoint.segments[middlePoint.segments.length - 1].endX,
            endY: middlePoint.segments[middlePoint.segments.length - 1].endY
          } : null,
          middlePointRaw: {
            latitude: middlePoint.latitude,
            longitude: middlePoint.longitude
          }
        });
        
        // 친구별 색상 (도보 경로용)
        const friendColor = getFriendColor(friendIndex);
        
        // 친구 위치에서 첫 번째 segment 시작점까지의 경로 (도보)
        if (middlePoint.segments.length > 0) {
          const firstSegment = middlePoint.segments[0];
          // 🎯 좌표 순서 수정: startX = lng, startY = lat
          const firstSegmentStart = { lat: firstSegment.startY, lng: firstSegment.startX };
          
          console.log(`🎯 친구 ${friendIndex + 1} 도보 경로 (시작):`, {
            from: friendPosition,
            to: firstSegmentStart,
            segment: {
              startX: firstSegment.startX,
              startY: firstSegment.startY
            }
          });
          
          routes.push({
            from: friendPosition,
            to: firstSegmentStart,
            color: friendColor, // 친구별 색상
            coords: [friendPosition, firstSegmentStart]
          });
        }
        
        // 마지막 segment 끝점에서 중간지점까지의 경로 (도보)
        if (middlePoint.segments.length > 0) {
          const lastSegment = middlePoint.segments[middlePoint.segments.length - 1];
          // 🎯 좌표 순서 수정: endX = lng, endY = lat
          const lastSegmentEnd = { lat: lastSegment.endY, lng: lastSegment.endX };
          
          console.log(`🎯 친구 ${friendIndex + 1} 도보 경로 (끝):`, {
            from: lastSegmentEnd,
            to: middlePosition,
            segment: {
              endX: lastSegment.endX,
              endY: lastSegment.endY
            },
            coordinatesMatch: lastSegmentEnd.lat === middlePosition.lat && 
                             lastSegmentEnd.lng === middlePosition.lng,
            coordinateDifference: {
              latDiff: Math.abs(lastSegmentEnd.lat - middlePosition.lat),
              lngDiff: Math.abs(lastSegmentEnd.lng - middlePosition.lng)
            }
          });
          
          routes.push({
            from: lastSegmentEnd,
            to: middlePosition,
            color: friendColor, // 친구별 색상
            coords: [lastSegmentEnd, middlePosition]
          });
        }
      });
    });
    
    console.log('🎯 생성된 경로들:', routes);
    return routes;
  }, []);


  // 교통수단별 색상 반환
  const getTransportTypeColor = (transportType: string) => {
    switch (transportType) {
      case '버스':
        return '#FF6B6B'; // 빨간색
      case '지하철':
        return '#4A90E2'; // 파란색
      case '도보':
        return '#8B4513'; // 갈색
      case '택시':
        return '#FFD93D'; // 노란색
      default:
        return '#9E9E9E'; // 회색
    }
  };

  // 친구별 색상 반환 (도보 경로용)
  const getFriendColor = (friendIndex: number) => {
    const colors = ['#50C878', '#FFD93D', '#6C5CE7', '#A29BFE', '#FF9F43', '#10AC84'];
    return colors[friendIndex % colors.length];
  };

  // 개별 segment에서 좌표 추출 (순서 정렬)
  const extractSegmentCoordinates = (segment: any) => {
    const coords: { lat: number; lng: number }[] = [];
    
    // segment 시작점 추가 - 🎯 좌표 순서 수정: startX = lng, startY = lat
    if (segment.startX && segment.startY) {
      coords.push({ lat: segment.startY, lng: segment.startX });
    }
    
    // passStops에서 정류장/역 좌표 추출 (index 순서대로 정렬)
    if (segment.passStops && segment.passStops.length > 0) {
      // index 순서대로 정렬
      const sortedStops = segment.passStops.sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
      
      sortedStops.forEach((stop: any) => {
        if (stop.x && stop.y) {
          // 🎯 좌표 순서 수정: x = lng, y = lat
          coords.push({ lat: stop.y, lng: stop.x });
        }
      });
    }
    
    // segment 끝점 추가 (시작점과 다를 경우만)
    if (segment.endX && segment.endY) {
      // 🎯 좌표 순서 수정: endX = lng, endY = lat
      const endCoord = { lat: segment.endY, lng: segment.endX };
      const lastCoord = coords[coords.length - 1];
      if (!lastCoord || lastCoord.lat !== endCoord.lat || lastCoord.lng !== endCoord.lng) {
        coords.push(endCoord);
      }
    }
    
    console.log(`🎯 segment (${segment.trafficTypeName}) 좌표 추출:`, {
      startPoint: coords[0],
      endPoint: coords[coords.length - 1],
      totalCoords: coords.length,
      passStopsCount: segment.passStops?.length || 0,
      rawSegment: {
        startX: segment.startX,
        startY: segment.startY,
        endX: segment.endX,
        endY: segment.endY
      }
    });
    
    return coords;
  };


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
    updateModalState({ showFriends: true });
  }, [updateModalState]);

  const handleScheduleClick = useCallback(() => {
    updateModalState({ showSchedule: true });
  }, [updateModalState]);

  const handleMeetingClick = useCallback(() => {
    updateModalState({ showMeeting: true });
  }, [updateModalState]);

  const handleFindMiddle = useCallback(async (
    friendsData?: Friend[],
    _category?: any,
    _customCategoryText?: string,
    middlePoints?: any[]
  ) => {
    const now = Date.now();
    
    if (now - lastFindMiddleTimeRef.current < 200) {
      return;
    }
    
    if (isFindingMiddleRef.current) {
      return;
    }
    
    lastFindMiddleTimeRef.current = now;
    isFindingMiddleRef.current = true;
    
    try {
      if (friendsData) {
        setFriends(friendsData);
      }
      
      updateUiState({ showHomeContent: false });
      // 카드가 표시되면 맵 상호작용 활성화
      enableMapInteraction();
      
      // 백엔드에서 받은 중간지점 데이터가 있으면 사용, 없으면 기본 역 카드 사용
      if (middlePoints && middlePoints.length > 0) {
        console.log('🎯 백엔드에서 받은 중간지점 데이터로 카드 생성:', middlePoints);
        console.log('🎯 중간지점 개수:', middlePoints.length);
        
        // 중간지점 데이터 저장 (뒤로가기용)
        setOriginalMiddlePoints(middlePoints);
        
        // 백엔드 데이터를 카드 형태로 변환
        const middlePointCards = middlePoints.map((point, index) => ({
          id: point.id || index + 1,
          title: point.lastEndStation || `중간지점 ${index + 1}`,
          duration: `${point.totalTravelTime || 0}분 (${point.transportType || '대중교통'})`,
          type: 'station' as const
        }));
        
        console.log('🎯 생성된 카드들:', middlePointCards);
        setCards(middlePointCards);
        updateUiState({ currentView: 'stations' });
        
        // 중간지점 마커 생성 (마지막 segment의 endX, endY 좌표 사용)
        const middlePointMarkers = middlePoints.map((point, index) => {
          console.log(`🎯 중간지점 ${index + 1} 원본 데이터:`, {
            point: point,
            hasSegments: !!(point.segments && point.segments.length > 0),
            segmentsLength: point.segments?.length || 0,
            latitude: point.latitude,
            longitude: point.longitude
          });
          
          // 🎯 마지막 segment의 endX, endY 좌표 사용 (도보 제외)
          let markerPosition;
          if (point.segments && point.segments.length > 0) {
            // 🎯 마지막 segment가 도보(trafficType: 3)인 경우, 도보가 아닌 마지막 segment 찾기
            let targetSegment = point.segments[point.segments.length - 1];
            
            // 마지막 segment가 도보인 경우, 도보가 아닌 마지막 segment 찾기
            if (targetSegment.trafficType === 3) {
              console.log(`🎯 중간지점 ${index + 1}: 마지막 segment가 도보입니다. 도보가 아닌 마지막 segment를 찾습니다.`);
              for (let i = point.segments.length - 1; i >= 0; i--) {
                if (point.segments[i].trafficType !== 3) {
                  targetSegment = point.segments[i];
                  console.log(`🎯 중간지점 ${index + 1}: 도보가 아닌 마지막 segment 발견 (index: ${i}):`, targetSegment);
                  break;
                }
              }
            }
            
            markerPosition = {
              lat: targetSegment.endY,  // endY = 위도
              lng: targetSegment.endX   // endX = 경도
            };
            console.log(`🎯 중간지점 ${index + 1} segment 좌표 사용:`, {
              targetSegment: targetSegment,
              markerPosition: markerPosition
            });
          } else {
            // segment가 없는 경우 기본 좌표 사용
            console.log(`🎯 중간지점 ${index + 1} 기본 좌표 사용:`, {
              latitude: point.latitude,
              longitude: point.longitude,
              latitudeType: typeof point.latitude,
              longitudeType: typeof point.longitude
            });
            
            if (!point.latitude || !point.longitude || 
                typeof point.latitude !== 'number' || 
                typeof point.longitude !== 'number' ||
                point.latitude === 0 || point.longitude === 0) {
              console.warn(`⚠️ 중간지점 ${index + 1}의 좌표가 유효하지 않습니다:`, {
                latitude: point.latitude,
                longitude: point.longitude
              });
              return null;
            }
            markerPosition = { 
              lat: point.latitude, 
              lng: point.longitude 
            };
          }
          
          console.log(`🎯 중간지점 ${index + 1} 마커 좌표:`, {
            markerPosition: markerPosition,
            lastSegmentEnd: point.segments && point.segments.length > 0 ? {
              endX: point.segments[point.segments.length - 1].endX,
              endY: point.segments[point.segments.length - 1].endY
            } : null,
            originalCoordinates: {
              lat: point.latitude,
              lng: point.longitude
            }
          });
          
          return {
            id: `middle-${point.id || index + 1}`,
            position: markerPosition,
            title: point.lastEndStation || `중간지점 ${index + 1}`,
            type: 'station' as const,
            isVisible: true,
            isHighlighted: false
          };
        }).filter(marker => marker !== null) as MapMarker[];
        
        // 🎯 친구 데이터가 전달되었으면 사용, 아니면 기존 friends 상태 사용
        const currentFriends = friendsData || friends;
        const friendMarkers = convertFriendsToMarkers(currentFriends);
        const allMarkers = [...friendMarkers, ...middlePointMarkers];
        
        // 🎯 segments 데이터를 이용해 실제 경로 생성
        const routesFromSegments = generateRoutesFromSegments(middlePoints, currentFriends);
        
        // 맵 중심을 중간지점들로 설정
        let mapCenter = mapState.center;
        if (middlePointMarkers.length > 0) {
          const centerLat = middlePointMarkers.reduce((sum, marker) => sum + marker.position.lat, 0) / middlePointMarkers.length;
          const centerLng = middlePointMarkers.reduce((sum, marker) => sum + marker.position.lng, 0) / middlePointMarkers.length;
          mapCenter = { lat: centerLat, lng: centerLng };
        }
        
        // 🎯 모든 맵 상태를 한 번에 업데이트 (렌더링 최적화!)
        updateMapState({
          markers: allMarkers,
          routes: routesFromSegments,
          center: mapCenter
        });
        
        // 🎯 카드 리스트 표시 (맵 렌더링을 위해 필수!)
        console.log('🎯 중간지점 조회 완료 - 카드 리스트 표시:', {
          middlePointMarkersCount: middlePointMarkers.length,
          friendMarkersCount: friendMarkers.length,
          allMarkersCount: allMarkers.length,
          routesCount: routesFromSegments.length
        });
        updateUiState({ showCardList: true });
      } else {
        // 기본 역 카드 사용
        const stationCards = generateStationCards();
        setCards(stationCards);
        updateUiState({ currentView: 'stations' });
        
        const allStations = getAllStations();
        const stationMarkers = allStations.map(station => ({
          id: `station-${station.id}`,
          position: { lat: station.lat, lng: station.lng },
          title: station.name,
          type: 'station' as const,
          isVisible: true,
          isHighlighted: false
        }));
        
        // 🎯 친구 데이터가 전달되었으면 사용, 아니면 기존 friends 상태 사용
        const currentFriends = friendsData || friends;
        const friendMarkers = convertFriendsToMarkers(currentFriends);
        const allMarkers = [...friendMarkers, ...stationMarkers];
        
        // 맵 중심을 역들과 친구들의 중앙으로 설정
        const allPoints = [
          ...allStations.map(station => ({ lat: station.lat, lng: station.lng })),
          ...friendMarkers.map(marker => marker.position)
        ];
        
        let mapCenter = mapState.center;
        if (allPoints.length > 0) {
          const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
          const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
          mapCenter = { lat: centerLat, lng: centerLng };
        }
        
        // 🎯 모든 맵 상태를 한 번에 업데이트 (렌더링 최적화!)
        updateMapState({
          markers: allMarkers,
          routes: [],
          center: mapCenter
        });
      }
      
      // 🎯 UI 상태 초기화
      updateUiState({
        selectedStationId: null,
        showCardList: true
      });
    } catch (error) {
      console.error('중간거리 찾기 중 오류 발생:', error);
      showToast('중간거리 찾기 중 오류가 발생했습니다.', 'error');
    } finally {
      isFindingMiddleRef.current = false;
    }
  }, [generateStationCards, convertFriendsToMarkers, showToast, enableMapInteraction, updateUiState, updateMapState, mapState.center]);

  const handleHideCards = useCallback(() => {
    // 🎯 UI 상태 초기화
    updateUiState({
      showCardList: false,
      currentView: 'stations',
      selectedStationId: null
    });
    
    // 중간지점 데이터 초기화
    setOriginalMiddlePoints([]);
    
    if ((window as any).resetMiddlePlaceCardSelection) {
      (window as any).resetMiddlePlaceCardSelection();
    }
    
    // 🎯 카드가 숨겨지면 맵 상호작용 비활성화 (초기 상태로 복원)
    disableMapInteraction();
    
    // 🎯 맵 상태 초기화
    updateMapState({
      markers: [],
      routes: []
    });
  }, [disableMapInteraction, updateUiState, updateMapState]);

  const handleCardClick = useCallback(async (cardId: number) => {
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
    
    // 전역으로 등록하여 TransportInfoModal에서 접근 가능하도록 함
    (window as any).handleCardClick = handleCardClick;
    
    const clickedCard = cards.find(card => card.id === cardId);
    if (!clickedCard) return;

    if (uiState.currentView === 'stations') {
      if (clickedCard.type === 'station') {
        // 중간지점 카드인지 확인 (originalMiddlePoints에 있는지 체크)
        const isMiddlePointCard = originalMiddlePoints.length > 0 && 
          originalMiddlePoints.some(point => (point.id || originalMiddlePoints.indexOf(point) + 1) === clickedCard.id);
        
        if (isMiddlePointCard) {
          // 🎯 중간지점 카드 클릭 시 백엔드 데이터 저장 - 더 정확한 매칭
          const middlePointData = originalMiddlePoints.find(point => {
            const pointId = point.id || (originalMiddlePoints.indexOf(point) + 1);
            return pointId === clickedCard.id;
          });
          
          console.log('🎯 중간지점 카드 클릭 검증:', {
            clickedCardId: clickedCard.id,
            clickedCardTitle: clickedCard.title,
            originalMiddlePointsCount: originalMiddlePoints.length,
            middlePointData: middlePointData,
            allMiddlePointIds: originalMiddlePoints.map((point, index) => ({
              index: index,
              id: point.id || (index + 1),
              title: point.lastEndStation || `중간지점 ${index + 1}`
            }))
          });
          
          if (middlePointData) {
            console.log('🎯 중간지점 카드 클릭됨:', middlePointData);
            updateModalState({ selectedMiddlePointData: middlePointData });
            
            // 🎯 사용자 위치에서 중간지점까지의 경로만 생성 (모든 친구 경로 제거)
            console.log('🎯 경로 생성 전 middlePointData 검증:', {
              middlePointData: middlePointData,
              coordinates: {
                lat: middlePointData.latitude,
                lng: middlePointData.longitude
              }
            });
            
            // 🎯 모든 사용자(1번, 2번, 3번...)에서 중간지점까지의 경로 생성
            const allUsersToMiddleRoute = generateAllUsersToMiddleRoute(middlePointData);
            updateMapState({ routes: allUsersToMiddleRoute });
            
            // 🎯 모든 사용자 마커와 중간지점 마커 표시
            const allUserMarkers = friends.map((friend, index) => {
              if (!friend.coordinates || 
                  typeof friend.coordinates.lat !== 'number' || 
                  typeof friend.coordinates.lng !== 'number' ||
                  friend.coordinates.lat === 0 || friend.coordinates.lng === 0) {
                return null;
              }
              
              return {
                id: `user-${friend.id}`,
                position: friend.coordinates,
                title: `⭐ 사용자 ${index + 1}: ${friend.location || '위치 미입력'}`,
                type: 'friend' as const,
                isVisible: true,
                isHighlighted: false
              };
            }).filter(marker => marker !== null) as MapMarker[];
            
            // 좌표 데이터 검증
            if (!middlePointData.latitude || !middlePointData.longitude || 
                typeof middlePointData.latitude !== 'number' || 
                typeof middlePointData.longitude !== 'number' ||
                middlePointData.latitude === 0 || middlePointData.longitude === 0) {
              console.warn(`⚠️ 선택된 중간지점의 좌표가 유효하지 않습니다:`, {
                latitude: middlePointData.latitude,
                longitude: middlePointData.longitude
              });
              return;
            }
            
            // 🎯 중간지점 마커 ID 생성 - middlePointData의 실제 ID 사용
            const middlePointIndex = originalMiddlePoints.findIndex(point => {
              const pointId = point.id || (originalMiddlePoints.indexOf(point) + 1);
              return pointId === clickedCard.id;
            });
            const actualMiddlePointId = middlePointData.id || (middlePointIndex + 1);
            
            // 🎯 마커 좌표 설정 - 마지막 segment의 endX, endY 값 사용
            console.log('🎯 중간지점 카드 클릭 - 원본 데이터:', {
              middlePointData: middlePointData,
              hasSegments: !!(middlePointData.segments && middlePointData.segments.length > 0),
              segmentsLength: middlePointData.segments?.length || 0,
              latitude: middlePointData.latitude,
              longitude: middlePointData.longitude
            });
            
            let markerPosition;
            if (middlePointData.segments && middlePointData.segments.length > 0) {
              console.log('🎯 중간지점 카드 클릭 - segments 전체 데이터:', middlePointData.segments);
              
              // 🎯 마지막 segment가 도보(trafficType: 3)인 경우, 도보가 아닌 마지막 segment 찾기
              let targetSegment = middlePointData.segments[middlePointData.segments.length - 1];
              
              // 마지막 segment가 도보인 경우, 도보가 아닌 마지막 segment 찾기
              if (targetSegment.trafficType === 3) {
                console.log('🎯 마지막 segment가 도보입니다. 도보가 아닌 마지막 segment를 찾습니다.');
                for (let i = middlePointData.segments.length - 1; i >= 0; i--) {
                  if (middlePointData.segments[i].trafficType !== 3) {
                    targetSegment = middlePointData.segments[i];
                    console.log(`🎯 도보가 아닌 마지막 segment 발견 (index: ${i}):`, targetSegment);
                    break;
                  }
                }
              }
              
              console.log('🎯 중간지점 카드 클릭 - 최종 선택된 segment:', targetSegment);
              
              markerPosition = {
                lat: targetSegment.endY,  // endY = 위도
                lng: targetSegment.endX   // endX = 경도
              };
              console.log('🎯 중간지점 카드 클릭 - segment 좌표 사용:', {
                targetSegment: targetSegment,
                markerPosition: markerPosition,
                endX: targetSegment.endX,
                endY: targetSegment.endY,
                endXType: typeof targetSegment.endX,
                endYType: typeof targetSegment.endY
              });
            } else {
              // segment가 없는 경우 기본값 사용
              console.log('🎯 중간지점 카드 클릭 - 기본 좌표 사용:', {
                latitude: middlePointData.latitude,
                longitude: middlePointData.longitude,
                latitudeType: typeof middlePointData.latitude,
                longitudeType: typeof middlePointData.longitude
              });
              markerPosition = {
                lat: middlePointData.latitude || 37.5665,
                lng: middlePointData.longitude || 126.9780
              };
            }
            
            console.log('🎯 마커 좌표 설정:', {
              markerPosition: markerPosition,
              lastSegmentEnd: middlePointData.segments && middlePointData.segments.length > 0 ? {
                endX: middlePointData.segments[middlePointData.segments.length - 1].endX,
                endY: middlePointData.segments[middlePointData.segments.length - 1].endY
              } : null,
              middlePointDataCoordinates: {
                lat: middlePointData.latitude,
                lng: middlePointData.longitude
              }
            });
            
            const middlePointMarker = {
              id: `middle-${actualMiddlePointId}`,
              position: markerPosition,
              title: middlePointData.lastEndStation || `중간지점 ${actualMiddlePointId}`,
              type: 'station' as const,
              isVisible: true,
              isHighlighted: true // 선택된 중간지점 강조
            };
            
            console.log('🎯 중간지점 마커 생성:', {
              clickedCardId: clickedCard.id,
              middlePointDataId: middlePointData.id,
              actualMiddlePointId: actualMiddlePointId,
              middlePointIndex: middlePointIndex,
              markerId: middlePointMarker.id,
              position: middlePointMarker.position,
              title: middlePointMarker.title
            });
            
            // 🎯 모든 사용자 마커와 중간지점 마커 포함
            const allMarkers = [...allUserMarkers, middlePointMarker];
            
            // 🎯 모든 상태를 한 번에 업데이트 (렌더링 최적화!)
            updateMapState({
              markers: allMarkers,
              center: middlePointMarker.position, // 중간지점을 중심으로 설정
              level: 4 // 더 가까운 줌 레벨로 설정
            });
            
            // 중간지점 정보로 TransportInfoModal 설정
            updateModalState({
              selectedStationInfo: {
                name: middlePointData.lastEndStation || `중간지점 ${actualMiddlePointId}`,
                position: markerPosition
              },
              showTransport: true
            });
            
            // 처리 완료 후 상태 리셋
            (handleCardClick as any).isProcessing = false;
            return;
          }
        }
        
        // 기본 역 카드 클릭 시 기존 로직
        const station = getStationById(clickedCard.id);
        if (station) {
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
            from: { lat: friend.coordinates?.lat || 37.5663, lng: friend.coordinates?.lng || 126.9779 },
            to: { lat: station.lat, lng: station.lng },
            color: '#4A90E2' // 파란색 (대중교통 경로)
          }));
          
          const allPoints = [
            ...friendMarkers.map(marker => marker.position),
            stationMarker.position
          ];
          
          // 맵 중심 계산
          let mapCenter = mapState.center;
          if (allPoints.length > 0) {
            const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
            const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
            mapCenter = { lat: centerLat, lng: centerLng };
          }
          
          // 🎯 모든 상태를 한 번에 업데이트 (렌더링 최적화!)
          updateUiState({
            selectedStationId: station.id,
            currentView: 'places'
          });
          
          updateMapState({
            markers: allMarkers,
            routes: friendRoutes,
            center: mapCenter,
            level: 6
          });
          
          updateModalState({
            selectedStationInfo: {
              name: station.name,
              position: { lat: station.lat, lng: station.lng }
            },
            showTransport: true
          });
          
          // 추천 장소 카드로 변경
          const placeCards = await generatePlaceCards(clickedCard.id);
          setCards(placeCards);
          
          // 맵 상호작용 활성화
          enableMapInteraction();
        }
      }
    } else {
      if (clickedCard.type === 'back') {
        // 원래 중간지점 데이터가 있으면 그것을 사용, 없으면 기본 역 카드 사용
        if (originalMiddlePoints.length > 0) {
          console.log('🎯 뒤로가기: 원래 중간지점 카드로 복원');
          const middlePointCards = originalMiddlePoints.map((point, index) => ({
            id: point.id || index + 1,
            title: point.lastEndStation || `중간지점 ${index + 1}`,
            duration: `${point.totalTravelTime || 0}분 (${point.transportType || '대중교통'})`,
            type: 'station' as const
          }));
          setCards(middlePointCards);
        } else {
          console.log('🎯 뒤로가기: 기본 역 카드로 복원');
          const stationCards = generateStationCards();
          setCards(stationCards);
        }
        updateUiState({
          currentView: 'stations',
          selectedStationId: null
        });
        
        // 원래 중간지점 데이터가 있으면 중간지점 마커로 복원, 없으면 기본 역 마커 사용
        if (originalMiddlePoints.length > 0) {
          // 중간지점 마커 복원 (마지막 segment의 endX, endY 좌표 사용, 도보 제외)
          const middlePointMarkers = originalMiddlePoints.map((point, index) => {
            // 🎯 마지막 segment의 endX, endY 좌표 사용 (도보 제외)
            let markerPosition;
            if (point.segments && point.segments.length > 0) {
              // 🎯 마지막 segment가 도보(trafficType: 3)인 경우, 도보가 아닌 마지막 segment 찾기
              let targetSegment = point.segments[point.segments.length - 1];
              
              // 마지막 segment가 도보인 경우, 도보가 아닌 마지막 segment 찾기
              if (targetSegment.trafficType === 3) {
                for (let i = point.segments.length - 1; i >= 0; i--) {
                  if (point.segments[i].trafficType !== 3) {
                    targetSegment = point.segments[i];
                    break;
                  }
                }
              }
              
              markerPosition = {
                lat: targetSegment.endY,  // endY = 위도
                lng: targetSegment.endX   // endX = 경도
              };
            } else {
              // segment가 없는 경우 기본 좌표 사용
              if (!point.latitude || !point.longitude || 
                  typeof point.latitude !== 'number' || 
                  typeof point.longitude !== 'number' ||
                  point.latitude === 0 || point.longitude === 0) {
                console.warn(`⚠️ 복원할 중간지점 ${index + 1}의 좌표가 유효하지 않습니다:`, {
                  latitude: point.latitude,
                  longitude: point.longitude
                });
                return null;
              }
              markerPosition = { 
                lat: point.latitude, 
                lng: point.longitude 
              };
            }
            
            return {
              id: `middle-${point.id || index + 1}`,
              position: markerPosition,
              title: point.lastEndStation || `중간지점 ${index + 1}`,
              type: 'station' as const,
              isVisible: true,
              isHighlighted: false
            };
          }).filter(marker => marker !== null) as MapMarker[];
          
          const friendMarkers = convertFriendsToMarkers(friends);
          const allMarkers = [...friendMarkers, ...middlePointMarkers];
          
          // 맵 중심을 중간지점들로 설정
          if (middlePointMarkers.length > 0) {
            const centerLat = middlePointMarkers.reduce((sum, marker) => sum + marker.position.lat, 0) / middlePointMarkers.length;
            const centerLng = middlePointMarkers.reduce((sum, marker) => sum + marker.position.lng, 0) / middlePointMarkers.length;
            
            updateMapState({
              markers: allMarkers,
              routes: [],
              center: { lat: centerLat, lng: centerLng }
            });
            enableMapInteraction();
          }
        } else {
          // 기본 역 마커 사용
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
          
          let mapCenter = mapState.center;
          if (allPoints.length > 0) {
            const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
            const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
            mapCenter = { lat: centerLat, lng: centerLng };
          }
          
          updateMapState({
            markers: allMarkers,
            routes: [],
            center: mapCenter,
            level: 7
          });
          enableMapInteraction();
        }
      } else if (clickedCard.type === 'place') {
        if (null === clickedCard.id) { // 🎯 selectedCardId 제거됨
          // 🎯 이미 선택된 장소를 다시 클릭하면 원상복귀 (친구들에서 역으로의 경로 복원)
          
          // 친구들과 역, 모든 장소 마커를 다시 표시
          const currentStation = getStationById(uiState.selectedStationId || 0);
          if (currentStation) {
            const places = await getPlacesByStationId(currentStation.id);
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
            
            // 친구들에서 역으로의 경로 복원
            const friendRoutes = friends.map(friend => ({
              from: { lat: friend.coordinates?.lat || 37.5663, lng: friend.coordinates?.lng || 126.9779 },
              to: { lat: currentStation.lat, lng: currentStation.lng },
              color: '#4A90E2'
            }));
            
            // 맵 중심을 친구들과 역의 중앙으로 복원
            const allPoints = [
              ...friendMarkers.map(marker => marker.position),
              stationMarker.position
            ];
            
            let mapCenter = mapState.center;
            if (allPoints.length > 0) {
              const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
              const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
              mapCenter = { lat: centerLat, lng: centerLng };
            }
            
            updateMapState({
              markers: allMarkers,
              routes: friendRoutes,
              center: mapCenter,
              level: 6
            });
            enableMapInteraction();
          }
        } else {
          // 🎯 새로운 장소 선택 시: 역과 해당 장소 간의 경로만 표시
          const places = await getPlacesByStationId(uiState.selectedStationId || 0);
          const selectedPlace = places.find(place => place.id === clickedCard.id);
          if (selectedPlace) {
            const currentStation = getStationById(uiState.selectedStationId || 0);
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
              
              // 🎯 역과 추천 장소만 표시하도록 수정
              const routePoints = [
                stationMarker.position,
                selectedPlaceMarker.position
              ];
              
              const centerLat = routePoints.reduce((sum, point) => sum + point.lat, 0) / routePoints.length;
              const centerLng = routePoints.reduce((sum, point) => sum + point.lng, 0) / routePoints.length;
              
              const stationToPlaceRoute = {
                from: { lat: currentStation.lat, lng: currentStation.lng },
                to: { lat: selectedPlace.lat, lng: selectedPlace.lng },
                color: '#FF6B6B'
              };
              
              // 🎯 모든 상태를 한 번에 업데이트 (렌더링 최적화!)
              updateMapState({
                markers: [stationMarker, selectedPlaceMarker], // 🎯 친구 마커 제거
                routes: [stationToPlaceRoute], // 🎯 친구 경로 제거
                center: { lat: centerLat, lng: centerLng },
                level: 1 // 🎯 줌 레벨을 1로 변경 (더 가깝게)
              });
              
              updateModalState({
                selectedStationInfo: {
                  name: `${currentStation.name} → ${selectedPlace.title}`,
                  position: { lat: currentStation.lat, lng: currentStation.lng },
                  placePosition: { lat: selectedPlace.lat, lng: selectedPlace.lng },
                  placeInfo: {
                    title: selectedPlace.title,
                    category: selectedPlace.category,
                    description: `${selectedPlace.title}는 ${selectedPlace.category} 카테고리의 장소입니다.`,
                    duration: selectedPlace.duration
                  }
                },
                showTransport: true
              });
              
              enableMapInteraction();
            }
          }
        }
      }
    }
    
    // 처리 완료 후 상태 리셋
    (handleCardClick as any).isProcessing = false;
  }, [cards, uiState.currentView, uiState.selectedStationId, friends, convertFriendsToMarkers, generatePlaceCards, generateStationCards, enableMapInteraction, updateUiState, updateMapState, updateModalState, mapState.center]);

  // Effects
  // 🗑️ 제거: 이스터 에그 useEffect (불필요한 기능)
  // useEffect(() => {
  //   if (mapCenter.lat === 37.6447 && mapCenter.lng === 127.1053) {
  //     setShowEasterEgg(true);
  //     setTimeout(() => setShowEasterEgg(false), 5000);
  //   }
  // }, [mapCenter]);

  useEffect(() => {
    if (uiState.showHomeContent) {
      const timer = setTimeout(() => {
        // 🎯 단순화: 페이드아웃 상태 없이 바로 숨김
        updateUiState({ showHomeContent: false });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [uiState.showHomeContent, updateUiState]);

  useEffect(() => {
    if (friends.length > 0 && !uiState.showCardList) {
      const friendMarkers = friends.map(friend => ({
        id: `friend-${friend.id}`,
        position: friend.coordinates || { lat: 37.5663, lng: 126.9779 },
        title: `${friend.name}: ${friend.location || '위치 미입력'}`,
        type: 'friend' as const,
        isHighlighted: false,
        isVisible: true
      }));
      
      updateMapState({ markers: friendMarkers });
    }
  }, [friends, uiState.showCardList, updateMapState]);

  // 🎯 약속 추가 관련 함수들
  const handleAddSchedule = (data: any) => {
    console.log('🎯 handleAddSchedule 호출됨:', data);
    
    // 바로 일정에 추가
    const newSchedule = {
      id: Date.now(),
      title: data.placeInfo.title,
      date: new Date().toISOString().split('T')[0],
      time: data.meetingTime,
      location: `${data.stationName}역 → ${data.placeInfo.title}`,
      description: data.placeInfo.description || `${data.placeInfo.title}에서 만남`,
      type: 'social' as const,
      participants: data.friends.map((f: any) => f.name),
      placeInfo: data.placeInfo,
      stationName: data.stationName,
      routes: data.routes
    };
    
    console.log('🎯 일정 추가 중:', newSchedule);
    setSchedules(prev => {
      const updatedSchedules = [...prev, newSchedule];
      console.log('🎯 업데이트된 일정 목록:', updatedSchedules);
      return updatedSchedules;
    });
    
    // ScheduleConfirmModal도 열기
    updateModalState({
      scheduleData: data,
      showScheduleConfirm: true
    });
  };

  const handleSendInvitation = () => {
    // TODO: 초대장 보내기 로직 구현
    showToast('초대장이 발송되었습니다!', 'success');
    updateModalState({ showScheduleConfirm: false });
  };

  const handleGoToSchedule = () => {
    // 플로팅 네비바의 일정 관리 페이지 열기
    updateModalState({
      showScheduleConfirm: false,
      showSchedule: true,
      showTransport: false
    });
  };

  // 일정 관리 핸들러
  const handleAddScheduleToCalendar = (schedule: any) => {
    const newSchedule = {
      id: Date.now(),
      title: schedule.placeInfo.title,
      date: new Date().toISOString().split('T')[0],
      time: schedule.meetingTime,
      location: `${schedule.stationName}역 → ${schedule.placeInfo.title}`,
      description: schedule.placeInfo.description || `${schedule.placeInfo.title}에서 만남`,
      type: 'social' as const,
      participants: schedule.friends.map((f: any) => f.name),
      placeInfo: schedule.placeInfo,
      stationName: schedule.stationName,
      routes: schedule.routes
    };
    
    setSchedules(prev => [...prev, newSchedule]);
    showToast('일정이 추가되었습니다!', 'success');
  };

  const handleRemoveSchedule = useCallback((id: number) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
    showToast('일정이 삭제되었습니다.', 'success');
  }, [showToast]);



  const handleCloseScheduleConfirmModal = useCallback(() => {
    // 약속 추가 확인 모달을 닫고 TransportInfoModal을 다시 열기
    updateModalState({ 
      showScheduleConfirm: false,
      showTransport: true 
    });
  }, [updateModalState]);

  // 교통정보 모달 닫기 핸들러
  const handleCloseTransportModal = useCallback(() => {
    updateModalState({ 
      showTransport: false,
      selectedMiddlePointData: null 
    });
    
    // 중복 클릭 방지 상태 리셋
    if ((handleCardClick as any).isProcessing) {
      (handleCardClick as any).isProcessing = false;
      console.log('교통정보 모달 닫기: 처리 중 상태 리셋됨');
    }
  }, [updateModalState]);



  return {
    // ===== 🎯 통합된 상태 객체들 =====
    uiState,
    mapState,
    modalState,
    
    // ===== 🎯 개별 상태들 =====
    friends,
    originalMiddlePoints,
    schedules,
    cards,
    toast,
    
    // ===== 🎯 디바운싱 함수들 =====
    setMapCenterDebounced,
    setMapLevelDebounced,
    
    // ===== 🎯 상태 업데이트 함수들 =====
    updateUiState,
    updateMapState,
    updateModalState,
    setFriends,
    setOriginalMiddlePoints,
    setSchedules,
    setCards,
    setToast,
    
    // ===== 🎯 핸들러들 =====
    showToast,
    hideToast,
    handleFriendClick,
    handleScheduleClick,
    handleMeetingClick,
    handleFindMiddle,
    handleHideCards,
    handleCardClick,
    handleAddSchedule,
    handleSendInvitation,
    handleGoToSchedule,
    handleCloseScheduleConfirmModal,
    handleCloseTransportModal,
    handleAddScheduleToCalendar,
    handleRemoveSchedule,
    
    // ===== 🎯 맵 상호작용 제어 =====
    enableMapInteraction,
    disableMapInteraction,
    
    // ===== 🎯 유틸리티 =====
    generateStationCards,
    generatePlaceCards,
    convertFriendsToMarkers,
    generateAllUsersToMiddleRoute
  };
};
