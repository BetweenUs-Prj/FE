import React, { useState, useEffect } from 'react';
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

// Backend data transformation utilities
const transformBackendToFrontend = (backendMeeting: any): Meeting => ({
  id: backendMeeting.meetingId,
  title: backendMeeting.title,
  date: backendMeeting.scheduledAt?.split('T')[0] || new Date().toISOString().split('T')[0],
  time: backendMeeting.scheduledAt?.split('T')[1]?.substring(0, 5) || '00:00',
  location: backendMeeting.place?.placeName || '장소 미정',
  description: backendMeeting.memo || '',
  status: mapBackendStatus(backendMeeting.status),
  participants: backendMeeting.participants?.map((p: any) => p.name || `User ${p.userId}`) || [],
  category: inferCategoryFromLocation(backendMeeting.place?.placeName) || '모임'
});

const mapBackendStatus = (backendStatus: string): Meeting['status'] => {
  switch (backendStatus) {
    case 'SCHEDULED': return 'upcoming';
    case 'CANCELLED': return 'cancelled';
    case 'COMPLETED': return 'completed';
    default: return 'upcoming';
  }
};

const inferCategoryFromLocation = (location?: string): string => {
  if (!location) return '모임';
  const loc = location.toLowerCase();
  if (loc.includes('카페') || loc.includes('coffee')) return '커피';
  if (loc.includes('식당') || loc.includes('맛집') || loc.includes('restaurant')) return '식사';
  if (loc.includes('술') || loc.includes('bar') || loc.includes('pub')) return '술';
  if (loc.includes('영화') || loc.includes('cinema')) return '문화';
  return '모임';
};

const MeetingModal: React.FC<MeetingModalProps> = ({ isVisible, onClose }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Fetch meetings from backend
  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/meetings', {
        headers: {
          'X-User-ID': '1' // TODO: Get from auth context
        }
      });

      if (response.ok) {
        const backendMeetings = await response.json();
        const transformedMeetings = backendMeetings.map(transformBackendToFrontend);
        setMeetings(transformedMeetings);
      } else {
        console.error('약속 목록 조회 실패:', response.statusText);
        showToast('약속 목록을 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('약속 목록 조회 중 오류:', error);
      showToast('약속 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load meetings when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      fetchMeetings();
    }
  }, [isVisible]);

  const handleAddMeeting = async () => {
    // TODO: Implement meeting creation form
    // For now, create a sample meeting to test API connection
    const sampleMeeting = {
      title: '새로운 만남',
      placeId: 1,
      placeName: '만남 장소',
      placeAddress: '서울특별시 강남구',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      maxParticipants: 10,
      memo: '새로운 만남입니다',
      participantUserIds: []
    };

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': '1' // TODO: Get from auth context
        },
        body: JSON.stringify(sampleMeeting)
      });

      if (response.ok) {
        const newMeeting = await response.json();
        // Transform backend format to frontend format
        const frontendMeeting: Meeting = {
          id: newMeeting.meetingId,
          title: newMeeting.title,
          date: newMeeting.scheduledAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          time: newMeeting.scheduledAt?.split('T')[1]?.substring(0, 5) || '00:00',
          location: newMeeting.place?.placeName || '장소 미정',
          description: newMeeting.memo || '',
          status: newMeeting.status === 'SCHEDULED' ? 'upcoming' : 'upcoming',
          participants: newMeeting.participants?.map((p: any) => p.name) || [],
          category: '모임'
        };
        
        // Refresh the meetings list instead of manually adding
        await fetchMeetings();
        showToast('만남이 생성되었습니다!', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(`만남 생성에 실패했습니다: ${errorData.message || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('만남 생성 중 오류:', error);
      showToast('만남 생성 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleRemoveMeeting = async (id: number) => {
    try {
      const response = await fetch(`/api/meetings/${id}/cancel`, {
        method: 'POST',
        headers: {
          'X-User-ID': '1' // TODO: Get from auth context
        }
      });

      if (response.ok) {
        // Refresh the meetings list instead of manually removing
        await fetchMeetings();
        showToast('만남이 취소되었습니다.', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(`만남 취소에 실패했습니다: ${errorData.message || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('만남 취소 중 오류:', error);
      showToast('만남 취소 중 오류가 발생했습니다.', 'error');
    }
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
              {isLoading ? (
                <div className={styles.loadingState}>
                  <div className={styles.loadingIcon}>⏳</div>
                  <p>약속 목록을 불러오는 중...</p>
                </div>
              ) : meetings.map(meeting => (
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

            {!isLoading && meetings.length === 0 && (
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
