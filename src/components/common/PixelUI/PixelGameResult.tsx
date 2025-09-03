import React from 'react';
import { PixelCard } from './PixelCard';
import { PixelButton } from './PixelButton';

interface GameResultItem {
  rank: number;
  userUid: string;
  displayName?: string;
  deltaMs?: number;
  score?: number;
  falseStart?: boolean;
  isCurrentUser?: boolean;
}

interface PixelGameResultProps {
  title: string;
  results: GameResultItem[];
  winnerUid?: string;
  loserUid?: string;
  penalty?: {
    code: string;
    text: string;
  };
  gameType: 'REACTION' | 'QUIZ';
  onPlayAgain?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export const PixelGameResult: React.FC<PixelGameResultProps> = ({
  title,
  results,
  winnerUid,
  loserUid,
  penalty,
  gameType,
  onPlayAgain,
  onGoHome,
  className = ''
}) => {
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getGameTypeIcon = () => {
    return gameType === 'REACTION' ? '⚡' : '🧠';
  };

  const formatTime = (deltaMs?: number) => {
    if (deltaMs === undefined || deltaMs === null) return 'N/A';
    return `${deltaMs}ms`;
  };

  const formatScore = (score?: number) => {
    if (score === undefined || score === null) return 'N/A';
    return `${score}점`;
  };

  return (
    <div className={`pixel-game-result ${className}`}>
      {/* 헤더 */}
      <PixelCard variant="header" className="result-header">
        <div style={{
          textAlign: 'center',
          padding: '1rem'
        }}>
          <h1 style={{
            fontSize: '2rem',
            margin: '0 0 0.5rem 0',
            color: '#2d3748',
            fontFamily: '"Courier New", monospace',
            fontWeight: 'bold'
          }}>
            {getGameTypeIcon()} {title}
          </h1>
          <p style={{
            margin: 0,
            fontSize: '1rem',
            color: '#4a5568',
            opacity: 0.8
          }}>
            게임 결과
          </p>
        </div>
      </PixelCard>

      {/* 우승자/패자 정보 */}
      {(winnerUid || loserUid) && (
        <PixelCard variant="success" className="winner-info" style={{marginTop: '1rem'}}>
          <div style={{
            textAlign: 'center',
            padding: '1.5rem'
          }}>
            {winnerUid && (
              <div style={{marginBottom: '1rem'}}>
                <h3 style={{
                  fontSize: '1.3rem',
                  margin: '0 0 0.5rem 0',
                  color: '#2d3748'
                }}>
                  🏆 우승자
                </h3>
                <p style={{
                  fontSize: '1.1rem',
                  margin: 0,
                  fontWeight: 'bold',
                  color: '#2d3748'
                }}>
                  {winnerUid}
                </p>
              </div>
            )}
            
            {loserUid && penalty && (
              <div>
                <h3 style={{
                  fontSize: '1.1rem',
                  margin: '0 0 0.5rem 0',
                  color: '#e53e3e'
                }}>
                  😅 벌칙 대상
                </h3>
                <p style={{
                  fontSize: '1rem',
                  margin: '0 0 0.5rem 0',
                  fontWeight: 'bold',
                  color: '#2d3748'
                }}>
                  {loserUid}
                </p>
                <div style={{
                  background: 'rgba(229, 62, 62, 0.1)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#c53030'
                }}>
                  {penalty.text}
                </div>
              </div>
            )}
          </div>
        </PixelCard>
      )}

      {/* 랭킹 리스트 */}
      <PixelCard variant="default" className="ranking-list" style={{marginTop: '1rem'}}>
        <div style={{padding: '1rem'}}>
          <h3 style={{
            fontSize: '1.2rem',
            margin: '0 0 1rem 0',
            textAlign: 'center',
            color: '#2d3748',
            fontFamily: '"Courier New", monospace'
          }}>
            📊 순위표
          </h3>
          
          <div className="ranking-items">
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: result.isCurrentUser 
                    ? 'rgba(102, 126, 234, 0.2)' 
                    : result.falseStart 
                      ? 'rgba(229, 62, 62, 0.1)'
                      : 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '8px',
                  border: result.isCurrentUser 
                    ? '2px solid rgba(102, 126, 234, 0.4)' 
                    : result.falseStart
                      ? '2px solid rgba(229, 62, 62, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '1.5rem',
                  marginRight: '1rem',
                  minWidth: '2rem'
                }}>
                  {getRankEmoji(result.rank)}
                </div>
                
                <div style={{flex: 1}}>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: result.isCurrentUser ? '#2b6cb0' : '#2d3748',
                    marginBottom: '0.2rem'
                  }}>
                    {result.displayName || result.userUid}
                    {result.isCurrentUser && ' (나)'}
                  </div>
                  
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#4a5568',
                    display: 'flex',
                    gap: '1rem'
                  }}>
                    {gameType === 'REACTION' && (
                      <>
                        <span>⏱️ {formatTime(result.deltaMs)}</span>
                        {result.falseStart && (
                          <span style={{color: '#e53e3e'}}>❌ 부정출발</span>
                        )}
                      </>
                    )}
                    {gameType === 'QUIZ' && (
                      <span>📝 {formatScore(result.score)}</span>
                    )}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: result.rank <= 3 ? '#d69e2e' : '#4a5568',
                  minWidth: '2rem',
                  textAlign: 'center'
                }}>
                  #{result.rank}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PixelCard>

      {/* 액션 버튼들 */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem',
        justifyContent: 'center'
      }}>
        {onPlayAgain && (
          <PixelButton
            variant="game"
            size="large"
            onClick={onPlayAgain}
          >
            🎮 다시 플레이
          </PixelButton>
        )}
        
        {onGoHome && (
          <PixelButton
            variant="primary"
            size="large"
            onClick={onGoHome}
          >
            🏠 홈으로
          </PixelButton>
        )}
      </div>
    </div>
  );
};

export default PixelGameResult;