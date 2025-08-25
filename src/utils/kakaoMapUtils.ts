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
