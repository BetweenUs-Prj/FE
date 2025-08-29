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
  routeOptions?: Array<{
    transportMode: 'transit' | 'car' | 'walk';
    duration: number;
    distance: number;
    departureTime: string;
    arrivalTime: string;
    details: string[];
    routeSteps?: RouteStep[];
    transferInfos?: TransferInfo[];
  }>;
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
  placePosition
}) => {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 20 });
  const [meetingTime, setMeetingTime] = useState('18:00');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // 교통수단 카테고리 선택 (대중교통, 자동차만)
  const [selectedTransportMode, setSelectedTransportMode] = useState<'transit' | 'car'>('transit');
  
  // 개별 친구별 교통수단 선택 (대중교통, 자동차만)
  const [individualTransportModes, setIndividualTransportModes] = useState<Record<number, 'transit' | 'car'>>({});
  
  // 상세 경로 표시 여부
  const [showDetailedRoutes, setShowDetailedRoutes] = useState(false);
  
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
  }, [isVisible]); // friends와 isPlaceMode를 의존성에서 제거

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

  // 교통수단 결정 함수
  const determineTransportMode = (distance: number): 'walk' | 'transit' | 'car' => {
    if (distance <= 1.0) return 'walk';
    if (distance <= 5.0) return 'transit';
    return 'car';
  };

  // 시간 계산 함수들
  const calculateDepartureTime = (arrivalTime: string, durationMinutes: number): string => {
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes - durationMinutes;
    const departureHours = Math.floor(totalMinutes / 60);
    const departureMinutes = totalMinutes % 60;
    return `${departureHours.toString().padStart(2, '0')}:${departureMinutes.toString().padStart(2, '0')}`;
  };

  const calculateArrivalTime = (departureTime: string, durationMinutes: number): string => {
    const [hours, minutes] = departureTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const arrivalHours = Math.floor(totalMinutes / 60);
    const arrivalMinutes = totalMinutes % 60;
    return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
  };

  const getLastTrainTime = (): string => {
    // 지하철 막차 시간 (대략적인 시간)
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

  // ODsay API 응답에서 상세 경로 정보 추출 함수
  const extractOdsayRouteInfo = (odsayRoute: any) => {
    console.log('extractOdsayRouteInfo 호출:', odsayRoute);
    
    const coords: { lat: number; lng: number }[] = [];
    const routeSteps: RouteStep[] = [];
    const transferInfos: TransferInfo[] = [];
    
    if (odsayRoute.subPath && odsayRoute.subPath.length > 0) {
      odsayRoute.subPath.forEach((subPath: any, index: number) => {
        // 좌표 추출
        if (subPath.coords && subPath.coords.length > 0) {
          subPath.coords.forEach((coord: any) => {
            let lat: number, lng: number;
            
            if (typeof coord === 'object') {
              lat = parseFloat(coord.lat || coord.y || coord[1] || coord.latitude);
              lng = parseFloat(coord.lng || coord.x || coord[0] || coord.longitude);
            } else if (Array.isArray(coord)) {
              lat = parseFloat(coord[1] || coord[0]);
              lng = parseFloat(coord[0] || coord[1]);
            } else {
              lat = parseFloat(coord);
              lng = parseFloat(coord);
            }
            
            if (!isNaN(lat) && !isNaN(lng)) {
              coords.push({ lat, lng });
            }
          });
        }
        
        // 경로 단계 정보 추출
        const step: RouteStep = {
          transportMode: subPath.trafficType === 1 ? 'transit' : 
                        subPath.trafficType === 2 ? 'car' : 'walk',
          duration: Math.round(subPath.sectionTime / 60),
          distance: Math.round(subPath.distance / 1000 * 10) / 10,
          details: []
        };
        
        // 교통수단별 상세 정보
        if (subPath.trafficType === 1) { // 대중교통
          const lane = subPath.lane?.[0];
          let transportName = '대중교통';
          let lineInfo = '';
          
          // 교통수단별 상세 정보
          if (lane?.subwayCode) {
            transportName = '지하철';
            lineInfo = `${lane.subwayCode}호선`;
          } else if (lane?.busNo) {
            transportName = '버스';
            lineInfo = `${lane.busNo}번`;
          } else if (lane?.busType === 1) {
            transportName = '마을버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 2) {
            transportName = '간선버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 3) {
            transportName = '지선버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 4) {
            transportName = '순환버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 5) {
            transportName = '광역버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 6) {
            transportName = '인천버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 7) {
            transportName = '경기버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 8) {
            transportName = '시외버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 9) {
            transportName = '공항버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          }
          
          step.line = lineInfo || transportName;
          step.station = subPath.startName || subPath.endName;
          step.direction = lane?.direction || '';
          
          // 상세 정보 구성
          const details = [];
          if (subPath.startName && subPath.endName) {
            details.push(`${subPath.startName} → ${subPath.endName}`);
          }
          if (lineInfo) {
            details.push(lineInfo);
          }
          if (lane?.direction) {
            details.push(`${lane.direction} 방향`);
          }
          if (subPath.stationCount) {
            details.push(`${subPath.stationCount}개역`);
          }
          
          step.details = details;
          
        } else if (subPath.trafficType === 2) { // 자동차
          step.details = [
            `${subPath.startName || '출발지'} → ${subPath.endName || '도착지'}`,
            '자동차'
          ];
        } else if (subPath.trafficType === 3) { // 도보
          step.details = [
            `${subPath.startName || '출발지'} → ${subPath.endName || '도착지'}`,
            '도보'
          ];
        } else if (subPath.trafficType === 4) { // 기차
          const lane = subPath.lane?.[0];
          step.line = lane?.busNo || '기차';
          step.station = subPath.startName || subPath.endName;
          step.direction = lane?.direction || '';
          step.details = [
            `${subPath.startName || '출발지'} → ${subPath.endName || '도착지'}`,
            lane?.busNo || '기차'
          ];
        }
        
        routeSteps.push(step);
        
        // 환승 정보 추출 (대중교통일 때만)
        if (index > 0 && subPath.trafficType === 1) {
          const lane = subPath.lane?.[0];
          let lineInfo = '';
          
          if (lane?.subwayCode) {
            lineInfo = `${lane.subwayCode}호선`;
          } else if (lane?.busNo) {
            lineInfo = `${lane.busNo}번`;
          } else if (lane?.busType) {
            const busTypes = {
              1: '마을버스', 2: '간선버스', 3: '지선버스', 4: '순환버스',
              5: '광역버스', 6: '인천버스', 7: '경기버스', 8: '시외버스', 9: '공항버스'
            };
            lineInfo = `${busTypes[lane.busType as keyof typeof busTypes] || '버스'}${lane.busNo ? ` ${lane.busNo}번` : ''}`;
          }
          
          const transferInfo: TransferInfo = {
            station: subPath.startName || '',
            line: lineInfo || '대중교통',
            direction: lane?.direction || '',
            time: `${Math.round(subPath.sectionTime / 60)}분`
          };
          transferInfos.push(transferInfo);
        }
      });
    }
    
    // 좌표가 없으면 시작점과 끝점만 추가
    if (coords.length === 0) {
      coords.push({ lat: stationPosition.lat, lng: stationPosition.lng });
      if (placePosition) {
        coords.push({ lat: placePosition.lat, lng: placePosition.lng });
      }
    }
    
    return { coords, routeSteps, transferInfos };
  };

  // ODsay API 응답에서 친구 경로 상세 정보 추출 함수
  const extractOdsayRouteInfoForFriend = (odsayRoute: any, friendPosition: { lat: number; lng: number }, stationPosition: { lat: number; lng: number }) => {
    console.log('extractOdsayRouteInfoForFriend 호출:', odsayRoute);
    
    const coords: { lat: number; lng: number }[] = [];
    const routeSteps: RouteStep[] = [];
    const transferInfos: TransferInfo[] = [];
    
    if (odsayRoute.subPath && odsayRoute.subPath.length > 0) {
      odsayRoute.subPath.forEach((subPath: any, index: number) => {
        // 좌표 추출
        if (subPath.coords && subPath.coords.length > 0) {
          subPath.coords.forEach((coord: any) => {
            let lat: number, lng: number;
            
            if (typeof coord === 'object') {
              lat = parseFloat(coord.lat || coord.y || coord[1] || coord.latitude);
              lng = parseFloat(coord.lng || coord.x || coord[0] || coord.longitude);
            } else if (Array.isArray(coord)) {
              lat = parseFloat(coord[1] || coord[0]);
              lng = parseFloat(coord[0] || coord[1]);
            } else {
              lat = parseFloat(coord);
              lng = parseFloat(coord);
            }
            
            if (!isNaN(lat) && !isNaN(lng)) {
              coords.push({ lat, lng });
            }
          });
        }
        
        // 경로 단계 정보 추출
        const step: RouteStep = {
          transportMode: subPath.trafficType === 1 ? 'transit' : 
                        subPath.trafficType === 2 ? 'car' : 'walk',
          duration: Math.round(subPath.sectionTime / 60),
          distance: Math.round(subPath.distance / 1000 * 10) / 10,
          details: []
        };
        
        // 교통수단별 상세 정보
        if (subPath.trafficType === 1) { // 대중교통
          const lane = subPath.lane?.[0];
          let transportName = '대중교통';
          let lineInfo = '';
          
          // 교통수단별 상세 정보
          if (lane?.subwayCode) {
            transportName = '지하철';
            lineInfo = `${lane.subwayCode}호선`;
          } else if (lane?.busNo) {
            transportName = '버스';
            lineInfo = `${lane.busNo}번`;
          } else if (lane?.busType === 1) {
            transportName = '마을버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 2) {
            transportName = '간선버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 3) {
            transportName = '지선버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 4) {
            transportName = '순환버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 5) {
            transportName = '광역버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 6) {
            transportName = '인천버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 7) {
            transportName = '경기버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 8) {
            transportName = '시외버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          } else if (lane?.busType === 9) {
            transportName = '공항버스';
            lineInfo = lane.busNo ? `${lane.busNo}번` : '';
          }
          
          step.line = lineInfo || transportName;
          step.station = subPath.startName || subPath.endName;
          step.direction = lane?.direction || '';
          
          // 상세 정보 구성
          const details = [];
          if (subPath.startName && subPath.endName) {
            details.push(`${subPath.startName} → ${subPath.endName}`);
          }
          if (lineInfo) {
            details.push(lineInfo);
          }
          if (lane?.direction) {
            details.push(`${lane.direction} 방향`);
          }
          if (subPath.stationCount) {
            details.push(`${subPath.stationCount}개역`);
          }
          
          step.details = details;
          
        } else if (subPath.trafficType === 2) { // 자동차
          step.details = [
            `${subPath.startName || '출발지'} → ${subPath.endName || '도착지'}`,
            '자동차'
          ];
        } else if (subPath.trafficType === 3) { // 도보
          step.details = [
            `${subPath.startName || '출발지'} → ${subPath.endName || '도착지'}`,
            '도보'
          ];
        } else if (subPath.trafficType === 4) { // 기차
          const lane = subPath.lane?.[0];
          step.line = lane?.busNo || '기차';
          step.station = subPath.startName || subPath.endName;
          step.direction = lane?.direction || '';
          step.details = [
            `${subPath.startName || '출발지'} → ${subPath.endName || '도착지'}`,
            lane?.busNo || '기차'
          ];
        }
        
        routeSteps.push(step);
        
        // 환승 정보 추출 (대중교통일 때만)
        if (index > 0 && subPath.trafficType === 1) {
          const lane = subPath.lane?.[0];
          let lineInfo = '';
          
          if (lane?.subwayCode) {
            lineInfo = `${lane.subwayCode}호선`;
          } else if (lane?.busNo) {
            lineInfo = `${lane.busNo}번`;
          } else if (lane?.busType) {
            const busTypes = {
              1: '마을버스', 2: '간선버스', 3: '지선버스', 4: '순환버스',
              5: '광역버스', 6: '인천버스', 7: '경기버스', 8: '시외버스', 9: '공항버스'
            };
            lineInfo = `${busTypes[lane.busType as keyof typeof busTypes] || '버스'}${lane.busNo ? ` ${lane.busNo}번` : ''}`;
          }
          
          const transferInfo: TransferInfo = {
            station: subPath.startName || '',
            line: lineInfo || '대중교통',
            direction: lane?.direction || '',
            time: `${Math.round(subPath.sectionTime / 60)}분`
          };
          transferInfos.push(transferInfo);
        }
      });
    }
    
    // 좌표가 없으면 시작점과 끝점만 추가
    if (coords.length === 0) {
      coords.push({ lat: friendPosition.lat, lng: friendPosition.lng });
      coords.push({ lat: stationPosition.lat, lng: stationPosition.lng });
    }
    
    return { coords, routeSteps, transferInfos };
  };

  // 추천장소 경로 생성 (ODsay API 사용)
  const generatePlaceRoutes = async () => {
    if (isGeneratingRef.current) return; // 중복 실행 방지
    
    console.log('generatePlaceRoutes 호출됨:', { placePosition, stationPosition, selectedTransportMode });
    if (!placePosition) return;
    
    isGeneratingRef.current = true;
    setIsLoading(true);
    
    try {
      const ODSAY_API_KEY = '5nKwyoYj9RBYlD6OSMG7Aw';
      
      // 교통수단에 따른 API 파라미터 설정
      let searchPathType = '1'; // 기본값: 대중교통
      let sopt = '1'; // 최단시간 우선
      
      if (selectedTransportMode === 'car') {
        searchPathType = '2'; // 자동차
        sopt = '1'; // 최단시간 우선
      } else {
        // 대중교통 (버스+지하철+도보 조합 고려)
        searchPathType = '1';
        sopt = '1'; // 최단시간 우선
      }
      
      // ODsay API 호출
      const params = new URLSearchParams({
        apiKey: ODSAY_API_KEY,
        SX: stationPosition.lng.toString(),
        SY: stationPosition.lat.toString(),
        EX: placePosition.lng.toString(),
        EY: placePosition.lat.toString(),
        Sopt: sopt,
        SearchPathType: searchPathType,
        SearchType: '1', // 실시간
        output: 'json'
      });
      
      const response = await fetch(`https://api.odsay.com/v1/api/searchPubTransPathT?${params}`);
      const data = await response.json();
      
      console.log('ODsay API 응답:', data);
      
      if (data.result && data.result.path && data.result.path.length > 0) {
        const odsayRoute = data.result.path[0];
        const routeInfo = odsayRoute.info;
        
        const duration = Math.round(routeInfo.totalTime / 60);
        const departureTime = calculateDepartureTime(meetingTime, duration);
        const arrivalTime = meetingTime;
        
        const { coords, routeSteps, transferInfos } = extractOdsayRouteInfo(odsayRoute);
        
        // 교통수단에 따른 transportMode 설정
        let transportMode: 'transit' | 'car' = selectedTransportMode;
        
        const route: TransportRoute = {
          friendId: 0,
          friendName: `${stationName} → 추천장소`,
          transportMode,
          duration,
          distance: Math.round(routeInfo.totalDistance / 1000 * 10) / 10, // km 단위로 변환
          details: [stationName, '추천장소'],
          coords,
          departureTime,
          arrivalTime,
          lastTrainTime: transportMode === 'transit' ? getLastTrainTime() : undefined,
          routeSteps,
          transferInfos,
          routeOptions: [
            {
              transportMode,
              duration,
              distance: Math.round(routeInfo.totalDistance / 1000 * 10) / 10,
              departureTime,
              arrivalTime,
              details: [stationName, '추천장소'],
              routeSteps,
              transferInfos
            }
          ]
        };
        
        console.log('추천장소 경로 설정 (ODsay 성공):', route);
        setRoutes([route]);
        updateMapRoutes([route]);
      } else {
        console.log('ODsay API 응답에 경로 데이터가 없음:', data);
        // ODsay API 실패 시 시뮬레이션 데이터 사용
        const distance = calculateDistance(
          stationPosition.lat, stationPosition.lng,
          placePosition.lat, placePosition.lng
        );
        
        const duration = Math.round(distance * (selectedTransportMode === 'transit' ? 3 : 2));
        
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
      }
    } catch (error) {
      console.error('ODsay API 오류:', error);
      // 오류 시 시뮬레이션 데이터 사용
      const distance = calculateDistance(
        stationPosition.lat, stationPosition.lng,
        placePosition.lat, placePosition.lng
      );
      
      const duration = Math.round(distance * (selectedTransportMode === 'transit' ? 3 : 2));
      
      const route: TransportRoute = {
        friendId: 0,
        friendName: `${stationName} → 추천장소`,
        transportMode: selectedTransportMode,
        duration,
        distance: Math.round(distance * 10) / 10,
        details: [stationName, '추천장소'],
        coords: generateRouteCoords(stationPosition, placePosition)
      };
      
      setRoutes([route]);
      updateMapRoutes([route]);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  // 친구들 경로 생성 (ODsay API 사용)
  const generateFriendRoutes = async () => {
    if (isGeneratingRef.current) return; // 중복 실행 방지
    
    console.log('generateFriendRoutes 호출됨:', { friendsCount: friends.length });
    
    isGeneratingRef.current = true;
    setIsLoading(true);
    
    try {
      const friendRoutesPromises = friends.map(async (friend) => {
        // 개별 친구의 교통수단 선택 확인
        const friendTransportMode = individualTransportModes[friend.id] || selectedTransportMode;
        
        try {
          const ODSAY_API_KEY = '5nKwyoYj9RBYlD6OSMG7Aw';
          
          // 교통수단에 따른 API 파라미터 설정
          let searchPathType = '1'; // 기본값: 대중교통
          let sopt = '1'; // 최단시간 우선
          
          if (friendTransportMode === 'car') {
            searchPathType = '2'; // 자동차
            sopt = '1'; // 최단시간 우선
          } else {
            // 대중교통 (버스+지하철+도보 조합 고려)
            searchPathType = '1';
            sopt = '1'; // 최단시간 우선
          }
          
          // ODsay API 호출
          const params = new URLSearchParams({
            apiKey: ODSAY_API_KEY,
            SX: friend.position.lng.toString(),
            SY: friend.position.lat.toString(),
            EX: stationPosition.lng.toString(),
            EY: stationPosition.lat.toString(),
            Sopt: sopt,
            SearchPathType: searchPathType,
            SearchType: '1', // 실시간
            output: 'json'
          });
          
          const response = await fetch(`https://api.odsay.com/v1/api/searchPubTransPathT?${params}`);
          const data = await response.json();
          
          console.log(`ODsay API 응답 (${friend.name}):`, data);
          
          if (data.result && data.result.path && data.result.path.length > 0) {
            const odsayRoute = data.result.path[0];
            const routeInfo = odsayRoute.info;
            
            const duration = Math.round(routeInfo.totalTime / 60);
            const departureTime = calculateDepartureTime(meetingTime, duration);
            const arrivalTime = meetingTime;
            
            const { coords, routeSteps, transferInfos } = extractOdsayRouteInfoForFriend(odsayRoute, friend.position, stationPosition);
            
            // 교통수단에 따른 transportMode 설정
            let transportMode: 'transit' | 'car' = friendTransportMode;
            
            return {
              friendId: friend.id,
              friendName: friend.name,
              transportMode,
              duration,
              distance: Math.round(routeInfo.totalDistance / 1000 * 10) / 10, // km 단위로 변환
              details: [friend.name, stationName],
              coords,
              departureTime,
              arrivalTime,
              lastTrainTime: transportMode === 'transit' ? getLastTrainTime() : undefined,
              routeSteps,
              transferInfos,
              routeOptions: [
                {
                  transportMode,
                  duration,
                  distance: Math.round(routeInfo.totalDistance / 1000 * 10) / 10,
                  departureTime,
                  arrivalTime,
                  details: [friend.name, stationName],
                  routeSteps,
                  transferInfos
                }
              ]
            };
                  } else {
          console.log(`ODsay API 응답에 경로 데이터가 없음 (${friend.name}):`, data);
          // ODsay API 실패 시 시뮬레이션 데이터 사용
          return generateSimulatedRoute(friend, friendTransportMode);
        }
        } catch (error) {
          console.error(`ODsay API 오류 (${friend.name}):`, error);
          // 오류 시 시뮬레이션 데이터 사용
          return generateSimulatedRoute(friend, friendTransportMode);
        }
      });
      
      const friendRoutes = await Promise.all(friendRoutesPromises);
      setRoutes(friendRoutes);
      updateMapRoutes(friendRoutes);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  // 시뮬레이션 경로 생성 (fallback용)
  const generateSimulatedRoute = (friend: Friend, transportMode: 'transit' | 'car' = 'transit') => {
    const distance = calculateDistance(
      friend.position.lat, friend.position.lng,
      stationPosition.lat, stationPosition.lng
    );
    
    const duration = Math.round(distance * (transportMode === 'transit' ? 3 : 2));
    
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
      if (line.includes('마을버스')) return '🚐';
      if (line.includes('간선버스')) return '🚌';
      if (line.includes('지선버스')) return '🚌';
      if (line.includes('순환버스')) return '🔄';
      if (line.includes('광역버스')) return '🚌';
      if (line.includes('인천버스')) return '🚌';
      if (line.includes('경기버스')) return '🚌';
      if (line.includes('시외버스')) return '🚌';
      if (line.includes('공항버스')) return '✈️';
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
  }, [selectedTransportMode, individualTransportModes]);

  // 경로 재계산 핸들러
  const handleRouteRecalculation = useCallback(async () => {
    if (isLoading || isGeneratingRef.current) return; // 이미 로딩 중이면 무시
    
    if (isPlaceMode) {
      await generatePlaceRoutes();
    } else {
      await generateFriendRoutes();
    }
  }, [isLoading, isPlaceMode, selectedTransportMode, individualTransportModes]); // 의존성 추가

  if (!isVisible) return null;

  console.log('TransportInfoModal 렌더링:', {
    isVisible,
    position,
    routes: routes.length,
    stationName
  });

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
          <h3 className={styles.title}>🚇 {stationName} 교통 정보</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className={styles.content}>
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
            <h4>🚇 교통수단 선택</h4>
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
          </div>

          {/* 경로 정보 */}
          <div className={styles.routesSection}>
            <h4>🚇 경로 정보</h4>
            
            {routes.length === 0 && (
              <div className={styles.emptyState}>
                <p>경로 정보가 없습니다</p>
              </div>
            )}
            
            {routes.map((route, routeIndex) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportInfoModal;
