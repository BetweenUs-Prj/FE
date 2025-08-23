import { create } from 'zustand';

export interface Player {
  id: string;
  name: string;
  score: number;
  reactionTime?: number;
}

interface GameState {
  players: Player[];
  /** Current session id for active game */
  sessionId?: number;
  /** Type of the current game */
  gameType?: 'QUIZ' | 'REACTION';
  setSession: (sessionId: number, gameType: 'QUIZ' | 'REACTION') => void;
  setPlayers: (players: Player[]) => void;
  updatePlayerScore: (id: string, delta: number) => void;
  setReactionTimes: (times: Record<string, number>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  players: [],
  setSession: (sessionId, gameType) =>
    set(() => ({
      sessionId,
      gameType,
    })),
  setPlayers: (players) => set({ players }),
  updatePlayerScore: (id, delta) =>
    set((state) => {
      const players = state.players.map((p) => (p.id === id ? { ...p, score: p.score + delta } : p));
      return { players };
    }),
  setReactionTimes: (times) =>
    set((state) => ({
      players: state.players.map((p) =>
        times[p.id] !== undefined ? { ...p, reactionTime: times[p.id] } : p,
      ),
    })),
}));