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
  PROMISE_SERVICE: 'http://localhost:8081',
  RECOMMENDATION_SERVICE: 'http://localhost:8082'
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

// MiddlePointService API 실패 응답 더미 데이터
export const MIDDLE_POINT_API_ERRORS = {
  // 네트워크 연결 실패 (500)
  NETWORK_ERROR: {
    status: 500,
    error: "Internal Server Error",
    message: "MiddlePointService가 응답하지 않습니다. 네트워크 연결을 확인해주세요.",
    timestamp: "2024-01-15T10:30:00.000Z",
    path: "/api/middle/points/multiple-locations"
  },

  // 잘못된 요청 데이터 (400)
  INVALID_REQUEST: {
    status: 400,
    error: "Bad Request", 
    message: "입력 데이터가 올바르지 않습니다. 최소 2개 이상의 위치가 필요합니다.",
    timestamp: "2024-01-15T10:30:00.000Z",
    path: "/api/middle/points/multiple-locations",
    details: {
      validationErrors: [
        {
          field: "locations",
          message: "최소 2개 이상의 위치가 필요합니다.",
          rejectedValue: []
        }
      ]
    }
  },

  // 좌표 범위 초과 (400)
  COORDINATE_OUT_OF_BOUNDS: {
    status: 400,
    error: "Bad Request",
    message: "좌표가 유효한 범위를 벗어났습니다. 한국 내 좌표만 지원됩니다.",
    timestamp: "2024-01-15T10:30:00.000Z", 
    path: "/api/middle/points/multiple-locations",
    details: {
      supportedRegion: "대한민국 (위도: 33-43, 경도: 124-132)"
    }
  },

  // 지오코딩 서비스 실패 (503)
  GEOCODING_SERVICE_ERROR: {
    status: 503,
    error: "Service Unavailable",
    message: "지오코딩 서비스(카카오맵 API)에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    timestamp: "2024-01-15T10:30:00.000Z",
    path: "/api/middle/points/multiple-locations",
    details: {
      externalService: "KakaoMap Geocoding API",
      estimatedRecoveryTime: "2024-01-15T10:35:00.000Z"
    }
  },

  // 대중교통 API 실패 (503)
  ODSAY_API_ERROR: {
    status: 503,
    error: "Service Unavailable", 
    message: "대중교통 정보 서비스(ODsay API)에 연결할 수 없습니다. 교통 정보 없이 중간지점을 계산합니다.",
    timestamp: "2024-01-15T10:30:00.000Z",
    path: "/api/middle/points/multiple-locations",
    details: {
      externalService: "ODsay Public Transit API",
      fallbackMode: "geometry-only"
    }
  },

  // 권한 없음 (401)
  UNAUTHORIZED: {
    status: 401,
    error: "Unauthorized",
    message: "인증되지 않은 요청입니다. 로그인 후 다시 시도해주세요.",
    timestamp: "2024-01-15T10:30:00.000Z",
    path: "/api/middle/points/multiple-locations"
  },

  // 요청 한도 초과 (429)
  RATE_LIMIT: {
    status: 429,
    error: "Too Many Requests",
    message: "API 요청 한도를 초과했습니다. 1분 후 다시 시도해주세요.",
    timestamp: "2024-01-15T10:30:00.000Z", 
    path: "/api/middle/points/multiple-locations",
    details: {
      limitType: "requests_per_minute",
      limit: 60,
      resetTime: "2024-01-15T10:31:00.000Z"
    }
  },

  // 서버 과부하 (503)
  SERVER_OVERLOAD: {
    status: 503,
    error: "Service Unavailable",
    message: "서버가 과부하 상태입니다. 잠시 후 다시 시도해주세요.",
    timestamp: "2024-01-15T10:30:00.000Z",
    path: "/api/middle/points/multiple-locations",
    details: {
      serverLoad: "HIGH",
      estimatedWaitTime: "2-3분"
    }
  },

  // 처리 시간 초과 (504)
  TIMEOUT: {
    status: 504,
    error: "Gateway Timeout", 
    message: "요청 처리 시간이 초과되었습니다. 위치가 너무 멀거나 복잡한 계산이 필요한 경우 발생할 수 있습니다.",
    timestamp: "2024-01-15T10:30:00.000Z",
    path: "/api/middle/points/multiple-locations",
    details: {
      timeoutDuration: "30s",
      suggestion: "위치 수를 줄이거나 가까운 거리의 위치를 입력해보세요."
    }
  }
};

// 잘못된 요청 데이터 예시
export const INVALID_MIDDLE_POINT_REQUESTS = {
  // 빈 위치 배열
  EMPTY_LOCATIONS: {
    locations: [],
    maxCandidates: 5
  },
  
  // 단일 위치 (최소 2개 필요)
  SINGLE_LOCATION: {
    locations: [
      {
        userId: 1,
        address: "서울시 강남구",
        latitude: 37.5665,
        longitude: 126.9780
      }
    ],
    maxCandidates: 5
  },
  
  // 잘못된 좌표
  INVALID_COORDINATES: {
    locations: [
      {
        userId: 1,
        address: "서울시 강남구", 
        latitude: 999.0,  // 잘못된 위도
        longitude: 999.0  // 잘못된 경도
      },
      {
        userId: 2,
        address: "서울시 서초구",
        latitude: 37.4833,
        longitude: 127.0322
      }
    ],
    maxCandidates: 5
  }
};
