import { http } from './http';

export interface CreateRoundResponse {
  roundId: number;
  status: string;
  createdAt: number;
}

export interface ClickResponse {
  resultId: number;
  userUid: string;
  clickedAt: number;
  deltaMs: number;
  falseStart: boolean;
  rank: number;
}

export interface RoundStatusResponse {
  roundId: number;
  sessionId: number;
  status: string;
  redAt: number;
  createdAt: number;
  participants: number;
  results: Array<{
    userUid: string;
    deltaMs: number;
    falseStart: boolean;
    rank: number;
  }>;
}

export async function createRound(sessionId: number): Promise<CreateRoundResponse> {
  const response = await http.post('/mini-games/reaction/rounds', { sessionId });
  return response.data;
}

export async function registerClick(roundId: number): Promise<ClickResponse> {
  const response = await http.post(`/mini-games/reaction/rounds/${roundId}/click`);
  return response.data;
}

export async function getRoundStatus(roundId: number): Promise<RoundStatusResponse> {
  const response = await http.get(`/mini-games/reaction/rounds/${roundId}`);
  return response.data;
}