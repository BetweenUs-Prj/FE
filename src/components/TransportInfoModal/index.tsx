import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './TransportInfoModal.module.css';
import { calculateDistance } from '../../utils/kakaoMapUtils';

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
  transportMode: 'bus' | 'subway' | 'bus_subway' | 'walk';
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
  transportMode: 'bus' | 'subway' | 'bus_subway' | 'walk';
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
    id?: number;
    title: string;
    category: string;
    description?: string;
    duration: string;
    lat?: number;
    lng?: number;
    address?: string;
    operatingHours?: string;
    contact?: string;
    rating?: number;
    reviewCount?: number;
    recommendationReason?: string;
  };
  onAddSchedule?: (scheduleData: {
    placeInfo: any;
    stationName: string;
    friends: Friend[];
    routes: TransportRoute[];
    meetingTime: string;
    selectedTransportMode: string;
  }) => void;
  middlePointData?: any; // 백엔드에서 받은 중간지점 데이터
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
  placeInfo,
  onAddSchedule,
  middlePointData
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
  
  // 교통수단 카테고리 선택 (버스, 지하철, 버스+지하철)
  const [selectedTransportMode, setSelectedTransportMode] = useState<'bus' | 'subway' | 'bus_subway'>('bus');
  
  // 중복 요청 방지를 위한 ref
  const isGeneratingRef = useRef(false);
  const lastGeneratedRef = useRef<string>('');
  
  // 스크롤 상태 관리
  const [isScrollable, setIsScrollable] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 스크롤 상태 체크 함수
  const checkScrollState = useCallback(() => {
    if (!contentRef.current) return;
    
    const { scrollHeight, clientHeight } = contentRef.current;
    const canScroll = scrollHeight > clientHeight;
    
    setIsScrollable(canScroll);
  }, []);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    checkScrollState();
  }, [checkScrollState]);

  // 모달 상태 초기화
  useEffect(() => {
    if (!isVisible) {
      setIsLoading(false);
      isGeneratingRef.current = false;
      lastGeneratedRef.current = '';
      
      // 모달이 닫힐 때 처리 중 상태 리셋
      if ((window as any).handleCardClick && (window as any).handleCardClick.isProcessing) {
        (window as any).handleCardClick.isProcessing = false;
        console.log('TransportInfoModal 닫기: 처리 중 상태 리셋됨');
      }
    } else {
      // 모달이 열릴 때 스크롤 상태 체크
      setTimeout(checkScrollState, 100);
    }
  }, [isVisible, checkScrollState]);

  // 내용이 변경될 때 스크롤 상태 체크
  useEffect(() => {
    if (isVisible) {
      // 여러 번 체크하여 확실하게 스크롤 상태 감지
      setTimeout(checkScrollState, 100);
      setTimeout(checkScrollState, 300);
      setTimeout(checkScrollState, 500);
    }
  }, [routes, isVisible, checkScrollState]);

  // 윈도우 리사이즈 시 스크롤 상태 체크
  useEffect(() => {
    if (isVisible) {
      const handleResize = () => {
        setTimeout(checkScrollState, 100);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isVisible, checkScrollState]);

  // 모달이 열릴 때 자동으로 경로 계산
  useEffect(() => {
    if (isVisible && !isGeneratingRef.current) {
      const currentKey = `${isPlaceMode}-${friends.length}-${stationName}-${meetingTime}`;
      
      if (lastGeneratedRef.current === currentKey) return;
      
      // 중간지점 데이터가 있으면 백엔드 데이터를 사용
      if (middlePointData) {
        generateMiddlePointRoutes();
      } else if (isPlaceMode) {
        generatePlaceRoutes();
      } else {
        generateFriendRoutes();
      }
      
      lastGeneratedRef.current = currentKey;
    }
  }, [isVisible, isPlaceMode, friends.length, stationName, meetingTime, middlePointData]);



  // 중간지점 데이터를 활용한 경로 생성
  const generateMiddlePointRoutes = () => {
    if (!middlePointData) return;
    
    console.log('🎯 중간지점 데이터로 경로 생성:', middlePointData);
    
    const middlePointRoutes: TransportRoute[] = friends.map(friend => {
      // 백엔드에서 받은 segments 데이터를 활용
      const segments = middlePointData.segments || [];
      
      // 교통수단 정보 추출 및 변환
      const rawTransportType = middlePointData.transportType || '지하철';
      const transportMode: 'bus' | 'subway' | 'bus_subway' | 'walk' = 
        rawTransportType === '버스' ? 'bus' :
        rawTransportType === '지하철' ? 'subway' :
        rawTransportType === '도보' ? 'walk' :
        'bus_subway'; // 기본값은 버스+지하철
      const totalTravelTime = middlePointData.totalTravelTime || 0;
      
      // 경로 단계 생성
      const routeSteps: RouteStep[] = segments.map((segment: any, index: number) => ({
        step: index + 1,
        instruction: `${segment.trafficTypeName || '이동'} (${segment.sectionTime || 0}분)`,
        distance: segment.distance || 0,
        duration: segment.sectionTime || 0,
        transportType: segment.trafficTypeName || '도보',
        startName: segment.startName || '',
        endName: segment.endName || '',
        startPosition: segment.startX && segment.startY ? 
          { lat: segment.startY, lng: segment.startX } : undefined,
        endPosition: segment.endX && segment.endY ? 
          { lat: segment.endY, lng: segment.endX } : undefined
      }));
      
      // 경로 요약 생성 (details 배열)
      const details = segments
        .filter((segment: any) => segment.trafficTypeName && segment.trafficTypeName !== '도보')
        .map((segment: any) => segment.startName || segment.endName || segment.trafficTypeName)
        .filter(Boolean);

      return {
        friendId: friend.id,
        friendName: friend.name,
        transportMode: transportMode,
        duration: totalTravelTime,
        distance: Math.round((middlePointData.trafficDistance || 0) / 1000 * 10) / 10,
        details: details.length > 0 ? details : [friend.location, middlePointData.lastEndStation || stationName],
        departureTime: calculateDepartureTime(meetingTime, totalTravelTime),
        arrivalTime: meetingTime,
        routeSteps: routeSteps,
        transferInfos: [] // 필요시 segments에서 환승 정보 추출
      };
    });
    
    setRoutes(middlePointRoutes);
    console.log('🎯 생성된 중간지점 경로:', middlePointRoutes);
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
        
        const duration = Math.round(distance * (selectedTransportMode === 'bus' ? 4 : selectedTransportMode === 'subway' ? 3 : 3.5));
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
        lastTrainTime: selectedTransportMode === 'subway' || selectedTransportMode === 'bus_subway' ? getLastTrainTime() : undefined,
          routeSteps,
          transferInfos: selectedTransportMode === 'subway' ? [{
            station: stationName,
            line: '지하철',
            direction: '추천장소 방향',
            time: `${duration}분`
          }] : selectedTransportMode === 'bus' ? [{
            station: stationName,
            line: '버스',
            direction: '추천장소 방향',
            time: `${duration}분`
          }] : selectedTransportMode === 'bus_subway' ? [{
            station: stationName,
            line: '버스+지하철',
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

  // 경로 생성 (실제 API 호출 준비)
  const generateSimulatedRoute = (friend: Friend, transportMode: 'bus' | 'subway' | 'bus_subway' = 'bus') => {
    // TODO: 실제 ODsay API 호출로 대체
    const distance = calculateDistance(
      friend.position.lat, friend.position.lng,
      stationPosition.lat, stationPosition.lng
    );
    
    const duration = Math.round(distance * (transportMode === 'bus' ? 4 : transportMode === 'subway' ? 3 : 3.5));
    const departureTime = calculateDepartureTime(meetingTime, duration);
    
    return {
      friendId: friend.id,
      friendName: friend.name,
      transportMode,
      duration,
      distance: Math.round(distance * 10) / 10,
      details: [friend.location, stationName + '역'],
      coords: generateRouteCoords(friend.position, stationPosition),
      departureTime,
      arrivalTime: meetingTime,
      lastTrainTime: transportMode === 'subway' || transportMode === 'bus_subway' ? getLastTrainTime() : undefined,
      routeSteps: [{
        transportMode,
        duration,
        distance: Math.round(distance * 10) / 10,
        details: [friend.location, stationName + '역']
      }],
      transferInfos: []
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
  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'bus': return '🚌';
      case 'subway': return '🚇';
      case 'bus_subway': return '🚌🚇';
      default: return '🚌';
    }
  };

  // 교통수단 선택 변경 시 자동 경로 재계산
  useEffect(() => {
    // place 모드일 때는 경로 재계산하지 않음
    if (isVisible && routes.length > 0 && !isPlaceMode) {
      handleRouteRecalculation();
    }
  }, [selectedTransportMode, isVisible, routes.length, isPlaceMode]);

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
            {middlePointData ? 
              `🚇 ${stationName} (${middlePointData.transportType || '대중교통'})` :
              isPlaceMode ? `📍 ${placeInfo?.title || '추천장소'}` : `🚇 ${stationName} 교통 정보`
            }
          </h3>
          <button className={styles.closeButton} onClick={() => {
            // 클릭 처리 상태 리셋
            if ((window as any).handleCardClick && (window as any).handleCardClick.isProcessing) {
              (window as any).handleCardClick.isProcessing = false;
              console.log('TransportInfoModal 닫기: 처리 중 상태 리셋됨');
            }
            onClose();
          }}>
            ✕
          </button>
        </div>

        {/* 컨텐츠 */}
        <div 
          ref={contentRef}
          className={`${styles.content} ${isScrollable ? styles.scrollable : ''}`}
          onScroll={handleScroll}
        >
          {/* 중간지점 데이터 정보 표시 */}
          {middlePointData && (
            <div className={styles.middlePointInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>교통수단:</span>
                <span className={styles.infoValue}>{middlePointData.transportType || '대중교통'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>총 소요시간:</span>
                <span className={styles.infoValue}>{middlePointData.totalTravelTime || 0}분</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>교통비:</span>
                <span className={styles.infoValue}>{middlePointData.travelCost || 0}원</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>총 거리:</span>
                <span className={styles.infoValue}>{Math.round((middlePointData.trafficDistance || 0) / 1000 * 10) / 10}km</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>도보 거리:</span>
                <span className={styles.infoValue}>{Math.round((middlePointData.totalWalk || 0) / 1000 * 10) / 10}km</span>
              </div>
              {middlePointData.fairnessScore !== null && middlePointData.fairnessScore !== undefined && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>공정성 점수:</span>
                  <span className={styles.infoValue}>{Math.round(middlePointData.fairnessScore * 10) / 10}</span>
                </div>
              )}
            </div>
          )}
          
          {isPlaceMode ? (
            <div className={styles.placeModeContent}>
              {placeInfo && (
                <>
                  {/* 🎯 장소 상세 정보 */}
                  <div className={styles.placeDetailSection}>
                    <div className={styles.placeHeader}>
                      <h4 className={styles.placeTitle}>{placeInfo.title}</h4>
                      <span className={styles.placeCategory}>{placeInfo.category}</span>
                      {placeInfo.id && (
                        <span className={styles.placeId}>ID: {placeInfo.id}</span>
                      )}
                    </div>
                    
                    {/* 🎯 상세 설명 */}
                    <div className={styles.placeDescription}>
                      <h5>📍 장소 소개</h5>
                      <p>{placeInfo.description}</p>
                      
                      {/* 좌표 정보 표시 */}
                      {(placeInfo.lat && placeInfo.lng) && (
                        <div className={styles.coordinateInfo}>
                          <small>📍 위치: {placeInfo.lat.toFixed(4)}, {placeInfo.lng.toFixed(4)}</small>
                        </div>
                      )}
                    </div>
                    
                    {/* 🎯 추가 장소 정보 */}
                    {(placeInfo.operatingHours || placeInfo.contact || placeInfo.address) && (
                      <div className={styles.additionalInfo}>
                        <h5>ℹ️ 상세 정보</h5>
                        {placeInfo.address && (
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>📍 주소:</span>
                            <span className={styles.infoValue}>{placeInfo.address}</span>
                          </div>
                        )}
                        {placeInfo.operatingHours && (
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>🕐 운영시간:</span>
                            <span className={styles.infoValue}>{placeInfo.operatingHours}</span>
                          </div>
                        )}
                        {placeInfo.contact && (
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>📞 연락처:</span>
                            <span className={styles.infoValue}>{placeInfo.contact}</span>
                          </div>
                        )}
                        {placeInfo.rating && (
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>⭐ 평점:</span>
                            <span className={styles.infoValue}>{placeInfo.rating}점</span>
                          </div>
                        )}
                        {placeInfo.reviewCount && (
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>💬 리뷰:</span>
                            <span className={styles.infoValue}>{placeInfo.reviewCount}개</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 🎯 추천 이유 */}
                    <div className={styles.recommendationReason}>
                      <h5>🎯 추천 이유</h5>
                      {placeInfo.recommendationReason ? (
                        <ul>
                          {placeInfo.recommendationReason.split('\n').filter(reason => reason.trim()).map((reason, index) => (
                            <li key={index}>🎯 {reason.trim()}</li>
                          ))}
                        </ul>
                      ) : (
                        <ul>
                          <li>🚇 역에서 도보 {placeInfo.duration} 거리에 위치</li>
                          <li>📍 중간 지점으로 접근성이 좋음</li>
                          <li>⭐ {placeInfo.category} 카테고리에서 인기 있는 장소</li>
                          <li>🕐 만남 시간에 적합한 운영 시간</li>
                          {placePosition && (
                            <li>📍 정확한 위치 정보로 쉬운 길찾기</li>
                          )}
                        </ul>
                      )}
                    </div>
                    
                    {/* 🎯 교통 정보 */}
                    <div className={styles.transportInfo}>
                      <h5>🚇 교통 정보</h5>
                      <div className={styles.transportDetails}>
                        <span>⏱️ 역에서 도보 {placeInfo.duration}</span>
                        <span>📏 거리: 약 {routes[0]?.distance || '0'}km</span>
                        {routes[0]?.duration && (
                          <span>🕐 예상 소요시간: {routes[0].duration}분</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 🎯 약속 추가 버튼 */}
                  <div className={styles.addScheduleSection}>
                    <button 
                      className={styles.addScheduleButton}
                      onClick={() => {
                        console.log('🎯 약속 추가하기 버튼 클릭됨 - ScheduleConfirmModal 표시');
                        console.log('🎯 onAddSchedule 존재:', !!onAddSchedule);
                        console.log('🎯 전달할 데이터:', {
                          placeInfo,
                          stationName,
                          friends,
                          routes,
                          meetingTime,
                          selectedTransportMode
                        });
                        
                        // 약속 확인 팝업 표시 (실제 생성은 scheduleButton에서 처리)
                        if (onAddSchedule) {
                          onAddSchedule({
                            placeInfo,
                            stationName,
                            friends,
                            routes,
                            meetingTime,
                            selectedTransportMode
                          });
                        }
                        // TransportInfoModal은 닫지 않음 (ScheduleConfirmModal이 닫힐 때 닫힘)
                      }}
                    >
                      📅 약속 추가하기
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.functionArea}>
          {/* 만남 시간 설정 */}
          <div className={styles.meetingTimeSection}>
            <div className={styles.timeInput}>
              <h4>⏰ 만남 시간</h4>
              <div className={styles.timeControls}>
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
          </div>

              {/* 교통수단 선택 */}
          <div className={styles.transportModeSection}>
                <h4>🚇 교통수단</h4>
            <div className={styles.transportButtons}>
              <button
                className={`${styles.transportButton} ${selectedTransportMode === 'bus' ? styles.active : ''}`}
                onClick={() => setSelectedTransportMode('bus')}
              >
                버스
              </button>
              <button
                className={`${styles.transportButton} ${selectedTransportMode === 'subway' ? styles.active : ''}`}
                onClick={() => setSelectedTransportMode('subway')}
              >
                지하철
              </button>
              <button
                className={`${styles.transportButton} ${selectedTransportMode === 'bus_subway' ? styles.active : ''}`}
                onClick={() => setSelectedTransportMode('bus_subway')}
              >
                버스+지하철
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
                            {route.details && route.details.length > 0 ? route.details.join(' → ') : `${route.friendName} → ${stationName}`}
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
