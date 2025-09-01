import { useEffect, useState, useRef } from 'react';

interface QuizTimerProps {
  expiresAtMs: number;
  serverTimeMs?: number;
  roundId: number;
  onExpire?: () => void;
}

/**
 * REST 기반 타이머 (시간 스큐 보정 포함)
 */
export function QuizTimerREST({ expiresAtMs, serverTimeMs, roundId, onExpire }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [skew, setSkew] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 서버 시간 스큐 계산
  useEffect(() => {
    console.log('[TIMER] Init props - expiresAtMs:', expiresAtMs, 'serverTimeMs:', serverTimeMs, 'roundId:', roundId);
    if (serverTimeMs) {
      const calculatedSkew = Date.now() - serverTimeMs;
      setSkew(calculatedSkew);
      console.log('[TIMER] Time skew detected:', Math.floor(calculatedSkew / 1000), 'seconds');
    } else {
      console.log('[TIMER] No server time provided, using local time');
    }
  }, [serverTimeMs, expiresAtMs, roundId]);
  
  // 타이머 업데이트
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now() - skew;
      const remaining = Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
      
      console.log('[TIMER] Update - now:', now, 'expiresAt:', expiresAtMs, 'remaining:', remaining, 'skew:', skew);
      
      setTimeLeft(remaining);
      
      if (remaining === 0 && onExpire) {
        console.log('[TIMER] Expired, calling onExpire');
        onExpire();
      }
    };
    
    // 초기 업데이트
    updateTimer();
    
    // 1초마다 업데이트
    intervalRef.current = setInterval(updateTimer, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [expiresAtMs, skew, roundId, onExpire]);
  
  // 타이머 색상 결정
  const getTimerColor = () => {
    if (timeLeft <= 5) return 'text-red-600';
    if (timeLeft <= 10) return 'text-orange-500';
    return 'text-gray-800';
  };
  
  // 타이머 배경색 결정
  const getTimerBgColor = () => {
    if (timeLeft <= 5) return 'bg-red-50';
    if (timeLeft <= 10) return 'bg-orange-50';
    return 'bg-gray-50';
  };
  
  // 진행 바 퍼센트 계산
  const progressPercent = (timeLeft / 30) * 100;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-800">남은 시간</h3>
        <div className={`px-3 py-1 rounded-full ${getTimerBgColor()}`}>
          <span className={`text-2xl font-bold ${getTimerColor()}`}>
            {timeLeft}초
          </span>
        </div>
      </div>
      
      {/* 진행 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* 경고 메시지 */}
      {timeLeft <= 5 && timeLeft > 0 && (
        <p className="text-red-600 text-sm mt-2 text-center animate-pulse">
          서둘러 답변을 선택하세요!
        </p>
      )}
    </div>
  );
}