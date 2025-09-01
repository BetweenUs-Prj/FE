import { useNavigate, useParams } from 'react-router-dom';
import { useReactionStore } from '../../hooks/useReactionStore';      
import { useGameStore } from '../../hooks/useGameStore';
import { useBackToGame } from '../../hooks/useBackToGame';
import { useEffect, useState } from 'react';
import { createSSEClient } from '../../utils/sse-client';
import { GameContainer, ThemeCard, ThemeButton, LoadingCard } from '../../components';

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

  return (
    <GameContainer>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 
          style={{ 
            fontSize: '2.5rem', 
            marginBottom: '2rem',
            color: '#147781',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            fontWeight: '600',
            textAlign: 'center'
          }}
        >
          ⚡ 반응속도 게임 결과 ⚡
        </h1>

        {isLoading ? (
          <LoadingCard
            message="결과를 불러오는 중..."
            variant="primary"
            spinnerColor="white"
          />
        ) : (
          <>
            {/* 내 결과 */}
            {myResult && (
              <ThemeCard
                variant="primary"
                style={{
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}
              >
                <h2 
                  style={{ 
                    fontSize: '1.5rem', 
                    marginBottom: '1rem',
                    color: '#FFFFFF',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    fontWeight: '600'
                  }}
                >
                  내 결과
                </h2>
                <div 
                  style={{ 
                    fontSize: '3rem', 
                    color: myResult.falseStart ? '#F96D3C' : '#FCB422',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    fontWeight: '700',
                    marginBottom: '0.5rem'
                  }}
                >
                  {myResult.falseStart ? 'False Start!' : `${myResult.deltaMs}ms`}
                </div>
                <div 
                  style={{ 
                    fontSize: '1.2rem', 
                    color: '#FFFFFF',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {myResult.falseStart ? '실격' : `${myResult.rank}등`}
                </div>
              </ThemeCard>
            )}

            {/* 전체 순위 */}
            {overallRanking.length > 0 && (
              <ThemeCard
                variant="primary"
                style={{
                  marginBottom: '2rem'
                }}
              >
                <h3 
                  style={{ 
                    fontSize: '1.5rem', 
                    marginBottom: '1.5rem',
                    color: '#FFFFFF',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}
                >
                  전체 순위
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {overallRanking.map((result, index) => (
                    <div
                      key={result.userUid}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: result.userUid === currentUserUid ? 
                          'rgba(252, 180, 34, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        border: result.userUid === currentUserUid ? 
                          '1px solid rgba(252, 180, 34, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div 
                          style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: '600',
                            color: index === 0 ? '#FCB422' : 
                                   index === 1 ? '#F97B25' : 
                                   index === 2 ? '#F96D3C' : '#FFFFFF',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          {index + 1}
                        </div>
                        <div 
                          style={{ 
                            fontSize: '1rem', 
                            color: '#FFFFFF',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          {result.displayName || 'Unknown'}
                        </div>
                      </div>
                      <div 
                        style={{ 
                          fontSize: '1rem', 
                          color: result.falseStart ? '#F96D3C' : '#FCB422',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                          fontWeight: '600'
                        }}
                      >
                        {result.falseStart ? 'False Start' : `${result.deltaMs}ms`}
                      </div>
                    </div>
                  ))}
                </div>
              </ThemeCard>
            )}

            {/* 벌칙 정보 */}
            {penalty && (
              <ThemeCard
                variant="secondary"
                style={{
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}
              >
                <h3 
                  style={{ 
                    fontSize: '1.5rem', 
                    marginBottom: '1rem',
                    color: '#FFFFFF',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    fontWeight: '600'
                  }}
                >
                  🎯 벌칙
                </h3>
                <div 
                  style={{ 
                    fontSize: '2rem', 
                    marginBottom: '0.5rem',
                    color: '#FFFFFF',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {penalty.emoji}
                </div>
                <div 
                  style={{ 
                    fontSize: '1.2rem', 
                    color: '#FFFFFF',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {penalty.text}
                </div>
              </ThemeCard>
            )}

            {/* 통계 정보 */}
            <ThemeCard
              variant="primary"
              style={{
                marginBottom: '2rem'
              }}
            >
              <h3 
                style={{ 
                  fontSize: '1.2rem', 
                  marginBottom: '1rem', 
                  textAlign: 'center',
                  color: '#FFFFFF',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  fontWeight: '600'
                }}
              >
                게임 통계
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{ 
                      fontSize: '2rem', 
                      color: '#FCB422',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                      fontWeight: '600'
                    }}
                  >
                    {overallRanking.length}
                  </div>
                  <div 
                    style={{ 
                      color: '#FFFFFF',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    총 참가자
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{ 
                      fontSize: '2rem', 
                      color: '#F96D3C',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                      fontWeight: '600'
                    }}
                  >
                    {overallRanking.filter(r => r.falseStart).length}
                  </div>
                  <div 
                    style={{ 
                      color: '#FFFFFF',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    False Start
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{ 
                      fontSize: '2rem', 
                      color: '#FCB422',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                      fontWeight: '600'
                    }}
                  >
                    {overallRanking.filter(r => !r.falseStart).length > 0 ?
                      Math.min(...overallRanking.filter(r => !r.falseStart).map(r => r.deltaMs)) + 'ms' :
                      'N/A'
                    }
                  </div>
                  <div 
                    style={{ 
                      color: '#FFFFFF',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    최고 기록
                  </div>
                </div>
              </div>
            </ThemeCard>

            {/* 하단 버튼들 */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <ThemeButton
                variant="success"
                onClick={handlePlayAgain}
              >
                다시 플레이
              </ThemeButton>
              
              <ThemeButton
                variant="primary"
                onClick={handleGoHome}
              >
                홈으로
              </ThemeButton>
            </div>
          </>
        )}
      </div>
    </GameContainer>
  );
}