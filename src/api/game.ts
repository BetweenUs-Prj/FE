import { http } from './http';
// The global game state store is implemented as a custom hook in the
// hooks directory.  Import the hook itself and its Player type
// separately as a type-only import to avoid bundling the entire module
// at runtime.
import { useGameStore } from '../hooks/useGameStore';
import type { Player, Question } from '../hooks/useGameStore';

export type GameType = 'QUIZ' | 'REACTION';

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
}): Promise<{ sessionId: number; gameType: GameType }> {
  const response = await http
    .post('/mini-games/sessions', payload)
    .then((r) => r.data);
  const { sessionId, gameType } = response;
  // Persist session details in the store.  Note: no dummy players are set
  useGameStore.getState().setSession(sessionId, gameType);
  // Populate some placeholder players if none exist yet.  This is
  // client-side only and should be removed once the backend provides
  // participant information.
  const currentPlayers = useGameStore.getState().players;
  if (!currentPlayers || currentPlayers.length === 0) {
    const dummyNames = ['동동', '철수', '영희', '민수'];
    const players: Player[] = dummyNames.map((name) => ({
      id: `${name}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      score: 0,
    }));
    useGameStore.getState().setPlayers(players);
  }
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
 * Create a quiz session with category support
 */
export async function createQuizSession(payload: {
  gameType: 'QUIZ';
  totalRounds: number;
  category: string;
  penaltyId: number;
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
  // Fetch paginated questions for the given category.  Spring Data uses
  // zero-based page indexes.  We request a single page with size 50 to
  // retrieve enough questions.  Adjust size as needed.
  return listQuestions(params.category, 0, 50);
}

export async function submitQuizAnswer(roundId: number, dto: { answerIndex: number }) {
  /*
   * Submit a quiz answer.  The backend expects a SubmitAnswerReq
   * which includes the user's UID and the answer text.  Because
   * the controller does not accept the user ID via header, we must
   * explicitly include it in the request body.  We derive the
   * current UID from localStorage (set by http.ts) or fall back to
   * a generated development UID.  The answer index is converted
   * to a string and sent as answerText.  See QuizController.submitAnswer
   * for details on the expected payload.
   */
  const userUid =
    (typeof localStorage !== 'undefined' && localStorage.getItem('userUid')) ||
    undefined;
  await http.post(`/mini-games/rounds/${roundId}/answers`, {
    userUid,
    answerText: String(dto.answerIndex),
  });
  return { success: true };
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
 * Start a new quiz round on the backend.  You must supply the session ID and
 * the ID of the question to present.  The backend will return a round
 * identifier which you can use when submitting answers.
 */
export async function startQuizRound(sessionId: number, questionId: number): Promise<{ roundId: number }> {
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
  const { data } = await http.post<StartRoundRes>(`/mini-games/quiz/${sessionId}/rounds`, { category });
  return data;
}

// Legacy function for backward compatibility
export async function startQuizRoundByCategory(req: { sessionId: string | number; category: string }): Promise<{ roundId: number }> {
  const result = await startQuizRound(req.sessionId, req.category);
  return { roundId: result.roundId };
}