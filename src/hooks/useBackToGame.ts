import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useBackToGame() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const currentPath = location.pathname;
      
      // 게임 관련 페이지에서는 뒤로가기를 허용 (메인으로 리다이렉트하지 않음)
      const gamePages = [
        '/game/reaction/lobby/',
        '/game/reaction/',
        '/game/quiz/',
        '/game/result/',
        '/game/lobby/',
        '/game/penalty',
        '/game/create'
      ];
      
      const isInGameFlow = gamePages.some(page => currentPath.includes(page));
      
      if (!isInGameFlow) {
        e.preventDefault();
        navigate('/game', { replace: true });
      }
      // 게임 플로우 내에서는 자연스러운 네비게이션 허용
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, location]);
}