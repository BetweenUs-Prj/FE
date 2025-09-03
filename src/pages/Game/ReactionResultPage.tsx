import { useNavigate, useParams } from 'react-router-dom';
import { useReactionStore } from '../../hooks/useReactionStore';      
import { useGameStore } from '../../hooks/useGameStore';
import { useBackToGame } from '../../hooks/useBackToGame';
import { useEffect, useState } from 'react';
import { createSSEClient } from '../../utils/sse-client';
import { GameContainer } from '../../components';
import { PixelGameResult } from '../../components/common/PixelUI/PixelGameResult';
import { PixelLoading } from '../../components/common/PixelUI/PixelLoading';

type OverallRanking = {
  userUid: string;
  displayName?: string;
  deltaMs: number;
  falseStart: boolean;
  rank: number;
};

type PenaltyInfo = {
  code: string;
  text: string;
  emoji: string;
};

export default function ReactionResultPage() {
  useBackToGame();
  
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { resetGame } = useReactionStore();
  const [overallRanking, setOverallRanking] = useState<OverallRanking[]>([]);
  const [myResult, setMyResult] = useState<OverallRanking | null>(null);
  const [penalty, setPenalty] = useState<PenaltyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentUserUid = localStorage.getItem('betweenUs_userUid') || '';
  
  useEffect(() => {
    console.log('[REACTION-RESULT] Loading results for session:', sessionId);
    
    const loadResults = async () => {
      if (!sessionId) {
        console.error('[REACTION-RESULT] No sessionId available');
        setIsLoading(false);
        return;
      }

      // Try to load results from localStorage first (more reliable)
      const storedResults = localStorage.getItem('reactionGameResults');
      if (storedResults) {
        try {
          const resultsData = JSON.parse(storedResults);
          if (resultsData.sessionId === sessionId && resultsData.overallRanking) {
            console.log('[REACTION-RESULT] Loading results from localStorage:', resultsData);
            setOverallRanking(resultsData.overallRanking);
            setMyResult(resultsData.overallRanking.find((r: OverallRanking) => r.userUid === currentUserUid) || null);
            setPenalty(resultsData.penalty || null);
            setIsLoading(false);
            
            // Clean up stored results after loading
            localStorage.removeItem('reactionGameResults');
            return;
          }
        } catch (error) {
          console.error('[REACTION-RESULT] Error parsing stored results:', error);
        }
      }

      // Try API first (for FINISHED sessions)
      try {
        console.log('[REACTION-RESULT] Trying to fetch results from API for session:', sessionId);
        const response = await fetch(`http://localhost:8080/api/mini-games/reaction/sessions/${sessionId}/results`);
        
        if (response.ok) {
          const results = await response.json();
          console.log('[REACTION-RESULT] Loaded results from API:', results);
          
          setOverallRanking(results.overallRanking || []);
          setMyResult(results.overallRanking?.find((r: OverallRanking) => r.userUid === currentUserUid) || null);
          setPenalty(results.penalty || null);
          setIsLoading(false);
          return;
        } else if (response.status === 204) {
          console.log('[REACTION-RESULT] Session results not ready yet, will try STOMP fallback');
        }
      } catch (error) {
        console.log('[REACTION-RESULT] API fetch failed, trying STOMP fallback:', error);
      }

      console.log('[REACTION-RESULT] Setting up STOMP connection for session:', sessionId);

      // STOMP 연결 (fallback)
      const socket = new SockJS('http://localhost:8080/ws');
      const client = Stomp.over(socket);
      
      // 10초 타임아웃 설정
      const timeoutId = setTimeout(() => {
        console.warn('[REACTION-RESULT] STOMP connection timeout - no results received');
        if (client.connected) {
          client.disconnect();
        }
        setIsLoading(false);
      }, 10000);
      
      client.connect({}, () => {
        console.log('[REACTION-RESULT] STOMP connected, subscribing to results');
        
        // 결과 구독
        client.subscribe(`/topic/reaction/${sessionId}/results`, (message) => {
          try {
            const results = JSON.parse(message.body);
            console.log('[REACTION-RESULT] Received results via STOMP:', results);
            
            setOverallRanking(results.overallRanking || []);
            setMyResult(results.overallRanking?.find((r: OverallRanking) => r.userUid === currentUserUid) || null);
            setPenalty(results.penalty || null);
            setIsLoading(false);
            
            clearTimeout(timeoutId);
            client.disconnect();
          } catch (error) {
            console.error('[REACTION-RESULT] Error parsing STOMP message:', error);
          }
        });
        
        // 최종 결과 구독
        client.subscribe(`/topic/reaction/${sessionId}/final`, (message) => {
          try {
            const results = JSON.parse(message.body);
            console.log('[REACTION-RESULT] Received final results via STOMP:', results);
            
            setOverallRanking(results.overallRanking || []);
            setMyResult(results.overallRanking?.find((r: OverallRanking) => r.userUid === currentUserUid) || null);
            setPenalty(results.penalty || null);
            setIsLoading(false);
            
            clearTimeout(timeoutId);
            client.disconnect();
          } catch (error) {
            console.error('[REACTION-RESULT] Error parsing final STOMP message:', error);
          }
        });
      }, (error: any) => {
        console.error('[REACTION-RESULT] STOMP connection failed:', error);
        clearTimeout(timeoutId);
        setIsLoading(false);
      });
    };

    loadResults();

    return () => {
      // Cleanup
      console.log('[REACTION-RESULT] Component unmounting');
    };
  }, [sessionId, currentUserUid]);

  const handlePlayAgain = () => {
    console.log('[REACTION-RESULT] Play again clicked');
    resetGame();
    navigate('/game/reaction/lobby');
  };

  const handleGoHome = () => {
    console.log('[REACTION-RESULT] Go home clicked');
    resetGame();
    navigate('/game');
  };

  // Convert ranking data to PixelGameResult format
  const convertToGameResultFormat = () => {
    return overallRanking.map(result => ({
      rank: result.rank,
      userUid: result.userUid,
      displayName: result.displayName,
      deltaMs: result.deltaMs,
      falseStart: result.falseStart,
      isCurrentUser: result.userUid === currentUserUid
    }));
  };

  return (
    <GameContainer>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {isLoading ? (
          <PixelLoading
            message="결과를 불러오는 중..."
            variant="game"
            size="large"
            fullScreen={false}
          />
        ) : (
          <PixelGameResult
            title="반응속도 게임 결과"
            results={convertToGameResultFormat()}
            penalty={penalty ? { code: penalty.code, text: penalty.text } : undefined}
            gameType="REACTION"
            onPlayAgain={handlePlayAgain}
            onGoHome={handleGoHome}
          />
        )}
      </div>
    </GameContainer>
  );
}