import { http } from './http';

export type Penalty = {
  id: number;
  text: string;
  emoji?: string;
};

export async function fetchPenalties(scope: 'all' | 'mine' | 'system' = 'all'): Promise<Penalty[]> {
  const { data } = await http.get<Penalty[]>('/penalties', { params: { scope } });
  return data;
}

// Legacy API for compatibility
export interface LegacyPenalty {
  id: number;
  description: string;
  userUid: string | null;
  createdAt: string;
}

export interface CreatePenaltyRequest {
  description: string;
  userUid: string | null;
}

export async function createPenalty(payload: CreatePenaltyRequest): Promise<LegacyPenalty> {
  const response = await http.post('/penalties', payload);
  return response.data;
}

export async function listPenalties(): Promise<LegacyPenalty[]> {
  const response = await http.get('/penalties');
  return response.data;
}

// New API for mini-games penalties
export type CreatePenaltyReq = {
  text: string;
};

export type CreatePenaltyRes = { 
  id: number; 
  text: string; 
  userUid: string; 
  createdAt: string;
};

export async function createGamePenalty(text: string) {
  const { data } = await http.post<CreatePenaltyRes>('/mini-games/penalties', { text });
  return data as { id: number; text: string; userUid: string; createdAt: string };
}