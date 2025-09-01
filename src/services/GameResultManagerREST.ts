import { GameType } from '../types/gameLifecycle';

export interface BaseGameResult {
  sessionId: number;
  gameType: GameType;
  playerResults: PlayerResult[];
  penalty?: PenaltyInfo;
  timestamp: number;
}

export interface PlayerResult {
  userUid: string;
  userName?: string;
  score: number;
  rank: number;
  reactionTime?: number;
  correctAnswers?: number;
}

export interface PenaltyInfo {
  penaltyId: number;
  description: string;
  assignedTo?: string;
}

/**
 * REST-only 게임 결과 관리자 (WebSocket 없음)
 */
export class GameResultManagerREST {
  private static instance: GameResultManagerREST;
  private results: Map<string, BaseGameResult> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  private constructor() {
    console.log('[RESULT] GameResultManagerREST initialized (REST-only)');
  }
  
  static getInstance(): GameResultManagerREST {
    if (!GameResultManagerREST.instance) {
      GameResultManagerREST.instance = new GameResultManagerREST();
    }
    return GameResultManagerREST.instance;
  }
  
  /**
   * 결과 폴링 시작
   */
  async startPolling(sessionId: number, gameType: GameType): Promise<void> {
    const key = this.getResultKey(sessionId, gameType);
    
    // 기존 폴링 중단
    this.stopPolling(sessionId, gameType);
    
    console.log('[RESULT] Starting polling for session:', sessionId, gameType);
    
    // 즉시 한 번 조회
    await this.fetchResult(sessionId, gameType);
    
    // 2초 간격으로 폴링
    const interval = setInterval(() => {
      this.fetchResult(sessionId, gameType);
    }, 2000);
    
    this.pollingIntervals.set(key, interval);
  }
  
  /**
   * 결과 폴링 중단
   */
  stopPolling(sessionId: number, gameType: GameType): void {
    const key = this.getResultKey(sessionId, gameType);
    const interval = this.pollingIntervals.get(key);
    
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(key);
      console.log('[RESULT] Stopped polling for session:', sessionId, gameType);
    }
  }
  
  /**
   * 결과 조회
   */
  private async fetchResult(sessionId: number, gameType: GameType): Promise<void> {
    try {
      const response = await fetch(`/api/mini-games/results/${sessionId}`, {
        headers: {
          'User-Uid': localStorage.getItem('userUid') || 'anonymous'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // BaseGameResult 형식으로 변환
        const result: BaseGameResult = {
          sessionId,
          gameType,
          playerResults: data.players?.map((p: any, index: number) => ({
            userUid: p.userUid,
            userName: p.userUid.substring(0, 8),
            score: p.totalScore || p.score || 0,
            rank: p.rank || index + 1,
            correctAnswers: p.correctCount
          })) || [],
          penalty: data.penaltyId ? {
            penaltyId: data.penaltyId,
            description: `벌칙 #${data.penaltyId}`,
            assignedTo: data.players?.[data.players.length - 1]?.userUid
          } : undefined,
          timestamp: data.timestamp || Date.now()
        };
        
        this.saveResult(result);
        
        // 게임 종료 상태면 폴링 중단
        if (data.status === 'FINISHED') {
          this.stopPolling(sessionId, gameType);
        }
      }
    } catch (error) {
      console.error('[RESULT] Failed to fetch result:', error);
    }
  }
  
  /**
   * 결과 저장
   */
  saveResult(result: BaseGameResult): void {
    const key = this.getResultKey(result.sessionId, result.gameType);
    this.results.set(key, result);
    
    // localStorage에도 저장 (백업)
    try {
      const stored = localStorage.getItem('gameResults') || '{}';
      const allResults = JSON.parse(stored);
      allResults[key] = result;
      localStorage.setItem('gameResults', JSON.stringify(allResults));
    } catch (error) {
      console.error('[RESULT] Failed to save to localStorage:', error);
    }
    
    console.log('[RESULT] Result saved:', key, result);
  }
  
  /**
   * 결과 조회
   */
  async getGameResult(sessionId: number, gameType: GameType): Promise<BaseGameResult | null> {
    const key = this.getResultKey(sessionId, gameType);
    
    // 메모리에서 먼저 확인
    let result = this.results.get(key);
    
    // localStorage에서 확인
    if (!result) {
      try {
        const stored = localStorage.getItem('gameResults');
        if (stored) {
          const allResults = JSON.parse(stored);
          result = allResults[key];
          
          if (result) {
            this.results.set(key, result);
          }
        }
      } catch (error) {
        console.error('[RESULT] Failed to load from localStorage:', error);
      }
    }
    
    // 없으면 API 직접 호출
    if (!result) {
      await this.fetchResult(sessionId, gameType);
      result = this.results.get(key);
    }
    
    return result || null;
  }
  
  /**
   * 모든 폴링 중단
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
    console.log('[RESULT] All polling stopped');
  }
  
  /**
   * 정리
   */
  cleanup(): void {
    this.stopAllPolling();
    this.results.clear();
    console.log('[RESULT] GameResultManagerREST cleaned up');
  }
  
  private getResultKey(sessionId: number, gameType: GameType): string {
    return `${gameType}_${sessionId}`;
  }
}