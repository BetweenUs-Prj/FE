import { http } from './http';

export interface Penalty {
  id: number;
  description: string;
  userUid: string | null;
  createdAt: string;
}

export interface CreatePenaltyRequest {
  description: string;
  userUid: string | null;
}

export async function createPenalty(payload: CreatePenaltyRequest): Promise<Penalty> {
  const response = await http.post('/penalties', payload);
  return response.data;
}

export async function listPenalties(): Promise<Penalty[]> {
  const response = await http.get('/penalties');
  return response.data;
}

// New API for mini-games penalties
export type CreatePenaltyReq = {
  text: string;
  gameType?: 'QUIZ' | 'REACTION';
  sessionId?: string | number;
};

export type CreatePenaltyRes = { id: string | number };

export async function createGamePenalty(body: CreatePenaltyReq) {
  const { data } = await http.post<CreatePenaltyRes>('/mini-games/penalties', body);
  return data;
}