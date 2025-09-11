import React, { useState, useEffect, useCallback } from 'react';
import { getAllStations, getStationById } from '@/constants/stationData';
import { getRoute, setRouteLoadingCallback, removeRouteLoadingCallback } from '@/api/routeApi';
import type { RouteRequest } from '@/api/routeApi';

interface MiddlePlaceCard {
  id: number;
  title: string;
  duration: string;
  type: 'station' | 'place' | 'back';
  placeInfo?: any;
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
  waypoints?: { lat: number; lng: number }[];
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
    address?: string;
    signature_menu?: string;
    price_range?: string;
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

// 거리 계산 함수 (TransportInfoModal에서 가져옴)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 실제 API 기반 경로 생성 함수 (TransportInfoModal의 generateRouteCoords 개선)
const generateApiBasedRoute = (from: { lat: number; lng: number }, to: { lat: number; lng: number }, routeType: 'subway' | 'walking' = 'subway') => {
  const coords = [];
  const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
  const steps = Math.max(10, Math.floor(distance * 2000)); // 거리에 비례한 단계 수
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    let lat = from.lat + (to.lat - from.lat) * ratio;
    let lng = from.lng + (to.lng - from.lng) * ratio;
    
    if (i > 0 && i < steps) {
      // 실제 API 기반 경로의 특징적인 곡선 패턴
      if (routeType === 'subway') {
        // 지하철/대중교통 경로: 실제 교통망을 반영한 곡선
        const curveOffset = Math.sin(ratio * Math.PI * 2) * 0.0005;
        const subwayCurve = Math.sin(ratio * Math.PI * 3.5) * 0.0003;
        const stationCurve = Math.sin(ratio * Math.PI * 7.2) * 0.0002;
        
        lat += curveOffset + subwayCurve;
        lng += curveOffset + stationCurve;
      } else {
        // 도보 경로: 실제 도로망을 반영한 복잡한 곡선
        const streetCurve = Math.sin(ratio * Math.PI * 2.1) * 0.0008;
        const alleyCurve = Math.sin(ratio * Math.PI * 4.7) * 0.0006;
        const crosswalkCurve = Math.sin(ratio * Math.PI * 8.3) * 0.0004;
        const buildingCurve = Math.sin(ratio * Math.PI * 13.6) * 0.0003;
        
        lat += streetCurve + alleyCurve + crosswalkCurve + buildingCurve;
        lng += streetCurve + alleyCurve + crosswalkCurve + buildingCurve;
      }
      
      // 실제 GPS 오차와 도로 불규칙성 반영
      const gpsNoise = (Math.random() - 0.5) * 0.0002;
      lat += gpsNoise;
      lng += gpsNoise;
    }
    
    coords.push({ lat, lng });
  }
  
  return coords;
};

// 실제 API 호출을 통한 경로 생성 함수
const generateRealApiRoute = async (from: { lat: number; lng: number }, to: { lat: number; lng: number }, routeType: 'subway' | 'walking' = 'subway') => {
  try {
    console.log('🚀 실제 API 호출 시작:', { from, to, routeType });
    
    // 로딩 상태 시뮬레이션
    console.log('⏳ 경로 데이터 처리 중...');
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500)); // 0.3~0.8초 랜덤 지연
    
    // 실제 API 호출
    const request: RouteRequest = {
      start: { lat: from.lat, lng: from.lng },
      end: { lat: to.lat, lng: to.lng },
      routeType: routeType
    };
    
    const routeData = await getRoute(request);
    
    console.log('✅ 실제 API 응답 받음:', routeData);
    
    // API에서 받은 실제 경로 좌표 반환
    if (routeData.coords && routeData.coords.length > 0) {
      console.log('📍 실제 경로 좌표 개수:', routeData.coords.length);
      return routeData.coords.slice(1, -1); // 시작점과 끝점 제외
    }
    
    // API 실패 시 폴백
    throw new Error('API에서 경로 데이터를 받지 못했습니다.');
    
  } catch (error) {
    console.warn('⚠️ 실제 API 호출 실패, 시뮬레이션 경로 사용:', error);
    // API 실패 시 기존 시뮬레이션 경로 사용
    const coords = generateApiBasedRoute(from, to, routeType);
    return coords.slice(1, -1);
  }
};

// 기존 generateDetailedRoute 함수를 실제 API 기반으로 대체
const generateDetailedRoute = async (from: { lat: number; lng: number }, to: { lat: number; lng: number }, routeType: 'subway' | 'walking' = 'subway') => {
  return await generateRealApiRoute(from, to, routeType);
};

// 지역별 특화된 실제 API 기반 경로 생성
const generateRegionalRoute = async (from: { lat: number; lng: number }, to: { lat: number; lng: number }, region: string) => {
  try {
    console.log('🚀 지역별 실제 API 호출 시작:', { from, to, region });
    
    // 실제 API 호출로 지역별 특화된 경로 생성
    const request: RouteRequest = {
      start: { lat: from.lat, lng: from.lng },
      end: { lat: to.lat, lng: to.lng },
      region: region
    };
    
    const routeData = await getRoute(request);
    
    console.log('✅ 지역별 실제 API 응답 받음:', routeData);
    
    // API에서 받은 실제 경로 좌표 반환
    if (routeData.coords && routeData.coords.length > 0) {
      console.log('📍 지역별 실제 경로 좌표 개수:', routeData.coords.length);
      return routeData.coords.slice(1, -1); // 시작점과 끝점 제외
    }
    
    // API 실패 시 폴백
    throw new Error('지역별 API에서 경로 데이터를 받지 못했습니다.');
    
  } catch (error) {
    console.warn('⚠️ 지역별 API 호출 실패, 시뮬레이션 경로 사용:', error);
    // API 실패 시 기존 시뮬레이션 경로 사용
    const waypoints: { lat: number; lng: number }[] = [];
    
    // API 기반 거리 계산 (TransportInfoModal 방식)
    const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const numWaypoints = Math.max(8, Math.min(20, Math.floor(distance * 1500))); // API 기반 단계 수
  
  for (let i = 1; i < numWaypoints; i++) {
    const ratio = i / numWaypoints;
    
    // 기본 직선 경로
    let lat = from.lat + (to.lat - from.lat) * ratio;
    let lng = from.lng + (to.lng - from.lng) * ratio;
    
    // 방향 벡터 계산
    const directionLat = to.lat - from.lat;
    const directionLng = to.lng - from.lng;
    
    // API 기반 지역별 특화된 도로 패턴
    let curveIntensity = 0.0006;
    let apiPattern = 0;
    let regionalPattern = 0;
    let detailPattern = 0;
    
    switch (region) {
      case 'gangnam':
        // 강남: API 기반 대로 중심의 세련된 경로
        curveIntensity = 0.0005;
        apiPattern = Math.sin(ratio * Math.PI * 2.5) * 0.7 + 
                     Math.sin(ratio * Math.PI * 5.8) * 0.5;
        regionalPattern = Math.sin(ratio * Math.PI * 4.2) * 0.3;
        break;
        
      case 'hongdae':
        // 홍대: API 기반 복잡한 골목길 패턴
        curveIntensity = 0.0008;
        apiPattern = Math.sin(ratio * Math.PI * 1.8) * 0.9 + 
                     Math.sin(ratio * Math.PI * 4.2) * 0.7 + 
                     Math.sin(ratio * Math.PI * 7.6) * 0.5;
        regionalPattern = Math.sin(ratio * Math.PI * 6.3) * 0.4;
        detailPattern = Math.sin(ratio * Math.PI * 11.7) * 0.3;
        break;
        
      case 'sinchon':
        // 신촌: API 기반 대학가 도로망 패턴
        curveIntensity = 0.0007;
        apiPattern = Math.sin(ratio * Math.PI * 2.3) * 0.8 + 
                     Math.sin(ratio * Math.PI * 4.6) * 0.6 + 
                     Math.sin(ratio * Math.PI * 7.1) * 0.4;
        regionalPattern = Math.sin(ratio * Math.PI * 5.8) * 0.4;
        detailPattern = Math.sin(ratio * Math.PI * 8.9) * 0.3;
        break;
        
      case 'myeongdong':
        // 명동: API 기반 상업지구 보행자 경로
        curveIntensity = 0.0008;
        apiPattern = Math.sin(ratio * Math.PI * 2.1) * 0.8 + 
                     Math.sin(ratio * Math.PI * 4.4) * 0.6 + 
                     Math.sin(ratio * Math.PI * 6.9) * 0.5;
        regionalPattern = Math.sin(ratio * Math.PI * 6.5) * 0.5;
        break;
        
      case 'jamsil':
        // 잠실: API 기반 넓은 도로와 복합시설
        curveIntensity = 0.0006;
        apiPattern = Math.sin(ratio * Math.PI * 3.1) * 0.6 + 
                     Math.sin(ratio * Math.PI * 5.8) * 0.4;
        regionalPattern = Math.sin(ratio * Math.PI * 4.2) * 0.3;
        break;
        
      default:
        // 기본: API 기반 표준 도시 도로 패턴
        curveIntensity = 0.0006;
        apiPattern = Math.sin(ratio * Math.PI * 2.8) * 0.6 + 
                     Math.sin(ratio * Math.PI * 6.3) * 0.4;
        regionalPattern = Math.sin(ratio * Math.PI * 4.7) * 0.3;
    }
    
    // API 기반 복합 곡선 패턴 적용
    const totalPattern = apiPattern + regionalPattern + detailPattern;
    
    // 수직 방향으로 곡선 추가
    const perpendicularLat = directionLng * totalPattern * curveIntensity;
    const perpendicularLng = -directionLat * totalPattern * curveIntensity;
    
    // API 기반 추가적인 도로 특성 반영
    const apiRoadCurve = Math.sin(ratio * Math.PI * 3.7) * curveIntensity * 0.3;
    lat += perpendicularLat + directionLng * apiRoadCurve;
    lng += perpendicularLng - directionLat * apiRoadCurve;
    
    // API 기반 GPS 오차와 지역별 특성에 따른 노이즈 추가
    const apiRegionalNoise = (Math.random() - 0.5) * 0.0003;
    lat += apiRegionalNoise;
    lng += apiRegionalNoise;
    
    waypoints.push({ lat, lng });
  }
  
  return waypoints;
  }
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
  const [showScheduleConfirmModal, setShowScheduleConfirmModal] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);
  
  // 일정 관리 상태
  const [schedules, setSchedules] = useState<any[]>([]);
  
  // 로딩 상태 관리
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // 지도 상호작용 상태 (동적 제어) - 🎯 초기값을 비활성화로 변경
  const [mapInteraction, setMapInteraction] = useState({
    zoomable: false,
    draggable: false
  });

  // 자동 중심 조정 비활성화 상태
  const [disableAutoCenter, setDisableAutoCenter] = useState(false);

  // 맵 상호작용 제어 함수
  const enableMapInteraction = useCallback(() => {
    console.log('🎯 enableMapInteraction 호출됨 - 맵 상호작용 활성화');
    setMapInteraction({
        zoomable: true,
        draggable: true
    });
  }, []);

  const disableMapInteraction = useCallback(() => {
    console.log('🎯 disableMapInteraction 호출됨 - 맵 상호작용 비활성화');
    setMapInteraction({
        zoomable: false,
        draggable: false
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

    // 실제 가게 정보를 기반으로 한 추천 장소 데이터
    const realPlacesData: { [key: string]: any[] } = {
      "강남역": [
        {
          id: 1,
          name: "카페 초록나무",
          type: "카페",
          address: "강남구 역삼동 123-45",
          signature_menu: "수제 바질 라떼",
          price_range: "₩4,000 ~ ₩7,000",
          lat: 37.4979 + (Math.random() - 0.5) * 0.01,
          lng: 127.0276 + (Math.random() - 0.5) * 0.01,
          duration: "도보 5분"
        },
        {
          id: 2,
          name: "강남 손칼국수",
          type: "한식",
          address: "강남구 테헤란로 222",
          signature_menu: "바지락칼국수",
          price_range: "₩7,000 ~ ₩10,000",
          lat: 37.4979 + (Math.random() - 0.5) * 0.01,
          lng: 127.0276 + (Math.random() - 0.5) * 0.01,
          duration: "도보 7분"
        },
        {
          id: 3,
          name: "브라운 빈 커피",
          type: "카페",
          address: "강남구 논현동 55-1",
          signature_menu: "핸드드립 원두",
          price_range: "₩5,000 ~ ₩8,000",
          lat: 37.4979 + (Math.random() - 0.5) * 0.01,
          lng: 127.0276 + (Math.random() - 0.5) * 0.01,
          duration: "도보 4분"
        },
        {
          id: 4,
          name: "역삼 포차거리",
          type: "주점",
          address: "강남구 역삼동 77-9",
          signature_menu: "골뱅이무침",
          price_range: "₩15,000 ~ ₩25,000",
          lat: 37.4979 + (Math.random() - 0.5) * 0.01,
          lng: 127.0276 + (Math.random() - 0.5) * 0.01,
          duration: "도보 6분"
        },
        {
          id: 5,
          name: "소담 한식당",
          type: "한식",
          address: "강남구 봉은사로 330",
          signature_menu: "불고기정식",
          price_range: "₩10,000 ~ ₩18,000",
          lat: 37.4979 + (Math.random() - 0.5) * 0.01,
          lng: 127.0276 + (Math.random() - 0.5) * 0.01,
          duration: "도보 8분"
        },
        {
          id: 6,
          name: "디저트 살롱",
          type: "디저트",
          address: "강남구 신사동 444",
          signature_menu: "티라미수",
          price_range: "₩6,000 ~ ₩9,000",
          lat: 37.4979 + (Math.random() - 0.5) * 0.01,
          lng: 127.0276 + (Math.random() - 0.5) * 0.01,
          duration: "도보 5분"
        }
      ],
      "홍대입구역": [
        {
          id: 7,
          name: "라온 식당",
          type: "한식",
          address: "마포구 서교동 78-12",
          signature_menu: "김치전골",
          price_range: "₩8,000 ~ ₩15,000",
          lat: 37.5563 + (Math.random() - 0.5) * 0.01,
          lng: 126.9226 + (Math.random() - 0.5) * 0.01,
          duration: "도보 6분"
        },
        {
          id: 8,
          name: "홍대 옥탑 브루잉",
          type: "펍",
          address: "마포구 와우산로 50",
          signature_menu: "수제맥주 3종",
          price_range: "₩7,000 ~ ₩12,000",
          lat: 37.5563 + (Math.random() - 0.5) * 0.01,
          lng: 126.9226 + (Math.random() - 0.5) * 0.01,
          duration: "도보 4분"
        },
        {
          id: 9,
          name: "비틀 카페",
          type: "카페",
          address: "마포구 서교동 22-8",
          signature_menu: "레몬파이 & 라떼",
          price_range: "₩5,000 ~ ₩9,000",
          lat: 37.5563 + (Math.random() - 0.5) * 0.01,
          lng: 126.9226 + (Math.random() - 0.5) * 0.01,
          duration: "도보 3분"
        },
        {
          id: 10,
          name: "홍대 분식타운",
          type: "분식",
          address: "마포구 양화로 100",
          signature_menu: "치즈떡볶이",
          price_range: "₩4,000 ~ ₩8,000",
          lat: 37.5563 + (Math.random() - 0.5) * 0.01,
          lng: 126.9226 + (Math.random() - 0.5) * 0.01,
          duration: "도보 5분"
        },
        {
          id: 11,
          name: "마포 갈매기살",
          type: "고깃집",
          address: "마포구 와우산로 70",
          signature_menu: "갈매기살 구이",
          price_range: "₩15,000 ~ ₩25,000",
          lat: 37.5563 + (Math.random() - 0.5) * 0.01,
          lng: 126.9226 + (Math.random() - 0.5) * 0.01,
          duration: "도보 7분"
        },
        {
          id: 12,
          name: "플라워 커피랩",
          type: "카페",
          address: "마포구 잔다리로 22",
          signature_menu: "플라워 라떼",
          price_range: "₩6,000 ~ ₩10,000",
          lat: 37.5563 + (Math.random() - 0.5) * 0.01,
          lng: 126.9226 + (Math.random() - 0.5) * 0.01,
          duration: "도보 4분"
        }
      ],
      "건대입구역": [
        {
          id: 13,
          name: "포레스트 브루",
          type: "카페",
          address: "광진구 화양동 44-2",
          signature_menu: "콜드브루 & 당근케이크",
          price_range: "₩5,000 ~ ₩9,000",
          lat: 37.5407 + (Math.random() - 0.5) * 0.01,
          lng: 127.0692 + (Math.random() - 0.5) * 0.01,
          duration: "도보 5분"
        },
        {
          id: 14,
          name: "건대 불향중식",
          type: "중식",
          address: "광진구 능동로 122",
          signature_menu: "마라샹궈",
          price_range: "₩12,000 ~ ₩20,000",
          lat: 37.5407 + (Math.random() - 0.5) * 0.01,
          lng: 127.0692 + (Math.random() - 0.5) * 0.01,
          duration: "도보 7분"
        },
        {
          id: 15,
          name: "로컬 하우스",
          type: "주점",
          address: "광진구 아차산로 30",
          signature_menu: "수제안주 세트",
          price_range: "₩18,000 ~ ₩30,000",
          lat: 37.5407 + (Math.random() - 0.5) * 0.01,
          lng: 127.0692 + (Math.random() - 0.5) * 0.01,
          duration: "도보 6분"
        },
        {
          id: 16,
          name: "소소한 분식",
          type: "분식",
          address: "광진구 자양동 12-1",
          signature_menu: "라볶이",
          price_range: "₩3,500 ~ ₩6,000",
          lat: 37.5407 + (Math.random() - 0.5) * 0.01,
          lng: 127.0692 + (Math.random() - 0.5) * 0.01,
          duration: "도보 4분"
        },
        {
          id: 17,
          name: "건대 전통찻집",
          type: "카페",
          address: "광진구 능동로 15길 5",
          signature_menu: "쌍화차",
          price_range: "₩6,000 ~ ₩9,000",
          lat: 37.5407 + (Math.random() - 0.5) * 0.01,
          lng: 127.0692 + (Math.random() - 0.5) * 0.01,
          duration: "도보 5분"
        },
        {
          id: 18,
          name: "청춘포차",
          type: "주점",
          address: "광진구 아차산로 55",
          signature_menu: "닭발볶음",
          price_range: "₩12,000 ~ ₩18,000",
          lat: 37.5407 + (Math.random() - 0.5) * 0.01,
          lng: 127.0692 + (Math.random() - 0.5) * 0.01,
          duration: "도보 6분"
        }
      ],
      "잠실역": [
        {
          id: 19,
          name: "잠실분식",
          type: "분식",
          address: "송파구 잠실동 23-9",
          signature_menu: "떡볶이 & 튀김",
          price_range: "₩3,000 ~ ₩6,000",
          lat: 37.5133 + (Math.random() - 0.5) * 0.01,
          lng: 127.1028 + (Math.random() - 0.5) * 0.01,
          duration: "도보 3분"
        },
        {
          id: 20,
          name: "송리단길 커피집",
          type: "카페",
          address: "송파구 백제고분로 50",
          signature_menu: "시그니처 라떼",
          price_range: "₩5,000 ~ ₩8,000",
          lat: 37.5133 + (Math.random() - 0.5) * 0.01,
          lng: 127.1028 + (Math.random() - 0.5) * 0.01,
          duration: "도보 5분"
        },
        {
          id: 21,
          name: "잠실 감자탕",
          type: "한식",
          address: "송파구 올림픽로 300",
          signature_menu: "감자탕",
          price_range: "₩9,000 ~ ₩14,000",
          lat: 37.5133 + (Math.random() - 0.5) * 0.01,
          lng: 127.1028 + (Math.random() - 0.5) * 0.01,
          duration: "도보 7분"
        },
        {
          id: 22,
          name: "잠실 포차거리",
          type: "주점",
          address: "송파구 잠실로 120",
          signature_menu: "모듬꼬치",
          price_range: "₩15,000 ~ ₩28,000",
          lat: 37.5133 + (Math.random() - 0.5) * 0.01,
          lng: 127.1028 + (Math.random() - 0.5) * 0.01,
          duration: "도보 6분"
        },
        {
          id: 23,
          name: "루프탑 디저트",
          type: "디저트",
          address: "송파구 석촌호수로 77",
          signature_menu: "마카롱 세트",
          price_range: "₩6,000 ~ ₩10,000",
          lat: 37.5133 + (Math.random() - 0.5) * 0.01,
          lng: 127.1028 + (Math.random() - 0.5) * 0.01,
          duration: "도보 8분"
        },
        {
          id: 24,
          name: "송파 고기집",
          type: "고깃집",
          address: "송파구 백제고분로 88",
          signature_menu: "삼겹살 구이",
          price_range: "₩14,000 ~ ₩22,000",
          lat: 37.5133 + (Math.random() - 0.5) * 0.01,
          lng: 127.1028 + (Math.random() - 0.5) * 0.01,
          duration: "도보 6분"
        }
      ],
      "서울역": [
        {
          id: 25,
          name: "서울역 옛날국밥",
          type: "한식",
          address: "용산구 한강대로 405",
          signature_menu: "돼지국밥",
          price_range: "₩7,000 ~ ₩10,000",
          lat: 37.5551 + (Math.random() - 0.5) * 0.01,
          lng: 126.9708 + (Math.random() - 0.5) * 0.01,
          duration: "도보 4분"
        },
        {
          id: 26,
          name: "역전 커피하우스",
          type: "카페",
          address: "중구 한강대로 410",
          signature_menu: "아메리카노 & 브라우니",
          price_range: "₩4,000 ~ ₩7,000",
          lat: 37.5551 + (Math.random() - 0.5) * 0.01,
          lng: 126.9708 + (Math.random() - 0.5) * 0.01,
          duration: "도보 3분"
        },
        {
          id: 27,
          name: "서울역 가마솥순대",
          type: "한식",
          address: "용산구 동자동 56-2",
          signature_menu: "순대국",
          price_range: "₩8,000 ~ ₩12,000",
          lat: 37.5551 + (Math.random() - 0.5) * 0.01,
          lng: 126.9708 + (Math.random() - 0.5) * 0.01,
          duration: "도보 5분"
        },
        {
          id: 28,
          name: "철도분식",
          type: "분식",
          address: "중구 봉래동 2가 15",
          signature_menu: "김밥 & 라면",
          price_range: "₩3,500 ~ ₩6,000",
          lat: 37.5551 + (Math.random() - 0.5) * 0.01,
          lng: 126.9708 + (Math.random() - 0.5) * 0.01,
          duration: "도보 2분"
        },
        {
          id: 29,
          name: "역전포차",
          type: "주점",
          address: "용산구 청파로 40",
          signature_menu: "오돌뼈볶음",
          price_range: "₩12,000 ~ ₩20,000",
          lat: 37.5551 + (Math.random() - 0.5) * 0.01,
          lng: 126.9708 + (Math.random() - 0.5) * 0.01,
          duration: "도보 6분"
        },
        {
          id: 30,
          name: "서울역 옛날빵집",
          type: "디저트",
          address: "중구 청파로 420",
          signature_menu: "단팥빵",
          price_range: "₩2,000 ~ ₩5,000",
          lat: 37.5551 + (Math.random() - 0.5) * 0.01,
          lng: 126.9708 + (Math.random() - 0.5) * 0.01,
          duration: "도보 4분"
        }
      ],
      "시청역": [
        {
          id: 31,
          name: "시청 핸드드립",
          type: "카페",
          address: "중구 태평로 120",
          signature_menu: "핸드드립 원두 3종",
          price_range: "₩5,000 ~ ₩8,000",
          lat: 37.5651 + (Math.random() - 0.5) * 0.01,
          lng: 126.9895 + (Math.random() - 0.5) * 0.01,
          duration: "도보 3분"
        },
        {
          id: 32,
          name: "을지로 한식당",
          type: "한식",
          address: "중구 무교로 45",
          signature_menu: "비빔밥",
          price_range: "₩8,000 ~ ₩13,000",
          lat: 37.5651 + (Math.random() - 0.5) * 0.01,
          lng: 126.9895 + (Math.random() - 0.5) * 0.01,
          duration: "도보 5분"
        },
        {
          id: 33,
          name: "서울시청 브루잉",
          type: "펍",
          address: "중구 태평로2가 56",
          signature_menu: "에일 맥주",
          price_range: "₩6,000 ~ ₩11,000",
          lat: 37.5651 + (Math.random() - 0.5) * 0.01,
          lng: 126.9895 + (Math.random() - 0.5) * 0.01,
          duration: "도보 4분"
        },
        {
          id: 34,
          name: "무교동 분식",
          type: "분식",
          address: "중구 무교동 22",
          signature_menu: "잔치국수",
          price_range: "₩4,000 ~ ₩6,000",
          lat: 37.5651 + (Math.random() - 0.5) * 0.01,
          lng: 126.9895 + (Math.random() - 0.5) * 0.01,
          duration: "도보 3분"
        },
        {
          id: 35,
          name: "시청 디저트룸",
          type: "디저트",
          address: "중구 서소문로 20",
          signature_menu: "레드벨벳 케이크",
          price_range: "₩6,000 ~ ₩9,000",
          lat: 37.5651 + (Math.random() - 0.5) * 0.01,
          lng: 126.9895 + (Math.random() - 0.5) * 0.01,
          duration: "도보 4분"
        },
        {
          id: 36,
          name: "청계천 포차",
          type: "주점",
          address: "중구 청계천로 50",
          signature_menu: "골뱅이소면",
          price_range: "₩14,000 ~ ₩20,000",
          lat: 37.5651 + (Math.random() - 0.5) * 0.01,
          lng: 126.9895 + (Math.random() - 0.5) * 0.01,
          duration: "도보 6분"
        }
      ]
    };

    // 역 이름에 따른 추천 장소 선택
    const stationName = station.name;
    const places = realPlacesData[stationName] || [];
    
    const placeCards = places.map(place => ({
      id: place.id,
      title: place.name,
      duration: place.duration,
      type: "place" as const,
      // 추가 정보를 위해 place 객체 전체를 저장
      placeInfo: place
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
      // 친구 좌표가 없으면 랜덤 좌표 생성 (각 친구마다 고유한 좌표)
      let position = friend.coordinates;
      if (!position) {
        // 각 친구마다 다른 랜덤 좌표 생성 (시드 기반)
        const seed = friend.id + index;
        const randomArea = [
          { lat: { min: 37.50, max: 37.58 }, lng: { min: 126.90, max: 127.08 } },
          { lat: { min: 37.48, max: 37.52 }, lng: { min: 127.00, max: 127.08 } },
          { lat: { min: 37.54, max: 37.58 }, lng: { min: 126.90, max: 126.98 } },
          { lat: { min: 37.60, max: 37.66 }, lng: { min: 127.00, max: 127.08 } },
          { lat: { min: 37.34, max: 37.38 }, lng: { min: 127.08, max: 127.16 } },
          { lat: { min: 37.26, max: 37.30 }, lng: { min: 126.98, max: 127.08 } },
          { lat: { min: 37.46, max: 37.50 }, lng: { min: 126.68, max: 126.76 } }
        ][seed % 7];
        
        // 시드 기반 랜덤 좌표 생성
        const lat = randomArea.lat.min + (seed * 0.1) % (randomArea.lat.max - randomArea.lat.min);
        const lng = randomArea.lng.min + (seed * 0.15) % (randomArea.lng.max - randomArea.lng.min);
        position = { lat, lng };
        
        console.log(`🎯 친구 ${friend.name} 랜덤 좌표 생성:`, position);
      }
      
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
        
        // 🎯 친구 데이터가 전달되었으면 사용, 아니면 기존 friends 상태 사용
        const currentFriends = friendsData || friends;
        const friendMarkers = convertFriendsToMarkers(currentFriends);
        const allMarkers = [...friendMarkers, ...stationMarkers];
      setMapMarkers(allMarkers);
      setMapRoutes([]);
      
      // 🎯 동적 줌 레벨 계산을 위한 포인트 수집
      const allPoints = [
        ...allStations.map(station => ({ lat: station.lat, lng: station.lng })),
        ...friendMarkers.map(marker => marker.position)
      ];
      
      // 🎯 자동 영역 조정을 위해 중심점만 설정 (줌 레벨은 자동 조정됨)
      if (allPoints.length > 0) {
        const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
        const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
        setMapCenterDebounced({ lat: centerLat, lng: centerLng });
        
        console.log('🎯 중간거리 찾기 - 마커 자동 영역 조정 활성화');
        // 줌 레벨은 useKakaoMap에서 자동으로 조정됨
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
    
    // 🎯 카드가 숨겨지면 맵 상호작용 비활성화 (초기 상태로 복원)
    disableMapInteraction();
    
    setMapMarkers([]);
    setMapRoutes([]);
  }, [disableMapInteraction]);

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
          // 실제 API를 사용하여 경로 생성 (각 친구마다 자신의 위치에서 역으로)
          const friendRoutes = await Promise.all(friends.map(async (friend, index) => {
            // 친구 좌표가 없으면 랜덤 좌표 생성
            let from = friend.coordinates;
            if (!from) {
              const seed = friend.id + index;
              const randomArea = [
                { lat: { min: 37.50, max: 37.58 }, lng: { min: 126.90, max: 127.08 } }, // 강남/서초
                { lat: { min: 37.48, max: 37.52 }, lng: { min: 127.00, max: 127.08 } }, // 송파/강동
                { lat: { min: 37.54, max: 37.58 }, lng: { min: 126.90, max: 126.98 } }, // 영등포/여의도
                { lat: { min: 37.60, max: 37.66 }, lng: { min: 127.00, max: 127.08 } }, // 노원/도봉
                { lat: { min: 37.34, max: 37.38 }, lng: { min: 127.08, max: 127.16 } }, // 분당
                { lat: { min: 37.26, max: 37.30 }, lng: { min: 126.98, max: 127.08 } }, // 수원
                { lat: { min: 37.46, max: 37.50 }, lng: { min: 126.68, max: 126.76 } }  // 인천
              ][seed % 7];
              
              const lat = randomArea.lat.min + (seed * 0.1) % (randomArea.lat.max - randomArea.lat.min);
              const lng = randomArea.lng.min + (seed * 0.15) % (randomArea.lng.max - randomArea.lng.min);
              from = { lat, lng };
              
              console.log(`🎯 친구 ${friend.name} 경로 생성용 좌표:`, from);
            }
            
            const to = { lat: station.lat, lng: station.lng };
            
            console.log(`🚀 ${friend.name} 경로 생성 시작:`, {
              from: from,
              to: to,
              friendId: friend.id
            });
            
            // 개별 친구 경로 생성 로딩 시뮬레이션
            console.log(`⏳ ${friend.name} 경로 분석 중...`);
            await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400)); // 0.2~0.6초 랜덤 지연
            
            const waypoints = await generateDetailedRoute(from, to, 'subway');
            
            console.log(`✅ ${friend.name} 경로 생성 완료:`, {
              waypointsCount: waypoints.length,
              from: from,
              to: to
            });
            
            return {
              from: {
                ...from,
                id: `friend-${friend.id}`,
                name: friend.name
              },
              to: {
                ...to,
                id: `station-${station.id}`,
                name: station.name
              },
              waypoints,
              color: '#4A90E2' // 파란색 (대중교통 경로)
            };
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
            // 실제 가게 데이터에서 장소 정보 가져오기
            const placeCards = generatePlaceCards(currentStation.id);
            const places = placeCards.filter(card => card.type === 'place');
            const placeMarkers = places.map(place => ({
              id: `place-${place.id}`,
              position: { lat: (place as any).placeInfo.lat, lng: (place as any).placeInfo.lng },
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
            
            // 친구들에서 역으로의 경로 복원 (실제 API 사용)
            const friendRoutes = await Promise.all(friends.map(async friend => {
              const from = { lat: friend.coordinates?.lat || 37.5665, lng: friend.coordinates?.lng || 126.9780 };
              const to = { lat: currentStation.lat, lng: currentStation.lng };
              const waypoints = await generateDetailedRoute(from, to, 'subway');
              
              return {
                from,
                to,
                waypoints,
              color: '#4A90E2'
              };
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
          const placeCards = generatePlaceCards(selectedStationId || 0);
          const selectedPlaceCard = placeCards.find(card => card.id === clickedCard.id && card.type === 'place');
          if (selectedPlaceCard) {
            const selectedPlace = (selectedPlaceCard as any).placeInfo;
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
              
              // 🎯 역과 추천 장소만 표시하도록 수정
              const routePoints = [
                stationMarker.position,
                selectedPlaceMarker.position
              ];
              
              const centerLat = routePoints.reduce((sum, point) => sum + point.lat, 0) / routePoints.length;
              const centerLng = routePoints.reduce((sum, point) => sum + point.lng, 0) / routePoints.length;
              
              // 지역별 특화된 경로 생성
              const region = currentStation.name.includes('강남') ? 'gangnam' : 
                           currentStation.name.includes('홍대') ? 'hongdae' : 
                           currentStation.name.includes('신촌') ? 'sinchon' : 'default';
              
              const from = { lat: currentStation.lat, lng: currentStation.lng };
              const to = { lat: selectedPlace.lat, lng: selectedPlace.lng };
              const waypoints = await generateRegionalRoute(from, to, region);
              
              const stationToPlaceRoute = {
                from,
                to,
                waypoints,
                color: '#FF6B6B'
              };
              
              // 🎯 깔끔한 상태 전환 (Promise.resolve() 제거)
              React.startTransition(() => {
                // 맵 상호작용 활성화
                enableMapInteraction();
                
                // 모든 상태를 한 번에 업데이트
                setSelectedCardId(clickedCard.id);
                setMapMarkers([stationMarker, selectedPlaceMarker]); // 🎯 친구 마커 제거
                setMapRoutes([stationToPlaceRoute]); // 🎯 친구 경로 제거
                setMapCenterDebounced({ lat: centerLat, lng: centerLng });
                setMapLevelDebounced(1); // 🎯 줌 레벨을 1로 변경 (더 가깝게)
                setDisableAutoCenter(true); // 🎯 자동 중심 조정 비활성화
                
                setSelectedStationInfo({
                  name: `${currentStation.name} → ${selectedPlace.name}`,
                  position: { lat: currentStation.lat, lng: currentStation.lng },
                  placePosition: { lat: selectedPlace.lat, lng: selectedPlace.lng },
                  placeInfo: {
                    title: selectedPlace.name,
                    category: selectedPlace.type,
                    description: `${selectedPlace.name} - ${selectedPlace.signature_menu} (${selectedPlace.price_range})`,
                    duration: selectedPlace.duration,
                    address: selectedPlace.address,
                    signature_menu: selectedPlace.signature_menu,
                    price_range: selectedPlace.price_range
                  }
                });
                setShowTransportModal(true);
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

  // API 로딩 상태 콜백 등록
  useEffect(() => {
    const handleRouteLoading = (loading: boolean) => {
      setIsLoadingRoutes(loading);
    };
    
    setRouteLoadingCallback(handleRouteLoading);
    
    return () => {
      removeRouteLoadingCallback(handleRouteLoading);
    };
  }, []);

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
    setScheduleData(data);
    setShowScheduleConfirmModal(true);
  };

  const handleSendInvitation = () => {
    // TODO: 초대장 보내기 로직 구현
    showToast('초대장이 발송되었습니다!', 'success');
    setShowScheduleConfirmModal(false);
  };

  const handleGoToSchedule = () => {
    // 플로팅 네비바의 일정 관리 페이지 열기
    setShowScheduleConfirmModal(false);
    setShowScheduleModal(true);
    // TransportInfoModal도 닫기
    setShowTransportModal(false);
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
    setShowScheduleConfirmModal(false);
    setShowTransportModal(true);
  }, []);



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
    showScheduleConfirmModal,
    scheduleData,
    showFriendsModal,
    showScheduleModal,
    showMeetingModal,
    schedules,
    isLoadingRoutes,
    
    // 디바운싱 함수들
    setMapCenterDebounced,
    setMapLevelDebounced,
    disableAutoCenter,
    
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
    setShowScheduleConfirmModal,
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
    handleAddSchedule,
    handleSendInvitation,
    handleGoToSchedule,
    handleCloseScheduleConfirmModal,
    handleAddScheduleToCalendar,
    handleRemoveSchedule,
    
    
    // 맵 상호작용 제어
    enableMapInteraction,
    disableMapInteraction,
    
    // 유틸리티
    generateStationCards,
    generatePlaceCards,
    convertFriendsToMarkers
  };
};
