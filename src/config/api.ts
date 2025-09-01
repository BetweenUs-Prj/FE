export const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export const API_ENDPOINTS = {
  // 세션 관리
  sessions: '/api/mini-games/sessions',
  
  // SSE 구독
  sse: {
    session: (sessionId: string) => `/api/sse/sessions/${sessionId}/subscribe`,
    reaction: (sessionId: string) => `/api/sse/reaction/${sessionId}/subscribe`,
    quiz: (sessionId: string) => `/api/sse/quiz/${sessionId}/subscribe`,
    status: (sessionId: string) => `/api/sse/sessions/${sessionId}/status`
  },
  
  // 폴링 백업
  polling: {
    sessionState: (sessionId: string) => `/api/polling/sessions/${sessionId}/state`,
    lobbyState: (sessionId: string) => `/api/polling/sessions/${sessionId}/lobby`,
    heartbeat: '/api/polling/heartbeat'
  },
  
  // 게임별 액션
  reaction: {
    click: (sessionId: string) => `/api/mini-games/reaction/${sessionId}/click`,
    ready: (sessionId: string) => `/api/mini-games/reaction/${sessionId}/ready`,
    start: (sessionId: string) => `/api/mini-games/reaction/${sessionId}/start`
  },
  
  quiz: {
    answer: (sessionId: string) => `/api/mini-games/quiz/${sessionId}/answer`,
    ready: (sessionId: string) => `/api/mini-games/quiz/${sessionId}/ready`,
    start: (sessionId: string) => `/api/mini-games/quiz/${sessionId}/start`,
    nextRound: (sessionId: string) => `/api/mini-games/quiz/${sessionId}/next-round`
  }
} as const;

/**
 * API 요청 헬퍼
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`[API] Request failed to ${url}:`, error);
    throw error;
  }
};

/**
 * JSON 응답 파싱 헬퍼
 */
export const apiJson = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await apiRequest(endpoint, options);
  return response.json();
};

/**
 * POST 요청 헬퍼
 */
export const apiPost = async <T = any>(
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> => {
  return apiJson<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
};

/**
 * GET 요청 헬퍼
 */
export const apiGet = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  return apiJson<T>(endpoint, {
    method: 'GET',
    ...options,
  });
};