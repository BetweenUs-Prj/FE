import React from 'react';
import styles from './ScheduleDetailModal.module.css';

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

interface ScheduleDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  schedule: Schedule | null;
}

const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  isVisible,
  onClose,
  schedule
}) => {
  if (!isVisible || !schedule) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>📅 일정 상세 정보</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* 기본 정보 */}
          <div className={styles.section}>
            <h4>📋 기본 정보</h4>
            <div className={styles.basicInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>제목:</span>
                <span className={styles.value}>{schedule.title}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>날짜:</span>
                <span className={styles.value}>{formatDate(schedule.date)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>시간:</span>
                <span className={styles.value}>{schedule.time}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>유형:</span>
                <span className={styles.value}>{getTypeText(schedule.type)}</span>
              </div>
            </div>
          </div>

          {/* 장소 정보 */}
          <div className={styles.section}>
            <h4>📍 장소 정보</h4>
            <div className={styles.locationInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>위치:</span>
                <span className={styles.value}>{schedule.location}</span>
              </div>
              {schedule.stationName && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>만남 역:</span>
                  <span className={styles.value}>{schedule.stationName}</span>
                </div>
              )}
              {schedule.placeInfo && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>장소:</span>
                  <span className={styles.value}>{schedule.placeInfo.title}</span>
                </div>
              )}
              {schedule.placeInfo?.category && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>카테고리:</span>
                  <span className={styles.value}>{schedule.placeInfo.category}</span>
                </div>
              )}
            </div>
          </div>

          {/* 설명 */}
          <div className={styles.section}>
            <h4>📝 설명</h4>
            <div className={styles.description}>
              {schedule.description}
            </div>
          </div>

          {/* 참여자 정보 */}
          <div className={styles.section}>
            <h4>👥 참여자 ({schedule.participants.length}명)</h4>
            <div className={styles.participants}>
              {schedule.participants.map((participant, index) => (
                <div key={index} className={styles.participant}>
                  {participant}
                </div>
              ))}
            </div>
          </div>

          {/* 교통 정보 */}
          {schedule.routes && schedule.routes.length > 0 && (
            <div className={styles.section}>
              <h4>🚇 교통 정보</h4>
              <div className={styles.routes}>
                {schedule.routes.map((route, index) => (
                  <div key={index} className={styles.route}>
                    <div className={styles.routeHeader}>
                      <span className={styles.routeName}>{route.friendName}</span>
                      <span className={styles.routeTime}>{route.duration}분</span>
                    </div>
                    <div className={styles.routeDetails}>
                      <span className={styles.routeDistance}>{route.distance}km</span>
                      <span className={styles.routePath}>{route.details.join(' → ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailModal;
