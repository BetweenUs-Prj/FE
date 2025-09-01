import { API_BASE_URL } from '../config/api';

/**
 * SSE 클라이언트 유틸리티
 * WebSocket을 대체하여 실시간 이벤트 수신
 */
export interface SSEClientOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onEvent?: (eventType: string, data: any) => void;
  onHeartbeat?: () => void;
  enablePollingFallback?: boolean;
  pollingInterval?: number; // ms, 기본값 2000
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private isConnected = false;
  private options: SSEClientOptions;
  private sessionId: string;
  private endpoint: string;
  private pollingTimer: NodeJS.Timeout | null = null;
  private lastEventTime = 0;
  
  constructor(sessionId: string, endpoint: 'sessions' | 'reaction' | 'quiz', options: SSEClientOptions = {}) {
    this.sessionId = sessionId;
    this.endpoint = endpoint;
    this.options = {
      enablePollingFallback: true,
      pollingInterval: 2000,
      ...options
    };
  }

  /**
   * SSE 연결 시작
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${API_BASE_URL}/api/sse/${this.endpoint}/${this.sessionId}/subscribe`;
        console.log(`[SSE] Connecting to ${url}`);
        
        this.eventSource = new EventSource(url, {
          withCredentials: true
        });

        this.eventSource.onopen = () => {
          console.log('[SSE] Connected successfully');
          this.isConnected = true;
          this.lastEventTime = Date.now();
          this.options.onConnect?.();
          resolve();
        };

        this.eventSource.onerror = (error) => {
          console.error('[SSE] Connection error:', error);
          this.isConnected = false;
          this.options.onError?.(error);
          
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.options.onDisconnect?.();
            this.startPollingFallback();
          }
          
          reject(error);
        };

        // 공통 이벤트 핸들러들
        this.setupEventHandlers();
        
        // 연결 타임아웃 (10초)
        setTimeout(() => {
          if (!this.isConnected) {
            console.warn('[SSE] Connection timeout, starting polling fallback');
            this.close();
            this.startPollingFallback();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('[SSE] Failed to create connection:', error);
        this.startPollingFallback();
        reject(error);
      }
    });
  }

  /**
   * SSE 이벤트 핸들러 설정
   */
  private setupEventHandlers() {
    if (!this.eventSource) return;

    // 연결 확인 이벤트
    this.eventSource.addEventListener('connected', (event) => {
      console.log('[SSE] Connection confirmed:', event.data);
    });

    this.eventSource.addEventListener('reaction-connected', (event) => {
      console.log('[SSE] Reaction game connected:', event.data);
    });

    this.eventSource.addEventListener('quiz-connected', (event) => {
      console.log('[SSE] Quiz game connected:', event.data);
    });

    // 하트비트
    this.eventSource.addEventListener('heartbeat', (event) => {
      this.lastEventTime = Date.now();
      this.options.onHeartbeat?.();
    });

    // 게임별 이벤트들
    const gameEvents = [
      'ready-status', 'game-start', 'game-end', 'session-state',
      'round-start', 'round-end', 'round-update', 'final-results',
      'session-closed', 'scoreboard', 'game-result', 'connection-update',
      'all-players-ready', 'game-error', 'recovery-complete',
      'lobby-update', 'session-cancelled', 'player-kicked',
      'members-update', 'initial-scoreboard'
    ];

    gameEvents.forEach(eventType => {
      this.eventSource?.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`[SSE] Received ${eventType}:`, data);
          this.lastEventTime = Date.now();
          this.options.onEvent?.(eventType, data);
        } catch (error) {
          console.error(`[SSE] Failed to parse ${eventType} data:`, event.data, error);
        }
      });
    });

    // 일반 메시지 이벤트
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] Received message:', data);
        this.lastEventTime = Date.now();
        this.options.onEvent?.('message', data);
      } catch (error) {
        console.error('[SSE] Failed to parse message:', event.data, error);
      }
    };
  }

  /**
   * 폴링 백업 시작
   */
  private startPollingFallback() {
    if (!this.options.enablePollingFallback || this.pollingTimer) return;

    console.log('[SSE] Starting polling fallback');
    this.pollingTimer = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/polling/sessions/${this.sessionId}/state`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          this.options.onEvent?.('polling-update', data);
        }
      } catch (error) {
        console.error('[SSE] Polling fallback failed:', error);
      }
    }, this.options.pollingInterval);
  }

  /**
   * 폴링 백업 중지
   */
  private stopPollingFallback() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      console.log('[SSE] Polling fallback stopped');
    }
  }

  /**
   * 연결 상태 확인
   */
  isAlive(): boolean {
    if (this.isConnected && this.eventSource?.readyState === EventSource.OPEN) {
      // 30초 이상 이벤트를 받지 못하면 연결이 끊어진 것으로 판단
      return (Date.now() - this.lastEventTime) < 30000;
    }
    return false;
  }

  /**
   * 연결 종료
   */
  close() {
    console.log('[SSE] Closing connection');
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.stopPollingFallback();
    this.isConnected = false;
    this.options.onDisconnect?.();
  }

  /**
   * 재연결 시도
   */
  async reconnect(): Promise<void> {
    console.log('[SSE] Attempting to reconnect');
    this.close();
    
    // 잠시 대기 후 재연결
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.connect();
  }
}

/**
 * SSE 클라이언트 팩토리
 */
export const createSSEClient = (
  sessionId: string, 
  gameType: 'reaction' | 'quiz' | 'general' = 'general',
  options: SSEClientOptions = {}
): SSEClient => {
  const endpoint = gameType === 'general' ? 'sessions' : gameType;
  return new SSEClient(sessionId, endpoint, options);
};

/**
 * React Hook용 SSE 클라이언트
 */
export const useSSEClient = (
  sessionId: string | null,
  gameType: 'reaction' | 'quiz' | 'general' = 'general',
  options: SSEClientOptions = {}
) => {
  const [client, setClient] = React.useState<SSEClient | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!sessionId) return;

    const sseClient = createSSEClient(sessionId, gameType, {
      ...options,
      onConnect: () => {
        setIsConnected(true);
        options.onConnect?.();
      },
      onDisconnect: () => {
        setIsConnected(false);
        options.onDisconnect?.();
      }
    });

    setClient(sseClient);
    sseClient.connect().catch(console.error);

    return () => {
      sseClient.close();
      setClient(null);
    };
  }, [sessionId, gameType]);

  return { client, isConnected };
};

declare global {
  namespace React {
    function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  }
}