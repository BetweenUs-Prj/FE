import React, { useState } from 'react';
import styles from './ScheduleModal.module.css';
import Toast from '../Toast';

interface Schedule {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: 'meeting' | 'personal' | 'work' | 'social';
  participants: string[];
  placeInfo?: {
    title: string;
    category: string;
    description?: string;
  };
  stationName?: string;
  routes?: any[];
}

interface ScheduleModalProps {
  isVisible: boolean;
  onClose: () => void;
  schedules?: Schedule[];
  onAddSchedule?: (schedule: Schedule) => void;
  onRemoveSchedule?: (id: number) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ 
  isVisible, 
  onClose, 
  schedules: propSchedules = [],
  onAddSchedule,
  onRemoveSchedule
}) => {
  // props로 받은 schedules를 직접 사용
  const schedules = propSchedules;
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
  // 게임 레디 상태 관리 (scheduleId -> gameType -> readyCount)
  const [gameReadyStates, setGameReadyStates] = useState<{
    [scheduleId: number]: {
      quiz: number;
      reaction: number;
    };
  }>({});

  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };



  const handleRemoveSchedule = (id: number) => {
    if (onRemoveSchedule) {
      onRemoveSchedule(id);
    }
    showToast('일정이 삭제되었습니다.', 'success');
  };

  const getTypeColor = (type: Schedule['type']) => {
    switch (type) {
      case 'meeting': return '#2196F3';
      case 'personal': return '#4CAF50';
      case 'work': return '#FF9800';
      case 'social': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getTypeText = (type: Schedule['type']) => {
    switch (type) {
      case 'meeting': return '회의';
      case 'personal': return '개인';
      case 'work': return '업무';
      case 'social': return '모임';
      default: return '기타';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatDetailedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const handleScheduleCardClick = (schedule: Schedule) => {
    // 이미 선택된 일정을 다시 클릭하면 접기
    if (selectedSchedule && selectedSchedule.id === schedule.id) {
      setSelectedSchedule(null);
    } else {
      setSelectedSchedule(schedule);
    }
  };

  const handleGameButtonClick = (scheduleId: number, gameType: 'quiz' | 'reaction') => {
    setGameReadyStates(prev => {
      const currentState = prev[scheduleId] || { quiz: 0, reaction: 0 };
      const currentCount = currentState[gameType];
      
      // 현재 레디 상태라면 취소, 아니면 레디
      const newCount = currentCount > 0 ? 0 : 1;
      
      return {
        ...prev,
        [scheduleId]: {
          ...currentState,
          [gameType]: newCount
        }
      };
    });
  };

  const getGameReadyCount = (scheduleId: number, gameType: 'quiz' | 'reaction') => {
    return gameReadyStates[scheduleId]?.[gameType] || 0;
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>일정 관리</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>

          <div className={styles.content}>

            <div className={styles.scheduleList}>
              {schedules.map(schedule => (
                <div 
                  key={schedule.id} 
                  className={`${styles.scheduleCard} ${selectedSchedule && selectedSchedule.id === schedule.id ? styles.expanded : ''}`}
                  onClick={() => handleScheduleCardClick(schedule)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.scheduleHeader}>
                    <div className={styles.scheduleInfo}>
                      <h3 className={styles.scheduleTitle}>{schedule.title}</h3>
                      <div className={styles.scheduleMeta}>
                        <span className={styles.date}>{formatDate(schedule.date)}</span>
                        <span className={styles.time}>{schedule.time}</span>
                        <span 
                          className={styles.type}
                          style={{ backgroundColor: getTypeColor(schedule.type) }}
                        >
                          {getTypeText(schedule.type)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.gameButtons}>
                      {/* 퀴즈 게임 버튼 */}
                      <div className={styles.gameButton}>
                        <button 
                          className={`${styles.gameButtonMain} ${getGameReadyCount(schedule.id, 'quiz') > 0 ? styles.ready : ''}`}
                          onClick={(e) => {
                            e.stopPropagation(); // 카드 확장 방지
                            handleGameButtonClick(schedule.id, 'quiz');
                          }}
                        >
                          🧩 퀴즈
                        </button>
                        <div className={styles.gameStatus}>
                          <span className={styles.readyCount}>{getGameReadyCount(schedule.id, 'quiz')}</span>
                          <span className={styles.totalCount}>/{schedule.participants.length}</span>
                        </div>
                      </div>
                      
                      {/* 반응속도 게임 버튼 */}
                      <div className={styles.gameButton}>
                        <button 
                          className={`${styles.gameButtonMain} ${getGameReadyCount(schedule.id, 'reaction') > 0 ? styles.ready : ''}`}
                          onClick={(e) => {
                            e.stopPropagation(); // 카드 확장 방지
                            handleGameButtonClick(schedule.id, 'reaction');
                          }}
                        >
                          ⚡ 반응속도
                        </button>
                        <div className={styles.gameStatus}>
                          <span className={styles.readyCount}>{getGameReadyCount(schedule.id, 'reaction')}</span>
                          <span className={styles.totalCount}>/{schedule.participants.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className={styles.removeButton}
                      onClick={(e) => {
                        e.stopPropagation(); // 상세 정보 열기 방지
                        if (window.confirm('정말로 일정을 취소하시겠습니까?')) {
                          handleRemoveSchedule(schedule.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className={styles.scheduleDetails}>
                    <div className={styles.location}>
                      <span className={styles.icon}>📍</span>
                      <span>{schedule.location}</span>
                    </div>
                    <div className={styles.description}>
                      <span className={styles.icon}>📝</span>
                      <span>{schedule.description}</span>
                    </div>
                    {schedule.participants.length > 0 && (
                      <div className={styles.participants}>
                        <span className={styles.icon}>👥</span>
                        <span>{schedule.participants.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* 🎯 상세 정보 섹션 - 카드 내부에 표시 */}
                  {selectedSchedule && selectedSchedule.id === schedule.id && (
                    <div className={styles.detailSection}>
                      <div className={styles.detailContent}>
                        {/* 기본 정보 */}
                        <div className={styles.detailGroup}>
                          <h4>📋 기본 정보</h4>
                          <div className={styles.detailInfo}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>제목:</span>
                              <span className={styles.detailValue}>{selectedSchedule.title}</span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>날짜:</span>
                              <span className={styles.detailValue}>{formatDetailedDate(selectedSchedule.date)}</span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>시간:</span>
                              <span className={styles.detailValue}>{selectedSchedule.time}</span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>유형:</span>
                              <span className={styles.detailValue}>{getTypeText(selectedSchedule.type)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 장소 정보 */}
                        <div className={styles.detailGroup}>
                          <h4>📍 장소 정보</h4>
                          <div className={styles.detailInfo}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>위치:</span>
                              <span className={styles.detailValue}>{selectedSchedule.location}</span>
                            </div>
                            {selectedSchedule.stationName && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>만남 역:</span>
                                <span className={styles.detailValue}>{selectedSchedule.stationName}</span>
                              </div>
                            )}
                            {selectedSchedule.placeInfo && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>장소:</span>
                                <span className={styles.detailValue}>{selectedSchedule.placeInfo.title}</span>
                              </div>
                            )}
                            {selectedSchedule.placeInfo?.category && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>카테고리:</span>
                                <span className={styles.detailValue}>{selectedSchedule.placeInfo.category}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 설명 */}
                        <div className={styles.detailGroup}>
                          <h4>📝 설명</h4>
                          <div className={styles.detailDescription}>
                            {selectedSchedule.description}
                          </div>
                        </div>

                        {/* 참여자 정보 */}
                        <div className={styles.detailGroup}>
                          <h4>👥 참여자 ({selectedSchedule.participants.length}명)</h4>
                          <div className={styles.detailParticipants}>
                            {selectedSchedule.participants.map((participant, index) => (
                              <div key={index} className={styles.detailParticipant}>
                                {participant}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 교통 정보 */}
                        {selectedSchedule.routes && selectedSchedule.routes.length > 0 && (
                          <div className={styles.detailGroup}>
                            <h4>🚇 교통 정보</h4>
                            <div className={styles.detailRoutes}>
                              {selectedSchedule.routes.map((route, index) => (
                                <div key={index} className={styles.detailRoute}>
                                  <div className={styles.detailRouteHeader}>
                                    <span className={styles.detailRouteName}>{route.friendName}</span>
                                    <span className={styles.detailRouteTime}>{route.duration}분</span>
                                  </div>
                                  <div className={styles.detailRouteDetails}>
                                    <span className={styles.detailRouteDistance}>{route.distance}km</span>
                                    <span className={styles.detailRoutePath}>{route.details.join(' → ')}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {schedules.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📅</div>
                <h3>일정이 없습니다</h3>
                <p>새로운 일정을 추가해보세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
        duration={3000}
      />
    </>
  );
};

export default ScheduleModal;
