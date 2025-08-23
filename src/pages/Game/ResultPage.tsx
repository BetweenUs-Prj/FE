import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../hooks/useGameStore';
import { getReactionResults } from '../../api/game';

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const nav = useNavigate();
  const players = useGameStore((s) => s.players);
  const gameType = useGameStore((s) => s.gameType);

  // For reaction games, store the leaderboard returned by the backend
  const [reactionResults, setReactionResults] = useState<
    { userUid: string; reactionTime: number; ranking: number }[]
  >([]);

  useEffect(() => {
    document.title = '게임 결과';
  }, []);

  // Fetch reaction results from the backend when this is a reaction game
  useEffect(() => {
    if (gameType === 'REACTION' && sessionId) {
      const id = Number(sessionId);
      getReactionResults(id).then((res) => {
        // The backend returns an array sorted by ranking
        setReactionResults(res);
      });
    }
  }, [gameType, sessionId]);

  // If there are no players and no results, show a placeholder
  if (!players || players.length === 0) {
    if (gameType === 'REACTION' && reactionResults.length === 0) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p>참가자가 없습니다.</p>
        </div>
      );
    }
  }

  // Build sorted ranking depending on game type.  For quiz we use
  // local player scores.  For reaction we prefer backend results if
  // available; otherwise fall back to local store.
  let sorted: { id: string; name: string; score?: number; reactionTime?: number }[];
  if (gameType === 'QUIZ') {
    sorted = [...players].sort((a, b) => b.score - a.score);
  } else {
    if (reactionResults.length > 0) {
      // Map reaction result entries to display objects.  We try to
      // match userUid with players list by id; if no match, display
      // the UID truncated as the name.
      sorted = reactionResults
        .sort((a, b) => a.ranking - b.ranking)
        .map((r) => {
          const player = players.find((p) => p.id === r.userUid);
          return {
            id: r.userUid,
            name: player ? player.name : r.userUid,
            reactionTime: r.reactionTime * 1000, // convert seconds to ms
          };
        });
    } else {
      // Fallback: sort local reaction times from store
      sorted = [...players].sort(
        (a, b) => (a.reactionTime ?? Infinity) - (b.reactionTime ?? Infinity),
      );
    }
  }

  const winner = sorted[0];

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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>게임 결과</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        우승자: {winner.name}
      </h2>
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#1e293b',
          borderRadius: '0.5rem',
          padding: '1rem',
        }}
      >
        {sorted.map((p, idx) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom:
                idx < sorted.length - 1
                  ? '1px solid rgba(255,255,255,0.1)'
                  : 'none',
            }}
          >
            <span>
              {idx + 1}. {p.name}
            </span>
            <span>
              {gameType === 'QUIZ'
                ? `${p.score ?? 0}점`
                : `${p.reactionTime ?? 0}ms`}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => nav('/')}
        style={{
          marginTop: '2rem',
          padding: '0.8rem 1.4rem',
          borderRadius: '0.5rem',
          background: '#2563eb',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        홈으로
      </button>
    </div>
  );
}