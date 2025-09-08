// 맵 관련 공통 유틸리티 함수들

// 친구별 색상 배열 (더 대비가 강한 색상)
export const FRIEND_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC', '#66BB6A'];

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

// segment에서 좌표 추출 (상세 경로용)
export const extractSegmentCoordinates = (segment: any): { lat: number; lng: number }[] => {
  const coords: { lat: number; lng: number }[] = [];
  
  console.log(`🗺️ segment 좌표 추출:`, {
    trafficType: segment.trafficTypeName,
    startPoint: { x: segment.startX, y: segment.startY },
    endPoint: { x: segment.endX, y: segment.endY },
    passStopsCount: segment.passStops?.length || 0
  });
  
  // segment가 유효하지 않은 경우 (모든 좌표가 null) 즉시 반환
  const hasValidStart = segment.startX && segment.startY;
  const hasValidEnd = segment.endX && segment.endY;
  const hasValidStops = segment.passStops && segment.passStops.length > 0 && 
                       segment.passStops.some((stop: any) => stop.x && stop.y);
  
  if (!hasValidStart && !hasValidEnd && !hasValidStops) {
    console.log(`⚠️ segment 좌표 정보 없음 - 건너뛰기 (trafficType: ${segment.trafficTypeName})`);
    return coords; // 빈 배열 반환
  }
  
  // segment 시작점 추가
  if (hasValidStart) {
    coords.push({ lat: segment.startY, lng: segment.startX });
  }
  
  // passStops에서 정류장/역 좌표 추출 (index 순서대로 정렬)
  if (hasValidStops) {
    const sortedStops = segment.passStops
      .filter((stop: any) => stop.x && stop.y) // 유효한 좌표만 필터링
      .sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
    
    sortedStops.forEach((stop: any, index: number) => {
      const stopCoord = { lat: stop.y, lng: stop.x };
      coords.push(stopCoord);
      console.log(`  📍 정류장 ${index + 1}: ${stop.stationName || 'Unknown'} (${stop.y}, ${stop.x})`);
    });
  }
  
  // segment 끝점 추가 (시작점과 다를 경우만)
  if (hasValidEnd) {
    const endCoord = { lat: segment.endY, lng: segment.endX };
    const lastCoord = coords[coords.length - 1];
    
    // 마지막 좌표와 끝점이 다른 경우에만 추가
    if (!lastCoord || 
        Math.abs(lastCoord.lat - endCoord.lat) > 0.0001 || 
        Math.abs(lastCoord.lng - endCoord.lng) > 0.0001) {
      coords.push(endCoord);
    }
  }
  
  // 좌표가 2개 미만이고 시작/끝점이 모두 유효한 경우 직선으로 보간
  if (coords.length < 2 && hasValidStart && hasValidEnd) {
    coords.length = 0; // 기존 좌표 제거
    coords.push({ lat: segment.startY, lng: segment.startX });
    coords.push({ lat: segment.endY, lng: segment.endX });
    console.log(`🔗 segment 직선 보간: 시작점 → 끝점`);
  }
  
  console.log(`✅ segment 좌표 추출 완료: ${coords.length}개 좌표`);
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
