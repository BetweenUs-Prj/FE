import { API_BASE_URLS } from './config';

export interface StationInfo {
  id: number;
  name: string;
  lat: number;
  lng: number;
  duration: string;
  line?: string; // 지하철 노선 정보 추가
}

// TODO: Remove PlaceInfo interface after successful FE-BE connection
// This interface will be replaced with backend PlaceDto structure directly
export interface PlaceInfo {
  id: number;
  title: string;
  lat: number;
  lng: number;
  duration: string;
  category: 'cafe' | 'restaurant' | 'park' | 'shopping' | 'culture' | string;
  description?: string;
  address?: string;
  operatingHours?: string;
  contact?: string;
  rating?: number;
  reviewCount?: number;
}

export interface StationWithPlaces {
  station: StationInfo;
  places: PlaceInfo[];
}

// TODO: 백엔드 API로 받을 예정 - 현재는 하드코딩된 데이터 유지
// 주요 서울 지하철역 정보 데이터 (6개 역)
export const STATION_DATA: StationInfo[] = [
  { id: 1, name: "강남역", lat: 37.497942, lng: 127.027621, duration: "15분", line: "2호선" },
  { id: 2, name: "홍대입구역", lat: 37.557345, lng: 126.924965, duration: "25분", line: "2호선" },
  { id: 3, name: "건대입구역", lat: 37.540705, lng: 127.069880, duration: "30분", line: "2호선" },
  { id: 4, name: "잠실역", lat: 37.513262, lng: 127.100196, duration: "28분", line: "8호선" },
  { id: 5, name: "서울역", lat: 37.554676, lng: 126.970606, duration: "5분", line: "1호선" },
  { id: 6, name: "시청역", lat: 37.565598, lng: 126.976812, duration: "10분", line: "1호선" }
];

// Hardcoded place data removed - now using backend API only

// TODO: 백엔드 API 연동 시 이 함수들을 API 호출로 교체
// 역 정보 조회 함수
export const getStationById = (id: number): StationInfo | undefined => {
  return STATION_DATA.find(station => station.id === id);
};

// 통합 추천 장소 조회 함수 - 새로운 unified recommendation API 사용
// * RecommendationsController.java 연동 (프리셋/AI 자동 선택)
export const getPlacesByStationAndPurpose = async (stationId: number, purpose: string): Promise<PlaceInfo[]> => {
  try {
    const station = getStationById(stationId);
    if (!station) {
      console.warn(`Station ${stationId} not found`);
      return [];
    }

    console.log(`Calling unified recommendation API: station=${station.name}, purpose=${purpose}`);

    // 새로운 unified recommendation API 호출
    const response = await fetch(`${API_BASE_URLS.RECOMMENDATION_SERVICE}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stationName: station.name,
        purpose: purpose
      })
    });
    
    if (!response.ok) {
      console.warn(`Unified API call failed (station ${stationId}, purpose ${purpose}):`, response.status);
      return [];
    }
    
    const recommendationResponse = await response.json();
    console.log('Unified recommendation response:', recommendationResponse);
    
    // PlaceRecommendationResponse 구조에서 장소 데이터 파싱
    if (!recommendationResponse || !recommendationResponse.places || !Array.isArray(recommendationResponse.places)) {
      console.warn(`Empty recommendation response for station ${stationId}`);
      return [];
    }
    
    // PlaceDto 배열을 PlaceInfo 배열로 변환
    try {
      const places: PlaceInfo[] = recommendationResponse.places.map((placeDto: any) => ({
        id: placeDto.id || Math.random(), // 임시 ID if not provided
        title: placeDto.name || placeDto.title || 'Unknown Place',
        category: placeDto.category || '기타',
        description: placeDto.description,
        duration: placeDto.walkingTime || '도보 5분', // 기본값
        lat: placeDto.latitude || 37.5665,
        lng: placeDto.longitude || 126.9780
      }));
      
      console.log(`Successfully parsed ${places.length} places from unified API response`);
      return places;
      
    } catch (error) {
      console.error('Error parsing PlaceDto objects:', error);
      return [];
    }
    
  } catch (error) {
    console.error('Unified recommendation API error:', error);
    return [];
  }
};

// 역별 추천 장소 조회 함수 - API 연동 (기존 버전, 호환성 유지)
// * PlaceController.java, PlaceStationController.java 연동
export const getPlacesByStationId = async (stationId: number): Promise<PlaceInfo[]> => {
  try {
    // 1. 백엔드에서 장소-역 관계 정보 조회
    const relationshipsResponse = await fetch(`${API_BASE_URLS.RECOMMENDATION_SERVICE}/place-stations/by-station/${stationId}`);
    
    if (!relationshipsResponse.ok) {
      console.warn(`API 호출 실패 (station ${stationId}):`, relationshipsResponse.status);
      return [];
    }
    
    const relationships = await relationshipsResponse.json();
    
    if (!relationships || relationships.length === 0) {
      console.warn(`서버에 station ${stationId} 데이터 없음`);
      return [];
    }
    
    // 2. 각 관계에 대한 장소 상세 정보 조회
    const placePromises = relationships.map(async (rel: any) => {
      try {
        const placeResponse = await fetch(`${API_BASE_URLS.RECOMMENDATION_SERVICE}/places/${rel.placeId}`);
        if (!placeResponse.ok) {
          throw new Error(`Failed to fetch place ${rel.placeId}`);
        }
        return await placeResponse.json();
      } catch (error) {
        console.warn(`장소 정보 조회 실패 (placeId: ${rel.placeId}) - 해당 장소 스킵:`, error);
        return null;
      }
    });
    
    const places = await Promise.all(placePromises);
    const validPlaces = places.filter(place => place !== null);
    
    // 3. 백엔드 데이터를 프론트엔드 PlaceInfo 형식으로 변환
    return validPlaces.map((place: any) => ({
      id: place.id,
      title: place.name,
      lat: place.latitude,
      lng: place.longitude,
      duration: place.walkingTime || "도보 5분",
      category: place.category,
      description: place.description
    }));
    
  } catch (error) {
    console.error(`장소 조회 API 전체 실패 (station ${stationId}):`, error);
    return [];
  }
};

// 모든 역 정보 조회 함수
export const getAllStations = (): StationInfo[] => {
  return STATION_DATA;
};

// 노선별 역 조회 함수 추가
export const getStationsByLine = (line: string): StationInfo[] => {
  return STATION_DATA.filter(station => station.line === line);
};

// 특정 지역 근처 역 조회 함수 추가
export const getNearbyStations = (lat: number, lng: number, radius: number = 0.01): StationInfo[] => {
  return STATION_DATA.filter(station => {
    const distance = Math.sqrt(
      Math.pow(station.lat - lat, 2) + Math.pow(station.lng - lng, 2)
    );
    return distance <= radius;
  });
};

// 특정 장소 정보 직접 조회 함수 - API 연동
// * PlaceController.java의 getPlaceById 엔드포인트와 연동
export const getPlaceById = async (placeId: number): Promise<PlaceInfo | null> => {
  try {
    const response = await fetch(`${API_BASE_URLS.RECOMMENDATION_SERVICE}/places/${placeId}`);
    
    if (!response.ok) {
      console.warn(`장소 조회 실패 (placeId: ${placeId}):`, response.status);
      return null;
    }
    
    const place = await response.json();
    
    // 백엔드 데이터를 프론트엔드 PlaceInfo 형식으로 변환
    return {
      id: place.id,
      title: place.name,
      lat: place.latitude,
      lng: place.longitude,
      duration: place.walkingTime || "도보 5분",
      category: place.category,
      description: place.description
    };
    
  } catch (error) {
    console.error(`장소 조회 API 실패 (placeId: ${placeId}):`, error);
    return null;
  }
};
