import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSession, createQuizSession, listQuestions, startQuizRound, startQuizRoundByCategory, StartRoundRes } from '../../api/game';
import type { GameType } from '../../api/game';
import { useGameStore } from '../../hooks/useGameStore';
import { CategorySelect } from '../../components/quiz/CategorySelect';
import { showToast } from '../../components/common/Toast';
import { listCategoriesSafe } from '../../api/meta';
import { createGamePenalty } from '../../api/penalty';
import '../../styles/penalty.css';

// Define penalty type for inline editing
type Penalty = { id: string; text: string };

// Utility function to generate unique IDs
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Individual penalty input row component
interface PenaltyInputRowProps {
  penalty: Penalty;
  onChange: (text: string) => void;
  onRemove: () => void;
  autoFocus?: boolean;
  selected: boolean;
  onSelect: () => void;
}

const PenaltyInputRow: React.FC<PenaltyInputRowProps> = ({
  penalty,
  onChange,
  onRemove,
  autoFocus = false,
  selected,
  onSelect,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div 
      className={`flex gap-2 items-center p-2 rounded-xl border-2 transition-all ${
        selected ? 'border-indigo-500 bg-indigo-50/10' : 'border-transparent hover:border-slate-600'
      }`}
      onClick={onSelect}
      style={{ marginBottom: '1rem', cursor: 'pointer' }}
    >
      <input
        type="radio"
        aria-label="이 벌칙 선택"
        checked={selected}
        onChange={onSelect}
        style={{ cursor: 'pointer' }}
      />
      <input
        ref={inputRef}
        value={penalty.text}
        placeholder="벌칙 내용을 입력하세요"
        onFocus={onSelect}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: '0.8rem',
          borderRadius: '0.375rem',
          border: '1px solid #374151',
          backgroundColor: '#374151',
          color: '#f8fafc',
          fontSize: '1rem',
          outline: 'none',
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid #ef4444',
          backgroundColor: 'transparent',
          color: '#ef4444',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        삭제
      </button>
    </div>
  );
};

// Category selector component for immediate visibility
const CategorySelector: React.FC<{
  onSelect: (category: string) => void;
  loading?: boolean;
}> = ({ onSelect, loading = false }) => {
  const [cats, setCats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const nav = useNavigate();
  const sessionId = useGameStore(s => s.sessionId);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const arr = await listCategoriesSafe();
        if (!alive) return;
        setCats(arr);
        if (arr.length > 0) {
          setSelected(arr[0]); // Auto-select first category
        }
      } catch (e) {
        if (!alive) return;
        setError('카테고리를 불러오지 못했습니다. 기본값으로 표시합니다.');
        const defaultCats = ['술', '역사', '스포츠', '음식', '상식'];
        setCats(defaultCats);
        setSelected(defaultCats[0]);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleStartQuiz = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selected) {
      showToast('카테고리를 선택해주세요.', 'error');
      return;
    }
    
    const mockSessionId = sessionId || 1; // Mock session ID for testing
    
    try {
      setIsLoading(true);
      console.info('[quiz] startRound clicked', { sessionId: mockSessionId, selected });
      
      const res = await startQuizRound(mockSessionId, selected);
      console.info('[quiz] startRound ok', res);
      
      nav(`/game/quiz/${mockSessionId}/round/${res.roundId}`, { state: res });
    } catch (err) {
      console.error('[quiz] startRound failed', err);
      showToast('라운드 시작에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, category: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelected(category);
    }
  };

  if (isLoading) {
    return (
      <div style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
        카테고리 불러오는 중…
      </div>
    );
  }

  return (
    <section aria-label="퀴즈 카테고리 선택" style={{ width: '100%' }}>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: '600', 
        marginBottom: '0.5rem',
        color: '#f8fafc',
        textAlign: 'center'
      }}>
        퀴즈 카테고리 선택
      </h2>
      
      {error && (
        <p 
          role="alert" 
          style={{ 
            color: '#fbbf24', 
            marginBottom: '1rem',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}
        >
          {error}
        </p>
      )}
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        {cats.map(name => (
          <button
            key={name}
            type="button"
            onClick={() => setSelected(name)}
            onKeyDown={(e) => handleKeyDown(e, name)}
            aria-pressed={selected === name}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: selected === name ? '2px solid #6366f1' : '1px solid #4b5563',
              backgroundColor: selected === name ? '#4338ca' : '#374151',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: selected === name ? '600' : '400',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
          >
            {name}
          </button>
        ))}
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleStartQuiz}
          disabled={!selected || isLoading}
          style={{
            padding: '0.8rem 1.4rem',
            borderRadius: '0.5rem',
            background: (!selected || isLoading) ? '#4b5563' : '#10b981',
            border: 'none',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: (!selected || isLoading) ? 'not-allowed' : 'pointer',
            minWidth: '120px',
          }}
          aria-label={`${selected} 카테고리로 퀴즈 시작`}
        >
          {isLoading ? '시작 중...' : '퀴즈 시작'}
        </button>
      </div>
    </section>
  );
};

export default function PenaltyPage() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const storeGameType = useGameStore((state) => state.gameType);
  const gameTypeQuery = searchParams.get('gameType') as GameType | null;
  const effectiveGameType: GameType | undefined = (gameTypeQuery as GameType) || storeGameType;
  
  // New state for inline penalty editing
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<string | null>(null);
  const [isPenaltyConfirmed, setIsPenaltyConfirmed] = useState(false);
  const [confirmedPenaltyId, setConfirmedPenaltyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const lastAddedIdRef = useRef<string | null>(null);
  
  // Store access
  const setPenalty = useGameStore(s => s.setPenalty);
  
  // Clear highlight after 1.5 seconds
  useEffect(() => {
    if (lastAddedIdRef.current) {
      const timer = setTimeout(() => {
        lastAddedIdRef.current = null;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [lastAddedIdRef.current]);

  useEffect(() => {
    document.title = '벌칙 선택';
    // Start with one empty penalty for immediate input
    if (penalties.length === 0) {
      const initialId = uid();
      setPenalties([{ id: initialId, text: '' }]);
      lastAddedIdRef.current = initialId;
    }
  }, []);

  const handleSelectPenalty = (id: string) => setSelectedPenaltyId(id);
  
  const handleAddPenalty = () => {
    const id = uid();
    lastAddedIdRef.current = id;
    setPenalties(prev => [...prev, { id, text: '' }]);
    setSelectedPenaltyId(id); // 새 항목을 기본 선택
  };

  const handlePenaltyChange = (id: string, text: string) => {
    setPenalties(prev =>
      prev.map(p => p.id === id ? { ...p, text } : p)
    );
    setValidationError('');
  };

  const handlePenaltyRemove = (id: string) => {
    setPenalties(prev => {
      const filtered = prev.filter(p => p.id !== id);
      // Always keep at least one penalty input
      if (filtered.length === 0) {
        const newId = uid();
        lastAddedIdRef.current = newId;
        return [{ id: newId, text: '' }];
      }
      return filtered;
    });
    setSelectedPenaltyId(prev => (prev === id ? null : prev));
  };

  // Check for duplicate penalties
  const getDuplicateMap = () => {
    const textCounts = penalties.reduce((acc, p) => {
      const text = p.text.trim();
      if (text) {
        acc[text] = (acc[text] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return penalties.reduce((acc, p) => {
      const text = p.text.trim();
      acc[p.id] = text && textCounts[text] > 1;
      return acc;
    }, {} as Record<string, boolean>);
  };

  const duplicateMap = getDuplicateMap();

  const handleConfirmPenalty = async () => {
    if (!selectedPenaltyId) return;
    
    const chosen = penalties.find(p => p.id === selectedPenaltyId);
    if (!chosen || !chosen.text.trim()) {
      showToast('벌칙 내용을 입력해주세요.', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const res = await createGamePenalty({ 
        text: chosen.text.trim(), 
        gameType: effectiveGameType as 'QUIZ' | 'REACTION' 
      });
      
      // Store single penalty in global state
      setPenalty({ id: res.id, text: chosen.text.trim() });
      
      // Success - proceed with confirmation
      setConfirmedPenaltyId(selectedPenaltyId);
      setIsPenaltyConfirmed(true);
      setValidationError('');
      showToast('벌칙이 저장되었습니다.', 'success');
    } catch (e: any) {
      let message = '벌칙 저장 중 오류가 발생했습니다.';
      if (e.response?.status === 400) {
        message = '입력 내용을 확인해주세요.';
      } else if (e.response?.status >= 500) {
        message = '서버 오류입니다. 잠시 후 다시 시도해주세요.';
      }
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReEditPenalty = () => {
    setIsPenaltyConfirmed(false);
    setConfirmedPenaltyId(null);
  };

  async function handleCategorySelect(category: string) {
    if (!confirmedPenaltyId || !effectiveGameType) return;
    
    setCategoryLoading(true);
    try {
      if (effectiveGameType === 'QUIZ') {
        const totalRounds = 5;
        
        // For now, we'll use a mock penalty ID since we don't have real backend integration
        // In a real app, you'd create the penalty in the backend first
        const mockPenaltyId = 1;
        
        const session = await createQuizSession({
          gameType: 'QUIZ',
          totalRounds,
          category,
          penaltyId: mockPenaltyId,
        });
        
        const questions = await listQuestions(category, 0, totalRounds);
        
        if (questions.length === 0) {
          showToast('선택한 카테고리에 문제가 없습니다.', 'error');
          return;
        }
        
        useGameStore.getState().setQuizState(category, questions, totalRounds);
        nav(`/game/quiz/${session.sessionId}`);
      } else {
        // For non-quiz games
        const mockPenaltyId = 1;
        const session = await createSession({
          gameType: effectiveGameType,
          penaltyId: mockPenaltyId,
        });
        nav(`/game/reaction/${session.sessionId}`);
      }
      
    } catch (error: any) {
      let errorMessage = '게임 시작에 실패했습니다. 잠시 후 다시 시도하세요.';
      
      if (error.response?.status) {
        switch (error.response.status) {
          case 400:
            errorMessage = '요청이 올바르지 않습니다.';
            break;
          case 401:
          case 403:
            errorMessage = '로그인이 필요합니다.';
            break;
          case 404:
            errorMessage = '요청한 리소스를 찾을 수 없습니다.';
            break;
          case 409:
            errorMessage = '이미 진행 중인 세션이 있습니다.';
            break;
          case 500:
            errorMessage = '서버 오류입니다. 잠시 후 다시 시도하세요.';
            break;
        }
      }
      
      showToast(errorMessage, 'error');
      console.error('Failed to start game:', error);
      
    } finally {
      setCategoryLoading(false);
    }
  }

  const confirmedPenalty = confirmedPenaltyId 
    ? penalties.find(p => p.id === confirmedPenaltyId)
    : null;

  return (
    <>
      {/* 상단 중앙 프리볰: 편집 모드 */}
      {!isPenaltyConfirmed && (
        <div className="sticky top-4 z-20 flex justify-center mb-6">
          <div className="rounded-2xl bg-slate-800/90 backdrop-blur px-6 py-3 shadow-lg">
            <span className="text-slate-200 mr-4 font-medium">현재 추가된 벌칙</span>
            <div className="inline-flex flex-wrap gap-2 align-middle">
              {penalties.filter(p => p.text.trim()).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPenalty(p.id)}
                  className={`rounded-full px-3 py-1 border transition-all ${
                    selectedPenaltyId === p.id
                      ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-300'
                      : 'bg-slate-700 text-slate-100 border-slate-600 hover:bg-slate-600'
                  }`}
                  aria-pressed={selectedPenaltyId === p.id}
                  title="클릭하면 이 벌칙을 선택합니다"
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 상단 중앙 확정 배너: 확정 모드 */}
      {isPenaltyConfirmed && confirmedPenaltyId && (
        <div className="sticky top-4 z-20 flex justify-center mb-8">
          <div className="rounded-2xl bg-indigo-600 text-white px-8 py-4 shadow-lg">
            <strong className="mr-3 text-lg">확정된 벌칙:</strong>
            <span className="text-lg">{penalties.find(p => p.id === confirmedPenaltyId)?.text ?? '—'}</span>
            <button 
              className="ml-6 text-sm underline opacity-90 hover:opacity-100 transition-opacity" 
              onClick={handleReEditPenalty}
            >
              벌칙 다시 선택
            </button>
          </div>
        </div>
      )}

      {/* 벌칙 편집 섹션: 확정 전만 */}
      {!isPenaltyConfirmed && (
        <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem', margin: '0 0 2rem 0', color: '#f8fafc' }}>벌칙 입력</h1>
          
          {/* 입력 리스트 */}
          <div style={{ width: '100%', maxWidth: '640px' }}>
            {penalties.map(p => (
              <PenaltyInputRow
                key={p.id}
                penalty={p}
                onChange={(txt) => handlePenaltyChange(p.id, txt)}
                onRemove={() => handlePenaltyRemove(p.id)}
                autoFocus={p.id === lastAddedIdRef.current}
                selected={selectedPenaltyId === p.id}
                onSelect={() => handleSelectPenalty(p.id)}
              />
            ))}
          </div>

          {/* 하단 버튼 */}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={handleAddPenalty} className="btn">+ 벌칙 추가</button>
            <button 
              type="button" 
              onClick={handleConfirmPenalty} 
              className="btn-primary" 
              disabled={!selectedPenaltyId || !penalties.find(p => p.id === selectedPenaltyId)?.text.trim() || loading}
            >
              {loading ? '확정 중...' : '확정하기'}
            </button>
          </div>
          
          {validationError && (
            <p role="alert" style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '0.75rem' }}>
              {validationError}
            </p>
          )}
        </div>
      )}

      {/* 카테고리 선택 섹션: 확정 후만 */}
      {isPenaltyConfirmed && (
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '640px' }}>
            <CategorySelector 
              onSelect={handleCategorySelect} 
              loading={categoryLoading}
            />
          </div>
        </div>
      )}
    </>
  );
}