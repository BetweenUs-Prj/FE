import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listCategories } from '../../api/game';

export default function CategoryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const nav = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    document.title = '카테고리 선택';
    listCategories().then(setCategories);
  }, []);

  function confirm() {
    if (!sessionId || !selected) return;
    nav(`/game/quiz/${sessionId}?category=${encodeURIComponent(selected)}`);
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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>카테고리 선택</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            style={{
              padding: '0.8rem 1rem',
              borderRadius: '0.5rem',
              border:
                selected === cat ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
              background: selected === cat ? '#1e40af' : '#1f2937',
              color: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      <button
        disabled={!selected}
        onClick={confirm}
        style={{
          marginTop: '2rem',
          padding: '0.8rem 1.4rem',
          borderRadius: '0.5rem',
          background: !selected ? '#4b5563' : '#2563eb',
          border: 'none',
          color: '#fff',
          cursor: !selected ? 'not-allowed' : 'pointer',
        }}
      >
        시작하기
      </button>
    </div>
  );
}