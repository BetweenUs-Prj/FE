import React, { useState } from 'react';
import { TopBar } from '../../components/common/TopBar';
import { Toast, showToast } from '../../components/common/Toast';
import { Home, Settings, User, Bell, Search, Plus, Heart, Star } from 'lucide-react';

/**
 * GlassPreview - iOS Glassmorphism Design System Preview
 * 
 * This page showcases all the glassmorphism components and utilities
 * for visual testing and design validation across light/dark themes.
 */
export default function GlassPreview() {
  const [isDark, setIsDark] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('option1');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('theme-dark');
  };

  const handleToastDemo = (type: 'success' | 'error' | 'info') => {
    const messages = {
      success: '성공적으로 완료되었습니다! 🎉',
      error: '오류가 발생했습니다. 다시 시도해주세요.',
      info: '새로운 알림이 도착했습니다. 📱'
    };
    showToast(messages[type], type);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'theme-dark' : ''}`} style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
      minHeight: '100vh'
    }}>
      <TopBar title="Glass Design System" showQuit={false} />
      
      {/* Main Content */}
      <div style={{ paddingTop: '80px', paddingBottom: '32px', paddingLeft: '16px', paddingRight: '16px', maxWidth: '1152px', margin: '0 auto' }}>
        
        {/* Test Glass Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}>
          <h2 style={{ color: '#1f2937', fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
            글래스모피즘 테스트
          </h2>
          <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '16px' }}>
            이 카드가 반투명한 글래스 효과로 보인다면 성공입니다!
          </p>
          <button style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px 0 rgba(59, 130, 246, 0.3)'
          }}>
            테스트 버튼
          </button>
        </div>
        
        {/* Theme Toggle */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">테마 설정</h2>
            <button
              onClick={toggleTheme}
              className="glass-btn-secondary"
            >
              {isDark ? '🌞 라이트 모드' : '🌙 다크 모드'}
            </button>
          </div>
          <p className="text-text-secondary">
            현재 테마: <span className="font-medium text-text-primary">{isDark ? 'Dark' : 'Light'}</span>
          </p>
        </div>

        {/* Color Palette */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">컬러 팔레트</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <div className="h-16 bg-tint-primary rounded-ios flex items-center justify-center text-text-on-tint font-medium">Primary</div>
              <p className="text-xs text-text-secondary text-center">iOS Blue</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-tint-secondary rounded-ios flex items-center justify-center text-text-on-tint font-medium">Secondary</div>
              <p className="text-xs text-text-secondary text-center">iOS Purple</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-tint-success rounded-ios flex items-center justify-center text-text-on-tint font-medium">Success</div>
              <p className="text-xs text-text-secondary text-center">iOS Green</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-tint-warning rounded-ios flex items-center justify-center text-text-on-tint font-medium">Warning</div>
              <p className="text-xs text-text-secondary text-center">iOS Orange</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-tint-danger rounded-ios flex items-center justify-center text-text-on-tint font-medium">Danger</div>
              <p className="text-xs text-text-secondary text-center">iOS Red</p>
            </div>
          </div>
        </div>

        {/* Glass Surfaces */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">글래스 표면</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Standard Glass</h3>
              <div className="glass p-4 rounded-ios">
                <p className="text-text-secondary text-sm">기본 글래스 효과</p>
                <p className="text-xs text-text-tertiary mt-1">backdrop-blur + opacity</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Strong Glass</h3>
              <div className="glass-strong p-4 rounded-ios">
                <p className="text-text-secondary text-sm">강한 글래스 효과</p>
                <p className="text-xs text-text-tertiary mt-1">더 높은 블러와 투명도</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Elevated Surface</h3>
              <div className="surface-elevated p-4 rounded-ios">
                <p className="text-text-secondary text-sm">상승된 표면</p>
                <p className="text-xs text-text-tertiary mt-1">카드, 모달용</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">버튼 스타일</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button className="glass-btn">
              <Settings size={16} className="mr-2" />
              Default
            </button>
            <button className="glass-btn-primary">
              <Home size={16} className="mr-2" />
              Primary
            </button>
            <button className="glass-btn-secondary">
              <User size={16} className="mr-2" />
              Secondary
            </button>
            <button className="glass-btn-success">
              <Plus size={16} className="mr-2" />
              Success
            </button>
            <button className="glass-btn-warning">
              <Bell size={16} className="mr-2" />
              Warning
            </button>
            <button className="glass-btn-danger">
              <Heart size={16} className="mr-2" />
              Danger
            </button>
          </div>
          
          <div className="mt-6 pt-6 hairline-top">
            <h3 className="font-medium text-text-primary mb-4">버튼 상태</h3>
            <div className="flex gap-4 flex-wrap">
              <button className="glass-btn">Normal</button>
              <button className="glass-btn glass-disabled">Disabled</button>
              <button className="glass-btn glass-loading relative">Loading</button>
            </div>
          </div>
        </div>

        {/* Form Elements */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">폼 요소</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">
                  텍스트 입력
                </label>
                <input
                  type="text"
                  className="glass-input w-full"
                  placeholder="여기에 입력하세요..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">
                  선택 메뉴
                </label>
                <select
                  className="glass-select w-full"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                >
                  <option value="option1">옵션 1</option>
                  <option value="option2">옵션 2</option>
                  <option value="option3">옵션 3</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                검색 입력
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" />
                <input
                  type="search"
                  className="glass-input w-full pl-10"
                  placeholder="검색어를 입력하세요..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toast Demo */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">토스트 알림</h2>
          
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => handleToastDemo('success')}
              className="glass-btn-success"
            >
              성공 토스트
            </button>
            <button
              onClick={() => handleToastDemo('error')}
              className="glass-btn-danger"
            >
              에러 토스트
            </button>
            <button
              onClick={() => handleToastDemo('info')}
              className="glass-btn-primary"
            >
              정보 토스트
            </button>
          </div>
        </div>

        {/* Modal Demo */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">모달 대화상자</h2>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="glass-btn-primary"
          >
            모달 열기
          </button>
        </div>

        {/* Typography */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">타이포그래피</h2>
          
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Heading 1</h1>
              <p className="text-sm text-text-tertiary">32px, Bold</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Heading 2</h2>
              <p className="text-sm text-text-tertiary">24px, Semibold</p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-text-primary">Heading 3</h3>
              <p className="text-sm text-text-tertiary">20px, Medium</p>
            </div>
            <div>
              <p className="text-base text-text-primary">Body Text - Primary</p>
              <p className="text-sm text-text-tertiary">16px, Regular</p>
            </div>
            <div>
              <p className="text-base text-text-secondary">Body Text - Secondary</p>
              <p className="text-sm text-text-tertiary">16px, Regular</p>
            </div>
            <div>
              <p className="text-sm text-text-tertiary">Caption Text</p>
              <p className="text-xs text-text-quaternary">14px, Regular</p>
            </div>
          </div>
        </div>

        {/* Scoreboard Demo */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">스코어보드 예시</h2>
          
          <div className="glass rounded-ios-lg p-4 space-y-3">
            <div className="flex items-center justify-between p-3 hairline-bottom">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-tint-primary flex items-center justify-center text-text-on-tint text-sm font-semibold">
                  1
                </div>
                <span className="font-medium text-text-primary">Player One</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-tint-warning" />
                <span className="font-semibold text-text-primary">1,250</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 hairline-bottom">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-tint-secondary flex items-center justify-center text-text-on-tint text-sm font-semibold">
                  2
                </div>
                <span className="font-medium text-text-primary">Player Two</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-tint-warning" />
                <span className="font-semibold text-text-primary">980</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-tint-success flex items-center justify-center text-text-on-tint text-sm font-semibold">
                  3
                </div>
                <span className="font-medium text-text-primary">Player Three</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-tint-warning" />
                <span className="font-semibold text-text-primary">750</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <>
          <div className="glass-overlay" onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="glass-modal">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                글래스 모달 예시
              </h3>
              <p className="text-text-secondary mb-6">
                이것은 iOS 스타일의 글래스모피즘 모달입니다. 
                배경 블러와 투명도가 적용되어 있습니다.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="glass-btn"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    handleToastDemo('success');
                  }}
                  className="glass-btn-primary"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
