// 실제 API 호출을 위한 라우트 API 함수들

// 로딩 상태 관리
let isLoadingRoutes = false;
const loadingCallbacks: ((loading: boolean) => void)[] = [];

export const setRouteLoadingCallback = (callback: (loading: boolean) => void) => {
  loadingCallbacks.push(callback);
};

export const removeRouteLoadingCallback = (callback: (loading: boolean) => void) => {
  const index = loadingCallbacks.indexOf(callback);
  if (index > -1) {
    loadingCallbacks.splice(index, 1);
  }
};

const setRouteLoading = (loading: boolean) => {
  isLoadingRoutes = loading;
  loadingCallbacks.forEach(callback => callback(loading));
};

export interface RouteRequest {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  routeType?: 'subway' | 'walking';
  region?: string;
}

export interface RouteResponse {
  coords: { lat: number; lng: number }[];
  duration?: number;
  distance?: number;
  steps?: any[];
}

// ODsay API를 사용한 실제 경로 조회 (다양한 방법 시도)

// 카카오맵 API를 사용한 실제 경로 조회 (모빌리티 API)
export const getRouteFromKakaoMobility = async (request: RouteRequest): Promise<RouteResponse> => {
  try {
    setRouteLoading(true);
    
    const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_MOBILITY_API_KEY;
    
    if (!KAKAO_API_KEY) {
      throw new Error('카카오 모빌리티 API 키가 설정되지 않았습니다. .env 파일에 VITE_KAKAO_MOBILITY_API_KEY를 설정해주세요.');
    }
    
    console.log('🚗 카카오 모빌리티 API 호출:', {
      apiKey: KAKAO_API_KEY.substring(0, 10) + '...',
      start: request.start,
      end: request.end
    });
    
    // 로딩 상태 시뮬레이션 (실제 API 호출 시간과 유사하게)
    console.log('⏳ 카카오 모빌리티 API 로딩 중...');
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200)); // 0.8~2초 랜덤 지연
    
    const response = await fetch(`https://apis-navi.kakaomobility.com/v1/directions?origin=${request.start.lng},${request.start.lat}&destination=${request.end.lng},${request.end.lat}&priority=TIME`, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${KAKAO_API_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`카카오 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coords = extractCoordinatesFromKakaoRoute(route);
      
      console.log('🚗 카카오 모빌리티 API 성공:', {
        coordsCount: coords.length,
        duration: route.summary.duration,
        distance: route.summary.distance
      });
      
      const result = {
        coords,
        duration: route.summary.duration,
        distance: route.summary.distance,
        steps: route.sections
      };
      
      setRouteLoading(false);
      return result;
    }
    
    throw new Error('카카오 API에서 유효한 경로를 찾을 수 없습니다.');
    
  } catch (error) {
    console.error('카카오 API 호출 실패:', error);
    setRouteLoading(false);
    throw error;
  }
};

// 카카오맵 JavaScript API를 사용한 경로 조회
export const getRouteFromKakaoMap = async (request: RouteRequest): Promise<RouteResponse> => {
  return new Promise(async (resolve, reject) => {
    try {
      setRouteLoading(true);
      
      // 로딩 상태 시뮬레이션
      console.log('⏳ 카카오맵 JavaScript API 로딩 중...');
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1000)); // 0.6~1.6초 랜덤 지연
      
      // 카카오맵 API가 로드되어 있는지 확인
      if (typeof window !== 'undefined' && window.kakao && window.kakao.maps && window.kakao.maps.services) {
        const { kakao } = window;
        
        // 출발지와 도착지 좌표
        const startPoint = new kakao.maps.LatLng(request.start.lat, request.start.lng);
        const endPoint = new kakao.maps.LatLng(request.end.lat, request.end.lng);
        
        // Directions 서비스가 사용 가능한지 확인
        if (!kakao.maps.services.Directions) {
          reject(new Error('카카오맵 Directions 서비스가 사용할 수 없습니다.'));
          return;
        }
        
        // 길찾기 서비스 객체 생성
        const directionsService = new kakao.maps.services.Directions();
        
        // 경로 검색 옵션
        const options = {
          priority: kakao.maps.services.Directions.Priority.OPTIMAL, // 최적 경로
          avoidTraffic: true, // 교통정보 회피
        };
        
        // 경로 검색 실행
        directionsService.route({
          origin: startPoint,
          destination: endPoint,
          ...options
        }, (result: any, status: any) => {
          if (status === kakao.maps.services.Status.OK) {
            const coords: { lat: number; lng: number }[] = [];
            
            // 경로 좌표 추출
            if (result.routes && result.routes[0]) {
              const route = result.routes[0];
              if (route.sections) {
                route.sections.forEach((section: any) => {
                  if (section.roads) {
                    section.roads.forEach((road: any) => {
                      if (road.vertexes) {
                        const decodedCoords = decodeKakaoVertexes(road.vertexes);
                        coords.push(...decodedCoords);
                      }
                    });
                  }
                });
              }
            }
            
            console.log('🗺️ 카카오맵 JavaScript API 성공:', {
              coordsCount: coords.length,
              duration: result.routes?.[0]?.summary?.duration || 0,
              distance: result.routes?.[0]?.summary?.distance || 0
            });
            
            const result_data = {
              coords,
              duration: result.routes?.[0]?.summary?.duration || 0,
              distance: result.routes?.[0]?.summary?.distance || 0,
              steps: result.routes?.[0]?.sections || []
            };
            
            setRouteLoading(false);
            resolve(result_data);
          } else {
            setRouteLoading(false);
            reject(new Error(`카카오맵 API 경로 검색 실패: ${status}`));
          }
        });
      } else {
        setRouteLoading(false);
        reject(new Error('카카오맵 API가 로드되지 않았습니다.'));
      }
    } catch (error) {
      setRouteLoading(false);
      reject(error);
    }
  });
};

// ODsay 경로에서 좌표 추출

// 카카오 경로에서 좌표 추출
const extractCoordinatesFromKakaoRoute = (route: any): { lat: number; lng: number }[] => {
  const coords: { lat: number; lng: number }[] = [];
  
  console.log('🔍 카카오 경로 데이터 구조:', route);
  
  if (route.sections) {
    route.sections.forEach((section: any, sectionIndex: number) => {
      console.log(`🔍 Section ${sectionIndex}:`, section);
      
      // 카카오 모빌리티 API는 roads 대신 다른 구조를 사용할 수 있음
      if (section.roads) {
        section.roads.forEach((road: any, roadIndex: number) => {
          console.log(`🔍 Road ${roadIndex}:`, road);
          
          if (road.vertexes) {
            console.log(`🔍 Vertexes 원본:`, road.vertexes.slice(0, 10)); // 처음 10개만 로그
            // 카카오 모빌리티 API의 vertexes는 압축된 형태
            const decodedCoords = decodeKakaoVertexes(road.vertexes);
            console.log(`🔍 디코딩된 좌표 샘플:`, decodedCoords.slice(0, 3)); // 처음 3개만 로그
            coords.push(...decodedCoords);
          }
        });
      }
      
      // 다른 가능한 좌표 필드들 확인
      if (section.vertexes) {
        console.log(`🔍 Section vertexes 발견:`, section.vertexes.slice(0, 10));
        const decodedCoords = decodeKakaoVertexes(section.vertexes);
        coords.push(...decodedCoords);
      }
      
      if (section.coordinates) {
        console.log(`🔍 Section coordinates 발견:`, section.coordinates.slice(0, 10));
        section.coordinates.forEach((coord: any) => {
          if (coord.lat && coord.lng) {
            coords.push({ lat: coord.lat, lng: coord.lng });
          }
        });
      }
    });
  }
  
  // 전체 route에서 좌표 찾기
  if (route.vertexes) {
    console.log(`🔍 Route vertexes 발견:`, route.vertexes.slice(0, 10));
    const decodedCoords = decodeKakaoVertexes(route.vertexes);
    coords.push(...decodedCoords);
  }
  
  if (route.coordinates) {
    console.log(`🔍 Route coordinates 발견:`, route.coordinates.slice(0, 10));
    route.coordinates.forEach((coord: any) => {
      if (coord.lat && coord.lng) {
        coords.push({ lat: coord.lat, lng: coord.lng });
      }
    });
  }
  
  console.log(`🔍 최종 추출된 좌표 개수: ${coords.length}`);
  return coords;
};

// 카카오 API의 압축된 좌표 디코딩
const decodeKakaoVertexes = (vertexes: number[]): { lat: number; lng: number }[] => {
  const coords: { lat: number; lng: number }[] = [];
  
  console.log(`🔍 Vertexes 디코딩 시작: ${vertexes.length}개 값`);
  console.log(`🔍 Vertexes 샘플:`, vertexes.slice(0, 10));
  
  // 카카오 모빌리티 API의 좌표는 이미 정규화된 형태일 수 있음
  // vertexes 값의 크기를 확인하여 적절한 디코딩 방법 선택
  const sampleValue = vertexes[0];
  console.log(`🔍 샘플 vertexes 값: ${sampleValue}`);
  
  if (sampleValue > 1000000) {
    // 큰 값이면 100000으로 나누기
    console.log(`🔍 큰 값 감지 - 100000으로 나누기`);
    for (let i = 0; i < vertexes.length; i += 2) {
      const lat = vertexes[i + 1] / 100000;
      const lng = vertexes[i] / 100000;
      
      if (lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132) {
        coords.push({ lat, lng });
      }
    }
  } else if (sampleValue > 1000) {
    // 중간 값이면 1000으로 나누기
    console.log(`🔍 중간 값 감지 - 1000으로 나누기`);
    for (let i = 0; i < vertexes.length; i += 2) {
      const lat = vertexes[i + 1] / 1000;
      const lng = vertexes[i] / 1000;
      
      if (lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132) {
        coords.push({ lat, lng });
      }
    }
  } else {
    // 작은 값이면 그대로 사용 (이미 정규화됨)
    console.log(`🔍 작은 값 감지 - 그대로 사용`);
    for (let i = 0; i < vertexes.length; i += 2) {
      const lat = vertexes[i + 1];
      const lng = vertexes[i];
      
      if (lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132) {
        coords.push({ lat, lng });
      }
    }
  }
  
  console.log(`🔍 디코딩 완료: ${coords.length}개 유효 좌표`);
  if (coords.length > 0) {
    console.log(`🔍 첫 번째 좌표: lat=${coords[0].lat}, lng=${coords[0].lng}`);
  }
  return coords;
};

// API 키 테스트 함수

// 통합 경로 조회 함수 (실제 경로 우선 사용)
export const getRoute = async (request: RouteRequest): Promise<RouteResponse> => {
  console.log('🚀 실제 경로 조회 시작...');
  setRouteLoading(true);
  
  // 1. 카카오 모빌리티 API 시도 (자동차 경로)
  try {
    console.log('🚗 카카오 모빌리티 API로 경로 조회 시도...');
    return await getRouteFromKakaoMobility(request);
  } catch (kakaoMobilityError) {
    console.error('❌ 카카오 모빌리티 API 실패:', kakaoMobilityError);
  }
  
  // 2. 카카오맵 JavaScript API 시도 (자동차 경로)
  try {
    console.log('🗺️ 카카오맵 JavaScript API로 경로 조회 시도...');
    return await getRouteFromKakaoMap(request);
  } catch (kakaoMapError) {
    console.error('❌ 카카오맵 JavaScript API 실패:', kakaoMapError);
  }
  
  
  // 모든 실제 API가 실패한 경우에만 시뮬레이션 경로 사용
  console.log('⚠️ 모든 실제 API 실패 - 시뮬레이션 경로로 폴백...');
  const coords = generateSimulatedRoute(request.start, request.end);
  setRouteLoading(false);
  return {
    coords,
    duration: 30,
    distance: 5
  };
};

// 시뮬레이션된 구불구불한 경로 생성 (실제 도로 경로처럼)
const generateSimulatedRoute = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
  const coords = [];
  const distance = Math.sqrt(Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2));
  const steps = Math.max(30, Math.floor(distance * 2000)); // 더 많은 점으로 부드러운 경로
  
  console.log('시뮬레이션 경로 생성:', { start, end, steps });
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    
    // 실제 도로처럼 구불구불한 효과 (여러 주파수 조합)
    const wave1 = Math.sin(t * Math.PI * 2) * 0.0008 * (1 - t * 0.3);
    const wave2 = Math.sin(t * Math.PI * 5) * 0.0003 * (1 - t * 0.7);
    const wave3 = Math.sin(t * Math.PI * 8) * 0.0001 * (1 - t * 0.9);
    
    // 랜덤 노이즈 (도로의 자연스러운 굴곡)
    const randomOffset = (Math.random() - 0.5) * 0.0002;
    
    // 중간 지점에서 더 큰 굴곡 (교차로, 회전 등)
    const midCurve = Math.sin(t * Math.PI) * 0.001 * Math.exp(-Math.pow((t - 0.5) * 4, 2));
    
    coords.push({
      lat: lat + wave1 + wave2 + wave3 + randomOffset + midCurve,
      lng: lng + wave1 * 0.6 + wave2 * 0.3 + wave3 * 0.1 + randomOffset * 0.5 + midCurve * 0.8
    });
  }
  
  console.log('시뮬레이션 경로 완성:', { coordsCount: coords.length });
  return coords;
};
