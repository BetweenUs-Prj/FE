import { SSEClient, createSSEClient } from '../utils/sse-client';
import { apiPost, apiGet } from '../config/api';

export interface SSEConfig {
  userUid: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  debug?: boolean;
}

export function createStompClient(config: SSEConfig): SSEClient {
  // WebSocket에서 SSE로 마이그레이션을 위한 호환성 레이어
  console.log('[SSE] Creating SSE client instead of STOMP');
  return null as any; // 임시로 null 반환, 실제 사용처에서 SSE 클라이언트 직접 생성
}

export interface LobbySubscriptionConfig {
  client: any;
  sessionId: string;
  gameType: string; // 'QUIZ' | 'REACTION'
  onLobbyUpdate: (data: LobbyEventPayload) => void;
  onGameStart?: (data: any) => void;
  onKicked?: (data: any) => void;
}

export interface LobbyEventPayload {
  type: 'LOBBY_SNAPSHOT' | 'MEMBER_JOINED' | 'MEMBER_LEFT';
  sessionId: number;
  members: MemberInfo[];
  count: number;
  version?: number;
  timestamp: number;
}

export interface MemberInfo {
  uid: string;
  name: string;
  role: 'HOST' | 'MEMBER';
  score: number;
}

export function subscribeLobbyEvents(config: LobbySubscriptionConfig) {
  const { sessionId, gameType, onLobbyUpdate, onGameStart, onKicked } = config;
  
  // SSE 클라이언트 생성
  const sseClient = createSSEClient(
    sessionId,
    gameType.toLowerCase() as 'reaction' | 'quiz',
    {
      onEvent: (eventType, data) => {
        switch (eventType) {
          case 'lobby-update':
            onLobbyUpdate(data);
            break;
          case 'game-start':
          case 'session-start':
            onGameStart?.(data);
            break;
          case 'player-kicked':
            onKicked?.(data);
            break;
        }
      }
    }
  );

  // SSE 연결 시작
  sseClient.connect().catch(console.error);

  // 구독 해제 함수 반환
  return () => {
    console.log('[SSE] Unsubscribing from lobby events');
    sseClient.close();
  };
}

export interface PollingConfig {
  fetchFunction: () => Promise<void>;
  intervalMs?: number;
  enabled?: boolean;
}

export class PollingManager {
  private intervalId: NodeJS.Timeout | null = null;
  private config: PollingConfig;
  private visibilityHandler: (() => void) | null = null;

  constructor(config: PollingConfig) {
    this.config = { intervalMs: 2500, enabled: true, ...config };
    
    // 페이지 가시성 변경 시 강제 동기화
    this.setupVisibilitySync();
  }
  
  private setupVisibilitySync() {
    this.visibilityHandler = () => {
      if (!document.hidden) {
        console.log('[POLLING] Page visible, forcing sync');
        this.config.fetchFunction().catch(error => {
          console.error('[POLLING] Error during visibility sync:', error);
        });
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('focus', this.visibilityHandler);
  }

  start() {
    if (!this.config.enabled || this.intervalId) return;

    console.log('[POLLING] Starting fallback polling every', this.config.intervalMs, 'ms');
    this.intervalId = setInterval(() => {
      this.config.fetchFunction().catch(error => {
        console.error('[POLLING] Error during polling:', error);
      });
    }, this.config.intervalMs);
  }

  stop() {
    if (this.intervalId) {
      console.log('[POLLING] Stopping fallback polling');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  cleanup() {
    this.stop();
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      window.removeEventListener('focus', this.visibilityHandler);
    }
  }

  isRunning() {
    return this.intervalId !== null;
  }
}