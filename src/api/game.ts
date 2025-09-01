import { http } from './http';
// The global game state store is implemented as a custom hook in the
// hooks directory.  Import the hook itself and its Player type
// separately as a type-only import to avoid bundling the entire module
// at runtime.
import { useGameStore } from '../hooks/useGameStore';
import type { Player, Question } from '../hooks/useGameStore';

export type GameType = 'QUIZ' | 'REACTION';

// STOMP Message Types for Quiz Game
export type RoundStartMsg = {
  type: 'ROUND_START';
  sessionId: number;
  roundId: number;
  roundNo: number;
  category: string;
  expiresAt: string;
  question: {
    id: number;
    text: string;
    options: { id: number; text: string }[];
  };
};

export type RoundEndMsg = {
  type: 'ROUND_END';
  roundId: number;
  correctOptionId: number;
};

export type GameEndMsg = {
  type: 'GAME_END';
};

export type ScoresMsg = {
  type: 'SCORES';
  scores: { uid: string; nick: string; score: number }[];
};

// Current Round Response Schema
export type CurrentRoundResponse = {
  sessionId: number;
  roundId: number;
  roundNo: number;
  category: string;
  expiresAt: string;
  question: {
    id: number;
    text: string;
    options: { id: number; text: string }[];
  };
};

// 런타임 에러 방지를 위한 안전한 메시지 파싱 헬퍼 (기존 타입은 유지)
export function parseRoundStartMessage(data: any): RoundStartMsg | null {
  if (!data || data.type !== 'ROUND_START') return null;
  if (!('roundId' in data) || !('roundNo' in data)) return null;
  if (!data.question || !Array.isArray(data.question.options)) return null;
  
  return {
    type: 'ROUND_START',
    sessionId: data.sessionId || 0,
    roundId: data.roundId,
    roundNo: data.roundNo,
    category: data.category || '',
    expiresAt: data.expiresAt || '',
    question: {
      id: data.question.id || 0,
      text: data.question.text || '',
      options: data.question.options.map((opt: any) => ({
        id: opt.id || 0,
        text: opt.text || ''
      }))
    }
  };
}

export function parseScoresMessage(data: any): ScoresMsg | null {
  if (!data || data.type !== 'SCORES') return null;
  if (!Array.isArray(data.scores)) return null;
  
  return {
    type: 'SCORES',
    scores: data.scores.map((score: any) => ({
      uid: score.uid || '',
      nick: score.nick || '',
      score: score.score || 0
    }))
  };
}

// Static categories fallback used when the backend does not provide a list of categories.
const categories = ['음식', '영화', '스포츠'];

// Create a new game session. In a real app this would call the backend.
/**
 * Creates a new game session on the backend.  The selected penalty must be
 * supplied as part of the payload.  For quiz sessions you may optionally
 * provide the total number of rounds.  A session ID will be returned by the
 * server and stored in the zustand store along with the game type.  In
 * contrast to the previous dummy implementation this function no longer
 * seeds dummy players; instead you should call setPlayers elsewhere if
 * required.
 */
export async function createSession(payload: {
  gameType: GameType;
  penaltyId: number;
  appointmentId?: number;
  totalRounds?: number;
  category?: string;
  inviteOnly?: boolean;
}): Promise<{ sessionId: number; gameType: GameType }> {
  const response = await http
    .post('/mini-games/sessions', payload)
    .then((r) => r.data);
  const { sessionId, gameType } = response;
  // Persist session details in the store
  useGameStore.getState().setSession(sessionId, gameType);
  return { sessionId, gameType };
}

export async function listPenalties() {
  const data = await http.get('/penalties').then((r) => r.data);
  return data;
}

export async function listCategories() {
  // Delegate to the dedicated meta API which handles backend fallback
  const { listCategories: metaListCategories } = await import('./meta');
  return metaListCategories();
}

/**
 * Create a quiz session with penalty ID
 */
export async function createQuizSession(payload: {
  gameType: 'QUIZ';
  penaltyId: number;
  category?: string;
  inviteOnly?: boolean;
  totalRounds?: number;
}): Promise<{ sessionId: number; gameType: GameType }> {
  const response = await http
    .post('/mini-games/sessions', payload)
    .then((r) => r.data);
  const { sessionId, gameType } = response;
  // Persist session details in the store
  useGameStore.getState().setSession(sessionId, gameType);
  return { sessionId, gameType };
}

/**
 * List questions for a specific category with pagination
 */
export async function listQuestions(category: string, page: number = 0, size: number = 10): Promise<Question[]> {
  const resp = await http
    .get('/mini-games/questions', {
      params: { category, page, size },
      timeout: 8000,
      validateStatus: (s) => s >= 200 && s < 500
    })
    .then((r) => r.data);
  
  // The backend returns a Page object with content array
  const questions: any[] = resp.content || [];
  return questions.map((q) => ({
    id: q.questionId ?? q.id ?? 0,
    text: q.question ?? q.text,
    choices: q.options?.map((o: any) => o.optionText) ?? q.choices,
    correct: 0, // unknown from backend; replaced by 0
  }));
}

export async function setPenalty(sessionId: number, penaltyId: number) {
  // Deprecated: penalty is now set during session creation.
  return { success: true };
}

export async function getQuestions(params: { category: string }): Promise<Question[]> {
  console.debug('[API] getQuestions req', params);
  try {
    // Fetch paginated questions for the given category.  Spring Data uses
    // zero-based page indexes.  We request a single page with size 50 to
    // retrieve enough questions.  Adjust size as needed.
    const result = await listQuestions(params.category, 0, 50);
    console.debug('[API] getQuestions res', { count: result.length, category: params.category });
    return result;
  } catch (error) {
    console.error('[API] getQuestions err', error);
    throw error;
  }
}

/**
 * Submit quiz answer - unified signature for timer and manual submission
 * 🔥 HOTFIX: Using legacy endpoint due to NoResourceFoundException in unified endpoint
 * CONTRACT:
 * - URL: POST /api/mini-games/rounds/{roundId}/answers (LEGACY - works)
 * - Headers: X-USER-UID (set by http interceptor)  
 * - Body: { optionId: number }
 * - Returns: 2xx with { correct: boolean, score: number, totalScore: number, allSubmitted: boolean, submittedCount: number, expectedParticipants: number }
 * - Errors: 400/404/409/410 mapped to client errors
 * - TODO: Fix unified endpoint /sessions/{sessionId}/rounds/{roundId}/answers routing issue
 */
export async function submitQuizAnswer(sessionId: number, roundId: number, optionId: number | null, responseTimeMs?: number): Promise<any> {
  const requestBody = {
    optionId: optionId, // SessionId is now in URL path
    responseTimeMs: responseTimeMs || 3000 // 🔥 클라이언트 응답 시간 추가
  };

  // First attempt - HOTFIX: Use legacy endpoint that works
  try {
    const response = await http.post(`/mini-games/rounds/${roundId}/answers`, requestBody);
    console.info('[QUIZ-API] Submit answer success (legacy endpoint):', response.data);
    return response.data || { success: true };
  } catch (error: any) {
    console.warn('[QUIZ-API] Submit answer failed:', {
      status: error.response?.status,
      data: error.response?.data,
      roundId,
      sessionId,
      optionId,
      endpoint: 'LEGACY'
    });

    // Handle 4xx client errors (no retry)
    if (error.response?.status === 409) {
      console.info('[QUIZ-API] Already answered - treating as success');
      return { success: true, alreadyAnswered: true };
    } else if (error.response?.status === 410) {
      console.warn('[QUIZ-API] Round closed');
      throw new Error('라운드가 종료되었습니다.');
    } else if (error.response?.status >= 400 && error.response?.status < 500) {
      const message = error.response?.data?.message || '잘못된 요청입니다.';
      console.error('[QUIZ-API] Client error:', message);
      throw new Error(message);
    }

    // Handle 5xx server errors (1 retry)
    if (error.response?.status >= 500) {
      console.warn('[QUIZ-API] Server error, retrying once with legacy endpoint...');
      try {
        const retryResponse = await http.post(`/mini-games/rounds/${roundId}/answers`, requestBody);
        console.info('[QUIZ-API] Retry success (legacy endpoint):', retryResponse.data);
        return retryResponse.data || { success: true };
      } catch (retryError: any) {
        console.error('[QUIZ-API] Retry failed - REQUEST SNAPSHOT:', {
          url: `/mini-games/rounds/${roundId}/answers`,
          body: requestBody,
          originalError: error.response?.data,
          retryError: retryError.response?.data,
          headers: { 'X-USER-UID': 'will be set by interceptor' },
          endpoint: 'LEGACY'
        });
        throw new Error('서버 오류입니다. 잠시 후 다시 시도해주세요.');
      }
    }

    // Network or other errors
    console.error('[QUIZ-API] Network/unknown error:', error.message);
    throw new Error('네트워크 오류입니다. 연결을 확인해주세요.');
  }
}

export async function submitReaction(sessionId: number, dto: { reactionTime: number }) {
  // Submit the reaction time in seconds.  The backend will record the
  // result for the current user (identified by X-USER-UID header).
  await http.post(`/mini-games/sessions/${sessionId}/reaction/results`, dto);
  return { success: true };
}

export async function getReactionResults(sessionId: number) {
  // Fetch reaction results sorted by reaction time ascending
  const results = await http
    .get(`/mini-games/sessions/${sessionId}/reaction/results`)
    .then((r) => r.data);
  return results;
}

/**
 * Start a new quiz round on the backend (legacy version with questionId).
 */
export async function startQuizRoundByQuestionId(sessionId: number, questionId: number): Promise<{ roundId: number }> {
  const resp = await http
    .post(`/mini-games/sessions/${sessionId}/rounds`, { questionId })
    .then((r) => r.data);
  // The response may include other fields; extract roundId via fallbacks
  const roundId = resp.roundId ?? resp.id ?? resp.round?.id;
  return { roundId };
}

export type StartRoundRes = {
  roundId: number;
  question: { 
    id: number; 
    text: string; 
    category: string; 
    options: { id: number; text: string }[] 
  };
};

/**
 * Start a new quiz round by category - new API
 */
export async function startQuizRound(sessionId: string | number, category: string): Promise<StartRoundRes> {
  const { data } = await http.post<StartRoundRes>(`/mini-games/sessions/${sessionId}/rounds`, { category });
  return data;
}

/**
 * Start quiz game session (로비에서 게임 시작)
 */
export async function startQuiz(sessionId: number | string, category?: string): Promise<{ roundId: number }> {
  const { data } = await http.post<{ roundId: number }>(
    `/mini-games/sessions/${sessionId}/start`,
    category ? { category } : {}
  );
  return data;
}

// Legacy function for backward compatibility
export async function startQuizRoundByCategory(req: { sessionId: string | number; category: string }): Promise<{ roundId: number }> {
  const result = await startQuizRound(req.sessionId, req.category);
  return { roundId: result.roundId };
}

/**
 * Get session details including category
 */
export async function getSession(sessionId: string): Promise<{ category?: string; quizCategory?: string; [key: string]: any }> {
  const { data } = await http.get(`/mini-games/sessions/${sessionId}`, {
    timeout: 5000,
    validateStatus: (s) => s >= 200 && s < 500,
  });
  return data;
}

/**
 * 세션 기반 단일 문제 조회 API
 */
export const getSessionQuestion = (sessionId: string, category?: string) =>
  http.get(`/mini-games/sessions/${sessionId}/question`, {
    params: category ? { category } : undefined,
    timeout: 8000,
    validateStatus: s => s >= 200 && s < 500,
  });

/**
 * Get current round with question and options
 */
export async function getCurrentRound(sessionId: string | number): Promise<CurrentRoundResponse | null> {
  try {
    const { data, status } = await http.get(`/mini-games/sessions/${sessionId}/rounds/current`, {
      timeout: 5000,
      validateStatus: s => s >= 200 && s < 500,
    });
    
    if (status === 204 || status === 404) {
      console.log(`[QUIZ-API] No active round for session ${sessionId} (status: ${status})`);
      return null; // No active round
    }
    
    return data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`[QUIZ-API] No active round for session ${sessionId} (404)`);
      return null;
    }
    console.error('Failed to get current round:', error);
    return null;
  }
}

/**
 * Get initial scoreboard for a session
 */
export async function getScoreboard(sessionId: string | number): Promise<Array<{userUid: string, displayName: string, score: number, rank: number}>> {
  try {
    const { data } = await http.get(`/mini-games/sessions/${sessionId}/scoreboard`, {
      timeout: 5000,
      validateStatus: s => s >= 200 && s < 500,
    });
    return data || [];
  } catch (error) {
    console.error('Failed to get scoreboard:', error);
    return [];
  }
}

/**
 * Get game results (winner, ranking, penalty info)
 */
export async function getGameResults(sessionId: string | number): Promise<GameResultsType | null> {
  try {
    const { data } = await http.get(`/mini-games/sessions/${sessionId}/results`, {
      timeout: 5000,
      validateStatus: s => s >= 200 && s < 500,
    });
    return data || null;
  } catch (error) {
    console.error('Failed to get game results:', error);
    return null;
  }
}

export interface GameResultsType {
  sessionId: number;
  gameType: string;
  winner: PlayerResult | null;
  ranking: PlayerResult[];
  penalty: PenaltyResult;
  completedAt: string;
}

export interface PlayerResult {
  uid: string;
  name: string;
  score: number;
  rank: number;
}

export interface PenaltyResult {
  assigned: boolean;
  rule: string;
  targets: PlayerResult[];
  content: string;
}

/**
 * Create a new quiz session (new game flow)
 */
export async function createNewQuizSession(data: { 
  category: string; 
  rounds: number; 
  inviteOnly: boolean;
  penaltyId?: number;
}): Promise<{ success: boolean; sessionId: number; gameType: 'QUIZ' }> {
  try {
    let penaltyId = data.penaltyId;
    
    // penaltyId가 제공되지 않은 경우 사용 가능한 벌칙 조회
    if (!penaltyId) {
      const penalties = await listPenalties();
      if (!penalties || penalties.length === 0) {
        throw new Error('사용 가능한 벌칙이 없습니다.');
      }
      penaltyId = penalties[0].penaltyId || penalties[0].id;
    }
    
    // 기존 엔드포인트 사용
    const response = await http.post('/mini-games/sessions', {
      appointmentId: null,
      gameType: 'QUIZ',
      penaltyId: penaltyId, // 유효한 벌칙 ID 사용
      totalRounds: data.rounds,
      category: data.category,
      inviteOnly: null, // deprecated
      isPrivate: data.inviteOnly,
      pin: null
    });
    
    // 응답에서 sessionId 안전하게 추출
    const sessionId = response.data.sessionId || response.data.id || response.data.gameSessionId;
    if (!sessionId) {
      throw new Error('세션 생성 응답에서 sessionId를 찾을 수 없습니다.');
    }
    
    return {
      success: true,
      sessionId: Number(sessionId),
      gameType: 'QUIZ'
    };
  } catch (error) {
    console.error('Failed to create quiz session:', error);
    throw error;
  }
}

/**
 * Create a new reaction session (new game flow)
 */
export async function createNewReactionSession(data: { 
  rounds: number; 
  inviteOnly: boolean;
  penaltyId?: number;
}): Promise<{ success: boolean; sessionId: number; gameType: 'REACTION' }> {
  try {
    // 먼저 사용 가능한 벌칙 목록 조회
    const penalties = await listPenalties();
    if (!penalties || penalties.length === 0) {
      throw new Error('사용 가능한 벌칙이 없습니다.');
    }
    
    // 벌칙 ID 결정: 매개변수로 받은 것 사용하거나 첫 번째 사용 가능한 벌칙 ID 사용
    const penaltyId = data.penaltyId || penalties[0].penaltyId || penalties[0].id;
    
    // 기존 엔드포인트 사용
    const response = await http.post('/mini-games/sessions', {
      gameType: 'REACTION',
      totalRounds: data.rounds,
      inviteOnly: data.inviteOnly,
      penaltyId: penaltyId // 선택된 벌칙 ID 사용
    });
    
    // 응답에서 sessionId 안전하게 추출
    const sessionId = response.data.sessionId || response.data.id || response.data.gameSessionId;
    if (!sessionId) {
      throw new Error('세션 생성 응답에서 sessionId를 찾을 수 없습니다.');
    }
    
    return {
      success: true,
      sessionId: Number(sessionId),
      gameType: 'REACTION'
    };
  } catch (error) {
    console.error('Failed to create reaction session:', error);
    throw error;
  }
}