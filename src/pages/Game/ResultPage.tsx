import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useGameStore } from '../../hooks/useGameStore';
import { getReactionResults, getGameResults, type GameResultsType } from '../../api/game';
import { LiveScoreboard } from '../../components/quiz/LiveScoreboard';
import type { ScoreboardItem } from '../../components/quiz/LiveScoreboard';
import { GameResultManager, type BaseGameResult } from '../../services/GameResultManager';
import { GameType } from '../../types/gameLifecycle';

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

    const socket = new SockJS('http://localhost:8080/ws');
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
            displayName: player.name || player.uid.substring(0, 8),
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

  const sorted = (finalScores.length > 0 ? finalScores : players)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((p: any, index) => ({
      id: p.userUid || p.id,
      name: p.displayName || p.name || (p.userUid || p.id)?.substring(0, 8) || 'Unknown',
      score: p.score || 0,
      rank: index + 1
    }));
  const winner = sorted.length > 0 ? sorted[0] : null;

  // --- 스타일 및 렌더링 ---
  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => { 
    if (!e.currentTarget.disabled) { 
      e.currentTarget.style.transform = 'translateY(-4px)'; 
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
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
      e.currentTarget.style.boxShadow = '6px 6px 0px #0d0d0d'; 
    } 
  };

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
      max-width: 800px; 
      margin-bottom: 2rem; 
      box-sizing: border-box; 
    }
    .pixel-title { 
      font-size: 2rem; 
      color: #ffd6a5; 
      text-shadow: 3px 3px 0px #0d0d0d; 
      margin: 0 0 1.5rem 0; 
      text-align: center; 
      word-break: break-all; 
    }
    .pixel-button { 
      font-family: 'Press Start 2P', cursive; 
      color: #f2e9e4; 
      border: 4px solid #0d0d0d; 
      box-shadow: 4px 4px 0px #0d0d0d; 
      padding: 1rem 2rem; 
      cursor: pointer; 
      transition: transform 0.1s linear, box-shadow 0.1s linear; 
      text-align: center; 
      background-color: #9a8c98; 
      font-size: 1rem; 
      margin: 0.5rem; 
    }
    .rank-item { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 1rem; 
      border: 4px solid #0d0d0d; 
      margin-bottom: 1rem; 
    }
  `;
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd6a5';
    if (rank === 2) return '#c9c9c9';
    if (rank === 3) return '#a1683a';
    return '#4a4e69';
  };

  if (players.length === 0 && reactionResults.length === 0 && finalScores.length === 0) {
      return (
        <>
            <style>{styles}</style>
            <div className="pixel-game-body">
                <div className="pixel-container">
                    <div className="pixel-box"><p className="pixel-title">참가자 정보 없음</p></div>
                </div>
            </div>
        </>
      );
  }

  return (
    <>
        <style>{styles}</style>
        <div className="pixel-game-body">
            <div className="pixel-container">
                <div className="pixel-box">
                    <h1 className="pixel-title">GAME OVER</h1>
                    <h2 style={{fontSize: '1.2rem', color: '#a7c957', textShadow: '2px 2px 0px #0d0d0d', wordBreak: 'break-all'}}>WINNER: {winner?.name || '...'}</h2>
                </div>

                <div className="pixel-box">
                    <h3 className="pixel-title" style={{fontSize: '1.5rem'}}>FINAL SCORE</h3>
                    <div style={{maxHeight: '30vh', overflowY: 'auto', paddingRight: '1rem'}}>
                        {sorted.length > 0 ? sorted.map((player, index) => (
                            <div key={player.id} className="rank-item" style={{backgroundColor: getRankColor(index + 1)}}>
                                <span style={{fontSize: '0.9rem', wordBreak: 'break-all'}}>#{index + 1} {player.name}</span>
                                <span style={{fontSize: '0.9rem'}}>{player.score} PTS</span>
                            </div>
                        )) : <p>결과를 불러오는 중입니다...</p>}
                    </div>
                </div>

                {penaltyInfo && (
                    <div className="pixel-box" style={{backgroundColor: '#9d2929'}}>
                        <h3 className="pixel-title" style={{color: '#f2e9e4'}}>PENALTY</h3>
                        <p style={{fontSize: '1.2rem', color: '#ffd6a5', marginBottom: '0.5rem', wordBreak: 'break-all'}}>{penaltyInfo.loserNickname || penaltyInfo.loserUid}</p>
                        <p style={{fontSize: '1rem', lineHeight: '1.5'}}>{penaltyInfo.penaltyText}</p>
                    </div>
                )}
                
                <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
                    <button onClick={() => nav('/appointment', { state: { penalty: penaltyInfo, gameType: gameType, sessionId: sessionId } })} className="pixel-button" style={{backgroundColor: '#6a856f'}} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                        약속으로
                    </button>
                    <button onClick={() => nav('/game')} className="pixel-button" style={{backgroundColor: '#c19454'}} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                        홈으로
                    </button>
                </div>
            </div>
        </div>
    </>
  );
}