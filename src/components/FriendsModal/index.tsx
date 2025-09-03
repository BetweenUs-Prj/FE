import React, { useState } from 'react';
import styles from './FriendsModal.module.css';
import Toast from '../Toast';

interface Friend {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'online' | 'offline' | 'busy';
}

interface FriendRequest {
  id: number;
  name: string;
  email: string;
  message?: string;
  timestamp: string;
}

interface SentRequest {
  id: number;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

interface FriendsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const FriendsModal: React.FC<FriendsModalProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent'>('friends');
  
  const [friends, setFriends] = useState<Friend[]>([
    { id: 1, name: '김철수', email: 'kim@example.com', phone: '010-1234-5678', status: 'online' },
    { id: 2, name: '이영희', email: 'lee@example.com', phone: '010-2345-6789', status: 'offline' },
    { id: 3, name: '박민수', email: 'park@example.com', phone: '010-3456-7890', status: 'busy' },
  ]);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    { id: 1, name: '최지영', email: 'choi@example.com', message: '안녕하세요! 친구가 되고 싶어요.', timestamp: '2024-01-15 14:30' },
    { id: 2, name: '정민호', email: 'jung@example.com', timestamp: '2024-01-14 09:15' },
  ]);

  const [sentRequests, setSentRequests] = useState<SentRequest[]>([
    { id: 1, name: '한소희', email: 'han@example.com', status: 'pending', timestamp: '2024-01-13 16:45' },
    { id: 2, name: '윤태현', email: 'yoon@example.com', status: 'pending', timestamp: '2024-01-12 11:20' },
    { id: 3, name: '송미라', email: 'song@example.com', status: 'pending', timestamp: '2024-01-11 13:10' },
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

  const handleAddFriend = () => {
    showToast('친구 추가 기능이 곧 추가될 예정입니다!', 'info');
  };

  const handleRemoveFriend = (id: number) => {
    setFriends(prev => prev.filter(friend => friend.id !== id));
    showToast('친구가 삭제되었습니다.', 'success');
  };

  const handleAcceptRequest = (id: number) => {
    const request = friendRequests.find(req => req.id === id);
    if (request) {
      // 친구 목록에 추가
      const newFriend: Friend = {
        id: Date.now(),
        name: request.name,
        email: request.email,
        phone: '010-0000-0000',
        status: 'offline'
      };
      setFriends(prev => [...prev, newFriend]);
      
      // 요청 목록에서 제거
      setFriendRequests(prev => prev.filter(req => req.id !== id));
      showToast('친구 요청을 수락했습니다.', 'success');
    }
  };

  const handleRejectRequest = (id: number) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
    showToast('친구 요청을 거절했습니다.', 'info');
  };

  const handleCancelSentRequest = (id: number) => {
    setSentRequests(prev => prev.filter(req => req.id !== id));
    showToast('보낸 친구 요청을 취소했습니다.', 'info');
  };

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'offline': return '#9E9E9E';
      case 'busy': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: Friend['status']) => {
    switch (status) {
      case 'online': return '온라인';
      case 'offline': return '오프라인';
      case 'busy': return '바쁨';
      default: return '오프라인';
    }
  };

  const getRequestStatusColor = (status: SentRequest['status']) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getRequestStatusText = (status: SentRequest['status']) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'accepted': return '수락됨';
      case 'rejected': return '거절됨';
      default: return '대기중';
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>친구 관리</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>

          <div className={styles.tabContainer}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'friends' ? styles.active : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              친구목록 ({friends.length})
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'requests' ? styles.active : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              친구 수락 ({friendRequests.length})
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'sent' ? styles.active : ''}`}
              onClick={() => setActiveTab('sent')}
            >
              보낸요청 ({sentRequests.length})
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === 'friends' && (
              <div className={styles.tabContent}>
                <div className={styles.friendsList}>
                  {friends.map(friend => (
                    <div key={friend.id} className={styles.friendCard}>
                      <div className={styles.friendInfo}>
                        <div className={styles.avatar}>
                          {friend.name.charAt(0)}
                        </div>
                        <div className={styles.details}>
                          <h3 className={styles.friendName}>{friend.name}</h3>
                          <p className={styles.friendEmail}>{friend.email}</p>
                          <p className={styles.friendPhone}>{friend.phone}</p>
                        </div>
                        <div className={styles.status}>
                          <span 
                            className={styles.statusDot}
                            style={{ backgroundColor: getStatusColor(friend.status) }}
                          ></span>
                          <span className={styles.statusText}>{getStatusText(friend.status)}</span>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button 
                          className={styles.removeButton}
                          onClick={() => handleRemoveFriend(friend.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {friends.length === 0 && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>👥</div>
                    <h3>친구가 없습니다</h3>
                    <p>친구를 추가해보세요!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className={styles.tabContent}>
                <div className={styles.requestsList}>
                  {friendRequests.map(request => (
                    <div key={request.id} className={styles.requestCard}>
                      <div className={styles.requestInfo}>
                        <div className={styles.avatar}>
                          {request.name.charAt(0)}
                        </div>
                        <div className={styles.details}>
                          <h3 className={styles.requestName}>{request.name}</h3>
                          <p className={styles.requestEmail}>{request.email}</p>
                          {request.message && (
                            <p className={styles.requestMessage}>{request.message}</p>
                          )}
                          <p className={styles.requestTime}>{request.timestamp}</p>
                        </div>
                      </div>
                      <div className={styles.requestActions}>
                        <button 
                          className={styles.acceptButton}
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          수락
                        </button>
                        <button 
                          className={styles.rejectButton}
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {friendRequests.length === 0 && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📨</div>
                    <h3>받은 친구 요청이 없습니다</h3>
                    <p>새로운 친구 요청을 기다려보세요!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sent' && (
              <div className={styles.tabContent}>
                <div className={styles.sentRequestsList}>
                  {sentRequests.map(request => (
                    <div key={request.id} className={styles.sentRequestCard}>
                      <div className={styles.requestInfo}>
                        <div className={styles.avatar}>
                          {request.name.charAt(0)}
                        </div>
                        <div className={styles.details}>
                          <h3 className={styles.requestName}>{request.name}</h3>
                          <p className={styles.requestEmail}>{request.email}</p>
                          <p className={styles.requestTime}>{request.timestamp}</p>
                        </div>
                      </div>
                      <div className={styles.requestActions}>
                        <button 
                          className={styles.cancelButton}
                          onClick={() => handleCancelSentRequest(request.id)}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {sentRequests.length === 0 && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📤</div>
                    <h3>보낸 친구 요청이 없습니다</h3>
                    <p>친구에게 요청을 보내보세요!</p>
                  </div>
                )}
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

export default FriendsModal;
