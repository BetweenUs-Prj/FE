import { http } from './http';

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

export type OpenSessionSummary = {
  sessionId: number;
  code: string;
  gameType: 'QUIZ' | 'REACTION';
  category: string | null;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  maxPlayers: number;
  memberCount: number;
  hostUid: string;
  createdAt: string; // ISO
};

export interface LobbySnapshot {
  sessionId: number;
  hostUid: string;
  gameType: string;
  capacity: number;
  total: number;
  readyCount: number;
  canJoin: boolean;
  members: MemberInfo[];
  version?: number;
  timestamp?: number;
}

export interface MemberInfo {
  userUid: string;
  isReady: boolean;
  joinedAt: string;
}

export interface SessionFullError {
  code: 'SESSION_FULL';
  message: string;
  capacity: number;
  total: number;
}

export interface SessionLookupResp {
  sessionId: number;
  gameType: string;
  status: string;
}

export interface SessionDetails {
  sessionId: number;
  appointmentId?: number;
  gameType: string;
  status: string;
  category?: string; // 카테고리 정보 추가
  totalRounds?: number; // 총 라운드 수
  hostUid: string;
  participants: ParticipantInfo[];
  startTime?: string;
  endTime?: string;
  inviteCode: string;
  inviteUrl: string;
}

export interface ParticipantInfo {
  userUid: string;
  nickname: string;
  isReady?: boolean;
}

// 세션 코드로 세션 정보 조회
export async function getSessionByCode(code: string): Promise<SessionLookupResp> {
  const { data } = await http.get<SessionLookupResp>(`/mini-games/sessions/by-code/${encodeURIComponent(code)}`);
  return data;
}

// 초대 코드로 세션 조인
export async function joinByCode(code: string): Promise<LobbySnapshot> {
  const { data } = await http.post<LobbySnapshot>(`/mini-games/sessions/join`, { code: code });
  return data;
}

// 기존 joinSessionByCode를 joinByCode를 사용하도록 별칭 제공
export async function joinSessionByCode(inviteCode: string): Promise<LobbySnapshot> {
  return joinByCode(inviteCode);
}

// 로비 정보 조회
export async function getLobby(sessionId: number | string): Promise<LobbySnapshot> {
  const { data } = await http.get(`/mini-games/sessions/${sessionId}/lobby`);
  
  // 서버 응답을 LobbySnapshot 형식으로 변환
  if (data.type === 'LOBBY_SNAPSHOT') {
    return {
      sessionId: data.sessionId,
      hostUid: data.members?.find((m: any) => m.role === 'HOST')?.uid || '',
      gameType: 'REACTION', // 또는 동적으로 설정
      capacity: 10, // 기본값
      total: data.count || data.members?.length || 0,
      readyCount: data.members?.filter((m: any) => m.ready).length || 0,
      canJoin: true, // 기본값
      members: data.members?.map((m: any) => ({
        userUid: m.uid,
        isReady: m.ready || false,
        joinedAt: m.joinedAt
      })) || [],
      version: data.version, // 서버에서 받은 version 정보 포함
      timestamp: data.timestamp // timestamp도 포함
    };
  }
  
  // 이미 올바른 형식이면 그대로 반환
  return data;
}

export async function getLobbySnapshot(sessionId: number): Promise<LobbySnapshot> {
  return getLobby(sessionId);
}

export async function getSessionDetails(sessionId: number): Promise<SessionDetails> {
  const { data } = await http.get<SessionDetails>(`/mini-games/sessions/${sessionId}`);
  return data;
}

// 세션 정보 조회 (카테고리 포함)
export async function getSession(sessionId: number): Promise<SessionDetails> {
  const { data } = await http.get<SessionDetails>(`/mini-games/sessions/${sessionId}`);
  return data;
}

export async function fetchOpenSessions(params?: {
  gameType?: 'QUIZ'|'REACTION';
  status?: string;
  page?: number;
  size?: number;
  q?: string;
}) {
  const { gameType, status='WAITING', page=0, size=10, q } = params ?? {};
  const res = await http.get<Page<OpenSessionSummary>>(
    '/mini-games/sessions',
    { params: { gameType, status, page, size, q } }
  );
  return res.data;
}

export async function joinBySessionId(sessionId: number) {
  return http.post(`/mini-games/sessions/${sessionId}/join`);
}

export async function getSessionSnapshot(sessionId: number) {
  const res = await http.get(`/mini-games/sessions/${sessionId}/snapshot`);
  return res.data;
}

/** 로비 진입 시 보조: 실제로 세션에 참가 */
export async function ensureJoin(sessionId: number) {
  try {
    console.log('[ENSURE-JOIN] Attempting to join session:', sessionId);
    
    // 실제 JOIN POST 요청 수행
    const joinResponse = await http.post(`/mini-games/sessions/${sessionId}/join`);
    console.log('[ENSURE-JOIN] JOIN POST response:', joinResponse);
    
    // JOIN 성공 시 로비 스냅샷과 함께 응답이 올 것으로 예상
    if (joinResponse.data) {
      console.log('[ENSURE-JOIN] JOIN successful with data:', joinResponse.data);
      return {
        ...joinResponse.data,
        lobbySnapshot: joinResponse.data // 로비 스냅샷 정보가 응답에 포함됨
      };
    }
    
    // JOIN 응답에 데이터가 없는 경우 세션 정보 조회
    const sessionData = await getSessionDetails(sessionId);
    console.log('[ENSURE-JOIN] Fallback session details:', sessionData);
    return sessionData;
    
  } catch (err: any) {
    const code = err?.response?.data?.code;
    const status = err?.response?.status;
    
    console.log('[ENSURE-JOIN] Error joining session:', { sessionId, status, code, message: err?.response?.data?.message });
    
    // 404 오류인 경우 세션이 존재하지 않는 것
    if (status === 404) {
      throw new Error('세션이 존재하지 않습니다. 세션 ID를 확인해주세요.');
    }
    
    // 409 오류인 경우 이미 참가 중 - 정상으로 처리
    if (status === 409 && code === 'ALREADY_JOINED') {
      console.log('[ENSURE-JOIN] Already joined, fetching current state');
      try {
        const sessionData = await getSessionDetails(sessionId);
        const lobbyData = await getLobbySnapshot(sessionId);
        return {
          ...sessionData,
          lobbySnapshot: lobbyData
        };
      } catch (fetchErr) {
        console.error('[ENSURE-JOIN] Failed to fetch current state:', fetchErr);
        throw new Error('이미 참가 중인 세션의 현재 상태를 가져오지 못했습니다.');
      }
    }
    
    // 기타 오류 - 재시도 또는 에러 전파
    throw new Error(`세션 참가에 실패했습니다: ${err?.response?.data?.message || err.message}`);
  }
}

// 퀴즈 세션 생성
export async function createQuizSession(payload: { penaltyId: number, totalRounds?: number, category?: string }): Promise<any> {
  const { data } = await http.post(`/mini-games/sessions`, { ...payload, gameType: 'QUIZ' });
  return data;
}

// 퀴즈 라운드 시작
export async function startQuizRound(sessionId: number | string, category: string): Promise<any> {
  const { data } = await http.post(`/mini-games/sessions/${sessionId}/rounds`, { category });
  return data;
}

// Session cleanup utilities
import { useGameStore } from '../hooks/useGameStore';
import { useReactionStore } from '../hooks/useReactionStore';

export async function leaveSessionSafe(sessionId?: number | string) {
  try {
    // Disconnect WebSocket connections
    const { disconnectWebSocket } = useReactionStore.getState();
    disconnectWebSocket();

    // Leave session on backend if sessionId exists
    if (sessionId) {
      try {
        await http.post(`/mini-games/sessions/${sessionId}/leave`, {});
      } catch (error) {
        console.warn('Failed to leave session on backend:', error);
        // Continue with cleanup even if backend fails
      }
    }
  } catch (error) {
    console.warn('Session cleanup warning:', error);
  } finally {
    // Reset all stores regardless of errors
    resetAllStores();
  }
}

export function resetAllStores() {
  // Reset game store
  const gameStore = useGameStore.getState();
  gameStore.resetGame();

  // Reset reaction store
  const reactionStore = useReactionStore.getState();
  reactionStore.resetGame();
}

export function createLeaveSessionHandler(sessionId?: number | string) {
  return () => leaveSessionSafe(sessionId);
}

export async function startSession(sessionId: number, payload?: { category?: string }) {
  return http.post(`/mini-games/sessions/${sessionId}/start`, payload || {});
}

// 반응속도 세션 시작
export async function startReactionSession(sessionId: number): Promise<any> {
  const { data } = await http.post(`/mini-games/sessions/${sessionId}/start`, {});
  return data;
}