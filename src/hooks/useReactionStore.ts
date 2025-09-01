import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSSEClient, SSEClient } from '../utils/sse-client';

export interface ReactionResult {
  userUid: string;
  deltaMs: number;
  falseStart: boolean;
  rank: number;
}

type ReactionGameStatus = 'LOBBY' | 'WAITING' | 'RED' | 'FINISHED' | 'CLOSED';

interface ReactionGameState {
  sessionId?: number;
  roundId?: number;
  status: ReactionGameStatus;
  redAt?: number;
  participants: number;
  results: ReactionResult[];
  myResult?: {
    deltaMs: number;
    falseStart: boolean;
    rank: number;
  };
  sseClient?: SSEClient;
  isConnected: boolean;
}

interface ReactionGameActions {
  setSession: (sessionId: number) => void;
  setRound: (roundId: number) => void;
  setStatus: (status: ReactionGameStatus) => void;
  setRedSignal: (redAt: number) => void;
  setResults: (results: ReactionResult[]) => void;
  setMyResult: (result: { deltaMs: number; falseStart: boolean; rank: number }) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  resetGame: () => void;
}

export const useReactionStore = create<ReactionGameState & ReactionGameActions>()(persist((set, get) => ({
  status: 'LOBBY',
  participants: 0,
  results: [],
  isConnected: false,
  
  setSession: (sessionId: number) => set({ sessionId }),
  
  setRound: (roundId: number) => set({ roundId }),
  
  setStatus: (status: ReactionGameStatus) => set({ status }),
  
  setRedSignal: (redAt: number) => set({ redAt, status: 'RED' }),
  
  setResults: (results: ReactionResult[]) => 
    set({ results, participants: results.length }),
  
  setMyResult: (result: { deltaMs: number; falseStart: boolean; rank: number }) => 
    set({ myResult: result }),
  
  connectWebSocket: () => {
    const { sessionId, sseClient, isConnected } = get();
    
    if (isConnected || !sessionId) {
      console.log('[SSE] Skip connection - already connected or no sessionId:', { isConnected, sessionId });
      return;
    }
    
    console.log('[SSE] Initializing SSE connection for session:', sessionId);
    
    const client = createSSEClient(String(sessionId), 'reaction', {
      onConnect: () => {
        console.log('[SSE] Connected successfully to session:', sessionId);
        set({ sseClient: client, isConnected: true });
      },
      onDisconnect: () => {
        console.log('[SSE] Disconnected from session:', sessionId);
        set({ isConnected: false });
      },
      onEvent: (eventType, data) => {
        console.log('[SSE] Event received:', eventType, data);
        
        switch (eventType) {
          case 'round-update':
          case 'round-start':
            if (data.status === 'RED' && data.redAt) {
              console.log('[SSE] RED signal received at:', data.redAt);
              set({ status: 'RED', redAt: data.redAt });
            }
            break;
            
          case 'final-results':
            if (data.overallRanking) {
              set({ results: data.overallRanking, participants: data.overallRanking.length, status: 'FINISHED' });
            }
            break;
            
          case 'session-closed':
            console.log('[SSE] Session closed:', data);
            set({ status: 'CLOSED' });
            break;
        }
      },
      onError: (error) => {
        console.error('[SSE] Connection error:', error);
        set({ isConnected: false });
      }
    });
    
    client.connect().catch(error => {
      console.error('[SSE] Failed to connect:', error);
      set({ isConnected: false });
    });
    
    set({ sseClient: client });
  },
  
  disconnectWebSocket: () => {
    const { sseClient } = get();
    if (sseClient) {
      console.log('[SSE] Disconnecting SSE');
      sseClient.close();
      set({ sseClient: null, isConnected: false });
    }
  },
  
  resetGame: () => {
    const { disconnectWebSocket } = get();
    disconnectWebSocket();
    set({
      sessionId: undefined,
      roundId: undefined,
      status: 'LOBBY',
      redAt: undefined,
      participants: 0,
      results: [],
      myResult: undefined,
      isConnected: false
    });
  }
}), {
  name: 'reaction-game-storage',
  version: 1,
  partialize: (state) => ({
    sessionId: state.sessionId,
    roundId: state.roundId,
    results: state.results,
    myResult: state.myResult
  })
}));