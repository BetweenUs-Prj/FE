import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import {
    getQuestions,
    submitQuizAnswer,
    startQuizRound,
    StartRoundRes
  } from '../../api/game';
import type { Question } from '../../api/game'; // Question 인터페이스는 타입으로만 가져옵니다.
import Scoreboard from '../../components/quiz/Scoreboard';
import type { ScoreboardItem } from '../../components/quiz/Scoreboard';
import { useGameStore } from '../../hooks/useGameStore';
import { http } from '../../api/http';

export default function QuizPage() {
  const { sessionId, roundId } = useParams<{ sessionId: string; roundId: string }>();
  const [searchParams] = useSearchParams();
  const { state } = useLocation() as { state?: StartRoundRes };
  const nav = useNavigate();

  const players = useGameStore((s) => s.players);
  const updatePlayerScore = useGameStore((s) => s.updatePlayerScore);

  const [round, setRound] = useState<StartRoundRes | null>(state ?? null);
  const [isLoading, setIsLoading] = useState(!state);
  const [scoreboard, setScoreboard] = useState<ScoreboardItem[]>([]);
  const [prevRanks, setPrevRanks] = useState<string[]>([]);

  // Legacy support
  const category = state?.question?.category || searchParams.get('category') || '';
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);

  useEffect(() => {
    document.title = '퀴즈';
    
    if (round) return; // Already have round data from state
    
    // New round flow: fetch from API if roundId exists
    if (roundId) {
      (async () => {
        try {
          const { data } = await http.get<StartRoundRes>(`/mini-games/quiz/rounds/${roundId}`);
          setRound(data);
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to fetch round:', error);
          setIsLoading(false);
        }
      })();
    } else {
      // Legacy flow: Fetch questions for the selected category
      getQuestions({ category }).then((qs) => {
        setQuestions(qs);
        setIsLoading(false);
      });
    }
  }, [category, roundId, round]);

  // Update scoreboard whenever player scores change
  useEffect(() => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const newRanks = sorted.map((p) => p.id);
    const items: ScoreboardItem[] = sorted.map((p, i) => {
      let change = 0;
      if (prevRanks.length > 0) {
        const prevIndex = prevRanks.indexOf(p.id);
        if (prevIndex === -1) {
          change = 0;
        } else if (prevIndex > i) {
          change = 1;
        } else if (prevIndex < i) {
          change = -1;
        }
      }
      return {
        id: p.id,
        name: p.name,
        score: p.score,
        rankChange: change,
      };
    });
    setPrevRanks(newRanks);
    setScoreboard(items);
  }, [players]);

  async function answer(choiceIndex: number) {
    const question = questions[currentIdx];
    if (!question) return;
    // Determine which player answers this question (for demo, rotate)
    const playerIndex = currentIdx % players.length;
    const player = players[playerIndex];
    // Evaluate answer
    if (choiceIndex === question.correct) {
      updatePlayerScore(player.id, 10);
    } else {
      updatePlayerScore(player.id, 0);
    }
    // Submit answer to backend if roundId is available
    const roundIdToUse = currentRoundId ?? question.id;
    await submitQuizAnswer(roundIdToUse, { answerIndex: choiceIndex });
    // Next question or end
    if (currentIdx + 1 >= questions.length) {
      nav(`/game/result/${sessionId}`);
    } else {
      const nextIndex = currentIdx + 1;
      const nextQuestion = questions[nextIndex];
      if (sessionId && nextQuestion) {
        // start a new round for the next question
        const r = await startQuizRound(Number(sessionId), nextQuestion.id);
        setCurrentRoundId(r.roundId);
      }
      setCurrentIdx(nextIndex);
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>라운드 불러오는 중…</p>
      </div>
    );
  }

  // New round flow: render from round data
  if (round) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">문제</h1>
        <div className="mb-4 text-gray-600">
          카테고리: {round.question.category} | 라운드 ID: {round.roundId}
        </div>
        <p className="mb-4 text-lg">{round.question.text}</p>
        <div className="grid gap-2">
          {round.question.options.map(option => (
            <button 
              key={option.id} 
              className="btn p-4 text-left bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
              onClick={() => console.log('Answer selected:', option.text)}
            >
              {option.text}
            </button>
          ))}
        </div>
      </main>
    );
  }

  // Legacy flow: render from questions array
  const question = questions[currentIdx];

  // Start the first round when questions are loaded and sessionId is available
  useEffect(() => {
    if (!isLoading && questions.length > 0 && currentRoundId === null && sessionId) {
      const q = questions[0];
      startQuizRound(Number(sessionId), q.id).then((r) => setCurrentRoundId(r.roundId));
    }
  }, [isLoading, questions, currentRoundId, sessionId]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        padding: '1rem',
      }}
    >
      <div style={{ flex: 3, paddingRight: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>카테고리: {category}</h2>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          문제 {currentIdx + 1} / {questions.length}
        </h3>
        <div
          style={{
            background: '#1e293b',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{question.text}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {question.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => answer(idx)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem',
                  background: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  cursor: 'pointer',
                }}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ flex: 2, paddingLeft: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>점수판</h3>
        <Scoreboard players={scoreboard} />
      </div>
    </div>
  );
}