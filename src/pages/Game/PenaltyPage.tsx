import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSession, createQuizSession, listQuestions } from '../../api/game';
import type { GameType } from '../../api/game';
import { useGameStore } from '../../hooks/useGameStore';
import { showToast } from '../../components/common/Toast';
import { listCategoriesSafe } from '../../api/meta';
import { fetchPenalties, type Penalty } from '../../api/penalty';
import { TopBar } from '../../components/common/TopBar';
import { createLeaveSessionHandler } from '../../api/session';
import { http } from '../../api/http';

export default function PenaltyPage() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const storeGameType = useGameStore((state) => state.gameType);
  const gameTypeQuery = searchParams.get('gameType') as GameType | null;
  const effectiveGameType: GameType | undefined = (gameTypeQuery as GameType) || storeGameType;
  
  // State for penalty selection
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [inviteOnly, setInviteOnly] = useState(false);
  
  // State for quiz game settings
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [showQuizSettings, setShowQuizSettings] = useState(false);
  
  // State for penalty creation
  const [newPenaltyText, setNewPenaltyText] = useState('');
  const [creatingPenalty, setCreatingPenalty] = useState(false);
  const [showPenaltyForm, setShowPenaltyForm] = useState(false);
  
  useEffect(() => {
    document.title = '벌칙 선택';
    loadPenalties();
    loadCategories();
  }, []);

  const loadPenalties = async () => {
    try {
      setLoading(true);
      const penaltiesData = await fetchPenalties('all');
      setPenalties(penaltiesData);
      
      // Auto-select first penalty if available
      if (penaltiesData.length > 0 && !selectedPenaltyId) {
        setSelectedPenaltyId(penaltiesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load penalties:', error);
      showToast('벌칙 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await listCategoriesSafe();
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      showToast('카테고리를 불러오지 못했습니다.', 'error');
    }
  };

  const handleSelectPenalty = (id: number) => setSelectedPenaltyId(id);

  const handleCreatePenalty = async () => {
    if (!newPenaltyText.trim()) {
      showToast('벌칙 내용을 입력해주세요.', 'error');
      return;
    }

    setCreatingPenalty(true);
    try {
      await http.post('/penalties', { description: newPenaltyText.trim() });
      showToast('벌칙이 추가되었습니다!', 'success');
      setNewPenaltyText('');
      setShowPenaltyForm(false);
      loadPenalties(); // Reload penalties
    } catch (error: any) {
      console.error('Failed to create penalty:', error);
      let errorMessage = '벌칙 추가에 실패했습니다.';
      
      if (error.response?.status === 400) {
        errorMessage = '벌칙 내용을 입력해주세요.';
      } else if (error.response?.status === 409) {
        errorMessage = '이미 같은 벌칙이 있습니다.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setCreatingPenalty(false);
    }
  };

  const handleStartGame = async () => {
    if (!selectedPenaltyId || !effectiveGameType) {
      showToast('벌칙을 선택해주세요.', 'error');
      return;
    }
    
    setCategoryLoading(true);
    try {
      if (effectiveGameType === 'QUIZ') {
        if (!selectedCategory) {
          showToast('카테고리를 선택해주세요.', 'error');
          return;
        }
        
        // Check if questions exist for the category
        const questions = await listQuestions(selectedCategory, 0, totalRounds);
        
        if (questions.length === 0) {
          showToast('선택한 카테고리에 문제가 없습니다.', 'error');
          return;
        }
        
        const session = await createQuizSession({
          gameType: 'QUIZ',
          totalRounds,
          category: selectedCategory,
          penaltyId: selectedPenaltyId,
          inviteOnly,
        });
        
        useGameStore.getState().setQuizState(selectedCategory, questions, totalRounds);
        nav(`/game/quiz/${session.sessionId}/lobby`);
        
      } else if (effectiveGameType === 'REACTION') {
        const session = await createSession({
          gameType: effectiveGameType,
          penaltyId: selectedPenaltyId,
          inviteOnly,
        });
        nav(`/game/reaction/lobby/${session.sessionId}`);
        
        // 세션 정보를 저장소에 저장
        sessionStorage.setItem('reaction.sessionId', session.sessionId.toString());
      }
      
    } catch (error: any) {
      console.error('Failed to start game:', error);
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
    } finally {
      setCategoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-background">
        <TopBar 
          title="벌칙 선택" 
          onQuit={createLeaveSessionHandler()} 
          showQuit={true}
        />
        <div className="space-container">
          <div className="space-glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="space-loader" style={{ margin: '0 auto 1rem' }}></div>
            <p className="space-text">벌칙 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="space-background"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        color: '#ffffff'
      }}
    >
      <TopBar 
        title="벌칙 선택" 
        onQuit={createLeaveSessionHandler()} 
        showQuit={true}
      />
      <div 
        className="space-container"
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: '60px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          
          {/* 벌칙 선택 섹션 */}
          <div 
            className="space-glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              padding: '2rem',
              marginBottom: '1.5rem'
            }}
          >
            <h1 
              className="space-text"
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1.5rem',
                textAlign: 'center',
                color: '#e0e0e0',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
              }}
            >
              🎯 벌칙 선택
            </h1>
            
            {/* 벌칙 드롭다운 */}
            <div style={{ marginBottom: '2rem' }}>
              <label 
                className="space-text"
                style={{
                  display: 'block',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem',
                  color: '#e0e0e0',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}
              >
                벌칙 선택
              </label>
              <select
                value={selectedPenaltyId || ''}
                onChange={(e) => handleSelectPenalty(Number(e.target.value))}
                disabled={loading || penalties.length === 0}
                className="space-glass-input"
                aria-label="벌칙 선택"
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  fontSize: '1rem',
                  borderRadius: '0.875rem',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  appearance: 'none',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e0e0e0',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5rem 1.5rem',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="" disabled>
                  {loading ? '불러오는 중...' : '벌칙을 선택하세요'}
                </option>
                {penalties.map(penalty => (
                  <option key={penalty.id} value={penalty.id}>
                    {penalty.text}
                  </option>
                ))}
              </select>
            </div>

            {/* 벌칙 추가 섹션 */}
            <div 
              className="space-glass-card"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                padding: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              {!showPenaltyForm ? (
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setShowPenaltyForm(true)}
                    className="space-glass-button space-button-green"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    + 벌칙 추가
                  </button>
                </div>
              ) : (
                <div>
                  <label 
                    className="space-text"
                    style={{
                      display: 'block',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: '#e0e0e0',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    새 벌칙
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="text"
                      value={newPenaltyText}
                      onChange={(e) => setNewPenaltyText(e.target.value)}
                      placeholder="벌칙 내용을 입력하세요"
                      disabled={creatingPenalty}
                      className="space-glass-input"
                      style={{
                        flex: 1,
                        padding: '0.875rem 1rem',
                        fontSize: '1rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#e0e0e0',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreatePenalty();
                        }
                      }}
                    />
                    <button
                      onClick={handleCreatePenalty}
                      disabled={creatingPenalty || !newPenaltyText.trim()}
                      className="space-glass-button space-button-green"
                      style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 1.25rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#e0e0e0',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {creatingPenalty ? '추가 중...' : '추가'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPenaltyForm(false);
                        setNewPenaltyText('');
                      }}
                      disabled={creatingPenalty}
                      className="space-glass-button"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 1.25rem',
                        fontSize: '1rem',
                        color: '#e0e0e0',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 초대 전용 설정 */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                <input
                  type="checkbox"
                  checked={inviteOnly}
                  onChange={(e) => setInviteOnly(e.target.checked)}
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    accentColor: '#6366f1'
                  }}
                />
                <span 
                  className="space-text"
                  style={{
                    color: '#e0e0e0',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  친구만 허용 (초대 전용)
                </span>
              </label>
              <p 
                className="space-text-muted"
                style={{
                  fontSize: '0.875rem',
                  margin: '0.5rem 0 0 2rem',
                  lineHeight: '1.4',
                  color: '#a0a0a0',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}
              >
                활성화하면 공개 목록에 표시되지 않고, 초대 코드로만 입장할 수 있습니다.
              </p>
            </div>

            {/* 게임 시작 섹션 */}
            {selectedPenaltyId && (
              <>
                {effectiveGameType === 'QUIZ' ? (
                  <div 
                    className="space-glass-card"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      padding: '2rem',
                      marginBottom: '1.5rem'
                    }}
                  >
                    <h2 
                      className="space-text"
                      style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '600', 
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        color: '#e0e0e0',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      🧠 퀴즈 게임 설정
                    </h2>
                    
                    {/* 라운드 수 선택 */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 
                        className="space-text"
                        style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: '600', 
                          marginBottom: '1rem',
                          textAlign: 'center',
                          color: '#e0e0e0',
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        총 라운드 수 선택
                      </h3>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        {[3, 5, 7, 10].map(rounds => (
                          <button
                            key={rounds}
                            type="button"
                            onClick={() => setTotalRounds(rounds)}
                            className={`space-glass-button ${totalRounds === rounds ? 'space-button-green' : ''}`}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '0.875rem',
                              fontSize: '1rem',
                              fontWeight: totalRounds === rounds ? '600' : '500',
                              minWidth: '80px',
                              background: totalRounds === rounds 
                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))'
                                : 'rgba(255, 255, 255, 0.1)',
                              border: totalRounds === rounds 
                                ? '2px solid rgba(16, 185, 129, 0.6)'
                                : '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#e0e0e0',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {rounds}라운드
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 카테고리 선택 */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 
                        className="space-text"
                        style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: '600', 
                          marginBottom: '1rem',
                          textAlign: 'center',
                          color: '#e0e0e0',
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        퀴즈 카테고리 선택
                      </h3>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        justifyContent: 'center'
                      }}>
                        {categories.map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setSelectedCategory(name)}
                            className={`space-glass-button ${selectedCategory === name ? 'space-button-purple' : ''}`}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '0.875rem',
                              fontSize: '1rem',
                              fontWeight: selectedCategory === name ? '600' : '500',
                              minWidth: '80px',
                              background: selectedCategory === name 
                                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(67, 56, 202, 0.2))'
                                : 'rgba(255, 255, 255, 0.1)',
                              border: selectedCategory === name 
                                ? '2px solid rgba(99, 102, 241, 0.6)'
                                : '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#e0e0e0',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 게임 시작 버튼 */}
                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={handleStartGame}
                        disabled={categoryLoading || !selectedCategory}
                        className="space-glass-button space-button-green"
                        style={{
                          fontSize: '1.2rem',
                          padding: '1rem 3rem',
                          width: '100%',
                          maxWidth: '300px',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '0.875rem',
                          color: '#e0e0e0',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {categoryLoading ? '게임 준비 중...' : '🧠 퀴즈 시작'}
                      </button>
                    </div>
                  </div>
                ) : effectiveGameType === 'REACTION' ? (
                  <div 
                    className="space-glass-card"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      padding: '2rem',
                      textAlign: 'center'
                    }}
                  >
                    <h2 
                      className="space-text"
                      style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '600', 
                        marginBottom: '2rem',
                        color: '#e0e0e0',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      ⚡ 반응속도 게임 ⚡
                    </h2>
                    <p 
                      className="space-text-muted"
                      style={{ 
                        fontSize: '1.1rem', 
                        marginBottom: '2rem',
                        lineHeight: '1.6',
                        color: '#a0a0a0',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      초록색 신호가 빨간색으로 바뀌는 순간 클릭하세요!<br />
                      가장 빠른 반응속도를 가진 플레이어가 승리합니다.
                    </p>
                    <button
                      onClick={handleStartGame}
                      disabled={categoryLoading}
                      className="space-glass-button space-button-green"
                      style={{
                        fontSize: '1.2rem',
                        padding: '1rem 3rem',
                        width: '100%',
                        maxWidth: '300px',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '0.875rem',
                        color: '#e0e0e0',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {categoryLoading ? '게임 준비 중...' : '⚡ 반응속도 게임 시작 ⚡'}
                    </button>
                  </div>
                ) : (
                  <div 
                    className="space-glass-card"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      padding: '2rem',
                      textAlign: 'center'
                    }}
                  >
                    <p 
                      className="space-text-muted"
                      style={{
                        color: '#a0a0a0',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      지원하지 않는 게임 타입입니다.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
