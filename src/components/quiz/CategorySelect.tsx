import React, { useState, useEffect } from 'react';
import { listCategories } from '../../api/meta';
import { showToast } from '../common/Toast';

// 아래 컴포넌트들은 프로젝트 내에 실제 파일이 있다고 가정합니다.
// import { ThemeCard, ThemeButton, LoadingCard } from '../common';

interface CategorySelectProps {
  onSelect: (category: string) => void;
  loading?: boolean;
}

const CATEGORY_MAPPING: { [key: string]: string } = {
  'GENERAL_KNOWLEDGE': '일반상식',
  'HISTORY': '역사',
  'SCIENCE': '과학',
  'GEOGRAPHY': '지리',
  'LITERATURE': '문학',
  'SPORTS': '스포츠',
  'ENTERTAINMENT': '연예',
  'TECHNOLOGY': '기술',
  'ART': '예술',
  'MUSIC': '음악',
  'MOVIE': '영화',
  'GAME': '게임',
  'FOOD': '음식',
  'ANIMAL': '동물',
  'NATURE': '자연',
  'CULTURE': '문화',
  'LANGUAGE': '언어',
  'MATH': '수학',
  'PHYSICS': '물리',
  'CHEMISTRY': '화학',
  'BIOLOGY': '생물',
  'ECONOMICS': '경제',
  'POLITICS': '정치',
  'SOCIETY': '사회',
  'PSYCHOLOGY': '심리학',
  'PHILOSOPHY': '철학',
  'RELIGION': '종교',
  'MYTHOLOGY': '신화',
  'FOLKLORE': '민속',
  'CUSTOMS': '풍습'
};

export const CategorySelect: React.FC<CategorySelectProps> = ({ onSelect, loading = false }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [displayCategories, setDisplayCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('[CategorySelect] Loading categories...');
      const categoryList = await listCategories();
      console.log('[CategorySelect] Categories loaded:', categoryList);
      
      setCategories(categoryList);
      const koreanCategories = categoryList.map(cat => CATEGORY_MAPPING[cat] || cat);
      setDisplayCategories(koreanCategories);
      
      if (categoryList.length > 0) {
        const firstCategory = categoryList[0];
        setSelectedCategory(firstCategory);
        onSelect(firstCategory);
      }
    } catch (err: any) {
      const errorMessage = '카테고리를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (originalCategory: string) => {
    setSelectedCategory(originalCategory);
    onSelect(originalCategory);
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
    .pixel-button.selected { background-color: #9a8c98; color: #fdffb6; }
    @keyframes blink { 50% { opacity: 0; } }
    .blinking-cursor { animation: blink 1s step-end infinite; }
  `;

  if (isLoading || loading) {
    return (
        <>
            <style>{styles}</style>
            <div className="pixel-box">
                <p className="pixel-title" style={{ fontSize: '1.2rem', color: '#f2e9e4', fontFamily: "'Press Start 2P', cursive" }}>
                    카테고리 로딩 중<span className="blinking-cursor">...</span>
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
                 <button className="pixel-button" onClick={loadCategories} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut}>
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
                🧠 카테고리 선택
            </h3>
            
            <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '0.9rem', color: '#c9c9c9', marginBottom: '1.5rem', textAlign: 'center' }}>
                원하는 카테고리를 선택하세요
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                {displayCategories.map((displayName, index) => {
                    const originalCategory = categories[index];
                    const isSelected = selectedCategory === originalCategory;
                    return (
                        <button
                            key={originalCategory}
                            onClick={() => handleCategorySelect(originalCategory)}
                            className={`pixel-button ${isSelected ? 'selected' : ''}`}
                            onMouseEnter={handleMouseOver}
                            onMouseLeave={handleMouseOut}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                        >
                            {displayName}
                        </button>
                    );
                })}
            </div>
        </div>
    </>
  );
};

