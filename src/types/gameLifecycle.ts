/**
 * 게임 생명주기 상태 정의
 * 30년차 시니어가 설계한 안정적인 게임 상태 머신
 */
export enum GameType {
    QUIZ = 'QUIZ',
  REACTION = 'REACTION'
}

export enum GameLifecycleState {
  // 세션 생성/관리
  CREATING = 'CREATING',           // 세션 생성 중
  LOBBY = 'LOBBY',                // 로비 대기 중
  JOINING = 'JOINING',            // 참가자 조인 중
  
  // 게임 시작 준비
  PREPARING = 'PREPARING',        // 게임 시작 준비 중
  READY_CHECK = 'READY_CHECK',    // 참가자 준비 상태 확인
  
  // 게임 진행
  IN_PROGRESS = 'IN_PROGRESS',    // 게임 진행 중
  ROUND_ACTIVE = 'ROUND_ACTIVE',  // 라운드 활성
  ROUND_END = 'ROUND_END',        // 라운드 종료
  
  // 게임 종료
  CALCULATING = 'CALCULATING',    // 결과 계산 중
  FINISHED = 'FINISHED',          // 게임 완료
  
  // 오류 상태
  ERROR = 'ERROR',                // 에러 발생
  RECOVERING = 'RECOVERING'       // 복구 시도 중
}

export interface GameSession {
  sessionId: number;
  gameType: GameType;
  state: GameLifecycleState;
  hostUid: string;
  participants: string[];
  currentRound?: number;
  totalRounds: number;
  error?: GameError;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface GameError {
  code: string;
  message: string;
  recoverable: boolean;
  retryCount?: number;
  maxRetries?: number;
  timestamp?: number;
}

export interface GameStateTransition {
  from: GameLifecycleState;
  to: GameLifecycleState;
  trigger: string;
  condition?: (session: GameSession) => boolean;
  action?: (session: GameSession) => Promise<void>;
}

/**
 * 게임별 상태 전환 규칙
 */
export const GAME_STATE_TRANSITIONS: GameStateTransition[] = [
  // 세션 생성 플로우
  { from: GameLifecycleState.CREATING, to: GameLifecycleState.LOBBY, trigger: 'SESSION_CREATED' },
  { from: GameLifecycleState.LOBBY, to: GameLifecycleState.JOINING, trigger: 'PLAYER_JOINING' },
  { from: GameLifecycleState.JOINING, to: GameLifecycleState.LOBBY, trigger: 'JOIN_COMPLETE' },
  
  // 게임 시작 플로우  
  { from: GameLifecycleState.LOBBY, to: GameLifecycleState.PREPARING, trigger: 'START_REQUESTED' },
  { from: GameLifecycleState.PREPARING, to: GameLifecycleState.READY_CHECK, trigger: 'PREPARATION_COMPLETE' },
  { from: GameLifecycleState.READY_CHECK, to: GameLifecycleState.IN_PROGRESS, trigger: 'ALL_PLAYERS_READY' },
  
  // 게임 진행 플로우
  { from: GameLifecycleState.IN_PROGRESS, to: GameLifecycleState.ROUND_ACTIVE, trigger: 'ROUND_START' },
  { from: GameLifecycleState.ROUND_ACTIVE, to: GameLifecycleState.ROUND_END, trigger: 'ROUND_COMPLETE' },
  { from: GameLifecycleState.ROUND_END, to: GameLifecycleState.ROUND_ACTIVE, trigger: 'NEXT_ROUND' },
  { from: GameLifecycleState.ROUND_END, to: GameLifecycleState.CALCULATING, trigger: 'GAME_END' },
  
  // 게임 완료 플로우
  { from: GameLifecycleState.CALCULATING, to: GameLifecycleState.FINISHED, trigger: 'RESULTS_READY' },
  
  // 에러 및 복구 플로우
  { from: GameLifecycleState.ERROR, to: GameLifecycleState.RECOVERING, trigger: 'RECOVERY_ATTEMPT' },
  { from: GameLifecycleState.RECOVERING, to: GameLifecycleState.LOBBY, trigger: 'RECOVERY_SUCCESS' },
  { from: GameLifecycleState.RECOVERING, to: GameLifecycleState.ERROR, trigger: 'RECOVERY_FAILED' }
];

/**
 * 게임별 최소 요구사항
 */
export const GAME_REQUIREMENTS = {
  [GameType.QUIZ]: {
    minPlayers: 2,
    maxPlayers: 8,
    defaultRounds: 5,
    timeouts: {
      lobby: 300000,      // 5분
      round: 30000,       // 30초
      transition: 5000    // 5초
    }
  },
  [GameType.REACTION]: {
    minPlayers: 2,
    maxPlayers: 8,
    defaultRounds: 1,
    timeouts: {
      lobby: 300000,      // 5분
      round: 10000,       // 10초
      transition: 3000    // 3초
    }
  }
};