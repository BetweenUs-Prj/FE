import axios, { AxiosHeaders } from 'axios';

// 개발환경: 프록시 경유, 운영환경: 절대경로
const API_BASE = import.meta.env.DEV ? '/api' : 'http://localhost:8080/api';
const UID_KEY = 'betweenUs_userUid';

function resolveUid(): string {
  const params = new URLSearchParams(location.search);
  const uidFromUrl = params.get('uid');

  const candidates = [
    uidFromUrl,
    localStorage.getItem(UID_KEY),
    sessionStorage.getItem(UID_KEY),
    localStorage.getItem('X-USER-UID'),
    sessionStorage.getItem('X-USER-UID'),
    localStorage.getItem('uid'),
    sessionStorage.getItem('uid'),
    localStorage.getItem('userUid'),
    sessionStorage.getItem('userUid'),
  ].filter(Boolean) as string[];

  let uid =
    candidates[0] ||
    `dev-user-${(crypto.randomUUID?.() ?? Math.random().toString(36)).slice(0, 8)}`;

  // 단일화 저장
  localStorage.setItem(UID_KEY, uid);
  sessionStorage.setItem(UID_KEY, uid);
  document.cookie = `X-USER-UID=${uid}; path=/`;

  // ✅ 레거시 키 정리
  ['userUid', 'uid', 'X-USER-UID'].forEach((k) => {
    if (k !== UID_KEY) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }
  });

  return uid;
}

// 어디서든 이걸로만 UID 읽게 export
export const getUid = () =>
  sessionStorage.getItem(UID_KEY) || localStorage.getItem(UID_KEY)!;


export const http = axios.create({ 
  baseURL: API_BASE,
  timeout: 20000, // 20초 타임아웃으로 상향
  headers: {
    'Content-Type': 'application/json'
  }
});

// 🚀 통합 타임아웃/재시도 유틸 (baseURL 보존)
interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
  shouldRetry?: (error: any) => boolean;
}

export const withTimeoutRetry = <T = any>(
  request: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeoutMs = 5000,
    shouldRetry = (error) => 
      error.code === 'ECONNABORTED' || 
      error.code === 'ERR_NETWORK' ||
      (error.response?.status >= 500 && error.response?.status < 600)
  } = config;

  return new Promise<T>((resolve, reject) => {
    let attemptCount = 0;

    const attemptRequest = async () => {
      attemptCount++;
      
      // 타임아웃 래핑
      const timeoutPromise = new Promise<never>((_, timeoutReject) => {
        setTimeout(() => {
          timeoutReject(new Error(`Request timeout after ${timeoutMs}ms (attempt ${attemptCount})`));
        }, timeoutMs);
      });

      try {
        const result = await Promise.race([request(), timeoutPromise]);
        resolve(result);
      } catch (error: any) {
        console.warn(`[withTimeoutRetry] Attempt ${attemptCount}/${maxRetries + 1} failed:`, {
          error: error.message,
          code: error.code,
          status: error.response?.status
        });

        // 재시도 조건 확인
        if (attemptCount <= maxRetries && shouldRetry(error)) {
          console.info(`[withTimeoutRetry] Retrying in ${retryDelay}ms... (${attemptCount}/${maxRetries})`);
          setTimeout(attemptRequest, retryDelay);
        } else {
          console.error(`[withTimeoutRetry] All retry attempts exhausted (${attemptCount}), rejecting`);
          reject(error);
        }
      }
    };

    attemptRequest();
  });
};

// 🎯 게임 시작 API 래퍼 (폴백 로직 포함)
export const startQuizSession = async (sessionId: number, options: { category?: string } = {}) => {
  console.log('[startQuizSession] Starting quiz session:', sessionId, options);

  return withTimeoutRetry(
    async () => {
      const response = await http.post(`/mini-games/sessions/${sessionId}/start`, options, {
        validateStatus: (status) => status < 500 // 4xx를 에러로 처리하지 않음
      });
      
      // 🚀 멱등성: 409(Already Started)도 성공으로 처리
      if (response.status === 409) {
        console.log('[startQuizSession] ✅ Game already started (409) - idempotent success');
        return response;
      }
      
      // 다른 4xx 에러는 예외로 던짐
      if (response.status >= 400 && response.status < 500) {
        const error = new Error(`Client error: ${response.status}`);
        (error as any).response = response;
        throw error;
      }
      
      return response;
    },
    {
      maxRetries: 2,
      retryDelay: 2000,
      timeoutMs: 8000, // 8초 타임아웃 (백엔드 atomic operation 고려)
      shouldRetry: (error) => {
        // 409는 재시도하지 않음 (이미 성공 처리됨)
        if (error.response?.status === 409) {
          return false;
        }
        
        // 재시도 조건: 네트워크 에러, 타임아웃, 5xx 서버 에러
        const shouldRetry = 
          error.code === 'ECONNABORTED' || 
          error.code === 'ERR_NETWORK' ||
          error.message?.includes('timeout') ||
          (error.response?.status >= 500 && error.response?.status < 600);
        
        console.log('[startQuizSession] Error analysis:', {
          code: error.code,
          status: error.response?.status,
          message: error.message,
          shouldRetry
        });
        
        return shouldRetry;
      }
    }
  );
};

// ECONNABORTED 재시도 로직
http.interceptors.response.use(
  response => response,
  async (error) => {
    const { config, code } = error;
    
    // ECONNABORTED 재시도 (최대 2회)
    if (code === 'ECONNABORTED' && config && !config._retryCount) {
      config._retryCount = 1;
      console.warn(`[HTTP] Timeout retry attempt for ${config.method?.toUpperCase()} ${config.url}`);
      return http(config);
    }
    
    return Promise.reject(error);
  }
);

http.interceptors.request.use((config) => {
  const headers = (config.headers ??= new AxiosHeaders());
  const uid = resolveUid();
  
  // [HOTFIX] 환경 편차 흡수 - 두 키 모두 전송 (서버에서 우선순위 처리)
  headers.set('X-USER-UID', uid); // 권장 표준 키
  headers.set('uid', uid); // 임시 호환성 (서버 고정 후 제거 예정)
  
  console.debug(`[HTTP] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
    params: config.params,
    data: config.data,
    uid,
    headers: { 'X-USER-UID': uid, 'uid': uid }
  });
  
  return config;
});

http.interceptors.response.use(
  (response) => {
    console.debug(`[HTTP] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[HTTP] ${error.response?.status || 'ERR'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);
