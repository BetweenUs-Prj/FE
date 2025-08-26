import type { StationInfo, PlaceInfo } from '../constants/stationData';

// 두 지점 간의 거리 계산 (하버사인 공식)
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 중간 지점 계산
export const calculateMiddlePoint = (lat1: number, lng1: number, lat2: number, lng2: number): { lat: number, lng: number } => {
  return {
    lat: (lat1 + lat2) / 2,
    lng: (lng1 + lng2) / 2
  };
};

// 여러 지점의 중심점 계산
export const calculateCenterPoint = (points: Array<{ lat: number, lng: number }>): { lat: number, lng: number } => {
  if (points.length === 0) {
    return { lat: 37.5665, lng: 126.9780 }; // 서울시청 기본값
  }
  
  const sumLat = points.reduce((sum, point) => sum + point.lat, 0);
  const sumLng = points.reduce((sum, point) => sum + point.lng, 0);
  
  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  };
};

// 가장 가까운 역 찾기
export const findNearestStation = (targetLat: number, targetLng: number, stations: StationInfo[]): StationInfo | null => {
  if (stations.length === 0) return null;
  
  let nearestStation = stations[0];
  let minDistance = calculateDistance(targetLat, targetLng, nearestStation.lat, nearestStation.lng);
  
  for (const station of stations) {
    const distance = calculateDistance(targetLat, targetLng, station.lat, station.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  }
  
  return nearestStation;
};

// 역 주변 추천 장소 필터링 (거리 기반)
export const filterNearbyPlaces = (
  stationLat: number, 
  stationLng: number, 
  places: PlaceInfo[], 
  maxDistance: number = 2 // 2km 이내
): PlaceInfo[] => {
  return places.filter(place => {
    const distance = calculateDistance(stationLat, stationLng, place.lat, place.lng);
    return distance <= maxDistance;
  });
};

// 카테고리별 추천 장소 필터링
export const filterPlacesByCategory = (places: PlaceInfo[], category: PlaceInfo['category']): PlaceInfo[] => {
  return places.filter(place => place.category === category);
};

// 카카오맵 마커 생성 유틸리티
export const createMapMarker = (
  map: any, 
  position: { lat: number, lng: number }, 
  title: string,
  options?: {
    imageSrc?: string;
    imageSize?: { width: number, height: number };
    imageOffset?: { x: number, y: number };
  }
) => {
  const marker = new window.kakao.maps.Marker({
    position: new window.kakao.maps.LatLng(position.lat, position.lng),
    map: map
  });

  // 커스텀 이미지가 있는 경우
  if (options?.imageSrc) {
    const image = new window.kakao.maps.MarkerImage(
      options.imageSrc,
      new window.kakao.maps.Size(options.imageSize?.width || 24, options.imageSize?.height || 24),
      {
        offset: new window.kakao.maps.Point(options.imageOffset?.x || 12, options.imageOffset?.y || 12)
      }
    );
    marker.setImage(image);
  }

  // 인포윈도우 생성
  const infowindow = new window.kakao.maps.InfoWindow({
    content: `<div style="padding:5px;font-size:12px;">${title}</div>`
  });

  // 마커 클릭 시 인포윈도우 표시
  window.kakao.maps.event.addListener(marker, 'click', function() {
    infowindow.open(map, marker);
  });

  return { marker, infowindow };
};

// 경로 그리기 유틸리티
export const drawPath = (
  map: any, 
  points: Array<{ lat: number, lng: number }>,
  options?: {
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
  }
) => {
  const path = new window.kakao.maps.Polyline({
    path: points.map(point => new window.kakao.maps.LatLng(point.lat, point.lng)),
    strokeColor: options?.strokeColor || '#FF0000',
    strokeWeight: options?.strokeWeight || 3,
    strokeOpacity: options?.strokeOpacity || 0.7
  });

  path.setMap(map);
  return path;
};

// 장소 검색 결과 타입
export interface PlaceSearchResult {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  category_name: string;
  place_url: string;
  x: string; // longitude
  y: string; // latitude
}

// 카카오맵 장소 검색
export const searchPlaces = async (keyword: string): Promise<PlaceSearchResult[]> => {
  return new Promise((resolve, reject) => {
    console.log('=== 장소 검색 시작 ===');
    console.log('검색 키워드:', keyword);
    console.log('window.kakao 존재:', !!window.kakao);
    console.log('window.kakao.maps 존재:', !!window.kakao?.maps);
    console.log('window.kakao.maps.services 존재:', !!window.kakao?.maps?.services);
    
    if (!window.kakao || !window.kakao.maps) {
      console.error('❌ 카카오맵 API가 로드되지 않았습니다.');
      reject(new Error('Kakao Maps API is not loaded'));
      return;
    }

    if (!window.kakao.maps.services) {
      console.error('❌ Places 서비스가 로드되지 않았습니다.');
      reject(new Error('Places service is not loaded'));
      return;
    }

    try {
      const places = new window.kakao.maps.services.Places();
      console.log('✅ Places 서비스 생성됨');
      
      places.keywordSearch(keyword, (results: PlaceSearchResult[], status: any) => {
        console.log('🔍 검색 콜백 호출됨');
        console.log('상태:', status);
        console.log('결과 개수:', results?.length);
        console.log('결과 샘플:', results?.[0]);
        
        if (status === window.kakao.maps.services.Status.OK) {
          console.log('✅ 검색 성공');
          resolve(results);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          console.log('⚠️ 검색 결과 없음');
          resolve([]);
        } else {
          console.error('❌ 검색 실패:', status);
          reject(new Error(`Place search failed with status: ${status}`));
        }
      });
    } catch (error) {
      console.error('❌ Places 서비스 생성 실패:', error);
      reject(error);
    }
  });
};

// 장소 검색 결과를 좌표로 변환
export const convertPlaceToCoordinates = (place: PlaceSearchResult): { lat: number, lng: number } => {
  return {
    lat: parseFloat(place.y),
    lng: parseFloat(place.x)
  };
};

// 주소 검색 결과 타입
export interface AddressSearchResult {
  address_name: string;
  address_type: string;
  b_code: string;
  b_name: string;
  h_code: string;
  h_name: string;
  main_address_no: string;
  mountain_yn: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_h_name: string;
  region_3depth_name: string;
  sub_address_no: string;
  x: string; // longitude
  y: string; // latitude
  // 추가 필드들 (실제 API 응답에 따라)
  [key: string]: any;
}

// 카카오맵 주소 검색
export const searchAddresses = async (keyword: string): Promise<AddressSearchResult[]> => {
  return new Promise((resolve, reject) => {
    console.log('=== 주소 검색 시작 ===');
    console.log('검색 키워드:', keyword);
    console.log('window.kakao 존재:', !!window.kakao);
    console.log('window.kakao.maps 존재:', !!window.kakao?.maps);
    console.log('window.kakao.maps.services 존재:', !!window.kakao?.maps?.services);
    
    if (!window.kakao || !window.kakao.maps) {
      console.error('❌ 카카오맵 API가 로드되지 않았습니다.');
      reject(new Error('Kakao Maps API is not loaded'));
      return;
    }

    if (!window.kakao.maps.services) {
      console.error('❌ Geocoder 서비스가 로드되지 않았습니다.');
      reject(new Error('Geocoder service is not loaded'));
      return;
    }

    try {
      const geocoder = new window.kakao.maps.services.Geocoder();
      console.log('✅ Geocoder 서비스 생성됨');
      
      geocoder.addressSearch(keyword, (results: AddressSearchResult[], status: any) => {
        console.log('🔍 주소 검색 콜백 호출됨');
        console.log('상태:', status);
        console.log('결과 개수:', results?.length);
        console.log('결과 샘플:', results?.[0]);
        
        if (status === window.kakao.maps.services.Status.OK) {
          console.log('✅ 주소 검색 성공');
          resolve(results);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          console.log('⚠️ 주소 검색 결과 없음');
          resolve([]);
        } else {
          console.error('❌ 주소 검색 실패:', status);
          reject(new Error(`Address search failed with status: ${status}`));
        }
      });
    } catch (error) {
      console.error('❌ Geocoder 서비스 생성 실패:', error);
      reject(error);
    }
  });
};

// 통합 검색 결과 타입
export interface UnifiedSearchResult {
  id: string;
  name: string;
  address: string;
  type: 'place' | 'address';
  coordinates: { lat: number, lng: number };
}

// 광범위한 지역명 필터링 함수
const isTooBroadLocation = (name: string, address: string): boolean => {
  const broadPatterns = [
    // 구 단위 지역명 패턴
    /^[가-힣]+구$/,
    /^[가-힣]+시$/,
    /^[가-힣]+군$/,
    /^[가-힣]+동$/,
    /^[가-힣]+읍$/,
    /^[가-힣]+면$/,
    
    // 서울시 구들
    /^강남$/,
    /^강북$/,
    /^강서$/,
    /^강동$/,
    /^노원$/,
    /^도봉$/,
    /^동대문$/,
    /^동작$/,
    /^마포$/,
    /^서대문$/,
    /^서초$/,
    /^성동$/,
    /^성북$/,
    /^송파$/,
    /^양천$/,
    /^영등포$/,
    /^용산$/,
    /^은평$/,
    /^종로$/,
    /^중구$/,
    /^중랑$/,
    
    // 광역시/도 단위
    /^서울$/,
    /^부산$/,
    /^대구$/,
    /^인천$/,
    /^광주$/,
    /^대전$/,
    /^울산$/,
    /^세종$/,
    /^제주$/,
    /^경기$/,
    /^강원$/,
    /^충북$/,
    /^충남$/,
    /^전북$/,
    /^전남$/,
    /^경북$/,
    /^경남$/,
    
    // 경기도 주요 지역들
    /^퇴계원$/,
    /^분당$/,
    /^판교$/,
    /^일산$/,
    /^평촌$/,
    /^과천$/,
    /^의왕$/,
    /^군포$/,
    /^안양$/,
    /^부천$/,
    /^광명$/,
    /^시흥$/,
    /^안산$/,
    /^수원$/,
    /^성남$/,
    /^하남$/,
    /^구리$/,
    /^남양주$/,
    /^가평$/,
    /^양평$/,
    /^여주$/,
    /^이천$/,
    /^용인$/,
    /^안성$/,
    /^평택$/,
    /^오산$/,
    /^화성$/,
    /^김포$/,
    /^고양$/,
    /^파주$/,
    /^연천$/,
    /^포천$/,
    /^동두천$/,
    /^의정부$/,
    /^양주$/
  ];

  // 이름이나 주소가 광범위한 패턴과 일치하는지 확인
  const isBroadName = broadPatterns.some(pattern => pattern.test(name.trim()));
  const isBroadAddress = broadPatterns.some(pattern => pattern.test(address.trim()));

  // 주소가 너무 짧거나 구체적이지 않은 경우도 제외
  const isTooShortAddress = address.length < 10;
  const isGenericAddress = /^[가-힣]+[시군구]/.test(address);
  
  // 구체적인 장소나 주소인지 확인하는 조건들
  const hasSpecificLocation = 
    // 건물명, 상호명이 포함된 경우
    /(빌딩|타워|센터|플라자|몰|마트|백화점|병원|학교|대학교|역|정류장|공원|극장|영화관|카페|레스토랑|식당|호텔|모텔|아파트|빌라|오피스텔)/.test(name) ||
    // 도로명 + 번지 형태
    /[0-9]+-[0-9]+/.test(address) ||
    // 구체적인 번지
    /[가-힣]+[0-9]+동/.test(address) ||
    // 건물번호가 포함된 경우
    /[0-9]+호/.test(address);

  // 광범위하거나 구체적이지 않은 경우 필터링
  return (isBroadName || isBroadAddress || isTooShortAddress || isGenericAddress) && !hasSpecificLocation;
};

// 검색 결과 필터링 함수
const filterSearchResults = (results: UnifiedSearchResult[]): UnifiedSearchResult[] => {
  return results.filter(result => {
    const isTooBroad = isTooBroadLocation(result.name, result.address);
    
    if (isTooBroad) {
      console.log(`필터링됨: ${result.name} - ${result.address} (너무 광범위함)`);
    }
    
    return !isTooBroad;
  });
};

// 장소와 주소를 통합 검색
export const unifiedSearch = async (keyword: string): Promise<UnifiedSearchResult[]> => {
  try {
    console.log('=== 통합 검색 시작 ===');
    console.log('검색 키워드:', keyword);
    
    // 장소 검색과 주소 검색을 병렬로 실행
    const [placeResults, addressResults] = await Promise.allSettled([
      searchPlaces(keyword),
      searchAddresses(keyword)
    ]);

    console.log('장소 검색 결과:', placeResults.status, placeResults.status === 'fulfilled' ? placeResults.value?.length : '실패');
    console.log('주소 검색 결과:', addressResults.status, addressResults.status === 'fulfilled' ? addressResults.value?.length : '실패');

    const results: UnifiedSearchResult[] = [];

    // 장소 검색 결과 처리
    if (placeResults.status === 'fulfilled') {
      console.log('장소 검색 결과 처리 중...');
      placeResults.value.forEach((place, index) => {
        console.log(`장소 ${index + 1}:`, place.place_name, place.road_address_name || place.address_name);
        results.push({
          id: place.id,
          name: place.place_name,
          address: place.road_address_name || place.address_name,
          type: 'place',
          coordinates: { lat: parseFloat(place.y), lng: parseFloat(place.x) }
        });
      });
    } else {
      console.error('장소 검색 실패:', placeResults.reason);
    }

    // 주소 검색 결과 처리
    if (addressResults.status === 'fulfilled') {
      console.log('주소 검색 결과 처리 중...');
      console.log('주소 검색 결과 원본:', addressResults.value);
      
      addressResults.value.forEach((address, index) => {
        // 주소 구성 요소들을 안전하게 처리
        const region1 = address.region_1depth_name || '';
        const region2 = address.region_2depth_name || '';
        const region3 = address.region_3depth_name || '';
        
        // 주소명 구성 (더 안전한 방식)
        const fullAddress = address.address_name || '';
        const addressParts = [region1, region2, region3].filter(part => part && part.trim());
        const addressName = addressParts.length > 0 ? addressParts.join(' ') : fullAddress;
        
        // 주소명이 여전히 비어있으면 다른 필드들 사용
        let finalName = addressName;
        if (!finalName.trim()) {
          if (address.b_name && address.b_name.trim()) {
            finalName = address.b_name;
          } else if (address.h_name && address.h_name.trim()) {
            finalName = address.h_name;
          } else if (fullAddress) {
            finalName = fullAddress.split(' ').slice(0, 3).join(' '); // 주소의 앞부분만 사용
          }
        }
        
        console.log(`주소 ${index + 1}:`, {
          name: finalName,
          address: fullAddress,
          original: address
        });
        
        // 주소명이 비어있으면 건너뛰기
        if (!finalName.trim()) {
          console.log(`주소 ${index + 1} 건너뛰기: 주소명이 비어있음`);
          return;
        }
        
        results.push({
          id: `addr_${index}`,
          name: finalName,
          address: fullAddress,
          type: 'address',
          coordinates: { lat: parseFloat(address.y), lng: parseFloat(address.x) }
        });
      });
    } else {
      console.error('주소 검색 실패:', addressResults.reason);
    }

    // 필터링 적용
    const filteredResults = filterSearchResults(results);
    
    console.log('✅ 통합 검색 완료');
    console.log('필터링 전 결과:', results.length);
    console.log('필터링 후 결과:', filteredResults.length);
    
    return filteredResults;
  } catch (error) {
    console.error('❌ 통합 검색 실패:', error);
    return [];
  }
};
