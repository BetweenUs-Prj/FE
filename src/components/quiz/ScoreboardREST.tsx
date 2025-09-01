import { useEffect, useState, useRef } from 'react';

export interface ScoreEntry {
  rank: number;
  userUid: string;
  score: number;
  correctCount: number;
}

interface ScoreboardProps {
  sessionId: number;
  onSubmit?: () => void; // 답변 제출 시 즉시 갱신용
}

/**
 * REST 폴링 기반 점수판 (WebSocket 없음)
 * - 1초 간격 폴링
 * - 실패 시 지수 백오프 (최대 10초)
 */
export function ScoreboardREST({ sessionId, onSubmit }: ScoreboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  
  const stopRef = useRef(false);
  const waitRef = useRef(1000); // 초기 대기 시간 1초
  
  // 점수판 조회
  const fetchScoreboard = async () => {
    if (stopRef.current) return;
    
    try {
      const response = await fetch(`/api/mini-games/results/${sessionId}/scoreboard?ts=${Date.now()}`, {
        headers: {
          'User-Uid': localStorage.getItem('userUid') || 'anonymous',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[SCOREBOARD] Response data:', data);
        setScores(data.scores || []);
        setLastUpdate(data.timestamp || Date.now());
        setLoading(false);
        // 성공 시 대기 시간 초기화
        waitRef.current = 1000;
      } else {
        console.log('[SCOREBOARD] Error response:', response.status, response.statusText);
        // 실패 시 대기 시간 증가 (지수 백오프)
        waitRef.current = Math.min(waitRef.current * 2, 10000);
      }
    } catch (error) {
      console.error('[SCOREBOARD] Fetch error:', error);
      waitRef.current = Math.min(waitRef.current * 2, 10000);
    }
  };
  
  // 폴링 루프
  useEffect(() => {
    const loop = async () => {
      while (!stopRef.current) {
        await fetchScoreboard();
        await new Promise(resolve => setTimeout(resolve, waitRef.current));
      }
    };
    
    loop();
    
    return () => {
      stopRef.current = true;
    };
  }, [sessionId]);
  
  // 답변 제출 시 즉시 갱신
  useEffect(() => {
    if (onSubmit) {
      fetchScoreboard();
    }
  }, [onSubmit]);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">점수판</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">점수판</h3>
        <span className="text-xs text-gray-500">
          {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : ''}
        </span>
      </div>
      
      <div className="space-y-2">
        {scores.length === 0 ? (
          <p className="text-gray-500 text-center py-4">아직 점수가 없습니다</p>
        ) : (
          scores.map((entry) => (
            <div
              key={entry.userUid}
              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition"
            >
              <div className="flex items-center">
                <span className="font-bold text-gray-600 w-8">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}.`}
                </span>
                <span className="ml-2 font-medium text-gray-800">
                  {entry.userUid.substring(0, 8)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  정답: {entry.correctCount}
                </span>
                <span className="font-bold text-lg text-blue-600">
                  {entry.score}점
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}