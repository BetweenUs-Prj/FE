import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useGameStore } from '../../hooks/useGameStore';
import type { ScoreboardItem as BaseScoreboardItem } from '../../components/quiz/LiveScoreboard';

// 반응속도 게임을 위해 확장된 ScoreboardItem 타입
interface ScoreboardItem extends BaseScoreboardItem {
  falseStart?: boolean;
}

interface GameResultState {
  penalty?: {
    selectedPenaltyId: number;
    penaltyText: string;
    loserUid: string;
    loserNickname?: string;
  };
  scores?: ScoreboardItem[];
  finalScoreboard?: ScoreboardItem[];
  gameType?: string;
}

interface GameResultData {
  sessionId: number;
  players: Array<{
    userUid: string;
    totalScore: number;
    correctCount: number;
    totalAnswers: number;
    rank: number;
    totalResponseTime?: number; // 총 응답시간 (ms)
  }>;
  winnerUid: string;
  penaltyId: number | null;
  penaltyText?: string | null; // 벌칙 텍스트 추가
  status: string;
  message?: string;
  timestamp: number;
}

/**
 * REST-only 결과 페이지 (WebSocket 완전 제거)
 */
export default function ResultPageREST() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state } = useLocation() as { state?: GameResultState };
  const nav = useNavigate();
  const gameType = useGameStore((s) => s.gameType);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameResults, setGameResults] = useState<GameResultData | null>(null);
  const [finalScores, setFinalScores] = useState<ScoreboardItem[]>([]);
  const [penaltyInfo, setPenaltyInfo] = useState<{
    loserUid: string;
    loserNickname?: string;
    penaltyText: string;
  } | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  // 게임 타입에 따라 다른 API 엔드포인트 사용
  const isReactionGame = gameType === 'REACTION' || state?.gameType === 'REACTION' || window.location.pathname.includes('/reaction/result/');
  
  // 컴포넌트 마운트 로깅
  useEffect(() => {
    console.log('[RESULT] mount sid=' + sessionId);
    mountedRef.current = true; // 마운트 시 true로 설정
    
    return () => {
      console.log('[RESULT] unmount sid=' + sessionId);
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [sessionId]);
  
  // 결과 조회 함수
  const fetchResults = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return false;
    
    // 게임 타입에 따라 다른 API 엔드포인트 사용
    const apiEndpoint = isReactionGame 
      ? `/api/mini-games/reaction/sessions/${sessionId}/results`
      : `/api/mini-games/results/${sessionId}`;
    
    try {
      console.log('[RESULT] fetch ' + apiEndpoint + ' sid=' + sessionId + ' ...');
      const response = await fetch(apiEndpoint + `?ts=${Date.now()}`, {
        headers: {
          'User-Uid': localStorage.getItem('userUid') || 'anonymous',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('[RESULT] fetch /results sid=' + sessionId + ' status=' + response.status);
      
      if (response.status === 200) {
        // 정상 결과
        let data: GameResultData = await response.json();
        console.log('[RESULT] status=200 payload=', data); // 실제 데이터 로깅
        
        // 게임 결과 설정
        setGameResults(data);
        console.log('[RESULT] Setting game results:', data);
        console.log('[RESULT] Game type:', isReactionGame ? 'REACTION' : 'QUIZ');
        console.log('[RESULT] Penalty data available:', {
          penalty: data.penalty,
          penaltyText: data.penaltyText,
          loserUid: data.loserUid,
          winnerUid: data.winnerUid
        });
        
        // 최종 점수 설정 - 반응속도 게임과 퀴즈 게임 구조 모두 지원
        let scores: ScoreboardItem[] = [];
        
        if (data.players) {
          // 퀴즈 게임 구조
          scores = data.players.map(player => ({
            userUid: player.userUid,
            displayName: player.userUid, // userUid를 displayName으로 사용
            score: player.totalScore,
            rank: player.rank,
            correctCount: player.correctCount,
            totalAnswers: player.totalAnswers,
            totalResponseTime: player.totalResponseTime || 0
          }));
        } else if (data.overallRanking) {
          // 반응속도 게임 구조
          console.log('[RESULT] Processing overallRanking:', data.overallRanking);
          scores = data.overallRanking.map((player, index) => {
            console.log(`[RESULT] Processing player ${index}:`, player);
            const mappedPlayer = {
              userUid: player.userUid || player.uid,
              displayName: player.userUid || player.uid,
              // 반응시간 필드 체크: deltaMs, avgReactionTime, reactionTime, score 등
              score: player.deltaMs || player.avgReactionTime || player.reactionTime || player.score || 0,
              rank: player.rank || (index + 1),
              correctCount: player.successfulRounds || 0,
              totalAnswers: player.totalRounds || 0,
              totalResponseTime: player.deltaMs || player.avgReactionTime || player.reactionTime || 0,
              // False Start 정보 추가
              falseStart: player.falseStart || false
            };
            console.log(`[RESULT] Mapped player ${index}:`, mappedPlayer);
            return mappedPlayer;
          });
        }
        setFinalScores(scores);
        console.log('[RESULT] Setting final scores: ▶(' + scores.length + ')', scores);
        
        // 벌칙 정보 설정
        if (data.penalty && data.penalty.text && data.loserUid) {
          console.log('[RESULT] Using penalty from API:', data.penalty, 'loser:', data.loserUid);
          setPenaltyInfo({
            loserUid: data.loserUid,
            loserNickname: data.loserUid, // userUid를 nickname으로 사용
            penaltyText: data.penalty.text
          });
          console.log('[RESULT] Setting penalty info:', {
            loserUid: data.loserUid,
            loserNickname: data.loserUid,
            penaltyText: data.penalty.text
          });
        } else if (data.penaltyText && data.loserUid) {
          // 벌칙과 대상이 모두 명시된 경우
          console.log('[RESULT] Using penalty with specified loser');
          setPenaltyInfo({
            loserUid: data.loserUid,
            loserNickname: data.loserUid,
            penaltyText: data.penaltyText
          });
        } else if (data.penaltyText && scores.length > 0) {
          // 퀴즈 게임: 벌칙은 있지만 loserUid가 없는 경우 - 최하위 점수자를 찾기
          console.log('[RESULT] Finding loser by lowest score for penaltyText');
          const lowestScore = Math.min(...scores.map(s => s.score));
          const loser = scores.find(s => s.score === lowestScore);
          if (loser) {
            console.log('[RESULT] Found loser by lowest score:', loser);
            setPenaltyInfo({
              loserUid: loser.userUid,
              loserNickname: loser.displayName || loser.userUid,
              penaltyText: data.penaltyText
            });
          }
        } else if (data.penalty && data.penalty.text && scores.length > 0) {
          // 다른 형식: data.penalty.text
          const lowestScore = Math.min(...scores.map(s => s.score));
          const loser = scores.find(s => s.score === lowestScore);
          if (loser) {
            console.log('[RESULT] Found loser by lowest score for penalty.text:', loser);
            setPenaltyInfo({
              loserUid: loser.userUid,
              loserNickname: loser.displayName || loser.userUid,
              penaltyText: data.penalty.text
            });
          }
        }
        
        setLoading(false);
        console.log('[RESULT] Setting loading to false');
        return true;
      } else if (response.status === 404) {
        // 결과 아직 없음
        console.log('[RESULT] status=404 - results not ready yet');
        return false;
      } else {
        // 기타 에러
        console.error('[RESULT] Unexpected status:', response.status);
        setError(`결과를 불러올 수 없습니다. (${response.status})`);
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[RESULT] Fetch error:', error);
      setError('결과를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
      return false;
    }
  }, [sessionId, isReactionGame]);
  
  // 폴링 시작
  useEffect(() => {
    if (!sessionId) return;
    
    const startPolling = async () => {
      // 첫 번째 시도
      const success = await fetchResults();
      if (success) return;
      
      // 폴링 시작 (3초마다)
      pollingRef.current = setInterval(async () => {
        if (!mountedRef.current) return;
        const success = await fetchResults();
        if (success && pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      }, 3000);
    };
    
    startPolling();
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [sessionId, fetchResults]);
  
  // 현재 상태 로깅
  useEffect(() => {
    console.log('[RESULT] Current state check:', {
      loading,
      error,
      gameResults,
      finalScores,
      penaltyInfo,
      isReactionGame,
      sessionId
    });
    
    console.log('[RESULT] Penalty info details:', penaltyInfo);
    console.log('[RESULT] Will show penalty section?', !!penaltyInfo);
  }, [loading, error, gameResults, finalScores, penaltyInfo]);
  
  // 픽셀 아트 마우스 이벤트 핸들러
  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '8px 8px 0px #0d0d0d'; 
    } 
  };
  
  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(0)'; 
      e.currentTarget.style.boxShadow = '4px 4px 0px #0d0d0d'; 
    } 
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(2px)'; 
      e.currentTarget.style.boxShadow = '2px 2px 0px #0d0d0d'; 
    } 
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '8px 8px 0px #0d0d0d'; 
    } 
  };

  // 픽셀 아트 스타일
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    .pixel-game-body { 
      font-family: 'Press Start 2P', cursive; 
      background-color: #2c2d3c; 
      color: #f2e9e4; 
      background-image: linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px); 
      background-size: 4px 4px; 
      image-rendering: pixelated; 
      min-height: 100vh; 
    }
    .pixel-container { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      padding: 2rem; 
    }
    .pixel-box { 
      background-color: #4a4e69; 
      padding: 1.5rem; 
      border: 4px solid #0d0d0d; 
      box-shadow: 8px 8px 0px #0d0d0d; 
      width: 100%; 
      margin-bottom: 2rem; 
      box-sizing: border-box; 
    }
    .pixel-header { 
      background-color: #22223b; 
      border-color: #0d0d0d; 
      margin-bottom: 1.5rem; 
    }
    .pixel-title { 
      font-size: 1.5rem; 
      color: #ffd6a5; 
      text-shadow: 3px 3px 0px #0d0d0d; 
      margin: 0 0 1.5rem 0; 
      text-align: center; 
    }
    .pixel-subtitle { 
      font-size: 1.2rem; 
      color: #a7c957; 
      text-shadow: 2px 2px 0px #0d0d0d; 
      margin: 0 0 1rem 0; 
      text-align: center; 
    }
    .pixel-button { 
      font-family: 'Press Start 2P', cursive; 
      color: #f2e9e4; 
      border: 4px solid #0d0d0d; 
      box-shadow: 4px 4px 0px #0d0d0d; 
      padding: 1rem; 
      cursor: pointer; 
      transition: transform 0.1s linear, box-shadow 0.1s linear; 
      text-align: center; 
      background-color: #22223b; 
      font-size: 1rem; 
      margin: 0.5rem; 
    }
    .pixel-button.primary { 
      background-color: #a7c957; 
      color: #0d0d0d; 
    }
    .pixel-button.secondary { 
      background-color: #4a4e69; 
      color: #f2e9e4; 
    }
    .winner-box { 
      background-color: #a7c957; 
      border-color: #0d0d0d; 
    }
    .winner-box .pixel-title { 
      color: #0d0d0d; 
    }
    .penalty-box { 
      background-color: #e76f51; 
      border-color: #0d0d0d; 
    }
    .penalty-box .pixel-title { 
      color: #f2e9e4; 
    }
    .rank-item { 
      background-color: #22223b; 
      padding: 1rem; 
      margin-bottom: 0.5rem; 
      border: 3px solid #0d0d0d; 
      box-shadow: 4px 4px 0px #0d0d0d; 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
    }
    .rank-info { 
      display: flex; 
      align-items: center; 
      gap: 1rem; 
    }
    .rank-number { 
      font-size: 1.2rem; 
      color: #ffd6a5; 
      font-weight: bold; 
    }
    .player-name { 
      font-size: 1rem; 
      color: #f2e9e4; 
    }
    .player-score { 
      font-size: 1rem; 
      color: #a7c957; 
      font-weight: bold; 
    }
    .button-container { 
      display: flex; 
      gap: 1rem; 
      justify-content: center; 
      margin-top: 2rem; 
    }
    .loading-text { 
      font-size: 1.2rem; 
      color: #f4a261; 
      text-align: center; 
      margin: 2rem 0; 
    }
    .error-text { 
      font-size: 1rem; 
      color: #e76f51; 
      text-align: center; 
      margin: 1rem 0; 
    }
    .blinking-cursor { 
      animation: blink 1s step-end infinite; 
    }
    @keyframes blink { 
      50% { opacity: 0; } 
    }
  `;

  // 로딩 중
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div className="pixel-box">
              <div className="pixel-title">
                결과를 불러오는 중<span className="blinking-cursor">...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div className="pixel-box">
              <div className="pixel-title">⚠️ 오류 발생</div>
              <div className="error-text">{error}</div>
              <div className="button-container">
                <button 
                  className="pixel-button primary" 
                  onClick={() => nav('/')}
                  onMouseEnter={handleMouseOver}
                  onMouseLeave={handleMouseOut}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                >
                  홈으로 이동
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 결과 데이터가 없는 경우
  if (!gameResults || !finalScores.length) {
    return (
      <>
        <style>{styles}</style>
        <div className="pixel-game-body">
          <div className="pixel-container">
            <div className="pixel-box">
              <div className="pixel-title">📊 게임 결과</div>
              <div className="loading-text">
                결과 데이터를 찾을 수 없습니다<span className="blinking-cursor">...</span>
              </div>
              <div className="button-container">
                <button 
                  className="pixel-button primary" 
                  onClick={() => nav('/')}
                  onMouseEnter={handleMouseOver}
                  onMouseLeave={handleMouseOut}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                >
                  홈으로 이동
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 우승자 찾기
  const winner = finalScores.find(score => score.userUid === gameResults.winnerUid);
  
  console.log('[RESULT] Rendering result screen with:', {
    gameResults,
    finalScores,
    penaltyInfo,
    winner
  });

  return (
    <>
      <style>{styles}</style>
      <div className="pixel-game-body">
        <div className="pixel-container">
          {/* 게임 결과 헤더 */}
          <div className="pixel-box pixel-header">
            <div className="pixel-title">
              {isReactionGame ? '⚡ 반응속도 게임 결과' : '🧠 퀴즈 게임 결과'}
            </div>
            <div className="pixel-subtitle">
              세션 #{gameResults.sessionId}
            </div>
          </div>

          {/* 우승자 */}
          {winner && (
            <div className="pixel-box winner-box">
              <div className="pixel-title">🏆 우승자</div>
              <div className="pixel-subtitle">
                {winner.displayName || winner.userUid}
              </div>
              <div className="player-score">
                {isReactionGame ? `${winner.score}ms` : `${winner.score}점`}
              </div>
            </div>
          )}

          {/* 최종 순위 */}
          <div className="pixel-box">
            <div className="pixel-title">📊 최종 순위</div>
            {finalScores.map((score, index) => (
              <div key={score.userUid} className="rank-item">
                <div className="rank-info">
                  <span className="rank-number">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}
                  </span>
                  <span className="player-name">
                    {score.displayName || score.userUid}
                  </span>
                </div>
                <span className="player-score">
                  {isReactionGame ? 
                    (score.falseStart ? 'False Start' : `${score.score}ms`) :
                    `${score.score}점`
                  }
                </span>
              </div>
            ))}
          </div>

          {/* 벌칙 정보 */}
          {penaltyInfo && (
            <div className="pixel-box penalty-box">
              <div className="pixel-title">🎯 벌칙</div>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  color: '#f2e9e4', 
                  marginBottom: '1rem',
                  fontWeight: 'bold'
                }}>
                  벌칙 대상: {penaltyInfo.loserNickname || penaltyInfo.loserUid}
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  color: '#ffd6a5',
                  lineHeight: '1.5',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid #ffd6a5',
                  borderRadius: '8px'
                }}>
                  {penaltyInfo.penaltyText}
                </div>
              </div>
            </div>
          )}


          {/* 버튼 */}
          <div className="button-container">
            {/* 반응속도 게임인 경우 다시 하기 버튼 추가 */}
            {isReactionGame && (
              <button 
                className="pixel-button secondary" 
                onClick={() => {
                  // 기존 세션 정보 정리
                  sessionStorage.removeItem('reaction.sessionId');
                  // 새로운 반응속도 게임 로비로 이동
                  nav('/game/reaction/lobby');
                }}
                onMouseEnter={handleMouseOver}
                onMouseLeave={handleMouseOut}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                다시 하기
              </button>
            )}
            <button 
              className="pixel-button secondary" 
              onClick={() => nav('/appointment')}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              약속으로 돌아가기
            </button>
            <button 
              className="pixel-button primary" 
              onClick={() => nav('/')}
              onMouseEnter={handleMouseOver}
              onMouseLeave={handleMouseOut}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              홈으로 이동
            </button>
          </div>
        </div>
      </div>
    </>
  );
}