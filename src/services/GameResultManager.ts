/**
 * 게임 결과 통합 관리자
 * 30년차 시니어의 안정적인 결과 처리 시스템
 */

import { GameType } from '../types/gameLifecycle';
import { http } from '../api/http';

export interface BaseGameResult {
  sessionId: number;
  gameType: GameType;
  completedAt: number;
  playerResults: PlayerResult[];
  winner?: PlayerResult;
  penalty?: PenaltyInfo;
}

export interface PlayerResult {
  userUid: string;
  userName?: string;
  score: number;
  rank: number;
  details: any; // 게임별 세부 정보
}

export interface QuizGameResult extends BaseGameResult {
  gameType: GameType.QUIZ;
  totalQuestions: number;
  correctAnswers: number;
  averageResponseTime: number;
  questionResults: QuizQuestionResult[];
}

export interface QuizQuestionResult {
  questionId: number;
  questionText: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  responseTime: number;
}

export interface ReactionGameResult extends BaseGameResult {
  gameType: GameType.REACTION;
  reactionTimeMs: number;
  isFalseStart: boolean;
  roundResults: ReactionRoundResult[];
}

export interface ReactionRoundResult {
  roundId: number;
  reactionTime: number;
  isFalseStart: boolean;
  rank: number;
  clickedAt: number;
}

export interface PenaltyInfo {
  penaltyId: number;
  description: string;
  assignedTo?: string;
}

export class GameResultManager {
  private static instance: GameResultManager;

  public static getInstance(): GameResultManager {
    if (!GameResultManager.instance) {
      GameResultManager.instance = new GameResultManager();
    }
    return GameResultManager.instance;
  }

  private constructor() {}

  /**
   * 게임 결과 저장
   */
  async saveGameResult(result: BaseGameResult): Promise<void> {
    try {
      console.log('[RESULT] Saving game result:', result);
      
      // localStorage에 임시 저장 (오프라인 대비)
      const storageKey = `gameResult_${result.gameType}_${result.sessionId}`;
      localStorage.setItem(storageKey, JSON.stringify(result));
      
      // 서버에 결과 전송
      await http.post('/mini-games/results', {
        sessionId: result.sessionId,
        gameType: result.gameType,
        completedAt: result.completedAt,
        playerResults: result.playerResults,
        gameDetails: this.extractGameDetails(result),
        penalty: result.penalty
      });
      
      console.log('[RESULT] Game result saved successfully');
      
    } catch (error) {
      console.error('[RESULT] Failed to save game result:', error);
      // 실패해도 localStorage에는 저장되어 있으므로 나중에 재시도 가능
    }
  }

  /**
   * 게임 결과 조회
   */
  async getGameResult(sessionId: number, gameType: GameType): Promise<BaseGameResult | null> {
    try {
      // 먼저 서버에서 조회
      const response = await http.get(`/mini-games/results/${sessionId}`);
      const serverResult = response.data;
      
      if (serverResult) {
        return this.transformServerResult(serverResult, gameType);
      }
      
      // 서버에 없으면 localStorage에서 조회
      const storageKey = `gameResult_${gameType}_${sessionId}`;
      const localResult = localStorage.getItem(storageKey);
      
      if (localResult) {
        return JSON.parse(localResult);
      }
      
      return null;
      
    } catch (error) {
      console.error('[RESULT] Failed to get game result:', error);
      
      // 에러 시 localStorage에서 조회
      const storageKey = `gameResult_${gameType}_${sessionId}`;
      const localResult = localStorage.getItem(storageKey);
      
      if (localResult) {
        return JSON.parse(localResult);
      }
      
      return null;
    }
  }

  /**
   * 퀴즈 게임 결과 생성
   */
  createQuizResult(
    sessionId: number,
    questionResults: QuizQuestionResult[],
    playerResults: PlayerResult[],
    penalty?: PenaltyInfo
  ): QuizGameResult {
    const correctAnswers = questionResults.filter(q => q.isCorrect).length;
    const totalTime = questionResults.reduce((sum, q) => sum + q.responseTime, 0);
    const averageResponseTime = questionResults.length > 0 ? totalTime / questionResults.length : 0;
    
    const score = correctAnswers * 100; // 기본 점수 계산
    
    return {
      sessionId,
      gameType: GameType.QUIZ,
      completedAt: Date.now(),
      totalQuestions: questionResults.length,
      correctAnswers,
      averageResponseTime,
      questionResults,
      playerResults: playerResults.map(p => ({
        ...p,
        details: {
          correctAnswers: questionResults.filter(q => q.isCorrect).length,
          totalQuestions: questionResults.length,
          averageResponseTime
        }
      })),
      winner: playerResults.find(p => p.rank === 1),
      penalty
    };
  }

  /**
   * 반응속도 게임 결과 생성
   */
  createReactionResult(
    sessionId: number,
    roundResults: ReactionRoundResult[],
    playerResults: PlayerResult[],
    penalty?: PenaltyInfo
  ): ReactionGameResult {
    const bestRound = roundResults.reduce((best, current) => {
      if (current.isFalseStart) return best;
      if (!best || current.reactionTime < best.reactionTime) return current;
      return best;
    }, null as ReactionRoundResult | null);
    
    const reactionTimeMs = bestRound?.reactionTime || -1;
    const isFalseStart = roundResults.every(r => r.isFalseStart);
    
    return {
      sessionId,
      gameType: GameType.REACTION,
      completedAt: Date.now(),
      reactionTimeMs,
      isFalseStart,
      roundResults,
      playerResults: playerResults.map(p => ({
        ...p,
        details: {
          bestReactionTime: reactionTimeMs,
          isFalseStart,
          totalRounds: roundResults.length
        }
      })),
      winner: playerResults.find(p => p.rank === 1),
      penalty
    };
  }

  /**
   * 게임별 상세 정보 추출
   */
  private extractGameDetails(result: BaseGameResult): any {
    switch (result.gameType) {
      case GameType.QUIZ:
        const quizResult = result as QuizGameResult;
        return {
          totalQuestions: quizResult.totalQuestions,
          correctAnswers: quizResult.correctAnswers,
          averageResponseTime: quizResult.averageResponseTime,
          questionResults: quizResult.questionResults
        };
      
      case GameType.REACTION:
        const reactionResult = result as ReactionGameResult;
        return {
          reactionTimeMs: reactionResult.reactionTimeMs,
          isFalseStart: reactionResult.isFalseStart,
          roundResults: reactionResult.roundResults
        };
      
      default:
        return {};
    }
  }

  /**
   * 서버 결과를 클라이언트 형식으로 변환
   */
  private transformServerResult(serverResult: any, gameType: GameType): BaseGameResult {
    const baseResult: BaseGameResult = {
      sessionId: serverResult.sessionId,
      gameType,
      completedAt: serverResult.completedAt || Date.now(),
      playerResults: serverResult.playerResults || [],
      winner: serverResult.winner,
      penalty: serverResult.penalty
    };

    if (gameType === GameType.QUIZ) {
      return {
        ...baseResult,
        gameType: GameType.QUIZ,
        totalQuestions: serverResult.gameDetails?.totalQuestions || 0,
        correctAnswers: serverResult.gameDetails?.correctAnswers || 0,
        averageResponseTime: serverResult.gameDetails?.averageResponseTime || 0,
        questionResults: serverResult.gameDetails?.questionResults || []
      } as QuizGameResult;
    }

    if (gameType === GameType.REACTION) {
      return {
        ...baseResult,
        gameType: GameType.REACTION,
        reactionTimeMs: serverResult.gameDetails?.reactionTimeMs || -1,
        isFalseStart: serverResult.gameDetails?.isFalseStart || false,
        roundResults: serverResult.gameDetails?.roundResults || []
      } as ReactionGameResult;
    }

    return baseResult;
  }

  /**
   * 결과 통계 계산
   */
  calculateStatistics(result: BaseGameResult): {
    averageScore: number;
    bestPlayer: PlayerResult | null;
    worstPlayer: PlayerResult | null;
    gameSpecificStats: any;
  } {
    const playerResults = result.playerResults;
    
    if (playerResults.length === 0) {
      return {
        averageScore: 0,
        bestPlayer: null,
        worstPlayer: null,
        gameSpecificStats: {}
      };
    }

    const averageScore = playerResults.reduce((sum, p) => sum + p.score, 0) / playerResults.length;
    const bestPlayer = playerResults.reduce((best, current) => 
      current.rank < best.rank ? current : best
    );
    const worstPlayer = playerResults.reduce((worst, current) => 
      current.rank > worst.rank ? current : worst
    );

    let gameSpecificStats = {};

    if (result.gameType === GameType.QUIZ) {
      const quizResult = result as QuizGameResult;
      gameSpecificStats = {
        totalQuestions: quizResult.totalQuestions,
        averageCorrectAnswers: playerResults.reduce((sum, p) => 
          sum + (p.details?.correctAnswers || 0), 0) / playerResults.length,
        averageResponseTime: quizResult.averageResponseTime
      };
    } else if (result.gameType === GameType.REACTION) {
      const reactionResult = result as ReactionGameResult;
      const validTimes = playerResults
        .map(p => p.details?.bestReactionTime)
        .filter(time => time > 0);
      
      gameSpecificStats = {
        averageReactionTime: validTimes.length > 0 
          ? validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length 
          : 0,
        fastestTime: Math.min(...validTimes),
        falseStartCount: playerResults.filter(p => p.details?.isFalseStart).length
      };
    }

    return {
      averageScore,
      bestPlayer,
      worstPlayer,
      gameSpecificStats
    };
  }

  /**
   * 결과 비교 (이전 게임들과)
   */
  async compareWithHistory(result: BaseGameResult, userUid: string): Promise<{
    personalBest: boolean;
    improvement: number;
    historicalRank: number;
  }> {
    try {
      // 사용자의 이전 게임 기록들 조회
      const historyResponse = await http.get(`/mini-games/users/${userUid}/history`, {
        params: { gameType: result.gameType }
      });
      
      const history = historyResponse.data || [];
      
      if (history.length === 0) {
        return {
          personalBest: true,
          improvement: 0,
          historicalRank: 1
        };
      }

      const currentPlayer = result.playerResults.find(p => p.userUid === userUid);
      if (!currentPlayer) {
        return {
          personalBest: false,
          improvement: 0,
          historicalRank: history.length + 1
        };
      }

      const previousScores = history.map((h: any) => h.score);
      const previousBest = Math.max(...previousScores);
      const personalBest = currentPlayer.score > previousBest;
      const improvement = currentPlayer.score - (previousScores[previousScores.length - 1] || 0);
      
      // 역사적 순위 계산
      const allScores = [...previousScores, currentPlayer.score].sort((a, b) => b - a);
      const historicalRank = allScores.indexOf(currentPlayer.score) + 1;

      return {
        personalBest,
        improvement,
        historicalRank
      };

    } catch (error) {
      console.error('[RESULT] Failed to compare with history:', error);
      return {
        personalBest: false,
        improvement: 0,
        historicalRank: 1
      };
    }
  }

  /**
   * 결과 공유 데이터 생성
   */
  generateShareData(result: BaseGameResult, userUid: string): {
    title: string;
    description: string;
    emoji: string;
    shareText: string;
  } {
    const currentPlayer = result.playerResults.find(p => p.userUid === userUid);
    
    if (!currentPlayer) {
      return {
        title: '게임 완료',
        description: '게임이 완료되었습니다',
        emoji: '🎮',
        shareText: '게임을 완료했습니다!'
      };
    }

    const isWinner = currentPlayer.rank === 1;
    const gameTypeKor = result.gameType === GameType.QUIZ ? '퀴즈' : '반응속도';

    if (isWinner) {
      return {
        title: '🏆 승리!',
        description: `${gameTypeKor} 게임에서 1등을 했습니다!`,
        emoji: '👑',
        shareText: `${gameTypeKor} 게임에서 1등을 차지했습니다! 🏆`
      };
    } else {
      return {
        title: '게임 완료',
        description: `${gameTypeKor} 게임에서 ${currentPlayer.rank}등을 했습니다`,
        emoji: '🎯',
        shareText: `${gameTypeKor} 게임을 완료했습니다! (${currentPlayer.rank}등)`
      };
    }
  }

  /**
   * 저장된 결과 정리 (오래된 것들 삭제)
   */
  cleanupOldResults(daysToKeep: number = 7): void {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('gameResult_')) {
        try {
          const result = JSON.parse(localStorage.getItem(key) || '{}');
          if (result.completedAt && result.completedAt < cutoffTime) {
            localStorage.removeItem(key);
            console.log(`[RESULT] Cleaned up old result: ${key}`);
          }
        } catch (error) {
          // 파싱 에러 시 삭제
          localStorage.removeItem(key);
        }
      }
    }
  }
}