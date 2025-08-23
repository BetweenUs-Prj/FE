import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameType } from '../../api/game';

export default function GameHomePage() {
  const nav = useNavigate();
  useEffect(() => {
    document.title = '게임 홈페이지';
  }, []);

  /**
   * Navigate to the penalty selection screen.  We defer session creation
   * until the user has chosen a penalty.  The selected game type is
   * conveyed via a query string parameter.
   */
  function begin(type: GameType) {
    nav(`/game/penalty?gameType=${type}`);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>게임 홈페이지</h1>
      <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>이 문구가 보이면 라우팅 OK입니다.</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={() => begin('QUIZ')}>퀴즈 시작</button>
        <button onClick={() => begin('REACTION')}>반응속도 시작</button>
      </div>
    </div>
  );
}