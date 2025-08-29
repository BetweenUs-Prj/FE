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
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 20 });
  const [meetingTime, setMeetingTime] = useState('18:00');
  const [isLoading, setIsLoading] = useState(false);
  
  // 교통수단 카테고리 선택 (대중교통, 자동차만)
  const [selectedTransportMode, setSelectedTransportMode] = useState<'transit' | 'car'>('transit');
  
  // 개별 친구별 교통수단 선택 (대중교통, 자동차만) - 현재 사용하지 않음
  // const [individualTransportModes, setIndividualTransportModes] = useState<Record<number, 'transit' | 'car'>>({});
  
  // 상세 경로 표시 여부
  const [showDetailedRoutes, setShowDetailedRoutes] = useState(false);
  
  // 하단 섹션 접힘 상태 관리
  const [isTransportSectionCollapsed, setIsTransportSectionCollapsed] = useState(true);
  const [isRoutesSectionCollapsed, setIsRoutesSectionCollapsed] = useState(true);
  
  // 중복 요청 방지를 위한 ref
  const isGeneratingRef = useRef(false);
  const lastGeneratedRef = useRef<string>('');

  // 위치 설정 및 모달 상태 초기화
  useEffect(() => {
    if (isVisible) {
      setPosition({ 
        x: window.innerWidth - 420, 
        y: 40 
      });
    } else {
      // 모달이 닫힐 때 상태 초기화
      setIsLoading(false);
      isGeneratingRef.current = false;
      lastGeneratedRef.current = '';
    }
  }, [isVisible]);

  // 모달이 열릴 때 자동으로 경로 계산 (한 번만 실행)
  useEffect(() => {
    console.log('TransportInfoModal useEffect:', {
      isVisible,
      isPlaceMode,
      friendsLength: friends.length,
      stationName
    });
    
    if (isVisible && !isGeneratingRef.current) {
      const currentKey = `${isPlaceMode}-${friends.length}-${stationName}-${meetingTime}`;
      
      // 이미 같은 조건으로 생성된 경우 스킵
      if (lastGeneratedRef.current === currentKey) {
        return;
      }
      
      if (isPlaceMode) {
        console.log('추천장소 경로 생성 시작');
        generatePlaceRoutes();
      } else if (friends.length > 0) {
        console.log('친구들 경로 생성 시작');
        generateFriendRoutes();
      }
      
      lastGeneratedRef.current = currentKey;
    }
  }, [isVisible]);

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

  // 추천장소 경로 생성 (시뮬레이션 모드)
  const generatePlaceRoutes = async () => {
    if (isGeneratingRef.current) return;
    
    console.log('generatePlaceRoutes 호출됨:', { placePosition, stationPosition, selectedTransportMode });
    if (!placePosition) return;
    
    isGeneratingRef.current = true;
    setIsLoading(true);
    
    try {
      const distance = calculateDistance(
        stationPosition.lat, stationPosition.lng,
        placePosition.lat, placePosition.lng
      );
      
      const duration = Math.round(distance * (selectedTransportMode === 'transit' ? 3 : 2));
      const departureTime = calculateDepartureTime(meetingTime, duration);
      
      // 시뮬레이션용 상세 경로 생성
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
      
      console.log('추천장소 경로 설정 (시뮬레이션):', route);
      setRoutes([route]);
      updateMapRoutes([route]);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  // 친구들 경로 생성 (시뮬레이션 모드)
  const generateFriendRoutes = async () => {
    if (isGeneratingRef.current) return;
    
    console.log('generateFriendRoutes 호출됨:', { friendsCount: friends.length });
    
    isGeneratingRef.current = true;
    setIsLoading(true);
    
    try {
          const friendRoutes = friends.map((friend) => {
      return generateSimulatedRoute(friend, selectedTransportMode);
    });
      
      setRoutes(friendRoutes);
      updateMapRoutes(friendRoutes);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  // 시뮬레이션 경로 생성
  const generateSimulatedRoute = (friend: Friend, transportMode: 'transit' | 'car' = 'transit') => {
    const distance = calculateDistance(
      friend.position.lat, friend.position.lng,
      stationPosition.lat, stationPosition.lng
    );
    
    const duration = Math.round(distance * (transportMode === 'transit' ? 3 : 2));
    const departureTime = calculateDepartureTime(meetingTime, duration);
    
    // 시뮬레이션용 상세 경로 생성
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
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
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
  }, [selectedTransportMode]);

  // 경로 재계산 핸들러
  const handleRouteRecalculation = useCallback(async () => {
    if (isLoading || isGeneratingRef.current) return;
    
    if (isPlaceMode) {
      await generatePlaceRoutes();
    } else {
      await generateFriendRoutes();
    }
  }, [isLoading, isPlaceMode, selectedTransportMode]);

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
          {/* 장소 정보 (PlaceMode일 때만 표시) */}
          {isPlaceMode && placeInfo && (
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

          {/* 만남 시간 설정 */}
          <div className={styles.meetingTimeSection}>
            <h4>⏰ 만남 시간 설정</h4>
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
                {isLoading ? (
                  <>
                    <div className={styles.spinner} style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                    계산 중...
                  </>
                ) : (
                  '경로 재계산'
                )}
              </button>
            </div>
          </div>

          {/* 교통수단 카테고리 선택 */}
          <div className={styles.transportModeSection}>
            <div className={styles.sectionHeader}>
              <h4>🚇 교통수단 선택</h4>
              <button
                className={styles.collapseButton}
                onClick={() => setIsTransportSectionCollapsed(!isTransportSectionCollapsed)}
              >
                {isTransportSectionCollapsed ? '⌄' : '⌃'}
              </button>
            </div>
            
            {!isTransportSectionCollapsed && (
              <div className={styles.transportButtons}>
                <button
                  className={`${styles.transportButton} ${selectedTransportMode === 'transit' ? styles.active : ''}`}
                  onClick={() => setSelectedTransportMode('transit')}
                >
                  🚇 대중교통 (버스+지하철+도보)
                </button>
                <button
                  className={`${styles.transportButton} ${selectedTransportMode === 'car' ? styles.active : ''}`}
                  onClick={() => setSelectedTransportMode('car')}
                >
                  🚗 자동차
                </button>
              </div>
            )}
          </div>

          {/* 경로 정보 */}
          <div className={styles.routesSection}>
            <div className={styles.sectionHeader}>
              <h4>🚇 경로 정보</h4>
              <button
                className={styles.collapseButton}
                onClick={() => setIsRoutesSectionCollapsed(!isRoutesSectionCollapsed)}
              >
                {isRoutesSectionCollapsed ? '⌄' : '⌃'}
              </button>
            </div>
            
            {!isRoutesSectionCollapsed && (
              <>
                {routes.length === 0 && (
                  <div className={styles.emptyState}>
                    <p>경로 정보가 없습니다</p>
                  </div>
                )}
                
                {routes.map((route) => (
                  <div key={route.friendId} className={styles.routeCard}>
                    <div className={styles.routeHeader}>
                      <h5>{route.friendName}</h5>
                      <div className={styles.routeSummary}>
                        <span>⏱️ {route.duration}분</span>
                        <span>📏 {route.distance}km</span>
                      </div>
                    </div>
                    
                    {/* 출발/도착 시간 정보 */}
                    {route.departureTime && route.arrivalTime && (
                      <div className={styles.timeInfo}>
                        <div className={styles.timeRow}>
                          <span className={styles.timeLabel}>출발:</span>
                          <span className={styles.timeValue}>{route.departureTime}</span>
                        </div>
                        <div className={styles.timeRow}>
                          <span className={styles.timeLabel}>도착:</span>
                          <span className={styles.timeValue}>{route.arrivalTime}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 막차 정보 */}
                    {route.lastTrainTime && (
                      <div className={styles.lastTrainInfo}>
                        <span className={styles.lastTrainLabel}>🚇 막차:</span>
                        <span className={styles.lastTrainTime}>{route.lastTrainTime}</span>
                      </div>
                    )}

                    {/* 환승 정보 */}
                    {route.transferInfos && route.transferInfos.length > 0 && (
                      <div className={styles.transferSection}>
                        <h6>🔄 환승 정보</h6>
                        {route.transferInfos.map((transfer, index) => (
                          <div key={index} className={styles.transferInfo}>
                            <div className={styles.transferStation}>
                              <strong>{transfer.station}</strong>
                            </div>
                            <div className={styles.transferDetails}>
                              <span>{transfer.line}</span>
                              <span>{transfer.direction}</span>
                              <span>{transfer.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 상세 경로 토글 버튼 */}
                    {route.routeSteps && route.routeSteps.length > 0 && (
                      <div className={styles.detailedRouteSection}>
                        <button
                          className={styles.toggleDetailedRoute}
                          onClick={() => setShowDetailedRoutes(!showDetailedRoutes)}
                        >
                          {showDetailedRoutes ? '▼' : '▶'} 상세 경로 보기
                        </button>
                        
                        {showDetailedRoutes && (
                          <div className={styles.routeSteps}>
                            {route.routeSteps.map((step, stepIndex) => (
                              <div key={stepIndex} className={styles.routeStep}>
                                <span className={styles.stepIcon}>{getTransportIcon(step.transportMode, step.line)}</span>
                                <div className={styles.stepInfo}>
                                  <span className={styles.stepName}>
                                    {step.transportMode === 'transit' ? 
                                      (step.line ? step.line : '대중교통') : 
                                      step.transportMode === 'car' ? '자동차' : '도보'
                                    }
                                  </span>
                                  <div className={styles.stepMeta}>
                                    <span className={styles.stepDuration}>{step.duration}분</span>
                                    <span className={styles.stepSeparator}>•</span>
                                    <span className={styles.stepDistance}>{step.distance}km</span>
                                  </div>
                                  
                                  <div className={styles.stepDetails}>
                                    {step.details.map((detail, index) => (
                                      <span key={index} className={styles.stepDetail}>
                                        {detail}
                                      </span>
                                    ))}
                                    {step.station && (
                                      <span className={styles.stepDetail}>
                                        📍 {step.station}
                                      </span>
                                    )}
                                    {step.direction && (
                                      <span className={styles.stepDetail}>
                                        ➡️ {step.direction}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 기본 경로 요약 */}
                    <div className={styles.routeDetails}>
                      <div className={styles.routeStep}>
                        <span className={styles.stepIcon}>{getTransportIcon(route.transportMode)}</span>
                        <div className={styles.stepInfo}>
                          <span className={styles.stepName}>
                            {route.transportMode === 'transit' ? '대중교통' : '자동차'}
                          </span>
                          <div className={styles.stepMeta}>
                            <span className={styles.stepDuration}>{route.duration}분</span>
                            <span className={styles.stepSeparator}>•</span>
                            <span className={styles.stepDistance}>{route.distance}km</span>
                          </div>
                          
                          <div className={styles.stepDetails}>
                            {route.details.map((detail, index) => (
                              <span key={index} className={styles.stepDetail}>
                                {detail}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportInfoModal;
