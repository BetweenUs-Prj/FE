import { create } from 'zustand';

export interface Player {
  id: string;
  name: string;
  score: number;
  reactionTime?: number;
}

export interface Question {
  id: number;
  text: string;
  choices: string[];
  correct: number;
}

interface GameState {
  players: Player[];
  /** Current session id for active game */
  sessionId?: number;
  /** Type of the current game */
  gameType?: 'QUIZ' | 'REACTION';
  /** Selected category for quiz games */
  selectedCategory?: string;
  /** Questions loaded for current quiz session */
  questions: Question[];
  /** Current round index (0-based) */
  currentRoundIndex: number;
  /** Total rounds for the session */
  totalRounds: number;
  /** Single confirmed penalty for the session */
  penalty?: { id: number; text: string };
  setSession: (sessionId: number, gameType: 'QUIZ' | 'REACTION') => void;
  setPlayers: (players: Player[]) => void;
  updatePlayerScore: (id: string, delta: number) => void;
  setReactionTimes: (times: Record<string, number>) => void;
  /** Set quiz-specific state */
  setQuizState: (category: string, questions: Question[], totalRounds: number) => void;
  /** Move to next round */
  nextRound: () => void;
  /** Set single penalty */
  setPenalty: (penalty: { id: number; text: string }) => void;
  /** Reset game state */
  resetGame: () => void;
}

/**
 * useGameStore is a global Zustand store used to manage session state and
 * player information across the mini game pages.  It exposes helpers for
 * setting the session ID and game type, updating player scores, and
 * storing reaction times.
 */
export const useGameStore = create<GameState>((set) => ({
  players: [],
  questions: [],
  currentRoundIndex: 0,
  totalRounds: 5,
  setSession: (sessionId, gameType) =>
    set(() => ({
      sessionId,
      gameType,
    })),
  setPlayers: (players) => set({ players }),
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
  resetGame: () =>
    set(() => ({
      sessionId: undefined,
      gameType: undefined,
      selectedCategory: undefined,
      questions: [],
      currentRoundIndex: 0,
      totalRounds: 5,
      players: [],
      penalty: undefined,
    })),
}));