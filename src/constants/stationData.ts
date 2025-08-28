export interface StationInfo {
  id: number;
  name: string;
  lat: number;
  lng: number;
  duration: string;
  line?: string; // 지하철 노선 정보 추가
}

export interface PlaceInfo {
  id: number;
  title: string;
  lat: number;
  lng: number;
  duration: string;
  category: 'cafe' | 'restaurant' | 'park' | 'shopping' | 'culture';
}

export interface StationWithPlaces {
  station: StationInfo;
  places: PlaceInfo[];
}

// 주요 서울 지하철역 정보 데이터 (6개 역)
export const STATION_DATA: StationInfo[] = [
  { id: 1, name: "강남역", lat: 37.497942, lng: 127.027621, duration: "15분", line: "2호선" },
  { id: 2, name: "홍대입구역", lat: 37.557345, lng: 126.924965, duration: "25분", line: "2호선" },
  { id: 3, name: "건대입구역", lat: 37.540705, lng: 127.069880, duration: "30분", line: "2호선" },
  { id: 4, name: "잠실역", lat: 37.513262, lng: 127.100196, duration: "28분", line: "8호선" },
  { id: 5, name: "서울역", lat: 37.554676, lng: 126.970606, duration: "5분", line: "1호선" },
  { id: 6, name: "시청역", lat: 37.565598, lng: 126.976812, duration: "10분", line: "1호선" }
];

// 역별 추천 장소 데이터 (각 역당 6개씩) - 실제 출구 기준 도보 거리
export const STATION_PLACES_DATA: Record<number, PlaceInfo[]> = {
  1: [ // 강남역
    { id: 1, title: "강남역 지하상가", lat: 37.497942, lng: 127.027621, duration: "도보 1분", category: "shopping" },
    { id: 2, title: "강남대로", lat: 37.498942, lng: 127.026621, duration: "도보 3분", category: "shopping" },
    { id: 3, title: "강남역 맛집거리", lat: 37.496942, lng: 127.028621, duration: "도보 5분", category: "restaurant" },
    { id: 4, title: "강남역 카페거리", lat: 37.497442, lng: 127.027121, duration: "도보 2분", category: "cafe" },
    { id: 5, title: "강남역 버스터미널", lat: 37.499942, lng: 127.025621, duration: "도보 8분", category: "culture" },
    { id: 6, title: "강남공원", lat: 37.496442, lng: 127.029121, duration: "도보 10분", category: "park" }
  ],
  2: [ // 홍대입구역
    { id: 7, title: "홍대거리", lat: 37.557845, lng: 126.924465, duration: "도보 3분", category: "shopping" },
    { id: 8, title: "홍대클럽거리", lat: 37.558845, lng: 126.923465, duration: "도보 8분", category: "culture" },
    { id: 9, title: "홍대맛집거리", lat: 37.556845, lng: 126.925465, duration: "도보 5분", category: "restaurant" },
    { id: 10, title: "홍대카페거리", lat: 37.557345, lng: 126.924965, duration: "도보 1분", category: "cafe" },
    { id: 11, title: "홍대공원", lat: 37.556345, lng: 126.926465, duration: "도보 12분", category: "park" },
    { id: 12, title: "홍대문화거리", lat: 37.558345, lng: 126.923965, duration: "도보 10분", category: "culture" }
  ],
  3: [ // 건대입구역
    { id: 13, title: "건대입구역 지하상가", lat: 37.540705, lng: 127.069880, duration: "도보 1분", category: "shopping" },
    { id: 14, title: "건대맛집거리", lat: 37.541705, lng: 127.068880, duration: "도보 5분", category: "restaurant" },
    { id: 15, title: "건대카페거리", lat: 37.539705, lng: 127.070880, duration: "도보 8분", category: "cafe" },
    { id: 16, title: "건대공원", lat: 37.543705, lng: 127.067880, duration: "도보 10분", category: "park" },
    { id: 17, title: "건대문화센터", lat: 37.538705, lng: 127.071880, duration: "도보 12분", category: "culture" },
    { id: 18, title: "건대상권", lat: 37.542705, lng: 127.068880, duration: "도보 15분", category: "shopping" }
  ],
  4: [ // 잠실역
    { id: 19, title: "잠실역 지하상가", lat: 37.513262, lng: 127.100196, duration: "도보 1분", category: "shopping" },
    { id: 20, title: "잠실맛집거리", lat: 37.514262, lng: 127.099196, duration: "도보 5분", category: "restaurant" },
    { id: 21, title: "잠실카페거리", lat: 37.512262, lng: 127.101196, duration: "도보 8분", category: "cafe" },
    { id: 22, title: "잠실공원", lat: 37.516262, lng: 127.097196, duration: "도보 10분", category: "park" },
    { id: 23, title: "잠실문화센터", lat: 37.511262, lng: 127.102196, duration: "도보 12분", category: "culture" },
    { id: 24, title: "잠실상권", lat: 37.515262, lng: 127.098196, duration: "도보 15분", category: "shopping" }
  ],
  5: [ // 서울역
    { id: 25, title: "서울역", lat: 37.554676, lng: 126.970606, duration: "도보 1분", category: "culture" },
    { id: 26, title: "서울역 지하상가", lat: 37.554676, lng: 126.970606, duration: "도보 1분", category: "shopping" },
    { id: 27, title: "서울역 맛집거리", lat: 37.553676, lng: 126.971606, duration: "도보 5분", category: "restaurant" },
    { id: 28, title: "서울역 카페거리", lat: 37.555676, lng: 126.969606, duration: "도보 8분", category: "cafe" },
    { id: 29, title: "서울역 공원", lat: 37.552676, lng: 126.972606, duration: "도보 10분", category: "park" },
    { id: 30, title: "서울역 문화센터", lat: 37.556676, lng: 126.969606, duration: "도보 12분", category: "culture" }
  ],
  6: [ // 시청역
    { id: 31, title: "서울시청", lat: 37.565598, lng: 126.976812, duration: "도보 3분", category: "culture" },
    { id: 32, title: "시청역 지하상가", lat: 37.565598, lng: 126.976812, duration: "도보 1분", category: "shopping" },
    { id: 33, title: "시청역 맛집거리", lat: 37.564598, lng: 126.977812, duration: "도보 8분", category: "restaurant" },
    { id: 34, title: "시청역 카페거리", lat: 37.566598, lng: 126.975812, duration: "도보 10분", category: "cafe" },
    { id: 35, title: "시청역 공원", lat: 37.563598, lng: 126.978812, duration: "도보 12분", category: "park" },
    { id: 36, title: "시청역 문화센터", lat: 37.567598, lng: 126.975812, duration: "도보 15분", category: "culture" }
  ]
};

// 역 정보 조회 함수
export const getStationById = (id: number): StationInfo | undefined => {
  return STATION_DATA.find(station => station.id === id);
};

// 역별 추천 장소 조회 함수
export const getPlacesByStationId = (stationId: number): PlaceInfo[] => {
  return STATION_PLACES_DATA[stationId] || [];
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
