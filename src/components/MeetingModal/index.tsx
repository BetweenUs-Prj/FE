import React, { useState } from 'react';
import styles from './MeetingModal.module.css';
import Toast from '../Toast';

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  participants: string[];
  category: string;
}

interface MeetingModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const MeetingModal: React.FC<MeetingModalProps> = ({ isVisible, onClose }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: 1,
      title: '친구들과 저녁 약속',
      date: '2024-01-20',
      time: '19:00',
      location: '강남역 맛집',
      description: '친구들과 저녁 먹으면서 수다 떨기',
      status: 'upcoming',
      participants: ['김철수', '이영희', '박민수'],
      category: '식사'
    },
    {
      id: 2,
      title: '동창회',
      date: '2024-01-25',
      time: '18:30',
      location: '홍대역 카페',
      description: '고등학교 동창들과 만나기',
      status: 'upcoming',
      participants: ['동창들'],
      category: '모임'
    },
    {
      id: 3,
      title: '영화 관람',
      date: '2024-01-18',
      time: '20:00',
      location: 'CGV 강남점',
      description: '새로 나온 영화 보기',
      status: 'completed',
      participants: ['연인'],
      category: '문화'
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

  const handleAddMeeting = () => {
    showToast('만남 추가 기능이 곧 추가될 예정입니다!', 'info');
  };

  const handleRemoveMeeting = (id: number) => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== id));
    showToast('만남이 삭제되었습니다.', 'success');
  };

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'upcoming': return '#2196F3';
      case 'ongoing': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: Meeting['status']) => {
    switch (status) {
      case 'upcoming': return '예정';
      case 'ongoing': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return '알 수 없음';
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
            <h2 className={styles.title}>만남 관리</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.addSection}>
              <button className={styles.addButton} onClick={handleAddMeeting}>
                + 만남 추가
              </button>
            </div>

            <div className={styles.meetingList}>
              {meetings.map(meeting => (
                <div key={meeting.id} className={styles.meetingCard}>
                  <div className={styles.meetingHeader}>
                    <div className={styles.meetingInfo}>
                      <h3 className={styles.meetingTitle}>{meeting.title}</h3>
                      <div className={styles.meetingMeta}>
                        <span className={styles.date}>{formatDate(meeting.date)}</span>
                        <span className={styles.time}>{meeting.time}</span>
                        <span className={styles.category}>{meeting.category}</span>
                        <span 
                          className={styles.status}
                          style={{ backgroundColor: getStatusColor(meeting.status) }}
                        >
                          {getStatusText(meeting.status)}
                        </span>
                      </div>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={() => handleRemoveMeeting(meeting.id)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className={styles.meetingDetails}>
                    <div className={styles.location}>
                      <span className={styles.icon}>📍</span>
                      <span>{meeting.location}</span>
                    </div>
                    <div className={styles.description}>
                      <span className={styles.icon}>📝</span>
                      <span>{meeting.description}</span>
                    </div>
                    {meeting.participants.length > 0 && (
                      <div className={styles.participants}>
                        <span className={styles.icon}>👥</span>
                        <span>{meeting.participants.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {meetings.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🤝</div>
                <h3>만남이 없습니다</h3>
                <p>새로운 만남을 추가해보세요!</p>
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

export default MeetingModal;
