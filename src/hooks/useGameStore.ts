import { create } from 'zustand';

export interface Player {
  id: string;
  name: string;
  score: number;
  reactionTime?: number;
}

export interface LobbyMember {
  uid: string;
  role: 'HOST' | 'MEMBER';
  score: number;
  joinedAt?: string;
}

export interface Question {
  id: number;
  text: string;
  choices: string[];
  correct: number;
}

export interface GameSession {
  sessionId: number;
  category: string;
  hostUid: string;
  participants: { userUid: string; nickname: string }[];
  totalRounds?: number;
}

export interface ScoreboardItem {
  userUid: string;
  nickname: string;
  score: number;
}

interface GameState {
  players: Player[];
  /** Current lobby members (for lobby screen) */
  lobbyMembers: LobbyMember[];
  /** Version of current lobby state (for preventing stale updates) */
  lobbyVersion?: number;
  /** Current session id for active game */
  sessionId?: number;
  /** Type of the current game */
  gameType?: 'QUIZ' | 'REACTION';
  /** Current game session details */
  session?: GameSession;
  /** Selected category for quiz games */
  selectedCategory?: string;
  /** Current scoreboard */
  scores: ScoreboardItem[];
  /** Questions loaded for current quiz session */
  questions: Question[];
  /** Current round index (0-based) */
  currentRoundIndex: number;
  /** Total rounds for the session */
  totalRounds: number;
  /** Single confirmed penalty for the session */
  penalty?: { id: number; text: string };
  setSession: (sessionId: number, gameType: 'QUIZ' | 'REACTION') => void;
  /** Set full session details from server */
  setSessionDetails: (session: GameSession) => void;
  /** Update scores */
  setScores: (scores: ScoreboardItem[]) => void;
  setPlayers: (players: Player[]) => void;
  updatePlayerScore: (id: string, delta: number) => void;
  /** Immutable lobby member management */
  replaceMembers: (members: LobbyMember[]) => void;
  addOrUpdateMember: (member: LobbyMember) => void;
  removeMemberByUid: (uid: string) => void;
  setReactionTimes: (times: Record<string, number>) => void;
  /** Set quiz-specific state */
  setQuizState: (category: string, questions: Question[], totalRounds: number) => void;
  /** Move to next round */
  nextRound: () => void;
  /** Set single penalty */
  setPenalty: (penalty: { id: number; text: string }) => void;
  /** Set game type */
  setGameType: (gameType: 'QUIZ' | 'REACTION') => void;
  /** Reset game state */
  resetGame: () => void;
}

/**
 * useGameStore is a global Zustand store used to manage session state and
 * player information across the mini game pages.  It exposes helpers for
 * setting the session ID and game type, updating player scores, and
 * storing reaction times.
 */
// 중복 제거 헬퍼 함수
const dedupByUid = (members: LobbyMember[]): LobbyMember[] => {
  const map = new Map<string, LobbyMember>();
  members.forEach(member => {
    if (member && member.uid) {
      map.set(member.uid, member);
    }
  });
  return Array.from(map.values());
};

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  lobbyMembers: [],
  lobbyVersion: undefined,
  questions: [],
  currentRoundIndex: 0,
  totalRounds: 5,
  scores: [],
  setSession: (sessionId, gameType) =>
    set(() => ({
      sessionId,
      gameType,
    })),
  setSessionDetails: (session) =>
    set((state) => ({ 
      session,
      totalRounds: session.totalRounds || state.totalRounds
    })),
  setScores: (scores) => set({ scores }),
  setPlayers: (players) => set({ players }),
  
  // 강화된 불변 로비 멤버 관리 액션들 - 새 참조 보장
  replaceMembers: (members: LobbyMember[], version?: number) => {
    const state = get();
    
    // 버전 가드: 오래된 업데이트 무시
    if (version && state.lobbyVersion && version <= state.lobbyVersion) {
      console.debug('[STORE] Ignoring stale update:', version, '<=', state.lobbyVersion);
      return;
    }
    
    const newMembers = dedupByUid(members.map(m => ({ ...m }))); // 깊은 복사로 새 참조
    console.debug('[STORE] replaceMembers - version:', version, 'members.len:', newMembers.length);
    
    set({
      lobbyMembers: newMembers,
      lobbyVersion: version
    });
  },
  
  addOrUpdateMember: (member: LobbyMember) => {
    const state = get();
    const existingMembers = state.lobbyMembers;
    const map = new Map(existingMembers.map(m => [m.uid, { ...m }])); // 기존 멤버도 복사
    
    // 새로 추가/업데이트할 멤버는 완전히 새 객체
    const newMember = { ...member };
    map.set(member.uid, newMember);
    
    const newMembers = Array.from(map.values());
    console.debug('[STORE] addOrUpdateMember - uid:', member.uid, 'total:', newMembers.length);
    
    set({
      lobbyMembers: newMembers,
      lobbyVersion: (state.lobbyVersion || 0) + 1 // 로컬 버전 증가
    });
  },
  
  removeMemberByUid: (uid: string) => {
    const state = get();
    const newMembers = state.lobbyMembers
      .filter(m => m.uid !== uid)
      .map(m => ({ ...m })); // 남은 멤버들도 새 참조로
    
    console.debug('[STORE] removeMemberByUid - uid:', uid, 'remaining:', newMembers.length);
    
    set({
      lobbyMembers: newMembers,
      lobbyVersion: (state.lobbyVersion || 0) + 1 // 로컬 버전 증가
    });
  },
  updatePlayerScore: (id, delta) =>
    set((state) => {
      const players = state.players.map((p) =>
        p.id === id ? { ...p, score: p.score + delta } : p,
      );
      return { players };
    }),
  setReactionTimes: (times) =>
    set((state) => ({
      players: state.players.map((p) =>
        times[p.id] !== undefined ? { ...p, reactionTime: times[p.id] } : p,
      ),
    })),
  setQuizState: (category, questions, totalRounds) =>
    set(() => ({
      selectedCategory: category,
      questions,
      totalRounds,
      currentRoundIndex: 0,
    })),
  nextRound: () =>
    set((state) => ({
      currentRoundIndex: Math.min(state.currentRoundIndex + 1, state.totalRounds - 1),
    })),
  setPenalty: (penalty) => set({ penalty }),
  setGameType: (gameType) => set({ gameType }),
  resetGame: () =>
    set(() => ({
      sessionId: undefined,
      gameType: undefined,
      session: undefined,
      selectedCategory: undefined,
      questions: [],
      currentRoundIndex: 0,
      totalRounds: 5,
      players: [],
      lobbyMembers: [], // 로비 멤버도 초기화
      lobbyVersion: undefined, // 버전도 초기화
      scores: [],
      penalty: undefined,
    })),
}));