import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useGameStore } from '../../hooks/useGameStore';
import { getReactionResults, getGameResults, type GameResultsType } from '../../api/game';
import { LiveScoreboard } from '../../components/quiz/LiveScoreboard';
import type { ScoreboardItem } from '../../components/quiz/LiveScoreboard';
import { GameResultManager, type BaseGameResult } from '../../services/GameResultManager';
import { GameType } from '../../types/gameLifecycle';
import { GameContainer } from '../../components';
import { PixelGameResult } from '../../components/common/PixelUI/PixelGameResult';
import { PixelLoading } from '../../components/common/PixelUI/PixelLoading';

// @ts-ignore - SockJS and @stomp/stompjs might not have types
import SockJS from 'sockjs-client';
// @ts-ignore
import { Client, StompSubscription } from '@stomp/stompjs';

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

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state } = useLocation() as { state?: GameResultState };
  const nav = useNavigate();
  const players = useGameStore((s) => s.players);
  const gameType = useGameStore((s) => s.gameType);

  const [reactionResults, setReactionResults] = useState<{ userUid: string; reactionTime: number; ranking: number }[]>([]);
  const [finalScores, setFinalScores] = useState<ScoreboardItem[]>([]);
  const [penaltyInfo, setPenaltyInfo] = useState<{ loserUid: string; loserNickname?: string; penaltyText: string; } | null>(null);
  const [gameResults, setGameResults] = useState<GameResultsType | null>(null);
  const [unifiedResults, setUnifiedResults] = useState<BaseGameResult | null>(null);
  const stompClient = useRef<Client | null>(null);
  const resultSubscription = useRef<StompSubscription | null>(null);
  const resultManager = useRef<GameResultManager | null>(null);

  useEffect(() => {
    resultManager.current = GameResultManager.getInstance();
  }, []);

  useEffect(() => {
    const loadExistingResults = async () => {
      if (!sessionId || !resultManager.current) return;

      try {
        console.log('[RESULT] Loading existing results for session:', sessionId);
        
        let existingResult = await resultManager.current.getGameResult(Number(sessionId), GameType.QUIZ);
        if (!existingResult) {
          existingResult = await resultManager.current.getGameResult(Number(sessionId), GameType.REACTION);
        }

        if (existingResult) {
          console.log('[RESULT] Found existing results:', existingResult);
          setUnifiedResults(existingResult);
          
          const displayScores: ScoreboardItem[] = existingResult.playerResults.map(player => ({
            userUid: player.userUid,
            displayName: player.userName || player.userUid.substring(0, 8),
            score: player.score,
            rank: player.rank
          }));
          
          setFinalScores(displayScores);

          if (existingResult.penalty) {
            setPenaltyInfo({
              loserUid: existingResult.penalty.assignedTo || '',
              loserNickname: existingResult.penalty.assignedTo?.substring(0, 8) || '',
              penaltyText: existingResult.penalty.description
            });
          }
        }
      } catch (error) {
        console.error('[RESULT] Failed to load existing results:', error);
      }
    };

    loadExistingResults();
  }, [sessionId]);

  useEffect(() => {
    document.title = '게임 결과';
    
    if (!sessionId) return;

    console.log('[RESULT] 🔍 Setting up WebSocket for game results - Session:', sessionId);

    const socket = new SockJS('http://localhost:8084/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.debug('[STOMP-RESULT]', str),
      reconnectDelay: 2000,
      onConnect: () => {
        console.log('[RESULT] ✅ WebSocket connected, subscribing to results');
        
        resultSubscription.current = client.subscribe(
          `/topic/quiz/${sessionId}/result`,
          (message) => {
            try {
              const results: GameResultsType = JSON.parse(message.body);
              console.log('[RESULT] ✅ Received game results via WebSocket:', results);
              setGameResults(results);
              
              if (resultManager.current && results.ranking && results.ranking.length > 0) {
                const playerResults = results.ranking.map(player => ({
                  userUid: player.uid,
                  userName: player.name,
                  score: player.score,
                  rank: player.rank,
                  details: {}
                }));

                const unifiedResult: BaseGameResult = {
                  sessionId: Number(sessionId),
                  gameType: gameType === 'QUIZ' ? GameType.QUIZ : GameType.REACTION,
                  completedAt: Date.now(),
                  playerResults,
                  winner: playerResults.find(p => p.rank === 1),
                  penalty: results.penalty?.assigned ? {
                    penaltyId: results.penalty.penaltyId || 0,
                    description: results.penalty.content,
                    assignedTo: results.penalty.targets[0]?.uid
                  } : undefined
                };

                resultManager.current.saveGameResult(unifiedResult);
                setUnifiedResults(unifiedResult);
              }
              
              if (results.ranking && results.ranking.length > 0) {
                const convertedScores: ScoreboardItem[] = results.ranking.map(player => ({
                  userUid: player.uid,
                  displayName: player.name,
                  score: player.score,
                  rank: player.rank
                }));
                setFinalScores(convertedScores);
                
                if (results.penalty && results.penalty.assigned) {
                  setPenaltyInfo({
                    loserUid: results.penalty.targets[0]?.uid || '',
                    loserNickname: results.penalty.targets[0]?.name || '',
                    penaltyText: results.penalty.content
                  });
                }
              }
            } catch (error) {
              console.error('[RESULT] ❌ Failed to parse WebSocket message:', error);
            }
          }
        );
        
        client.subscribe(
          `/topic/quiz/${sessionId}/scores`,
          (message) => {
            try {
              const scoreboardData = JSON.parse(message.body);
              let scoresArray: any[] = [];
              
              if (Array.isArray(scoreboardData)) {
                scoresArray = scoreboardData;
              } else if (scoreboardData && Array.isArray(scoreboardData.scores)) {
                scoresArray = scoreboardData.scores;
              } else if (scoreboardData && Array.isArray(scoreboardData.ranking)) {
                scoresArray = scoreboardData.ranking;
              } else if (scoreboardData && typeof scoreboardData === 'object') {
                scoresArray = [scoreboardData];
              } else {
                return;
              }
              
              const formattedScoreboard = scoresArray.map((item: any, index: number) => {
                const userUid = String(item.userUid || item.userId || item.uid || 'unknown');
                const displayName = item.nickname || item.displayName || item.name || String(item.userUid || item.userId || item.uid || 'unknown').substring(0, 8);
                const score = Number(item.score || 0);
                
                return { userUid, displayName, score, rank: index + 1 };
              });
              
              setFinalScores(formattedScoreboard);
            } catch (error) {
              console.error('[RESULT] ❌ Failed to parse score update:', error);
            }
          }
        );
        
        client.subscribe(
          `/topic/quiz/${sessionId}/game-end`,
          (message) => {
            try {
              loadResultsFromAPI();
            } catch (error) {
              console.error('[RESULT] ❌ Failed to parse game end message:', error);
            }
          }
        );
      },
      onDisconnect: () => console.log('[RESULT] 🔗 WebSocket disconnected'),
      onStompError: (frame) => console.error('[RESULT] ❌ STOMP error:', frame)
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (resultSubscription.current) {
        resultSubscription.current.unsubscribe();
      }
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [sessionId]);

  const loadResultsFromAPI = async () => {
    if (!sessionId || gameType !== 'QUIZ') return;
    try {
      const results = await getGameResults(Number(sessionId));
      if (results && results.ranking && results.ranking.length > 0) {
        const apiScores: ScoreboardItem[] = results.ranking
          .map((player, index) => ({
            userUid: player.uid,
            displayName: player.name || String(player.uid).substring(0, 8),
            score: Number(player.score) || 0,
            rank: player.rank || (index + 1)
          }))
          .sort((a, b) => b.score - a.score)
          .map((item, index) => ({ ...item, rank: index + 1 }));
        
        const apiPenalty = results.penalty && results.penalty.assigned ? {
          loserUid: results.penalty.targets?.[0]?.uid || '',
          loserNickname: results.penalty.targets?.[0]?.name || results.penalty.targets?.[0]?.uid || '미정',
          penaltyText: results.penalty.content || '벌칙을 수행하세요'
        } : null;
        
        if (apiScores.some(s => s.score > 0)) {
          setFinalScores(apiScores);
          setPenaltyInfo(apiPenalty);
        }
      }
    } catch (error) {
      console.error('[RESULT] ❌ Failed to load API results:', error);
    }
  };

  const checkGameCompletion = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/mini-games/sessions/${sessionId}`);
      const sessionData = await response.json();
      if (sessionData.status === 'IN_PROGRESS' || sessionData.status === 'WAITING') {
        const forceEndResponse = await fetch(`/api/mini-games/sessions/${sessionId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (forceEndResponse.ok) {
          setTimeout(() => {
            loadResultsFromAPI();
          }, 1000);
        }
      } else if (sessionData.status === 'FINISHED') {
        const sessionResults = sessionData.finalScoreboard || sessionData.results;
        if (Array.isArray(sessionResults) && sessionResults.length > 0) {
          const formattedResults = sessionResults.map((item: any, index: number) => ({
            userUid: String(item.userUid || item.userId || item.uid || 'unknown'),
            displayName: item.nickname || item.displayName || item.name || String(item.userUid || item.userId || item.uid || 'unknown').substring(0, 8),
            score: Number(item.score || 0),
            rank: index + 1
          }));
          setFinalScores(formattedResults);
        }
      }
    } catch (error) {
      console.error('[RESULT] ❌ Error checking game completion:', error);
    }
  };

  useEffect(() => {
    loadResultsFromAPI();
    checkGameCompletion();
  }, [sessionId, gameType]);

  useEffect(() => {
    if (!sessionId || gameType !== 'QUIZ') return;
    const syncScores = async () => {
      try {
        const latestScores = await getGameResults(Number(sessionId));
        if (latestScores && latestScores.ranking && latestScores.ranking.length > 0) {
          const formattedScores = latestScores.ranking.map((player: any, index: number) => ({
            userUid: String(player.userUid || player.userId || player.uid || 'unknown'),
            displayName: player.nickname || player.displayName || player.name || String(player.userUid || player.userId || player.uid || 'unknown').substring(0, 8),
            score: Number(player.score || 0),
            rank: index + 1
          }));
          const enhancedScores = formattedScores.map(score => {
            const storePlayer = players.find(p => p.id === score.userUid || p.name === score.displayName);
            return {
              ...score,
              displayName: storePlayer?.name || score.displayName || score.userUid.substring(0, 8) || 'Unknown'
            };
          });
          setFinalScores(enhancedScores);
        }
      } catch (error) {
        console.error('[RESULT] ❌ Failed to sync scores:', error);
      }
    };
    syncScores();
    const interval = setInterval(syncScores, 5000);
    return () => clearInterval(interval);
  }, [sessionId, gameType, players]);

  useEffect(() => {
    let unifiedScores: ScoreboardItem[] = [];
    let unifiedPenalty: { loserUid: string; loserNickname?: string; penaltyText: string; } | null = null;
    if (state?.scores && Array.isArray(state.scores) && state.scores.length > 0) {
      unifiedScores = state.scores.map(score => ({
        ...score,
        displayName: score.displayName || score.userUid?.substring(0, 8) || 'Unknown'
      }));
      if (state.penalty) {
        unifiedPenalty = {
          loserUid: state.penalty.loserUid,
          loserNickname: state.penalty.loserNickname || state.penalty.loserUid,
          penaltyText: state.penalty.penaltyText || '벌칙을 수행하세요'
        };
      }
    }
    else if (state?.finalScoreboard && Array.isArray(state.finalScoreboard) && state.finalScoreboard.length > 0) {
      unifiedScores = state.finalScoreboard.map(score => ({
        ...score,
        displayName: score.displayName || score.userUid?.substring(0, 8) || 'Unknown'
      }));
      if (state.penalty) {
        unifiedPenalty = {
          loserUid: state.penalty.loserUid,
          loserNickname: state.penalty.loserNickname || state.penalty.loserUid,
          penaltyText: state.penalty.penaltyText || '벌칙을 수행하세요'
        };
      }
    }
    else if (gameResults?.ranking && gameResults.ranking.length > 0) {
      unifiedScores = gameResults.ranking.map(player => ({
        userUid: player.uid,
        displayName: player.name || player.uid?.substring(0, 8) || 'Unknown',
        score: player.score,
        rank: player.rank
      }));
      if (gameResults.penalty && gameResults.penalty.assigned) {
        unifiedPenalty = {
          loserUid: gameResults.penalty.targets[0]?.uid || '',
          loserNickname: gameResults.penalty.targets[0]?.name || gameResults.penalty.targets[0]?.uid || 'Unknown',
          penaltyText: gameResults.penalty.content || '벌칙을 수행하세요'
        };
      }
    }
    else if (finalScores.length > 0) {
      unifiedScores = finalScores.map(score => ({
        ...score,
        displayName: score.displayName || score.userUid?.substring(0, 8) || 'Unknown'
      }));
    }
    else if (players.length > 0) {
      unifiedScores = players
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((player, index) => ({
          userUid: player.id,
          displayName: player.name || player.id?.substring(0, 8) || 'Unknown',
          score: player.score || 0,
          rank: index + 1
        }));
    }
    if (unifiedScores.length > 0) {
      const enhancedScores = unifiedScores.map(score => {
        const storePlayer = players.find(p => p.id === score.userUid || p.name === score.displayName);
        return {
          ...score,
          displayName: storePlayer?.name || score.displayName || score.userUid?.substring(0, 8) || 'Unknown'
        };
      });
      setFinalScores(enhancedScores);
    }
    if (unifiedPenalty) {
      setPenaltyInfo(unifiedPenalty);
    }
  }, [state, gameResults, finalScores, players, sessionId, gameType]);
  
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (gameType === 'QUIZ' && finalScores.length === 0 && players.length > 0) {
        const fallbackScores = players
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .map((p, index) => ({
            userUid: p.id,
            displayName: p.name || p.id,
            score: p.score || 0,
            rank: index + 1
          }));
        setFinalScores(fallbackScores);
      }
    }, 1000);
    const penaltyFallbackTimer = setTimeout(() => {
      if (gameType === 'QUIZ' && !penaltyInfo && players.length > 0) {
        const lastPlayer = players.sort((a, b) => (a.score || 0) - (b.score || 0))[0];
        const defaultPenalty = {
          loserUid: lastPlayer.id,
          loserNickname: lastPlayer.name || lastPlayer.id,
          penaltyText: '벌칙을 수행하세요'
        };
        setPenaltyInfo(defaultPenalty);
      }
    }, 3000);
    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(penaltyFallbackTimer);
    };
  }, [gameType, finalScores.length, penaltyInfo, players]);

  useEffect(() => {
    if (gameType === 'REACTION' && sessionId) {
      const id = Number(sessionId);
      getReactionResults(id).then((res) => {
        setReactionResults(res);
      });
    }
  }, [gameType, sessionId]);

  // Convert data to PixelGameResult format
  const convertToGameResultFormat = () => {
    const currentUserUid = localStorage.getItem('betweenUs_userUid') || '';
    
    const sorted = (finalScores.length > 0 ? finalScores : players)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((p: any, index) => ({
        rank: index + 1,
        userUid: p.userUid || p.id,
        displayName: p.displayName || p.name || (p.userUid || p.id)?.substring(0, 8) || 'Unknown',
        score: p.score || 0,
        isCurrentUser: (p.userUid || p.id) === currentUserUid
      }));
    
    return sorted;
  };

  // Get winner and loser display names
  const getWinnerUid = () => {
    const sorted = convertToGameResultFormat();
    if (sorted.length === 0) return undefined;
    const winner = sorted.find(p => p.rank === 1);
    return winner?.displayName || winner?.userUid;
  };

  const getLoserUid = () => {
    const sorted = convertToGameResultFormat();
    if (sorted.length === 0) return undefined;
    const lastRank = Math.max(...sorted.map(p => p.rank));
    const loser = sorted.find(p => p.rank === lastRank);
    return loser?.displayName || loser?.userUid;
  };

  const handlePlayAgain = () => {
    nav('/game');
  };

  const handleGoHome = () => {
    nav('/game');
  };

  const handleGoAppointment = () => {
    nav('/appointment', { 
      state: { 
        penalty: penaltyInfo, 
        gameType: gameType, 
        sessionId: sessionId 
      } 
    });
  };

  // Loading state
  if (players.length === 0 && reactionResults.length === 0 && finalScores.length === 0) {
    return (
      <GameContainer>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <PixelLoading
            message="결과를 불러오는 중..."
            variant="game"
            size="large"
            fullScreen={false}
          />
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <PixelGameResult
          title="게임 결과"
          results={convertToGameResultFormat()}
          winnerUid={getWinnerUid()}
          loserUid={penaltyInfo ? getLoserUid() : undefined}
          penalty={penaltyInfo ? { 
            code: 'PENALTY', 
            text: penaltyInfo.penaltyText 
          } : undefined}
          gameType={gameType === 'QUIZ' ? 'QUIZ' : 'REACTION'}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
        />
        
        {/* Additional appointment button for this specific page */}
        {penaltyInfo && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '1rem'
          }}>
            <button
              onClick={handleGoAppointment}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#6a856f',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              약속으로
            </button>
          </div>
        )}
      </div>
    </GameContainer>
  );
}