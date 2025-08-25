export interface StationInfo {
  id: number;
  name: string;
  lat: number;
  lng: number;
  duration: string;
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

// 역 정보 데이터
export const STATION_DATA: StationInfo[] = [
  { id: 1, name: "강남역", lat: 37.498095, lng: 127.027610, duration: "15분" },
  { id: 2, name: "홍대입구역", lat: 37.557192, lng: 126.925381, duration: "25분" },
  { id: 3, name: "신촌역", lat: 37.555161, lng: 126.936889, duration: "20분" },
  { id: 4, name: "이대역", lat: 37.556677, lng: 126.946013, duration: "18분" },
  { id: 5, name: "아현역", lat: 37.557345, lng: 126.956141, duration: "22분" },
  { id: 6, name: "충정로역", lat: 37.559973, lng: 126.963391, duration: "12분" }
];

// 역별 추천 장소 데이터
export const STATION_PLACES_DATA: Record<number, PlaceInfo[]> = {
  1: [ // 강남역
    { id: 1, title: "스타벅스 강남점", lat: 37.498195, lng: 127.027710, duration: "도보 3분", category: "cafe" },
    { id: 2, title: "맥도날드 강남점", lat: 37.499295, lng: 127.026810, duration: "도보 8분", category: "restaurant" },
    { id: 3, title: "강남공원", lat: 37.497395, lng: 127.028910, duration: "도보 12분", category: "park" },
    { id: 4, title: "강남타워", lat: 37.500495, lng: 127.025010, duration: "도보 15분", category: "shopping" },
    { id: 5, title: "강남문화센터", lat: 37.496595, lng: 127.029110, duration: "도보 18분", category: "culture" }
  ],
  2: [ // 홍대입구역
    { id: 6, title: "투썸플레이스 홍대점", lat: 37.557292, lng: 126.925481, duration: "도보 3분", category: "cafe" },
    { id: 7, title: "홍대맛집", lat: 37.558392, lng: 126.924581, duration: "도보 8분", category: "restaurant" },
    { id: 8, title: "홍대공원", lat: 37.556492, lng: 126.926681, duration: "도보 12분", category: "park" },
    { id: 9, title: "홍대상권", lat: 37.559592, lng: 126.923781, duration: "도보 15분", category: "shopping" },
    { id: 10, title: "홍대문화거리", lat: 37.555692, lng: 126.927881, duration: "도보 18분", category: "culture" }
  ],
  3: [ // 신촌역
    { id: 11, title: "이디야 신촌점", lat: 37.555261, lng: 126.936989, duration: "도보 3분", category: "cafe" },
    { id: 12, title: "신촌맛집", lat: 37.556361, lng: 126.935089, duration: "도보 8분", category: "restaurant" },
    { id: 13, title: "신촌공원", lat: 37.554461, lng: 126.937189, duration: "도보 12분", category: "park" },
    { id: 14, title: "신촌상권", lat: 37.557561, lng: 126.934289, duration: "도보 15분", category: "shopping" },
    { id: 15, title: "신촌문화센터", lat: 37.553661, lng: 126.938389, duration: "도보 18분", category: "culture" }
  ],
  4: [ // 이대역
    { id: 16, title: "할리스 이대점", lat: 37.556777, lng: 126.946113, duration: "도보 3분", category: "cafe" },
    { id: 17, title: "이대맛집", lat: 37.557877, lng: 126.945213, duration: "도보 8분", category: "restaurant" },
    { id: 18, title: "이대공원", lat: 37.555977, lng: 126.947313, duration: "도보 12분", category: "park" },
    { id: 19, title: "이대상권", lat: 37.558977, lng: 126.944413, duration: "도보 15분", category: "shopping" },
    { id: 20, title: "이대문화센터", lat: 37.555077, lng: 126.948513, duration: "도보 18분", category: "culture" }
  ],
  5: [ // 아현역
    { id: 21, title: "빽다방 아현점", lat: 37.557445, lng: 126.956241, duration: "도보 3분", category: "cafe" },
    { id: 22, title: "아현맛집", lat: 37.558545, lng: 126.955341, duration: "도보 8분", category: "restaurant" },
    { id: 23, title: "아현공원", lat: 37.556645, lng: 126.957441, duration: "도보 12분", category: "park" },
    { id: 24, title: "아현상권", lat: 37.559645, lng: 126.954541, duration: "도보 15분", category: "shopping" },
    { id: 25, title: "아현문화센터", lat: 37.555745, lng: 126.958641, duration: "도보 18분", category: "culture" }
  ],
  6: [ // 충정로역
    { id: 26, title: "메가MGC 충정로점", lat: 37.560073, lng: 126.963491, duration: "도보 3분", category: "cafe" },
    { id: 27, title: "충정로맛집", lat: 37.561173, lng: 126.962591, duration: "도보 8분", category: "restaurant" },
    { id: 28, title: "충정로공원", lat: 37.559273, lng: 126.964691, duration: "도보 12분", category: "park" },
    { id: 29, title: "충정로상권", lat: 37.562273, lng: 126.961791, duration: "도보 15분", category: "shopping" },
    { id: 30, title: "충정로문화센터", lat: 37.558373, lng: 126.965891, duration: "도보 18분", category: "culture" }
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
