import {
  type GameError,
  type GameSession,
  type GameStateTransition,
  GameLifecycleState,
  GameType,
  GAME_STATE_TRANSITIONS,
  GAME_REQUIREMENTS,
} from '../types/gameLifecycle';

import { http } from '../api/http';
import { createSSEClient, SSEClient } from '../utils/sse-client';

// WebSocket imports stubbed out to prevent "SockJS is not defined" errors
const SockJS = () => ({ readyState: 3, close: () => {} });
const Client = () => ({
  activate: () => {},
  deactivate: () => {},
  subscribe: () => ({ unsubscribe: () => {} }),
  publish: () => {},
  connected: false,
  onConnect: null,
  onDisconnect: null,
  onStompError: null,
  onWebSocketError: null
});

export class GameLifecycleManager {
  private session: GameSession | null = null;
  private sseClient: SSEClient | null = null;
  private stompClient: any = null; // Stubbed WebSocket client
  private subscriptions: Map<string, any> = new Map();
  private stateHistory: Array<{ state: GameLifecycleState; timestamp: number }> = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private retryTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private connectionRetryCount: number = 0;
  private maxRetries: number = 3;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeat: number = 0;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private userUid: string,
    private onStateChange?: (session: GameSession) => void,
    private onError?: (error: GameError) => void
  ) {}

  /**
   * 게임 세션 생성
   */
  async createSession(gameType: GameType, appointmentId: number, penaltyId: number): Promise<GameSession> {
    try {
      this.updateState(GameLifecycleState.CREATING);  
      
      const createData = {
        appointmentId,
        gameType: gameType.toString(),
        hostUid: this.userUid,
        penaltyId
      };

      console.log('[LIFECYCLE] Creating session:', createData);
      
      const response = await http.post('/mini-games/sessions', createData);
      const sessionData = response.data;
      
      this.session = {
        sessionId: sessionData.sessionId,
        gameType,
        state: GameLifecycleState.LOBBY,
        hostUid: this.userUid,
        participants: [this.userUid],
        totalRounds: sessionData.totalRounds || GAME_REQUIREMENTS[gameType].defaultRounds,
        createdAt: Date.now()
      };

      console.log('[LIFECYCLE] Session created successfully:', this.session);
      this.updateState(GameLifecycleState.LOBBY);
      
      return this.session;
    } catch (error) {
      console.error('[LIFECYCLE] Failed to create session:', error);
      throw this.handleError('SESSION_CREATE_FAILED', 'Failed to create game session', true, error);
    }
  }

  /**
   * 게임 세션 조인
   */
  async joinSession(sessionId: number): Promise<GameSession> {
    try {
      this.updateState(GameLifecycleState.JOINING);
      
      // 멱등성 보장 조인
      await http.post(`/mini-games/sessions/${sessionId}/join`);
      
      // 세션 정보 로드
      const sessionResponse = await http.get(`/mini-games/sessions/${sessionId}`);
      const sessionData = sessionResponse.data;
      
      this.session = {
        sessionId: sessionData.sessionId,
        gameType: sessionData.gameType as GameType,
        state: this.mapBackendStateToLifecycleState(sessionData.status),
        hostUid: sessionData.hostUid,
        participants: sessionData.participants || [],
        totalRounds: sessionData.totalRounds,
        createdAt: Date.now()
      };

      console.log('[LIFECYCLE] Joined session successfully:', this.session);
      this.updateState(GameLifecycleState.LOBBY);
      
      return this.session;
    } catch (error) {
      console.error('[LIFECYCLE] Failed to join session:', error);
      throw this.handleError('SESSION_JOIN_FAILED', 'Failed to join game session', true, error);
    }
  }

  /**
   * WebSocket 연결 및 이벤트 구독 설정
   */
  async connectWebSocket(): Promise<void> {
    if (!this.session) {
      throw new Error('No active session');
    }

    return new Promise((resolve, reject) => {
      // WebSocket stubbed out - no longer connecting
      console.log('[LIFECYCLE] WebSocket disabled - using REST-only mode');
      const socket = SockJS();
      this.stompClient = Client();

      // Immediately resolve since we're not actually connecting
      resolve();
      return;

      this.stompClient.onConnect = () => {
        console.log('[LIFECYCLE] WebSocket connected for session:', this.session?.sessionId);
        this.connectionRetryCount = 0; // 연결 성공 시 재시도 카운트 리셋
        this.lastHeartbeat = Date.now();
        this.setupSubscriptions();
        this.startHealthMonitoring();
        resolve();
      };

      this.stompClient.onStompError = (frame) => {
        console.error('[LIFECYCLE] STOMP error:', frame);
        reject(new Error(`STOMP connection failed: ${frame.headers.message}`));
      };

      this.stompClient.onWebSocketError = (error) => {
        console.error('[LIFECYCLE] WebSocket error:', error);
        reject(error);
      };

      this.stompClient.activate();
    });
  }

  /**
   * 게임별 구독 설정
   */
  private setupSubscriptions(): void {
    if (!this.session || !this.stompClient) return;

    const { sessionId, gameType } = this.session;
    const topicPrefix = gameType === GameType.QUIZ ? 'quiz' : 'reaction';

    // 공통 구독들
    this.subscribe(`/topic/${topicPrefix}/${sessionId}/start`, this.handleGameStart.bind(this));
    this.subscribe(`/topic/${topicPrefix}/${sessionId}/ready`, this.handleReadyUpdate.bind(this));
    this.subscribe(`/topic/${topicPrefix}/${sessionId}/game-end`, this.handleGameEnd.bind(this));
    this.subscribe(`/topic/${topicPrefix}/${sessionId}/error`, this.handleGameError.bind(this));

    // 게임별 특화 구독
    if (gameType === GameType.QUIZ) {
      this.subscribe(`/topic/quiz/${sessionId}/question`, this.handleQuizQuestion.bind(this));
      this.subscribe(`/topic/quiz/${sessionId}/results`, this.handleQuizResults.bind(this));
    } else if (gameType === GameType.REACTION) {
      this.subscribe(`/topic/reaction/${sessionId}/round`, this.handleReactionRound.bind(this));
      this.subscribe(`/topic/reaction/${sessionId}/round-results`, this.handleReactionResults.bind(this));
    }

    console.log('[LIFECYCLE] All subscriptions set up for', gameType, 'game');
  }

  /**
   * 구독 헬퍼 메서드
   */
  private subscribe(destination: string, handler: Function): void {
    if (!this.stompClient) return;

    const subscription = this.stompClient.subscribe(destination, (message) => {
      try {
        const payload = JSON.parse(message.body);
        console.log(`[LIFECYCLE] ${destination} received:`, payload);
        handler(payload);
      } catch (error) {
        console.error(`[LIFECYCLE] Failed to parse message from ${destination}:`, error);
      }
    });

    this.subscriptions.set(destination, subscription);
  }

  /**
   * 게임 시작 요청
   */
  async startGame(): Promise<void> {
    if (!this.session || !this.isHost()) {
      throw new Error('Only host can start the game');
    }

    try {
      this.updateState(GameLifecycleState.PREPARING);
      
      await http.post(`/mini-games/sessions/${this.session.sessionId}/start`);
      
      console.log('[LIFECYCLE] Game start request sent successfully');
    } catch (error) {
      console.error('[LIFECYCLE] Failed to start game:', error);
      throw this.handleError('GAME_START_FAILED', 'Failed to start game', true, error);
    }
  }

  /**
   * 플레이어 준비 상태 알림
   */
  async announceReady(): Promise<void> {
    if (!this.session || !this.stompClient) return;

    const gamePrefix = this.session.gameType === GameType.QUIZ ? 'quiz' : 'reaction';
    
    try {
      this.stompClient.publish({
        destination: `/app/${gamePrefix}/${this.session.sessionId}/ready`,
        body: JSON.stringify({ uid: this.userUid })
      });
      
      console.log('[LIFECYCLE] Ready signal sent for user:', this.userUid);
    } catch (error) {
      console.error('[LIFECYCLE] Failed to send ready signal:', error);
    }
  }

  /**
   * 게임 동기화
   */
  async syncGame(): Promise<void> {
    if (!this.session) return;

    if (this.session.state !== GameLifecycleState.IN_PROGRESS &&
        this.session.state !== GameLifecycleState.ROUND_ACTIVE) {
      console.log('[LIFECYCLE] Skipping sync - game not in progress');
      return;
    }

    try {
      const gamePrefix = this.session.gameType === GameType.QUIZ ? 'quiz' : 'reaction';
      await http.post(`/mini-games/${gamePrefix}/${this.session.sessionId}/sync`);
      
      console.log('[LIFECYCLE] Game synced successfully');
    } catch (error) {
      console.warn('[LIFECYCLE] Sync failed (non-critical):', error);
    }
  }

  /**
   * 이벤트 핸들러들
   */
  private handleGameStart(payload: any): void {
    console.log('[LIFECYCLE] Game start event received');
    this.updateState(GameLifecycleState.IN_PROGRESS);
    this.session!.startedAt = Date.now();
    this.syncGame();
  }

  private handleReadyUpdate(payload: any): void {
    console.log('[LIFECYCLE] Ready update received:', payload);
    
    if (payload.readyCount !== undefined && payload.total !== undefined) {
      // 모든 플레이어가 준비되면 자동으로 동기화
      if (payload.readyCount === payload.total && 
          this.session?.state === GameLifecycleState.IN_PROGRESS) {
        this.syncGame();
      }
    }
    
    this.emit('ready-update', payload);
  }

  private handleQuizQuestion(payload: any): void {
    console.log('[LIFECYCLE] Quiz question received:', payload);
    this.updateState(GameLifecycleState.ROUND_ACTIVE);
    this.session!.currentRound = payload.questionNumber;
    this.emit('quiz-question', payload);
  }

  private handleQuizResults(payload: any): void {
    console.log('[LIFECYCLE] Quiz results received:', payload);
    this.updateState(GameLifecycleState.ROUND_END);
    this.emit('quiz-results', payload);
    
    // 게임 종료 확인
    if (payload.isLastQuestion) {
      this.updateState(GameLifecycleState.CALCULATING);
    }
  }

  private handleReactionRound(payload: any): void {
    console.log('[LIFECYCLE] Reaction round event received:', payload);
    
    if (payload.type === 'ROUND_START') {
      this.updateState(GameLifecycleState.ROUND_ACTIVE);
      this.session!.currentRound = payload.roundNumber || 1;
      this.emit('reaction-round-start', payload);
    } else if (payload.type === 'ROUND_STATE' && payload.status === 'RED') {
      this.emit('reaction-red-signal', payload);
    }
  }

  private handleReactionResults(payload: any): void {
    console.log('[LIFECYCLE] Reaction results received:', payload);
    this.updateState(GameLifecycleState.ROUND_END);
    this.emit('reaction-results', payload);
    
    // 반응속도 게임은 보통 1라운드이므로 바로 계산 상태로
    this.updateState(GameLifecycleState.CALCULATING);
  }

  private handleGameEnd(payload: any): void {
    console.log('[LIFECYCLE] Game end event received:', payload);
    this.updateState(GameLifecycleState.FINISHED);
    this.session!.finishedAt = Date.now();
    this.emit('game-end', payload);
  }

  private handleGameError(payload: any): void {
    console.error('[LIFECYCLE] Game error received:', payload);
    this.handleError(payload.code || 'UNKNOWN_ERROR', payload.message, payload.recoverable || false);
  }

  /**
   * 상태 관리 메서드들
   */
  private updateState(newState: GameLifecycleState): void {
    if (!this.session) return;

    const oldState = this.session.state;
    this.session.state = newState;
    
    this.stateHistory.push({
      state: newState,
      timestamp: Date.now()
    });

    console.log(`[LIFECYCLE] State transition: ${oldState} → ${newState}`);
    
    if (this.onStateChange) {
      this.onStateChange(this.session);
    }
    
    this.emit('state-change', { from: oldState, to: newState, session: this.session });
  }

  private mapBackendStateToLifecycleState(backendState: string): GameLifecycleState {
    const stateMap: Record<string, GameLifecycleState> = {
      'WAITING': GameLifecycleState.LOBBY,
      'IN_PROGRESS': GameLifecycleState.IN_PROGRESS,
      'FINISHED': GameLifecycleState.FINISHED
    };
    
    return stateMap[backendState] || GameLifecycleState.LOBBY;
  }

  private handleError(code: string, message: string, recoverable: boolean, originalError?: any): GameError {
    const error: GameError = {
      code,
      message,
      recoverable,
      retryCount: 0,
      maxRetries: recoverable ? 3 : 0,
      timestamp: Date.now()
    };

    if (this.session) {
      this.session.error = error;
      this.updateState(GameLifecycleState.ERROR);
    }

    console.error('[LIFECYCLE] Error occurred:', error, originalError);
    
    if (this.onError) {
      this.onError(error);
    }

    // 복구 가능한 에러의 경우 자동 복구 시도
    if (recoverable) {
      this.attemptRecovery(error);
    }

    return error;
  }

  private async attemptRecovery(error: GameError): Promise<void> {
    if (!error.retryCount) error.retryCount = 0;
    if (error.retryCount >= (error.maxRetries || 3)) {
      console.log('[LIFECYCLE] Max retry attempts reached for error:', error.code);
      return;
    }

    error.retryCount++;
    this.updateState(GameLifecycleState.RECOVERING);
    
    console.log(`[LIFECYCLE] Attempting recovery ${error.retryCount}/${error.maxRetries} for:`, error.code);

    const retryDelay = Math.min(1000 * Math.pow(2, error.retryCount), 10000); // 지수 백오프, 최대 10초
    
    const timeoutId = setTimeout(async () => {
      try {
        // 복구 로직 (세션 상태 재확인 및 WebSocket 재연결)
        if (this.session) {
          const response = await http.get(`/mini-games/sessions/${this.session.sessionId}`);
          const sessionData = response.data;
          
          this.session.state = this.mapBackendStateToLifecycleState(sessionData.status);
          this.session.error = undefined;
          
          // WebSocket 재연결
          if (!this.stompClient?.connected) {
            await this.connectWebSocket();
          }
          
          console.log('[LIFECYCLE] Recovery successful');
          this.emit('recovery-success', { error, session: this.session });
        }
      } catch (recoveryError) {
        console.error('[LIFECYCLE] Recovery failed:', recoveryError);
        this.attemptRecovery(error);
      } finally {
        this.retryTimeouts.delete(error.code);
      }
    }, retryDelay);
    
    this.retryTimeouts.set(error.code, timeoutId);
  }

  /**
   * 이벤트 시스템
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`[LIFECYCLE] Error in event listener for ${event}:`, error);
      }
    });
  }

  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 유틸리티 메서드들
   */
  public isHost(): boolean {
    return this.session?.hostUid === this.userUid;
  }

  public getSession(): GameSession | null {
    return this.session;
  }

  public getState(): GameLifecycleState | null {
    return this.session?.state || null;
  }

  public canTransitionTo(targetState: GameLifecycleState): boolean {
    if (!this.session) return false;
    
    return GAME_STATE_TRANSITIONS.some(transition => 
      transition.from === this.session!.state && 
      transition.to === targetState &&
      (!transition.condition || transition.condition(this.session!))
    );
  }

  /**
   * 연결 상태 모니터링 시작
   */
  private startHealthMonitoring(): void {
    // 하트비트 전송 (30초마다)
    this.heartbeatInterval = setInterval(() => {
      if (this.stompClient?.connected && this.session) {
        try {
          this.stompClient.publish({
            destination: `/app/heartbeat/${this.session.sessionId}`,
            body: JSON.stringify({ userUid: this.userUid, timestamp: Date.now() })
          });
          this.lastHeartbeat = Date.now();
        } catch (error) {
          console.warn('[LIFECYCLE] Failed to send heartbeat:', error);
        }
      }
    }, 30000);

    // 연결 상태 체크 (10초마다)
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 10000);
  }

  /**
   * 연결 상태 확인 및 복구
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.session) return;

    try {
      // WebSocket 연결 상태 확인
      if (!this.stompClient?.connected) {
        console.warn('[LIFECYCLE] WebSocket disconnected, attempting reconnect');
        this.handleConnectionError('WEBSOCKET_DISCONNECTED', '웹소켓 연결이 끊어졌습니다');
        return;
      }

      // 하트비트 타임아웃 체크 (2분 이상 응답 없음)
      const heartbeatTimeout = Date.now() - this.lastHeartbeat;
      if (heartbeatTimeout > 120000) {
        console.warn('[LIFECYCLE] Heartbeat timeout detected');
        this.handleConnectionError('HEARTBEAT_TIMEOUT', '서버 응답이 없습니다');
        return;
      }

      // 세션 상태 동기화 확인
      const response = await http.get(`/mini-games/sessions/${this.session.sessionId}`, {
        timeout: 5000
      });
      
      const serverState = this.mapBackendStateToLifecycleState(response.data.status);
      if (serverState !== this.session.state) {
        console.log(`[LIFECYCLE] State drift detected: local=${this.session.state}, server=${serverState}`);
        this.session.state = serverState;
        this.updateState(serverState);
        this.emit('state-sync', { localState: this.session.state, serverState });
      }

    } catch (error) {
      console.error('[LIFECYCLE] Health check failed:', error);
      this.handleConnectionError('HEALTH_CHECK_FAILED', '연결 상태 확인에 실패했습니다');
    }
  }

  /**
   * 연결 오류 처리
   */
  private async handleConnectionError(errorCode: string, errorMessage: string): Promise<void> {
    if (this.connectionRetryCount >= this.maxRetries) {
      const fatalError: GameError = {
        code: errorCode,
        message: errorMessage,
        timestamp: Date.now(),
        recoverable: false,
        retryCount: this.connectionRetryCount,
        maxRetries: this.maxRetries
      };
      
      if (this.session) {
        this.session.error = fatalError;
      }
      
      this.onError?.(fatalError);
      return;
    }

    const recoveryError: GameError = {
      code: errorCode,
      message: errorMessage,
      timestamp: Date.now(),
      recoverable: true,
      retryCount: this.connectionRetryCount,
      maxRetries: this.maxRetries
    };

    if (this.session) {
      this.session.error = recoveryError;
    }

    this.connectionRetryCount++;
    await this.attemptRecovery(recoveryError);
  }

  /**
   * 네트워크 연결 품질 측정
   */
  public async measureConnectionQuality(): Promise<{
    latency: number;
    packetLoss: number;
    connectionStable: boolean;
  }> {
    const pingResults: number[] = [];
    const pingCount = 5;
    let successCount = 0;

    for (let i = 0; i < pingCount; i++) {
      try {
        const start = Date.now();
        await http.get('/api/health/ping', { timeout: 5000 });
        const latency = Date.now() - start;
        pingResults.push(latency);
        successCount++;
      } catch (error) {
        // 실패한 ping은 결과에 포함하지 않음
      }
      
      // 100ms 간격으로 ping
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const averageLatency = pingResults.length > 0 
      ? pingResults.reduce((sum, lat) => sum + lat, 0) / pingResults.length 
      : 0;
    
    const packetLoss = ((pingCount - successCount) / pingCount) * 100;
    const connectionStable = successCount >= 3 && averageLatency < 1000;

    return {
      latency: Math.round(averageLatency),
      packetLoss: Math.round(packetLoss),
      connectionStable
    };
  }

  /**
   * 정리 메서드
   */
  public cleanup(): void {
    console.log('[LIFECYCLE] Cleaning up game lifecycle manager');
    
    // 구독 정리
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    
    // WebSocket 연결 종료
    if (this.stompClient?.connected) {
      this.stompClient.deactivate();
    }
    
    // 타이머 정리
    this.retryTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.retryTimeouts.clear();
    
    // 헬스체크 및 하트비트 타이머 정리
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // 이벤트 리스너 정리
    this.eventListeners.clear();
    
    this.session = null;
    this.stompClient = null;
  }
}