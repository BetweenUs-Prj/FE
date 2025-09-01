import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from './Toast';

interface TopBarProps {
  title?: string;
  onQuit?: () => Promise<void> | void;
  showQuit?: boolean;
}

export function TopBar({ title = '게임', onQuit, showQuit = true }: TopBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/game');
    }
  };

  const handleQuit = async () => {
    const confirmed = window.confirm('정말로 게임을 포기하시겠습니까?');
    if (!confirmed) return;

    try {
      await onQuit?.();
      showToast('게임을 종료했습니다.', 'info');
      navigate('/game');
    } catch (error) {
      console.error('Failed to quit game:', error);
      showToast('게임 종료 중 오류가 발생했습니다.', 'error');
      // 강제로 안전한 상태로 복귀
      navigate('/game');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 1000,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
    }}>
      <button
        onClick={handleBack}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        aria-label="뒤로 가기"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <ArrowLeft size={18} />
        <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>뒤로</span>
      </button>

      <h1 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
        margin: 0,
        flex: 1,
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '300px'
      }}>
        {title}
      </h1>

      {showQuit ? (
        <button
          onClick={handleQuit}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
          aria-label="게임 포기"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
          }}
        >
          <Home size={16} />
          <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>포기</span>
        </button>
      ) : (
        <div style={{ width: '48px' }}></div>
      )}
    </div>
  );
}