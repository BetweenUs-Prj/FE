// 맵 관련 공통 유틸리티 함수들

// 친구별 색상 배열
export const FRIEND_COLORS = ['#50C878', '#FFD93D', '#6C5CE7', '#A29BFE', '#FF9F43', '#10AC84'];

// 교통수단별 색상
export const TRANSPORT_COLORS = {
  '버스': '#FF6B6B',
  '지하철': '#4A90E2', 
  '도보': '#9E9E9E',
  '택시': '#FFD93D',
  '기타': '#8B4513'
};

// 친구별 색상 반환
export const getFriendColor = (friendIndex: number): string => {
  return FRIEND_COLORS[friendIndex % FRIEND_COLORS.length];
};

// 교통수단별 색상 반환
export const getTransportTypeColor = (transportType: string): string => {
  return TRANSPORT_COLORS[transportType as keyof typeof TRANSPORT_COLORS] || TRANSPORT_COLORS.기타;
};

// 좌표 유효성 검증
export const isValidCoordinates = (coordinates: { lat: number; lng: number } | undefined): boolean => {
  if (!coordinates) return false;
  return typeof coordinates.lat === 'number' && 
         typeof coordinates.lng === 'number' &&
         coordinates.lat !== 0 && 
         coordinates.lng !== 0;
};

// 친구 좌표 검증 및 경고
export const validateFriendCoordinates = (friend: any, friendIndex: number): boolean => {
  if (!isValidCoordinates(friend.coordinates)) {
    console.warn(`⚠️ 친구 ${friend.name || friendIndex + 1}의 좌표가 유효하지 않습니다:`, friend.coordinates);
    return false;
  }
  return true;
};

// segment에서 좌표 추출
export const extractSegmentCoordinates = (segment: any): { lat: number; lng: number }[] => {
  const coords: { lat: number; lng: number }[] = [];
  
  // segment 시작점 추가
  if (segment.startX && segment.startY) {
    coords.push({ lat: segment.startY, lng: segment.startX });
  }
  
  // passStops에서 정류장/역 좌표 추출 (index 순서대로 정렬)
  if (segment.passStops && segment.passStops.length > 0) {
    const sortedStops = segment.passStops.sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
    sortedStops.forEach((stop: any) => {
      if (stop.x && stop.y) {
        coords.push({ lat: stop.y, lng: stop.x });
      }
    });
  }
  
  // segment 끝점 추가 (시작점과 다를 경우만)
  if (segment.endX && segment.endY) {
    const endCoord = { lat: segment.endY, lng: segment.endX };
    const lastCoord = coords[coords.length - 1];
    if (!lastCoord || lastCoord.lat !== endCoord.lat || lastCoord.lng !== endCoord.lng) {
      coords.push(endCoord);
    }
  }
  
  return coords;
};

// 맵 중심점 계산
export const calculateMapCenter = (points: { lat: number; lng: number }[]): { lat: number; lng: number } => {
  if (points.length === 0) {
    return { lat: 37.5663, lng: 126.9779 }; // 서울시청 기본값
  }
  
  const centerLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const centerLng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
  
  return { lat: centerLat, lng: centerLng };
};
