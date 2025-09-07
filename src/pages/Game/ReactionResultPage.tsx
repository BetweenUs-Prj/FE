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
  userId?: number;  // API response uses userId (number)
  userUid?: string; // Frontend expects userUid (string) 
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
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [loserId, setLoserId] = useState<number | null>(null);
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
            
            // Convert localStorage data format to frontend format
            const convertedRanking = resultsData.overallRanking.map((result: any) => ({
              ...result,
              userUid: String(result.userId || result.userUid), // Handle both formats
              userId: result.userId
            }));
            
            setOverallRanking(convertedRanking);
            setMyResult(convertedRanking.find((r: OverallRanking) => r.userUid === currentUserUid) || null);
            setPenalty(resultsData.penalty || null);
            setWinnerId(resultsData.winnerId || null);
            setLoserId(resultsData.loserId || null);
            setIsLoading(false);
            
            // Clean up stored results after loading
            localStorage.removeItem('reactionGameResults');
            return;
          }
        } catch (error) {
          console.error('[REACTION-RESULT] Error parsing stored results:', error);
        }
      }

      // API를 통해 결과 조회
      try {
        console.log('[REACTION-RESULT] Fetching results from API for session:', sessionId);
        const response = await fetch(`http://localhost:8084/api/mini-games/reaction/sessions/${sessionId}/results`);
        
        if (response.ok) {
          const results = await response.json();
          console.log('[REACTION-RESULT] Loaded results from API:', results);
          
          // Convert API response format to frontend format
          const convertedRanking = results.overallRanking?.map((result: any) => ({
            ...result,
            userUid: String(result.userId), // Convert userId to userUid string
            userId: result.userId
          })) || [];
          
          setOverallRanking(convertedRanking);
          setMyResult(convertedRanking.find((r: OverallRanking) => r.userUid === currentUserUid) || null);
          setPenalty(results.penalty || null);
          setWinnerId(results.winnerId || null);
          setLoserId(results.loserId || null);
          setIsLoading(false);
          return;
        } else {
          console.log('[REACTION-RESULT] API returned status:', response.status);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[REACTION-RESULT] API fetch failed:', error);
        setIsLoading(false);
      }
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

  // Get winner and loser display names
  const getWinnerUid = () => {
    // Use convertToGameResultFormat() data to get winner
    const results = convertToGameResultFormat();
    if (results.length === 0) return undefined;
    const winner = results.find(r => r.rank === 1);
    return winner?.displayName || winner?.userUid;
  };

  const getLoserUid = () => {
    // Use convertToGameResultFormat() data to get loser
    const results = convertToGameResultFormat();
    if (results.length === 0) return undefined;
    const lastRank = Math.max(...results.map(r => r.rank));
    const loser = results.find(r => r.rank === lastRank);
    return loser?.displayName || loser?.userUid;
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
            winnerUid={getWinnerUid()}
            loserUid={penalty ? getLoserUid() : undefined}
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