import React, { useState, useEffect } from 'react';
import { listPenalties, createPenaltySafe, deletePenalty, type Penalty, type CreatePenaltyRequest } from '../../api/meta';
import { showToast } from '../common/Toast';

// 원본 코드의 ThemeCard, ThemeButton, LoadingCard 컴포넌트를
// 픽셀 스타일에 맞는 div, button으로 대체합니다.
// import { ThemeCard, ThemeButton, LoadingCard } from '../common';

interface PenaltySelectProps {
  onSelect: (penalty: Penalty | null) => void;
  selectedPenalty: Penalty | null;
}

export const PenaltySelect: React.FC<PenaltySelectProps> = ({ 
  onSelect, 
  selectedPenalty 
}) => {
  const [showPenaltyList, setShowPenaltyList] = useState(false);
  const [showAddPenalty, setShowAddPenalty] = useState(false);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [newPenaltyText, setNewPenaltyText] = useState('');

  useEffect(() => {
    loadPenalties();
  }, []);

  const loadPenalties = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('[PenaltySelect] Loading penalties...');
      const penaltyList = await listPenalties();
      console.log('[PenaltySelect] Penalties loaded:', penaltyList);
      setPenalties(penaltyList);
    } catch (err: any) {
      const errorMessage = '벌칙 목록을 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Failed to load penalties:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePenaltySelect = (penalty: Penalty) => {
    onSelect(penalty);
    setShowPenaltyList(false);
  };

  const handleRemovePenalty = () => {
    onSelect(null);
  };

  const handleAddPenalty = async () => {
    if (!newPenaltyText.trim()) {
      showToast('벌칙 내용을 입력해주세요.', 'error');
      return;
    }

    try {
      setIsCreating(true);
      const createRequest: CreatePenaltyRequest = {
        description: newPenaltyText.trim()
      };
      const newPenalty = await createPenaltySafe(createRequest);
      setPenalties(prev => [newPenalty, ...prev]);
      onSelect(newPenalty);
      setNewPenaltyText('');
      setShowAddPenalty(false);
      setShowPenaltyList(false);
      showToast('새로운 벌칙이 추가되었습니다!', 'success');
    } catch (err: any) {
      console.error('Failed to create penalty:', err);
      showToast('벌칙 생성에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePenalty = async (penalty: Penalty, event: React.MouseEvent) => {
    event.stopPropagation();
    // confirm은 브라우저 기본 UI이므로, 실제 프로젝트에서는 커스텀 모달 사용을 권장합니다.
    if (!window.confirm(`"${penalty.text}" 벌칙을 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await deletePenalty(penalty.id);
      setPenalties(prev => prev.filter(p => p.id !== penalty.id));
      if (selectedPenalty?.id === penalty.id) {
        onSelect(null);
      }
      showToast('벌칙이 삭제되었습니다.', 'success');
    } catch (err: any) {
      console.error('Failed to delete penalty:', err);
      showToast('벌칙 삭제에 실패했습니다.', 'error');
    }
  };

  const handleCancelAdd = () => {
    setNewPenaltyText('');
    setShowAddPenalty(false);
  };

  // --- 스타일 및 렌더링 ---
  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };
  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; } };
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; } };
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; } };
  
  const styles = `
    .pixel-box { background-color: #4a4e69; padding: 1.5rem; border: 4px solid #0d0d0d; box-shadow: 8px 8px 0px #0d0d0d; width: 100%; margin-bottom: 2rem; box-sizing: border-box; }
    .pixel-title { font-size: 1.5rem; color: #ffd6a5; text-shadow: 3px 3px 0px #0d0d0d; margin: 0 0 1.5rem 0; text-align: center; }
    .pixel-button { font-family: 'Press Start 2P', cursive; color: #f2e9e4; border: 4px solid #0d0d0d; box-shadow: 4px 4px 0px #0d0d0d; padding: 1rem; cursor: pointer; transition: transform 0.1s linear, box-shadow 0.1s linear; text-align: center; background-color: #22223b; font-size: 0.9rem; }
    .pixel-button:disabled { background-color: #3b3d51; color: #6e6f7a; cursor: not-allowed; }
    .pixel-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
    .pixel-input { font-family: 'Press Start 2P', cursive; width: calc(100% - 2rem); padding: 1rem; border: 4px solid #0d0d0d; background-color: #22223b; color: #f2e9e4; font-size: 1rem; margin-bottom: 1.5rem; outline: none; }
    @keyframes blink { 50% { opacity: 0; } }
    .blinking-cursor { animation: blink 1s step-end infinite; }
  `;

  if (isLoading) {
    return (
        <>
            <style>{styles}</style>
            <div className="pixel-box">
                <p className="pixel-title" style={{ fontSize: '1.2rem', color: '#f2e9e4', fontFamily: "'Press Start 2P', cursive" }}>
                    벌칙 로딩 중<span className="blinking-cursor">...</span>
                </p>
            </div>
        </>
    );
  }

  if (error) {
    return (
        <>
            <style>{styles}</style>
            <div className="pixel-box" style={{backgroundColor: '#9d2929'}}>
                 <p style={{fontFamily: "'Press Start 2P', cursive", fontSize: '1rem', marginBottom: '1.5rem'}}>{error}</p>
                 <button className="pixel-button" onClick={loadPenalties} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut}>
                    다시 시도
                </button>
            </div>
        </>
    );
  }

  return (
    <>
        <style>{styles}</style>
        <div className="pixel-box" style={{ marginBottom: '2rem' }}>
            <h3 className="pixel-title" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                🎯 벌칙 설정
            </h3>
            <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.9rem', color: '#c9c9c9', marginBottom: '1.5rem', textAlign: 'center' }}>
                마지막 순위가 받을 벌칙을 선택하세요
            </p>

            {selectedPenalty && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '4px solid #0d0d0d', backgroundColor: '#22223b', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1rem', color: '#fdffb6', fontFamily: "'Press Start 2P', cursive" }}>{selectedPenalty.text}</span>
                    <button className="pixel-button" style={{ backgroundColor: '#9d2929', padding: '0.5rem', fontSize: '0.7rem' }} onClick={handleRemovePenalty}>제거</button>
                </div>
            )}

            {!selectedPenalty && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="pixel-button" onClick={() => setShowPenaltyList(true)} style={{ flex: 1, minWidth: '150px', backgroundColor: '#6a856f' }} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut}>
                        벌칙 선택
                    </button>
                    <button className="pixel-button" onClick={() => setShowAddPenalty(true)} style={{ flex: 1, minWidth: '150px', backgroundColor: '#c19454' }} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut}>
                        벌칙 추가
                    </button>
                </div>
            )}

            {showAddPenalty && (
                <div className="pixel-modal-overlay" onClick={handleCancelAdd}>
                    <div className="pixel-box" style={{ maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <h3 className="pixel-title">새로운 벌칙 추가</h3>
                        <input type="text" value={newPenaltyText} onChange={(e) => setNewPenaltyText(e.target.value)} placeholder="예: 춤추기, 노래하기..." className="pixel-input" disabled={isCreating} onKeyPress={(e) => { if (e.key === 'Enter' && !isCreating) handleAddPenalty(); }} />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="pixel-button" style={{flex: 1, backgroundColor: '#6a856f'}} onClick={handleAddPenalty} disabled={!newPenaltyText.trim() || isCreating}>{isCreating ? '추가 중...' : '추가'}</button>
                            <button className="pixel-button" style={{flex: 1}} onClick={handleCancelAdd} disabled={isCreating}>취소</button>
                        </div>
                    </div>
                </div>
            )}

            {showPenaltyList && (
                <div className="pixel-modal-overlay" onClick={() => setShowPenaltyList(false)}>
                    <div className="pixel-box" style={{ maxWidth: '600px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <h3 className="pixel-title">벌칙 목록</h3>
                        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0.5rem' }}>
                            {penalties.map((penalty) => (
                                <div key={penalty.id} onClick={() => handlePenaltySelect(penalty)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '4px solid #0d0d0d', backgroundColor: '#22223b', marginBottom: '1rem', cursor: 'pointer' }}>
                                    <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.9rem', flex: 1, textAlign: 'left', paddingRight: '1rem', wordBreak: 'break-word' }}>{penalty.text}</span>
                                    {(penalty as any).userUid !== 'system' && (
                                         <button className="pixel-button" onClick={(e) => handleDeletePenalty(penalty, e)} style={{ backgroundColor: '#9d2929', padding: '0.5rem', fontSize: '0.7rem', minWidth: '60px', flexShrink: 0 }}>삭제</button>
                                    )}
                                </div>
                            ))}
                        </div>
                         <button className="pixel-button" style={{marginTop: '1.5rem'}} onClick={() => setShowPenaltyList(false)}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    </>
  );
};

