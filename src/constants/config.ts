export const KAKAO_MAP_APP_KEY = 'a4719916b48fc96916d269b6b35554a4';

// 카카오모빌리티 길찾기 API 키 (실제 API 키로 교체하세요)
export const KAKAO_MOBILITY_API_KEY = '43eada9de69514725083923fc08b8d7e';

export const DEFAULT_MAP_CENTER = {
  lat: 33.450701,
  lng: 126.570667
};

export const SEOUL_CENTER = {
  lat: 37.5665,
  lng: 126.9780
};

export const DEFAULT_MAP_LEVEL = 3;

export const API_BASE_URLS = {
  PROMISE_SERVICE: 'http://localhost:8083/api',
  RECOMMENDATION_SERVICE: 'http://localhost:8082/api'
};

export const MAP_PRESETS = {
  DEFAULT: {
    center: DEFAULT_MAP_CENTER,
    level: DEFAULT_MAP_LEVEL,
    draggable: true,
    zoomable: true,
    scrollwheel: true
  },
  SEOUL: {
    center: SEOUL_CENTER,
    level: 5,
    draggable: true,
    zoomable: true,
    scrollwheel: true
  },
  READONLY: {
    center: DEFAULT_MAP_CENTER,
    level: 4,
    draggable: false,
    zoomable: false,
    scrollwheel: false
  }
};
