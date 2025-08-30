import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './TransportInfoModal.module.css';

interface Friend {
  id: number;
  name: string;
  location: string;
  position: { lat: number; lng: number };
}

interface TransferInfo {
  station: string;
  line: string;
  direction: string;
  time: string;
  platform?: string;
}

interface RouteStep {
  transportMode: 'transit' | 'car' | 'walk';
  line?: string;
  station?: string;
  direction?: string;
  duration: number;
  distance: number;
  details: string[];
  transferInfo?: TransferInfo;
}

interface TransportRoute {
  friendId: number;
  friendName: string;
  transportMode: 'transit' | 'car' | 'walk';
  duration: number;
  distance: number;
  details: string[];
  coords?: { lat: number; lng: number }[];
  departureTime?: string;
  arrivalTime?: string;
  lastTrainTime?: string;
  routeSteps?: RouteStep[];
  transferInfos?: TransferInfo[];
}

interface TransportInfoModalProps {
  isVisible: boolean;
  onClose: () => void;
  stationName: string;
  stationPosition: { lat: number; lng: number };
  friends: Friend[];
  onRouteUpdate?: (routes: any[]) => void;
  onMapRouteUpdate?: (routeData: any) => void;
  isPlaceMode?: boolean;
  placePosition?: { lat: number; lng: number };
  placeInfo?: {
    title: string;
    category: string;
    description?: string;
    duration: string;
  };
}

const TransportInfoModal: React.FC<TransportInfoModalProps> = ({
  isVisible,
  onClose,
  stationName,
  stationPosition,
  friends,
  onRouteUpdate,
  onMapRouteUpdate,
  isPlaceMode = false,
  placePosition,
  placeInfo
}) => {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    const maxX = window.innerWidth - 420;
    const maxY = window.innerHeight - 400;
    return {
      x: Math.max(20, Math.min(maxX, window.innerWidth - 420)),
      y: Math.max(20, Math.min(maxY, 90)) // 더 상단으로 위치 조정
    };
  });
  const [meetingTime, setMeetingTime] = useState('18:00');
  const [isLoading, setIsLoading] = useState(false);
  
  // 교통수단 카테고리 선택 (대중교통, 자동차만)
  const [selectedTransportMode, setSelectedTransportMode] = useState<'transit' | 'car'>('transit');
  
  // 중복 요청 방지를 위한 ref
  const isGeneratingRef = useRef(false);
  const lastGeneratedRef = useRef<string>('');

  // 모달 상태 초기화
  useEffect(() => {
    if (!isVisible) {
      setIsLoading(false);
      isGeneratingRef.current = false;
      lastGeneratedRef.current = '';
    }
  }, [isVisible]);

  // 모달이 열릴 때 자동으로 경로 계산
  useEffect(() => {
    if (isVisible && !isGeneratingRef.current) {
      const currentKey = `${isPlaceMode}-${friends.length}-${stationName}-${meetingTime}`;
      
      if (lastGeneratedRef.current === currentKey) return;
      
      if (isPlaceMode) {
        generatePlaceRoutes();
      } else {
        generateFriendRoutes();
      }
      
      lastGeneratedRef.current = currentKey;
    }
  }, [isVisible, isPlaceMode, friends.length, stationName, meetingTime]);

  // 거리 계산 함수
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 시간 계산 함수들
  const calculateDepartureTime = (arrivalTime: string, durationMinutes: number): string => {
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes - durationMinutes;
    const departureHours = Math.floor(totalMinutes / 60);
    const departureMinutes = totalMinutes % 60;
    return `${departureHours.toString().padStart(2, '0')}:${departureMinutes.toString().padStart(2, '0')}`;
  };

  const getLastTrainTime = (): string => {
    return '24:00';
  };

  // 경로 좌표 생성 함수
  const generateRouteCoords = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    const coords = [];
    const steps = Math.max(5, Math.floor(calculateDistance(start.lat, start.lng, end.lat, end.lng) * 1000));
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = start.lat + (end.lat - start.lat) * ratio;
      const lng = start.lng + (end.lng - start.lng) * ratio;
      
      if (i > 0 && i < steps) {
        const curveOffset = Math.sin(ratio * Math.PI * 2) * 0.0002;
        coords.push({ lat: lat + curveOffset, lng: lng + curveOffset });
      } else {
        coords.push({ lat, lng });
      }
    }
    
    return coords;
  };

  // 추천장소 경로 생성
  const generatePlaceRoutes = async () => {
    if (isGeneratingRef.current || !placePosition) return;
    
    isGeneratingRef.current = true;
    setIsLoading(true);
    
    try {
      const distance = calculateDistance(
        stationPosition.lat, stationPosition.lng,
        placePosition.lat, placePosition.lng
      );
      
      const duration = Math.round(distance * (selectedTransportMode === 'transit' ? 3 : 2));
      const departureTime = calculateDepartureTime(meetingTime, duration);
      
      const routeSteps: RouteStep[] = [{
        transportMode: selectedTransportMode,
        duration,
        distance: Math.round(distance * 10) / 10,
        details: [stationName, '추천장소']
      }];
      
      const route: TransportRoute = {
        friendId: 0,
        friendName: `${stationName} → 추천장소`,
        transportMode: selectedTransportMode,
        duration,
        distance: Math.round(distance * 10) / 10,
        details: [stationName, '추천장소'],
        coords: generateRouteCoords(stationPosition, placePosition),
        departureTime,
        arrivalTime: meetingTime,
        lastTrainTime: selectedTransportMode === 'transit' ? getLastTrainTime() : undefined,
        routeSteps,
        transferInfos: selectedTransportMode === 'transit' ? [{
          station: stationName,
          line: '지하철',
          direction: '추천장소 방향',
          time: `${duration}분`
        }] : []
      };
      
      setRoutes([route]);
      updateMapRoutes([route]);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  // 친구들 경로 생성
  const generateFriendRoutes = async () => {
    if (isGeneratingRef.current) return;
    
    isGeneratingRef.current = true;
    setIsLoading(true);
    
    try {
      const friendRoutes = friends.map((friend) => 
        generateSimulatedRoute(friend, selectedTransportMode)
      );
      
      setRoutes(friendRoutes);
      updateMapRoutes(friendRoutes);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  // 경로 생성
  const generateSimulatedRoute = (friend: Friend, transportMode: 'transit' | 'car' = 'transit') => {
    const distance = calculateDistance(
      friend.position.lat, friend.position.lng,
      stationPosition.lat, stationPosition.lng
    );
    
    const duration = Math.round(distance * (transportMode === 'transit' ? 3 : 2));
    const departureTime = calculateDepartureTime(meetingTime, duration);
    
    const routeSteps: RouteStep[] = [{
      transportMode,
      duration,
      distance: Math.round(distance * 10) / 10,
      details: [friend.name, stationName]
    }];
    
    return {
      friendId: friend.id,
      friendName: friend.name,
      transportMode,
      duration,
      distance: Math.round(distance * 10) / 10,
      details: [friend.name, stationName],
      coords: generateRouteCoords(friend.position, stationPosition),
      departureTime,
      arrivalTime: meetingTime,
      lastTrainTime: transportMode === 'transit' ? getLastTrainTime() : undefined,
      routeSteps,
      transferInfos: transportMode === 'transit' ? [{
        station: friend.name,
        line: '지하철',
        direction: stationName + ' 방향',
        time: `${duration}분`
      }] : []
    };
  };

  // 지도에 경로 표시
  const updateMapRoutes = (routes: TransportRoute[]) => {
    if (onRouteUpdate) {
      onRouteUpdate(routes);
    }
    
    if (onMapRouteUpdate) {
      onMapRouteUpdate(routes);
    }
  };

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // 화면 경계 내에서만 이동하도록 제한
      const maxX = window.innerWidth - 420; // 모달 너비
      const maxY = window.innerHeight - 400; // 모달 높이 (추정)
      
      setPosition({
        x: Math.max(20, Math.min(newX, maxX)),
        y: Math.max(20, Math.min(newY, maxY))
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 브라우저 크기 변경 시 모달 위치 조정
  useEffect(() => {
    const handleResize = () => {
      const maxX = window.innerWidth - 420;
      const maxY = window.innerHeight - 400;
      
      setPosition(prev => ({
        x: Math.max(20, Math.min(prev.x, maxX)),
        y: Math.max(20, Math.min(prev.y, maxY))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 교통수단 아이콘
  const getTransportIcon = (mode: string, line?: string) => {
    if (mode === 'transit' && line) {
      if (line.includes('호선')) return '🚇';
      if (line.includes('버스')) return '🚌';
      return '🚇';
    }
    
    switch (mode) {
      case 'transit': return '🚇';
      case 'car': return '🚗';
      case 'walk': return '🚶';
      default: return '🚇';
    }
  };

  // 교통수단 선택 변경 시 자동 경로 재계산
  useEffect(() => {
    if (isVisible && routes.length > 0) {
      handleRouteRecalculation();
    }
  }, [selectedTransportMode, isVisible, routes.length]);

  // 경로 재계산 핸들러
  const handleRouteRecalculation = useCallback(async () => {
    if (isLoading || isGeneratingRef.current) return;
    
    if (isPlaceMode) {
      await generatePlaceRoutes();
    } else {
      await generateFriendRoutes();
    }
  }, [isLoading, isPlaceMode, selectedTransportMode, generatePlaceRoutes, generateFriendRoutes]);

  if (!isVisible) return null;

  return (
    <div 
      className={styles.overlay}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className={styles.modal}>
        {/* 헤더 */}
        <div className={styles.header} onMouseDown={handleMouseDown}>
          <h3 className={styles.title}>
            {isPlaceMode ? `📍 ${placeInfo?.title || '추천장소'}` : `🚇 ${stationName} 교통 정보`}
          </h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className={styles.content}>
          {isPlaceMode ? (
            <div className={styles.mainArea}>
              {placeInfo && (
                <div className={styles.placeInfoSection}>
                  <h4>📍 장소 정보</h4>
                  <div className={styles.placeCard}>
                    <div className={styles.placeHeader}>
                      <h5>{placeInfo.title}</h5>
                      <span className={styles.placeCategory}>{placeInfo.category}</span>
                    </div>
                    {placeInfo.description && (
                      <p className={styles.placeDescription}>{placeInfo.description}</p>
                    )}
                    <div className={styles.placeMeta}>
                      <span>⏱️ {placeInfo.duration}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.functionArea}>
              {/* 만남 시간 설정 */}
              <div className={styles.meetingTimeSection}>
                <h4>⏰ 만남 시간</h4>
                <div className={styles.timeInput}>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className={styles.timePicker}
                  />
                  <button 
                    onClick={handleRouteRecalculation}
                    className={styles.refreshButton}
                    disabled={isLoading}
                  >
                    {isLoading ? '계산 중...' : '재계산'}
                  </button>
                </div>
              </div>

              {/* 교통수단 선택 */}
              <div className={styles.transportModeSection}>
                <h4>🚇 교통수단</h4>
                <div className={styles.transportButtons}>
                  <button
                    className={`${styles.transportButton} ${selectedTransportMode === 'transit' ? styles.active : ''}`}
                    onClick={() => setSelectedTransportMode('transit')}
                  >
                    🚇 대중교통
                  </button>
                  <button
                    className={`${styles.transportButton} ${selectedTransportMode === 'car' ? styles.active : ''}`}
                    onClick={() => setSelectedTransportMode('car')}
                  >
                    🚗 자동차
                  </button>
                </div>
              </div>

              {/* 경로 정보 */}
              <div className={styles.routesSection}>
                <h4>🚇 경로 정보</h4>
                {routes.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>경로 정보가 없습니다</p>
                  </div>
                ) : (
                  <div className={styles.routesList}>
                    {routes.map((route) => (
                      <div key={route.friendId} className={styles.routeCard}>
                        <div className={styles.routeHeader}>
                          <div className={styles.routeInfo}>
                            <h5>{route.friendName}</h5>
                            <div className={styles.routeMeta}>
                              <span>⏱️ {route.duration}분</span>
                              <span>📏 {route.distance}km</span>
                              {route.lastTrainTime && (
                                <span className={styles.lastTrainBadge}>막차 {route.lastTrainTime}</span>
                              )}
                            </div>
                          </div>
                          {route.departureTime && route.arrivalTime && (
                            <div className={styles.timeInfo}>
                              <span>{route.departureTime} → {route.arrivalTime}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 간단한 경로 요약 */}
                        <div className={styles.routeSummary}>
                          <span className={styles.transportIcon}>{getTransportIcon(route.transportMode)}</span>
                          <span className={styles.routeText}>
                            {route.details.join(' → ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransportInfoModal;
