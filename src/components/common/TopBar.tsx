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

  const pixelStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  `;

  return (
    <>
      <style>{pixelStyles}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        backgroundColor: '#2c2d3c',
        border: 'none',
        borderBottom: '4px solid #0d0d0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 1000,
        boxShadow: '0 8px 0px #0d0d0d',
        fontFamily: "'Press Start 2P', cursive",
        backgroundImage: 'linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px)',
        backgroundSize: '4px 4px',
        imageRendering: 'pixelated'
      }}>
        <button
          onClick={handleBack}
          style={{
            backgroundColor: '#4a4e69',
            border: '3px solid #0d0d0d',
            boxShadow: '4px 4px 0px #0d0d0d',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f2e9e4',
            fontSize: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: "'Press Start 2P', cursive",
            textShadow: '1px 1px 0px #0d0d0d'
          }}
          aria-label="뒤로 가기"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(2px)';
            e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
          }}
        >
          <ArrowLeft size={14} />
          <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>뒤로</span>
        </button>

        <h1 style={{
          fontSize: '12px',
          color: '#ffd6a5',
          margin: 0,
          flex: 1,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '300px',
          fontFamily: "'Press Start 2P', cursive",
          textShadow: '2px 2px 0px #0d0d0d'
        }}>
          {title}
        </h1>

        {showQuit ? (
          <button
            onClick={handleQuit}
            style={{
              backgroundColor: '#e76f51',
              border: '3px solid #0d0d0d',
              boxShadow: '4px 4px 0px #0d0d0d',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#f2e9e4',
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "'Press Start 2P', cursive",
              textShadow: '1px 1px 0px #0d0d0d'
            }}
            aria-label="게임 포기"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d';
            }}
          >
            <Home size={14} />
            <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>포기</span>
          </button>
        ) : (
          <div style={{ width: '48px' }}></div>
        )}
      </div>
    </>
  );
}