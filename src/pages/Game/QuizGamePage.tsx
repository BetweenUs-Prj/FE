/**
 * 기존 컴포넌트 활용한 완전한 퀴즈 게임 페이지
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showToast } from '../../components/common/Toast';
import {
  GameHeader,
  GameContainer,
  LoadingCard,
  ThemeButton
} from '../../components';
import QuizTimer from '../../components/game/quiz/QuizTimer';
import QuizQuestionCard from '../../components/game/quiz/QuizQuestionCard';
import AnswerFeedback from '../../components/game/quiz/AnswerFeedback';
import WaitingForPlayers from '../../components/game/quiz/WaitingForPlayers';
import { LiveScoreboard, type ScoreboardItem } from '../../components/quiz/LiveScoreboard';
import { getUid, http } from '../../api/http';
import { submitQuizAnswer } from '../../api/game';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  questionId: string;
  questionText: string;
  options: QuizOption[];
  roundNo: number;
  category: string;
  roundId: string;
  expiresAt: string;
}

export default function QuizGamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // 기본 상태
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 세션 정보
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  
  // 퀴즈 상태 (통일된 명명)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [inflight, setInflight] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [serverTimeMs, setServerTimeMs] = useState<number | null>(null);
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
  
  // ms/초/ISO 모두 안전 처리
  function normalizeMillis(v: unknown): number | null {
    if (v == null) return null;
    if (typeof v === 'number') {
      // 초 단위(10자리 이하)면 ms로 보정
      return v < 1e12 ? Math.trunc(v * 1000) : Math.trunc(v);
    }
    if (typeof v === 'string') {
      const n = Number(v);
      if (Number.isFinite(n)) return n < 1e12 ? Math.trunc(n * 1000) : Math.trunc(n);
      const t = Date.parse(v); // ISO 문자열
      return Number.isFinite(t) ? t : null;
    }
    return null;
  }
  
  
  // 스코어보드 상태
  const [scoreboard, setScoreboard] = useState<ScoreboardItem[]>([]);
  
  // 대기 상태
  const [waitingInfo, setWaitingInfo] = useState<{
    submittedCount: number;
    expectedParticipants: number;
  } | null>(null);
  
  // 피드백 상태
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  
  // 피드백 완료 콜백
  const handleFeedbackComplete = useCallback(() => {
    setShowFeedback(false);
    // 피드백 완료 후에는 대기 화면이 표시됨 (waitingInfo가 있으면)
  }, []);
  
  // Refs - 폴링 및 스코어 관리만 사용 (타이머는 useEffect로 대체)
  const timerRef = useRef<number | null>(null); // Legacy - kept for compatibility
  const pollRoundRef = useRef<number | null>(null);
  const scorePollingRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const currentExpiresAtRef = useRef<string | null>(null); // Legacy
  
  // 폴링 안정화를 위한 추가 refs
  const pollingIdRef = useRef<number | null>(null);
  const loadingNextRef = useRef(false);
  const mountedRef = useRef(false);
  const serverOffsetRef = useRef(0); // 서버-클라이언트 시차(ms)
  
  const userUid = getUid();
  console.log('[QUIZ] User UID:', userUid);

  // 호이스팅되는 함수 선언문들 - TDZ 문제 해결
  // Legacy timer functions (kept for compatibility but not used)
  function clearTimer() {
    console.log('[QUIZ] Clearing timer (legacy)');
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // loadNextRoundImmediately를 먼저 선언
  const loadNextRoundImmediately = useCallback(async () => {
    if (loadingNextRef.current) return;
    loadingNextRef.current = true;
    
    try {
      const r = await http.get(`/mini-games/sessions/${sessionId}/rounds/current`, { 
        validateStatus: () => true 
      });
      
      if (r.status === 200 && r.data) {
        applyRound(r.data);
        return;
      }
      
      if (r.status === 204 && r.headers['x-round-phase'] === 'FINISHED') {
        goToResults();
        return;
      }
      
      // 아직 준비 전: 짧게 재시도
      schedule(loadNextRoundImmediately, 300);
    } catch (error) {
      console.error('[QUIZ] loadNextRoundImmediately error:', error);
      schedule(loadNextRoundImmediately, 500);
    } finally {
      loadingNextRef.current = false;
    }
  }, [sessionId]);

  // 🔥 실시간 타이머 업데이트 - 오프셋 기반 방식
  useEffect(() => {
    if (!expiresAtMs || !currentQuestion) {
      console.log('[QUIZ] Timer not starting - expiresAtMs:', expiresAtMs, 'currentQuestion:', !!currentQuestion);
      return;
    }
    
    console.log('[QUIZ] Starting timer with expiresAtMs:', expiresAtMs, 'serverOffset:', serverOffsetRef.current);
    
    let correctedExpiresAt = expiresAtMs;
    
    // 서버 오프셋을 반영한 현재 시각
    const nowAdj = Date.now() + serverOffsetRef.current;
    
    // 초기 보정 - 비정상적인 만료 시간 체크
    const diffMsInit = correctedExpiresAt - nowAdj;
    if (diffMsInit > 35_000 || diffMsInit < -5_000) {
      correctedExpiresAt = nowAdj + 30_000;
      console.log('[QUIZ] Timer corrected from', new Date(expiresAtMs).toLocaleTimeString(), 'to', new Date(correctedExpiresAt).toLocaleTimeString());
    }
    
    // 즉시 첫 번째 값 설정
    const initialRem = Math.max(0, Math.min(30, Math.floor((correctedExpiresAt - nowAdj) / 1000)));
    console.log('[QUIZ] Initial timer value:', initialRem);
    setTimeLeft(initialRem);
    
    // 500ms 간격으로 타이머 업데이트
    const timer = setInterval(() => {
      if (!mountedRef.current) return;
      
      const curAdj = Date.now() + serverOffsetRef.current;
      const rem = Math.max(0, Math.min(30, Math.floor((correctedExpiresAt - curAdj) / 1000)));
      
      console.log('[QUIZ] Timer tick - remaining:', rem, 'seconds', 'currentTime:', new Date(curAdj).toLocaleTimeString());
      setTimeLeft(rem);
      
      if (rem <= 0) {
        console.log('[QUIZ] Time expired, checking next round...');
        // 시간 만료 시 답변하지 않은 경우
        if (!hasSubmitted && currentQuestion) {
          console.log('[QUIZ] Auto-handling timeout - marking as submitted and moving to next round');
          setHasSubmitted(true);
          setIsAnswered(true);
          showToast('⏰ 시간 초과! 0점 처리됩니다.', 'error', 5000);
          
          // 잠시 대기 후 다음 라운드로 진행
          setTimeout(() => {
            loadNextRoundImmediately();
          }, 1000);
        } else {
          loadNextRoundImmediately();
        }
      }
    }, 500);
    
    return () => {
      console.log('[QUIZ] Clearing timer interval');
      clearInterval(timer);
    };
  }, [expiresAtMs, currentQuestion?.questionId]); // serverTimeMs는 offsetRef에 흡수되므로 의존성 제외

  function clearAllIntervals() {
    console.log('[QUIZ] Clearing all intervals...');
    
    clearTimer();
    
    if (pollRoundRef.current !== null) {
      clearInterval(pollRoundRef.current);
      pollRoundRef.current = null;
    }
    
    if (scorePollingRef.current !== null) {
      clearInterval(scorePollingRef.current);
      scorePollingRef.current = null;
    }
  }

  // 폴링 안정화를 위한 함수 선언문들 (호이스팅 가능)
  function stopRoundPolling() {
    if (pollingIdRef.current) {
      window.clearTimeout(pollingIdRef.current);
      pollingIdRef.current = null;
    }
  }

  function schedule(fn: () => void, ms: number) {
    stopRoundPolling();
    pollingIdRef.current = window.setTimeout(fn, ms);
  }

  function applyRound(roundData: any) {
    const question: QuizQuestion = {
      questionId: roundData.question.id.toString(),
      questionText: roundData.question.text,
      options: roundData.question.options.map((opt: any) => ({
        id: opt.id.toString(),
        text: opt.text
      })),
      roundNo: roundData.roundNo,
      category: roundData.category,
      roundId: roundData.roundId.toString(),
      expiresAt: roundData.expiresAt
    };
    
    setCurrentQuestion(question);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setInflight(false);
    setHasSubmitted(false);
    setWaitingInfo(null);
    setShowFeedback(false); // 피드백 초기화
    setRoundStartTime(Date.now()); // 🔥 라운드 시작 시간 기록
    
    // 타이머 시작 (서버 권위 시간 사용)
    const ms = normalizeMillis(roundData.expiresAtMs || roundData.expireAtMillis || roundData.expiresAt);
    const serverMs = normalizeMillis(roundData.serverTimeMs);
    
    if (ms != null) {
      setExpiresAtMs(prev => (prev === ms ? prev : ms));
      if (serverMs != null) {
        setServerTimeMs(prev => (prev === serverMs ? prev : serverMs));
        serverOffsetRef.current = serverMs - Date.now();  // ⭐ 오프셋 저장 (한 번만 계산)
      }
      
      const timeSkew = serverMs ? Math.floor((serverMs - Date.now()) / 1000) : 0;
      console.debug('[QUIZ] Applied round:', roundData.roundId, 'expiresAtMs:', ms, 'serverTimeMs:', serverMs, 
        'timeSkew:', timeSkew, 'seconds');
    }
  }

  function goToResults() {
    console.log('[QUIZ] Game finished, navigating to results');
    clearAllIntervals();
    stopRoundPolling();
    // 🔥 게임 종료 시 결과 페이지로 이동
    navigate(`/game/result/${sessionId}`, { replace: true });
  }

  function startRoundPolling(initialDelay: number = 0) {
    // 중복 방지
    stopRoundPolling();

    const loop = async () => {
      // 언마운트/세션 변경 안전장치
      if (!mountedRef.current) return;

      try {
        const res = await http.get(`/mini-games/sessions/${sessionId}/rounds/current`, { 
          validateStatus: () => true 
        });
        
        if (res.status === 200 && res.data) {
          applyRound(res.data);
          schedule(loop, 1000); // 진행 중 1s
          return;
        }
        
        // 전환 상태: 대기
        const phase = res.headers?.['x-round-phase'];
        if (res.status === 204 && phase === 'WAITING_NEXT') {
          schedule(loop, 400); // 전환 중 0.4s
          return;
        }
        
        if (res.status === 204 && phase === 'FINISHED') {
          goToResults();
          return;
        }
        
        // 그 외 예외는 짧게 리트라이
        schedule(loop, 800);
      } catch (error) {
        console.error('[QUIZ] startRoundPolling error:', error);
        schedule(loop, 1000);
      }
    };

    schedule(loop, initialDelay);
  }

  /**
   * 세션 정보 로드
   */
  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      console.log('[QUIZ] Loading session info:', sessionId, 'with userUid:', userUid);
      const response = await http.get(`/mini-games/sessions/${sessionId}`);
      const sessionData = response.data;
      console.log('[QUIZ] Session data loaded:', sessionData);
        
      setSessionInfo(sessionData);
      setParticipants(sessionData.participants || []);
      
      // 스코어보드 초기화
      const initialScoreboard: ScoreboardItem[] = (sessionData.participants || []).map((p: any, index: number) => {
        const userUid = String(p.userUid || 'unknown');
        const displayName = p.nickname || p.displayName || 
                           (userUid !== 'unknown' ? `Player ${userUid.slice(-4)}` : `User ${index + 1}`);
        
        return {
          userUid: userUid,
          displayName: displayName,
          score: 0,
          rank: 1
        };
      });
      console.log('[QUIZ] Initial scoreboard:', initialScoreboard);
      setScoreboard(initialScoreboard);
      
      return sessionData;
    } catch (error) {
      console.error('[QUIZ] Session loading error:', error);
      throw error;
    }
  }, [sessionId, userUid]);

  /**
   * 현재 라운드 로드 - HTTP 204/404를 정상 상태로 처리
   */
  const loadCurrentRound = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      console.log('[QUIZ] Loading current round for session:', sessionId);
      const response = await http.get(`/mini-games/sessions/${sessionId}/rounds/current`, {
        validateStatus: () => true
      });
      
      if (response.status === 200 && response.data) {
        const roundData = response.data;
        console.log('[QUIZ] Round data loaded:', roundData);
        console.log('[QUIZ] Round data question:', roundData.question);
        console.log('[QUIZ] Round data options:', roundData.question?.options);
        
        if (roundData && roundData.question) {
          const question: QuizQuestion = {
            questionId: roundData.question.id.toString(),
            questionText: roundData.question.text,
            options: roundData.question.options.map((opt: any) => ({
              id: opt.id.toString(),
              text: opt.text
            })),
            roundNo: roundData.roundNo,
            category: roundData.category,
            roundId: roundData.roundId.toString(),
            expiresAt: roundData.expiresAt
          };
          
          console.log('[QUIZ] Mapped question:', question);
          
          setCurrentQuestion(question);
          setSelectedOptionId(null);
          setIsAnswered(false);
          setInflight(false);
          setHasSubmitted(false);
          setShowFeedback(false); // 피드백 초기화
          setWaitingInfo(null); // 대기 정보 초기화
          
          // 타이머 시작 (서버 권위 시간 사용)
          const ms = normalizeMillis(roundData.expiresAtMs || roundData.expireAtMillis || roundData.expiresAt);
          const serverMs = normalizeMillis(roundData.serverTimeMs);
          
          if (ms != null) {
            setExpiresAtMs(prev => (prev === ms ? prev : ms));
            if (serverMs != null) {
              setServerTimeMs(prev => (prev === serverMs ? prev : serverMs));
              serverOffsetRef.current = serverMs - Date.now();  // ⭐ 오프셋 저장 (한 번만 계산)
            }
            
            console.debug('[QUIZ] Timer setup - expiresAtMs:', ms, 'serverTimeMs:', serverMs);
          }
          
          return question;
        } else {
          console.log('[QUIZ] No question in round data');
        }
      } else if (response.status === 204 || response.status === 404) {
        const phase = response.headers['x-round-phase'] || 'WAITING_NEXT';
        console.log('[QUIZ] Round load - no active round (phase:', phase, ')');
        
        if (phase === 'FINISHED') {
          console.log('[QUIZ] Game finished during round load');
          return 'GAME_FINISHED';
        }
        // phase === 'WAITING_NEXT' - 정상적인 라운드 간 대기 상태
        return 'WAITING_NEXT';
      } else {
        console.warn('[QUIZ] Unexpected response status during round load:', response.status);
        return null;
      }
    } catch (error) {
      console.error('[QUIZ] Network error during round loading:', error);
      throw error;
    }
  }, [sessionId, userUid]);

  // \uae30\uc874 startTimer useCallback \uc81c\uac70 - \ud568\uc218 \uc120\uc5b8\ubb38\uc73c\ub85c \ub300\uccb4\ub428

  /**
   * 옵션 클릭 시 즉시 제출 (click-to-submit) - 완전히 리팩터링됨
   */
  const onOptionClick = useCallback(async (optionId: string) => {
    // Guard clauses for race conditions and invalid states
    if (inflight || hasSubmitted || !currentQuestion) {
      console.log('[QUIZ] Option click ignored', { inflight, hasSubmitted, hasQuestion: !!currentQuestion });
      return;
    }
    
    // Time guard: prevent submissions within 150ms of expiration
    if (expiresAtMs && Date.now() >= expiresAtMs - 150) {
      console.log('[QUIZ] Option click ignored - too close to expiration');
      showToast('시간이 초과되었습니다.', 'error');
      return;
    }
    
    setInflight(true);
    setSelectedOptionId(optionId);
    
    // 🔥 실제 응답 시간 계산 (라운드 시작부터 클릭까지의 시간)
    const actualResponseTime = roundStartTime ? Date.now() - roundStartTime : 3000;
    console.debug('[QUIZ] Response time calculated:', actualResponseTime, 'ms');
    
    try {
      const res = await http.post(
        `/mini-games/sessions/${sessionId}/rounds/${currentQuestion.roundId}/answers`,
        { 
          optionId: parseInt(optionId),
          responseTimeMs: actualResponseTime // 🔥 실제 응답시간 전송
        },
        { validateStatus: () => true }
      );
      
      if (res.status === 200 || res.status === 409) {
        setHasSubmitted(true);
        setIsAnswered(true);
        
        console.log('[QUIZ] Answer submitted:', {
          status: res.status,
          correct: res.data?.correct,
          allSubmitted: res.data?.allSubmitted,
          submittedCount: res.data?.submittedCount,
          expectedParticipants: res.data?.expectedParticipants,
          alreadySubmitted: res.data?.alreadySubmitted
        });
        
        if (res.data?.alreadySubmitted) {
          showToast('이미 답변을 제출하셨습니다.', 'info', 5000);
        } else {
          // 토스트 대신 애니메이션 피드백 표시
          setLastAnswerCorrect(res.data?.correct || false);
          setShowFeedback(true);
        }
        
        if (res.data?.allSubmitted) {
          console.debug('[QUIZ] All submitted - stopping polling and loading next round');
          stopRoundPolling();
          // 피드백 표시 후 다음 라운드로 진행
          setTimeout(() => {
            loadNextRoundImmediately();
          }, showFeedback ? 3000 : 0);
        } else {
          console.debug('[QUIZ] Waiting for others:', res.data?.submittedCount, '/', res.data?.expectedParticipants);
          setWaitingInfo({
            submittedCount: res.data?.submittedCount || 0,
            expectedParticipants: res.data?.expectedParticipants || 1
          });
          startRoundPolling();
        }
        return;
      }
      
      if (res.status === 410 && res.data?.code === 'ROUND_CLOSED') {
        setHasSubmitted(true);
        stopRoundPolling();
        loadNextRoundImmediately();
        return;
      }
      
      if (res.status === 422 && res.data?.code === 'INVALID_OPTION') {
        const currentRound = await loadCurrentRound();
        showToast('선택이 유효하지 않습니다.', 'error');
        if (currentRound === 'GAME_FINISHED') {
          // 🔥 게임이 종료된 경우 결과 페이지로 이동
          navigate(`/game/result/${sessionId}`, { replace: true });
        }
        return;
      }
      
      if (res.status === 404 || res.status === 403) {
        showToast('세션/권한 오류', 'error');
        navigate('/game', { replace: true });
        return;
      }
      
      // 5xx 서버 오류만 사용자에게 표시
      if (res.status >= 500) {
        showToast('서버 내부 오류입니다. 잠시 후 다시 시도해주세요.', 'error');
      } else {
        console.warn('[QUIZ] Unexpected status code:', res.status, res.data);
        showToast('예상치 못한 응답입니다.', 'error');
      }
    } catch (error: any) {
      console.error('[QUIZ] Answer submission error:', error);
      showToast('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setInflight(false);
    }
  }, [currentQuestion, inflight, hasSubmitted, expiresAtMs, sessionId, navigate, loadCurrentRound, stopRoundPolling, loadNextRoundImmediately, startRoundPolling]);
  
  /**
   * Legacy submitAnswer function - kept for backward compatibility during transition
   */
  const submitAnswer = useCallback(async (optionId: string) => {
    // Redirect to new click-to-submit behavior
    return onOptionClick(optionId);
  }, [onOptionClick]);

  /**
   * 실시간 점수 업데이트 로드
   */
  const loadScoreboard = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await http.get(`/mini-games/sessions/${sessionId}/scores`);
      const scoresData = response.data;
        console.log('[QUIZ] Scores loaded:', scoresData);
        console.log('[QUIZ] First score detail:', scoresData[0]);
        if (scoresData[0]) {
          console.log('[QUIZ] Score keys:', Object.keys(scoresData[0]));
        }
        
        // 점수 데이터를 스코어보드 형식으로 변환
        const scoreboardData: ScoreboardItem[] = scoresData.map((score: any, index: number) => {
          console.log('[QUIZ] Score data:', score);
          const userUid = String(score.userUid || 'unknown');
          const displayName = score.nickname || score.displayName || 
                             (userUid !== 'unknown' ? `Player ${userUid.slice(-4)}` : `User ${index + 1}`);
          console.log('[QUIZ] Processed:', { userUid, displayName });
          
          return {
            userUid: userUid,
            displayName: displayName,
            score: score.totalScore || 0,
            rank: index + 1
          };
        });
        
      setScoreboard(scoreboardData);
    } catch (error) {
      console.log('[QUIZ] Score loading error:', error);
    }
  }, [sessionId, userUid]);

  /**
   * 게임 종료 확인
   */
  const checkGameEnd = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await http.get(`/mini-games/sessions/${sessionId}`);
      const sessionData = response.data;
      console.log('[QUIZ] Session status check:', sessionData.status);
      
      if (sessionData.status === 'FINISHED' || sessionData.status === 'COMPLETED') {
        console.log('[QUIZ] Game finished, navigating to results...');
        // 모든 인터벌 정리
        clearAllIntervals();
        
        // 최종 점수 업데이트 후 결과 페이지로 이동
        await loadScoreboard();
        showToast('게임이 종료되었습니다!', 'info');
        
        // 🔥 게임 종료 시 결과 페이지로 이동
        navigate(`/game/result/${sessionId}`, { replace: true });
      }
    } catch (error) {
      console.log('[QUIZ] Game end check error:', error);
    }
  }, [sessionId, userUid, navigate, loadScoreboard]);

  // \uae30\uc874 clearAllIntervals useCallback \uc81c\uac70 - \ud568\uc218 \uc120\uc5b8\ubb38\uc73c\ub85c \ub300\uccb4\ub428

  // Old startRoundPolling useCallback removed - replaced with function declaration above

  /**
   * 초기화 - 의존성 배열 최소화
   */
  const initialize = useCallback(async () => {
    if (!sessionId) {
      setError('세션 ID가 없습니다.');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('[QUIZ] Initializing quiz game for session:', sessionId);
      
      // 1. 세션 정보 로드
      const sessionResponse = await http.get(`/mini-games/sessions/${sessionId}`);
      const sessionData = sessionResponse.data;
      setSessionInfo(sessionData);
      setParticipants(sessionData.participants || []);
      
      // 2. 현재 라운드 확인 - HTTP 204/404를 정상 상태로 처리
      let question = null;
      try {
        const roundResponse = await http.get(`/mini-games/sessions/${sessionId}/rounds/current`, {
          validateStatus: () => true
        });
        
        if (roundResponse.status === 200 && roundResponse.data) {
          const roundData = roundResponse.data;
          
          if (roundData && roundData.question) {
            question = {
              questionId: roundData.question.id.toString(),
              questionText: roundData.question.text,
              options: roundData.question.options.map((opt: any) => ({
                id: opt.id.toString(),
                text: opt.text
              })),
              roundNo: roundData.roundNo,
              category: roundData.category,
              roundId: roundData.roundId.toString(),
              expiresAt: roundData.expiresAt
            };
            setCurrentQuestion(question);
            
            // 타이머 시작 (서버 권위 시간 사용)
            // 🔥 초기 타이머 설정: 서버 시간 동기화 적용
            const ms = normalizeMillis(roundData.expiresAtMs || roundData.expireAtMillis || roundData.expiresAt);
            const serverMs = normalizeMillis(roundData.serverTimeMs);
            
            if (ms != null) {
              setExpiresAtMs(prev => (prev === ms ? prev : ms));
              if (serverMs != null) {
                setServerTimeMs(prev => (prev === serverMs ? prev : serverMs));
                serverOffsetRef.current = serverMs - Date.now();  // ⭐ 오프셋 저장 (한 번만 계산)
              }
              
              console.debug('[QUIZ] Initial timer - expiresAtMs:', ms, 'serverTimeMs:', serverMs);
            }
          }
        } else if (roundResponse.status === 204 || roundResponse.status === 404) {
          const phase = roundResponse.headers['x-round-phase'] || 'WAITING_NEXT';
          console.log('[QUIZ] Initial round check - no active round (phase:', phase, ')');
          
          if (phase === 'FINISHED') {
            console.log('[QUIZ] Game already finished on init');
            clearAllIntervals();
            // 🔥 게임이 이미 종료된 경우 결과 페이지로 이동
            navigate(`/game/result/${sessionId}`, { replace: true });
            return;
          }
          // phase === 'WAITING_NEXT' - 다음 라운드 대기 중, 폴링 시작
        }
      } catch (roundError) {
        console.log('[QUIZ] Round check error:', roundError);
        // 네트워크 에러 등의 경우에만 에러 처리
      }
      
      // 3. 초기 점수 로드
      try {
        const scoresResponse = await http.get(`/mini-games/sessions/${sessionId}/scores`);
        const scoresData = scoresResponse.data;
        const scoreboardData = scoresData.map((score: any, index: number) => ({
          userUid: score.userUid,
          displayName: score.userUid,
          score: score.totalScore || 0,
          rank: index + 1,
          totalResponseTime: score.totalResponseTime || undefined
        }));
        
        // 점수 변경 확인 (deep comparison) - 응답시간도 포함
        setScoreboard(prev => {
          if (prev.length === scoreboardData.length && 
              prev.every((item, i) => 
                item.userUid === scoreboardData[i].userUid && 
                item.score === scoreboardData[i].score &&
                item.totalResponseTime === scoreboardData[i].totalResponseTime
              )) {
            return prev; // 변경 없음
          }
          return scoreboardData;
        });
      } catch (scoreError) {
        console.log('[QUIZ] Failed to load initial scores');
      }
      
      if (!question) {
        // 라운드가 없으면 대기 상태로 폴링 시작
        console.log('[QUIZ] No active round, starting polling...');
        startRoundPolling();
      }
      
    } catch (error) {
      console.error('[QUIZ] Initialization failed:', error);
      setError(error instanceof Error ? error.message : '게임 초기화에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]); // startRoundPolling 의존성 제거 - 함수 선언문에서 호출


  // 초기화 useEffect - 마운트/언마운트 관리
  useEffect(() => {
    mountedRef.current = true;
    console.log('[QUIZ] Component mounting for session:', sessionId);
    
    // 로비 구독/폴링은 이 페이지에서 반드시 해제
    // stopLobbySubscriptions?.(); // If available
    
    // 초기화 및 라운드 폴링 시작
    initialize();
    startRoundPolling(0);
    
    // 정리 함수
    return () => {
      mountedRef.current = false;
      console.log('[QUIZ] Component unmounting or sessionId changed');
      stopRoundPolling();
      clearAllIntervals();
      clearTimer();
    };
  }, [sessionId]); // 함수 선언문이므로 startRoundPolling/stopRoundPolling를 의존성에 넣지 않음


  // 실시간 점수 업데이트
  useEffect(() => {
    if (!sessionId || isLoading) return;
    
    console.log('[QUIZ] Starting real-time score polling...');
    
    // 기존 점수 폴링 정리
    if (scorePollingRef.current !== null) {
      clearInterval(scorePollingRef.current);
      scorePollingRef.current = null;
    }
    
    // 새 점수 폴링 시작 (더 빠른 업데이트)
    scorePollingRef.current = window.setInterval(async () => {
      if (!mountedRef.current) return;
      
      try {
        const response = await http.get(`/mini-games/sessions/${sessionId}/scores`);
        const scoresData = response.data;
        const scoreboardData = scoresData.map((score: any, index: number) => {
          const userUid = String(score.userUid || 'unknown');
          const displayName = score.nickname || score.displayName || 
                             (userUid !== 'unknown' ? `Player ${userUid.slice(-4)}` : `User ${index + 1}`);
          
          return {
            userUid: userUid,
            displayName: displayName,
            score: score.totalScore || 0,
            rank: index + 1,
            totalResponseTime: score.totalResponseTime || undefined
          };
        });
        
        // 점수 변경 확인 (deep comparison) - 응답시간도 포함
        setScoreboard(prev => {
          if (prev.length === scoreboardData.length && 
              prev.every((item, i) => 
                item.userUid === scoreboardData[i].userUid && 
                item.score === scoreboardData[i].score &&
                item.totalResponseTime === scoreboardData[i].totalResponseTime
              )) {
            return prev; // 변경 없음
          }
          console.log('[QUIZ] Score updated:', scoreboardData);
          return scoreboardData;
        });
      } catch (error) {
        console.log('[QUIZ] Score polling error:', error);
      }
    }, 1000); // 1초마다 업데이트 (실시간성 개선)
    
    return () => {
      if (scorePollingRef.current !== null) {
        clearInterval(scorePollingRef.current);
        scorePollingRef.current = null;
      }
    };
  }, [sessionId, isLoading]);

  // 에러 상태
  if (error) {
    return (
      <GameContainer>
        <GameHeader title="퀴즈 게임" backPath="/game" />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>오류 발생</h2>
          <p style={{ marginBottom: '2rem' }}>{error}</p>
          <ThemeButton variant="primary" onClick={() => navigate('/game')}>
            게임 홈으로 돌아가기
          </ThemeButton>
        </div>
      </GameContainer>
    );
  }

  // 로딩 상태
  // --- 스타일 및 렌더링 ---
  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
    } 
  };
  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(0)'; 
      e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; 
    } 
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(2px)'; 
      e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; 
    } 
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
    } 
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    .pixel-game-body { 
      font-family: 'Press Start 2P', cursive; 
      background-color: #2c2d3c; 
      color: #f2e9e4; 
      background-image: linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px); 
      background-size: 4px 4px; 
      image-rendering: pixelated; 
      min-height: 100vh; 
    }
    .pixel-container { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      padding: 2rem; 
    }
    .pixel-box { 
      background-color: #4a4e69; 
      padding: 1.5rem; 
      border: 4px solid #0d0d0d; 
      box-shadow: 8px 8px 0px #0d0d0d; 
      width: 100%; 
      margin-bottom: 2rem; 
      box-sizing: border-box; 
    }
    .pixel-title { 
      font-size: 1.5rem; 
      color: #ffd6a5; 
      text-shadow: 3px 3px 0px #0d0d0d; 
      margin: 0 0 1.5rem 0; 
      text-align: center; 
    }
    .pixel-button { 
      font-family: 'Press Start 2P', cursive; 
      color: #f2e9e4; 
      border: 4px solid #0d0d0d; 
      box-shadow: 4px 4px 0px #0d0d0d; 
      padding: 1rem; 
      cursor: pointer; 
      transition: transform 0.1s linear, box-shadow 0.1s linear; 
      text-align: center; 
      background-color: #22223b; 
      font-size: 1rem; 
    }
    .pixel-button:disabled { 
      background-color: #3b3d51; 
      color: #6e6f7a; 
      cursor: not-allowed; 
      transform: translateY(0); 
    }
    .pixel-game-layout { 
      display: flex; 
      flex-direction: column; 
      gap: 2rem; 
      width: 100%; 
      max-width: 1200px; 
      margin: 0 auto; 
    }
    @media (min-width: 1024px) { 
      .pixel-game-layout { 
        flex-direction: row; 
      } 
    }
    .pixel-main-panel { 
      flex: 1; 
    }
    .pixel-side-panel { 
      width: 100%; 
    }
    @media (min-width: 1024px) { 
      .pixel-side-panel { 
        width: 320px; 
      } 
    }
    .timer-box { 
      background-color: #22223b; 
      text-align: center; 
    }
    .timer-display { 
      font-size: 2rem; 
      color: #a7c957; 
      margin-bottom: 1rem; 
    }
    .timer-bar { 
      width: 100%; 
      background-color: #3b3d51; 
      border: 2px solid #0d0d0d; 
    }
    .timer-progress { 
      height: 20px; 
      background-color: #a7c957; 
      transition: width 0.1s linear; 
    }
    .question-info { 
      font-size: 0.9rem; 
      color: #c9c9c9; 
      margin-bottom: 1rem; 
      text-align: center; 
    }
    .question-text { 
      font-size: 1.5rem; 
      line-height: 1.5; 
    }
    .options-grid { 
      display: grid; 
      grid-template-columns: 1fr; 
      gap: 1rem; 
      margin-top: 2rem; 
    }
    .option-button { 
      padding: 1.5rem 1rem; 
    }
    .option-button.selected { 
      background-color: #9a8c98; 
    }
    .status-box { 
      background-color: #22223b; 
      text-align: center; 
    }
    .scoreboard-box { 
      background-color: #4a4e69; 
    }
    .scoreboard-title { 
      font-size: 1.2rem; 
    }
    .scoreboard-item { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 0.5rem; 
      font-size: 0.9rem; 
    }
    @keyframes blink { 
      50% { opacity: 0; } 
    }
    .blinking-cursor { 
      animation: blink 1s step-end infinite; 
    }
  `;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="pixel-box">
          <p className="pixel-title">
            퀴즈 게임 준비 중<span className="blinking-cursor">...</span>
          </p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="pixel-box" style={{backgroundColor: '#9d2929'}}>
          <h2 className="pixel-title">오류 발생</h2>
          <p style={{marginBottom: '1.5rem'}}>{error}</p>
          <button 
            className="pixel-button" 
            onClick={() => navigate('/game')}
            onMouseEnter={handleMouseOver}
            onMouseLeave={handleMouseOut}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            홈으로
          </button>
        </div>
      );
    }
    
    if (!currentQuestion) {
      return (
        <div className="pixel-game-layout">
          <div className="pixel-main-panel">
            <div className="pixel-box" style={{ backgroundColor: '#4a4e69' }}>
              <div style={{
                textAlign: 'center',
                padding: '2rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1.5rem'
                }}>
                  ⏰
                </div>
                <p className="pixel-title" style={{
                  fontSize: '1.5rem',
                  color: '#fdffb6',
                  textShadow: '3px 3px 0px #0d0d0d',
                  marginBottom: '1rem'
                }}>
                  WAITING FOR NEXT ROUND
                </p>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#c9c9c9'
                }}>
                  Get ready for the next question<span className="blinking-cursor">...</span>
                </p>
              </div>
            </div>
          </div>
          <div className="pixel-side-panel">
            <div className="pixel-box scoreboard-box">
              <h2 className="pixel-title scoreboard-title">SCORE</h2>
              {scoreboard.map((item, index) => (
                <div key={`${item.userUid}-${index}-waiting`} className="scoreboard-item">
                  <span>{(item.displayName || item.userUid || 'Unknown').substring(0,12)}</span>
                  <span>{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="pixel-game-layout">
        <div className="pixel-main-panel">
          {/* 타이머 */}
          <div className="pixel-box timer-box">
            <div className="timer-display">{timeLeft}</div>
            <div className="timer-bar">
              <div 
                className="timer-progress" 
                style={{width: `${(timeLeft/30)*100}%`}}
              ></div>
            </div>
          </div>
          
          {/* 질문 */}
          <div className="pixel-box">
            <p className="question-info">
              Round {currentQuestion.roundNo} - {currentQuestion.category}
            </p>
            <h2 className="pixel-title question-text">
              {currentQuestion.questionText}
            </h2>
            <div className="options-grid">
              {currentQuestion.options.map(opt => (
                <button 
                  key={opt.id} 
                  onClick={() => onOptionClick(opt.id)} 
                  disabled={hasSubmitted || inflight} 
                  className={`pixel-button option-button ${selectedOptionId === opt.id ? 'selected' : ''}`}
                  onMouseEnter={handleMouseOver} 
                  onMouseLeave={handleMouseOut} 
                  onMouseDown={handleMouseDown} 
                  onMouseUp={handleMouseUp}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
          
          {/* 상태 표시 */}
          {inflight && (
            <div className="pixel-box status-box" style={{ backgroundColor: '#c19454' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  fontSize: '2rem'
                }}>
                  ⏳
                </div>
                <p style={{
                  fontSize: '1rem',
                  color: '#ffd6a5',
                  textShadow: '2px 2px 0px #0d0d0d'
                }}>
                  SUBMITTING<span className="blinking-cursor">...</span>
                </p>
              </div>
            </div>
          )}
          
          {hasSubmitted && !inflight && (
            <div className="pixel-box status-box" style={{ backgroundColor: '#6a856f' }}>
              <div style={{
                fontSize: '1.2rem',
                color: '#caffbf',
                textShadow: '2px 2px 0px #0d0d0d',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                ✅ ANSWER SUBMITTED!
              </div>
              <p style={{
                fontSize: '0.9rem',
                color: '#f2e9e4',
                textAlign: 'center'
              }}>
                Waiting for next round<span className="blinking-cursor">...</span>
              </p>
              {waitingInfo && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#0d0d0d',
                  border: '2px solid #caffbf',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#caffbf',
                    fontWeight: 'bold'
                  }}>
                    COMPLETED: {waitingInfo.submittedCount}/{waitingInfo.expectedParticipants}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 사이드바 - 스코어보드 */}
        <div className="pixel-side-panel">
          <div className="pixel-box scoreboard-box">
            <h2 className="pixel-title scoreboard-title">SCORE</h2>
            {scoreboard.map((item, index) => (
              <div key={`${item.userUid}-${index}`} className="scoreboard-item">
                <span>{(item.displayName || item.userUid || 'Unknown').substring(0,12)}</span>
                <span>{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="pixel-game-body">
        <div className="pixel-container">
          <h1 className="pixel-title" style={{marginBottom: '2rem'}}>
            {currentQuestion ? `Round ${currentQuestion.roundNo}` : "Quiz Game"}
          </h1>
          {renderContent()}
        </div>
      </div>
      
      {/* 답변 피드백 애니메이션 */}
      {showFeedback && (
        <AnswerFeedback 
          isCorrect={lastAnswerCorrect}
          onComplete={handleFeedbackComplete}
        />
      )}
      
      {/* 다른 플레이어 대기 화면 */}
      {!showFeedback && waitingInfo && hasSubmitted && (
        <WaitingForPlayers 
          submittedCount={waitingInfo.submittedCount}
          expectedParticipants={waitingInfo.expectedParticipants}
        />
      )}
    </>
  );
}