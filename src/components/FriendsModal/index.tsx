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

interface FriendsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const FriendsModal: React.FC<FriendsModalProps> = ({ isVisible, onClose }) => {
  const [friends, setFriends] = useState<Friend[]>([
    { id: 1, name: '김철수', email: 'kim@example.com', phone: '010-1234-5678', status: 'online' },
    { id: 2, name: '이영희', email: 'lee@example.com', phone: '010-2345-6789', status: 'offline' },
    { id: 3, name: '박민수', email: 'park@example.com', phone: '010-3456-7890', status: 'busy' },
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

          <div className={styles.content}>
            <div className={styles.addSection}>
              <button className={styles.addButton} onClick={handleAddFriend}>
                + 친구 추가
              </button>
            </div>

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
