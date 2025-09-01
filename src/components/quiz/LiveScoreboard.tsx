import { motion, Reorder } from "framer-motion";
import { useState, useEffect } from "react";
import { ThemeCard } from "../common";

export interface ScoreboardItem {
  userUid: string;
  displayName: string;
  score: number;
  rank: number;
  totalResponseTime?: number; // 총 응답 시간 (ms)
}

interface LiveScoreboardProps {
  items: ScoreboardItem[]; // QuizPage.tsx에서 items prop으로 전달
}

export function LiveScoreboard({ items }: LiveScoreboardProps) {
  const [sortedScores, setSortedScores] = useState<ScoreboardItem[]>([]);
  const [prevRanks, setPrevRanks] = useState<string[]>([]);

  // 점수에 따라 정렬하고 순위 변동 계산 (점수가 같으면 응답시간으로 정렬)
  useEffect(() => {
    console.log('[LiveScoreboard] Received items:', items);
    
    if (!items || !Array.isArray(items)) {
      console.log('[LiveScoreboard] No valid items, clearing scores');
      setSortedScores([]);
      return;
    }
    
    // 점수로 1차 정렬, 점수가 같으면 응답시간으로 2차 정렬 (응답시간이 적은 순)
    const newSorted = [...items].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // 점수가 높은 순
      }
      // 점수가 같으면 응답시간이 적은 순 (totalResponseTime이 undefined인 경우 최대값으로 처리)
      const aTime = a.totalResponseTime ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.totalResponseTime ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
    
    const newRanks = newSorted.map(s => s.userUid);
    
    console.log('[LiveScoreboard] Sorted scores:', newSorted);
    console.log('[LiveScoreboard] New ranks:', newRanks);
    console.log('[LiveScoreboard] Previous ranks:', prevRanks);
    
    setSortedScores(newSorted);
    setPrevRanks(prev => prev.length === 0 ? newRanks : prev);
  }, [items, prevRanks]);

  const getRankChange = (userUid: string, currentIndex: number) => {
    if (prevRanks.length === 0) return 0;
    
    const prevIndex = prevRanks.indexOf(userUid);
    if (prevIndex === -1) return 0;
    
    if (prevIndex > currentIndex) return 1; // 순위 상승
    if (prevIndex < currentIndex) return -1; // 순위 하락
    return 0; // 변동 없음
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return "🔺"; // 상승
    if (change < 0) return "🔻"; // 하락
    return ""; // 변동 없음
  };

  const getRankChangeColor = (change: number) => {
    if (change > 0) return "#147781"; // 프로젝트 테마 색상 (상승)
    if (change < 0) return "#F96D3C"; // 프로젝트 테마 색상 (하락)
    return "#FCB422"; // 프로젝트 테마 색상 (변동 없음)
  };

  return (
    <ThemeCard
      variant="primary"
      style={{
        position: 'sticky',
        top: '100px',
        width: '100%',
        maxWidth: '320px'
      }}
    >
      <h3 
        style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          fontWeight: '600',
          color: '#FFFFFF',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          marginBottom: '1rem',
          textAlign: 'center'
        }}
      >
        🏆 실시간 순위
      </h3>
      
      <Reorder.Group 
        as="div" 
        axis="y" 
        values={sortedScores} 
        onReorder={() => {}} // 사용자 드래그는 비활성화
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        {sortedScores.map((item, index) => {
          const rankChange = getRankChange(item.userUid, index);
          
          return (
            <motion.div
              key={item.userUid}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'clamp(0.6rem, 1.5vw, 0.8rem)',
                borderRadius: '0.5rem',
                background: index === 0 
                  ? 'linear-gradient(135deg, #FCB422 0%, #F97B25 100%)'
                  : index === 1
                  ? 'linear-gradient(135deg, #F96D3C 0%, #F97B25 100%)'
                  : index === 2
                  ? 'linear-gradient(135deg, #147781 0%, #1E9AA8 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: index === 0 
                  ? '1px solid rgba(252, 180, 34, 0.4)'
                  : index === 1
                  ? '1px solid rgba(249, 109, 60, 0.4)'
                  : index === 2
                  ? '1px solid rgba(20, 119, 129, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                <span style={{
                  width: 'clamp(1.2rem, 3vw, 1.5rem)',
                  height: 'clamp(1.2rem, 3vw, 1.5rem)',
                  borderRadius: '50%',
                  background: index === 0 
                    ? 'linear-gradient(135deg, #FCB422, #F97B25)'
                    : index === 1
                    ? 'linear-gradient(135deg, #F96D3C, #F97B25)'
                    : index === 2
                    ? 'linear-gradient(135deg, #147781, #1E9AA8)'
                    : 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                  fontWeight: '600',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  flexShrink: 0
                }}>
                  {index + 1}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, minWidth: 0 }}>
                  <span style={{ 
                    fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.displayName}
                  </span>
                  {rankChange !== 0 && (
                    <span style={{
                      fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)',
                      color: getRankChangeColor(rankChange),
                      fontWeight: '500'
                    }}>
                      {getRankChangeIcon(rankChange)} {Math.abs(rankChange)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ 
                textAlign: 'right',
                flexShrink: 0,
                marginLeft: '0.5rem'
              }}>
                <span style={{ 
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                  fontWeight: '700',
                  display: 'block'
                }}>
                  {item.score}점
                </span>
                {item.totalResponseTime && (
                  <span style={{
                    fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: '500'
                  }}>
                    {Math.round(item.totalResponseTime / 1000)}초
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </Reorder.Group>
      
      {sortedScores.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          color: '#FFFFFF',
          opacity: 0.7
        }}>
          <p style={{
            fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
            margin: 0
          }}>
            순위 정보를 불러오는 중...
          </p>
        </div>
      )}
    </ThemeCard>
  );
}