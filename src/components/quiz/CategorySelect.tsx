import React, { useState, useEffect } from 'react';
import { listCategories } from '../../api/meta';
import { showToast } from '../common/Toast';

interface CategorySelectProps {
  onSelect: (category: string) => void;
  loading?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({ onSelect, loading = false }) => {
  const [categories, setCategories] = useState<string[]>([]);
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
      const categoryList = await listCategories();
      setCategories(categoryList);
      
      if (categoryList.length > 0) {
        setSelectedCategory(categoryList[0]); // Default to first category
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

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleStartQuiz = () => {
    if (selectedCategory) {
      onSelect(selectedCategory);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, category: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategorySelect(category);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem',
        }}
      >
        <p style={{ color: '#d1d5db' }}>카테고리를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem',
        }}
      >
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={loadCategories}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #6b7280',
            backgroundColor: 'transparent',
            color: '#d1d5db',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
        width: '100%',
        maxWidth: '640px',
      }}
    >
      <h2 
        style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          marginBottom: '0.5rem',
          color: '#f8fafc'
        }}
      >
        퀴즈 카테고리 선택
      </h2>
      
      <p 
        style={{ 
          color: '#9ca3af', 
          marginBottom: '1.5rem', 
          textAlign: 'center',
          fontSize: '0.9rem'
        }}
      >
        원하는 카테고리를 선택하고 퀴즈를 시작하세요.
      </p>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem', 
          width: '100%', 
          marginBottom: '2rem' 
        }}
        role="radiogroup"
        aria-labelledby="category-selection-title"
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategorySelect(category)}
            onKeyDown={(e) => handleKeyDown(e, category)}
            role="radio"
            aria-checked={selectedCategory === category}
            tabIndex={selectedCategory === category ? 0 : -1}
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              border: selectedCategory === category ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
              background: selectedCategory === category ? '#1e40af' : '#374151',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: selectedCategory === category ? '600' : '400',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 0 0 2px #3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
            }}
          >
            {category}
          </button>
        ))}
      </div>

      <button
        onClick={handleStartQuiz}
        disabled={!selectedCategory || loading}
        style={{
          padding: '0.8rem 1.4rem',
          borderRadius: '0.5rem',
          background: (!selectedCategory || loading) ? '#4b5563' : '#10b981',
          border: 'none',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: (!selectedCategory || loading) ? 'not-allowed' : 'pointer',
          minWidth: '120px',
        }}
        aria-label={`${selectedCategory} 카테고리로 퀴즈 시작`}
      >
        {loading ? '시작 중...' : '퀴즈 시작'}
      </button>
    </div>
  );
};