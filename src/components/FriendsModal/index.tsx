import React, { useState, useEffect } from 'react';
import styles from './FriendsModal.module.css';
import Toast from '../Toast';
import AddFriendModal from '../AddFriendModal';
import {
  getFriendsList,
  getReceivedFriendRequests,
  getSentFriendRequests,
  getPendingRequestCount,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  deleteFriend
} from '@/services/friendService';
import type {
  Friend,
  FriendRequest,
  SentFriendRequest
} from '@/types/friend.ts';

interface FriendsModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentUserId?: number;
}

const FriendsModal: React.FC<FriendsModalProps> = ({ isVisible, onClose, currentUserId = 1 }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent'>('friends');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

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

  // 데이터 로드 함수
  const loadFriendsData = async () => {
    setIsLoading(true);
    try {
      const [friendsRes, requestsRes, sentRes, countRes] = await Promise.all([
        getFriendsList(),
        getReceivedFriendRequests(),
        getSentFriendRequests(),
        getPendingRequestCount()
      ]);

      if (friendsRes.success) {
        setFriends(friendsRes.data);
      }
      if (requestsRes.success) {
        setFriendRequests(requestsRes.data);
      }
      if (sentRes.success) {
        setSentRequests(sentRes.data);
      }
      if (countRes.success) {
        setPendingCount(countRes.data.count);
      }
    } catch (error) {
      console.error('친구 데이터 로드 오류:', error);
      showToast('친구 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isVisible) {
      loadFriendsData();
    }
  }, [isVisible]);

  const handleAddFriend = () => {
    setShowAddFriendModal(true);
  };

  const handleFriendAdded = () => {
    loadFriendsData(); // 데이터 새로고침
  };

  const handleRemoveFriend = async (id: number) => {
    try {
      const response = await deleteFriend(id);
      if (response.success) {
        setFriends(prev => prev.filter(friend => friend.id !== id));
        showToast('친구가 삭제되었습니다.', 'success');
      } else {
        showToast(response.message || '친구 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('친구 삭제 오류:', error);
      showToast('친구 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleAcceptRequest = async (id: number) => {
    try {
      const response = await acceptFriendRequest(id);
      if (response.success) {
        // 요청 목록에서 제거
        setFriendRequests(prev => prev.filter(req => req.id !== id));
        // 친구 목록 새로고침
        loadFriendsData();
        showToast('친구 요청을 수락했습니다.', 'success');
      } else {
        showToast(response.message || '친구 요청 수락에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('친구 요청 수락 오류:', error);
      showToast('친구 요청 수락 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleRejectRequest = async (id: number) => {
    try {
      const response = await rejectFriendRequest(id);
      if (response.success) {
        setFriendRequests(prev => prev.filter(req => req.id !== id));
        showToast('친구 요청을 거절했습니다.', 'info');
      } else {
        showToast(response.message || '친구 요청 거절에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('친구 요청 거절 오류:', error);
      showToast('친구 요청 거절 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleCancelSentRequest = async (id: number) => {
    try {
      const response = await cancelFriendRequest(id);
      if (response.success) {
        setSentRequests(prev => prev.filter(req => req.id !== id));
        showToast('보낸 친구 요청을 취소했습니다.', 'info');
      } else {
        showToast(response.message || '친구 요청 취소에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('친구 요청 취소 오류:', error);
      showToast('친구 요청 취소 중 오류가 발생했습니다.', 'error');
    }
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

  const getRequestStatusText = (status: SentFriendRequest['status']) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'accepted': return '수락됨';
      case 'rejected': return '거절됨';
      case 'cancelled': return '취소됨';
      default: return '대기중';
    }
  };

  const getRequestStatusColor = (status: SentFriendRequest['status']) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'cancelled': return '#9E9E9E';
      default: return '#9E9E9E';
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
              {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
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
                <div className={styles.addFriendSection}>
                  <button 
                    className={styles.addFriendButton}
                    onClick={handleAddFriend}
                  >
                    + 친구 추가
                  </button>
                </div>
                
                {isLoading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>친구 목록을 불러오는 중...</p>
                  </div>
                ) : (
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
                            {friend.phone && <p className={styles.friendPhone}>{friend.phone}</p>}
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

                    {friends.length === 0 && (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👥</div>
                        <h3>친구가 없습니다</h3>
                        <p>친구를 추가해보세요!</p>
                      </div>
                    )}
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
                          {request.sender.name.charAt(0)}
                        </div>
                        <div className={styles.details}>
                          <h3 className={styles.requestName}>{request.sender.name}</h3>
                          <p className={styles.requestEmail}>{request.sender.email}</p>
                          {request.message && (
                            <p className={styles.requestMessage}>{request.message}</p>
                          )}
                          <p className={styles.requestTime}>
                            {new Date(request.createdAt).toLocaleString('ko-KR')}
                          </p>
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
                          {request.receiver.name.charAt(0)}
                        </div>
                        <div className={styles.details}>
                          <h3 className={styles.requestName}>{request.receiver.name}</h3>
                          <p className={styles.requestEmail}>{request.receiver.email}</p>
                          <p className={styles.requestTime}>
                            {new Date(request.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <div className={styles.requestActions}>
                        <div className={styles.requestStatus}>
                          <span 
                            className={styles.statusBadge}
                            style={{ backgroundColor: getRequestStatusColor(request.status) }}
                          >
                            {getRequestStatusText(request.status)}
                          </span>
                        </div>
                        {request.status === 'pending' && (
                          <button 
                            className={styles.cancelButton}
                            onClick={() => handleCancelSentRequest(request.id)}
                          >
                            취소
                          </button>
                        )}
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

      <AddFriendModal
        isVisible={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onFriendAdded={handleFriendAdded}
        existingFriends={friends}
        sentRequests={sentRequests}
        receivedRequests={friendRequests}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default FriendsModal;
