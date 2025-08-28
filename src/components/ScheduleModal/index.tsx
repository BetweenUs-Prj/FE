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
}

interface ScheduleModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isVisible, onClose }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: 1,
      title: '친구들과 점심 약속',
      date: '2024-01-15',
      time: '12:00',
      location: '강남역 스타벅스',
      description: '친구들과 점심 먹으면서 이야기하기',
      type: 'social',
      participants: ['김철수', '이영희', '박민수']
    },
    {
      id: 2,
      title: '회의',
      date: '2024-01-16',
      time: '14:00',
      location: '회사',
      description: '프로젝트 진행상황 회의',
      type: 'work',
      participants: ['팀원들']
    },
    {
      id: 3,
      title: '운동',
      date: '2024-01-17',
      time: '18:00',
      location: '헬스장',
      description: '유산소 운동 30분',
      type: 'personal',
      participants: []
    }
  ]);

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

  const handleAddSchedule = () => {
    showToast('일정 추가 기능이 곧 추가될 예정입니다!', 'info');
  };

  const handleRemoveSchedule = (id: number) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
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
            <div className={styles.addSection}>
              <button className={styles.addButton} onClick={handleAddSchedule}>
                + 일정 추가
              </button>
            </div>

            <div className={styles.scheduleList}>
              {schedules.map(schedule => (
                <div key={schedule.id} className={styles.scheduleCard}>
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
                    <button 
                      className={styles.removeButton}
                      onClick={() => handleRemoveSchedule(schedule.id)}
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
