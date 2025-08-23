import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { submitReaction } from '../../api/game';
import { useGameStore } from '../../hooks/useGameStore';

export default function ReactionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const nav = useNavigate();
  const players = useGameStore((s) => s.players);
  const setReactionTimes = useGameStore((s) => s.setReactionTimes);
  const [status, setStatus] = useState<'waiting' | 'ready' | 'finished'>(
    'waiting',
  );
  const [startTime, setStartTime] = useState<number | null>(null);
  const timerRef = useRef<number>();

  useEffect(() => {
    document.title = '반응속도 게임';
    // Start timer to change color
    timerRef.current = window.setTimeout(() => {
      setStatus('ready');
      setStartTime(Date.now());
    }, 2000 + Math.random() * 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleClick() {
    if (status === 'waiting') {
      // clicked too early - reset timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setStatus('ready');
        setStartTime(Date.now());
      }, 2000 + Math.random() * 2000);
    } else if (status === 'ready' && startTime) {
      const reactionMs = Date.now() - startTime;
      // For demo, assign random reaction times to all players (simulate multi-player)
      const times: Record<string, number> = {};
      players.forEach((p) => {
        times[p.id] = reactionMs + Math.floor(Math.random() * 200);
      });
      setReactionTimes(times);
      // Submit reaction for the current user; convert ms to seconds as double
      if (sessionId) {
        submitReaction(Number(sessionId), { reactionTime: reactionMs / 1000 });
      }
      setStatus('finished');
    }
  }

  function viewResults() {
    if (sessionId) {
      nav(`/game/result/${sessionId}`);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>반응속도 게임</h1>
      <div
        onClick={handleClick}
        style={{
          width: '80%',
          maxWidth: '400px',
          height: '200px',
          borderRadius: '0.5rem',
          backgroundColor:
            status === 'waiting'
              ? '#15803d' // green
              : status === 'ready'
              ? '#b91c1c' // red
              : '#374151', // finished
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#f8fafc',
          fontSize: '1.25rem',
          marginBottom: '2rem',
          userSelect: 'none',
        }}
      >
        {status === 'waiting' && '초록색에서 빨간색으로 변할 때 클릭하세요!'}
        {status === 'ready' && '지금! 클릭!'}
        {status === 'finished' && '게임 종료'}
      </div>
      {status === 'finished' && (
        <button
          onClick={viewResults}
          style={{
            padding: '0.8rem 1.4rem',
            borderRadius: '0.5rem',
            background: '#2563eb',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          랭킹 보기
        </button>
      )}
    </div>
  );
}