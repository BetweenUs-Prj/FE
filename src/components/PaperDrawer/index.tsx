import React, { useState } from 'react';
import styles from './PaperDrawer.module.css';

interface Friend {
  id: number;
  name: string;
  location: string;
}

interface PaperDrawerProps {
  children?: React.ReactNode;
}

const PaperDrawer: React.FC<PaperDrawerProps> = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([
    { id: 1, name: '', location: '' },
    { id: 2, name: '', location: '' }
  ]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleFriendChange = (id: number, field: 'name' | 'location', value: string) => {
    setFriends(prev => prev.map(friend => 
      friend.id === id ? { ...friend, [field]: value } : friend
    ));
  };

  const handleAddFriend = () => {
    const newId = Math.max(...friends.map(f => f.id)) + 1;
    setFriends(prev => [...prev, { id: newId, name: '', location: '' }]);
  };

  const handleRemoveFriend = (id: number) => {
    // 친구 1번(id: 1)은 삭제할 수 없음
    if (id === 1 || id === 2) {
      return;
    }
    
    if (friends.length > 1) {
      setFriends(prev => prev.filter(friend => friend.id !== id));
    }
  };

  const handleFindMiddle = () => {
    // 중간거리 찾기 버튼 클릭 시 PaperDrawer 토글
    setIsExpanded(!isExpanded);
    console.log('중간거리 찾기 버튼 클릭됨');
    // TODO: 실제 중간거리 계산 로직 구현
  };

  return (
    <div className={`${styles.paperDrawer} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.paperDrawerContent}>
        <div className={styles.paperDrawerHeader} onClick={handleToggle}>
          <div className={styles.paperTab}>
            <div className={styles.paperTabIcon}>📅</div>
            <div className={styles.paperTabText}>우리의 어디서 만날까 ?</div>
          </div>
        </div>
        <div className={styles.paperDrawerBody}>
          <div className={styles.defaultContent}>
            <h3>서로의 위치를 적어주세요 !</h3>
            <div className={styles.friendsContainer}>
              {friends.map((friend) => (
                <div key={friend.id} className={styles.friendItem}>
                  <div className={styles.friendHeader}>
                    <div className={styles.friendLabel}>
                      {friend.id === 1 ? '나' : '친구'}
                    </div>
                    <div className={styles.inputContainer}>
                      <input
                        type="text"
                        value={friend.location}
                        onChange={(e) => handleFriendChange(friend.id, 'location', e.target.value)}
                        className={styles.friendLocationInput}
                        placeholder="위치를 입력해주세요"
                      />
                      {friend.id !== 1 && friend.id !== 2 && (
                        <button
                          onClick={() => handleRemoveFriend(friend.id)}
                          className={styles.removeFriendBtn}
                          title="삭제"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={handleAddFriend} className={styles.addFriendBtn}>
                + 친구 추가하기
              </button>
            </div>
          </div>
        </div>
      </div>
      <button 
        onClick={handleFindMiddle} 
        className={styles.findMiddleButton}
        title="중간거리 찾기"
      >
        <div className={styles.findMiddleButtonText}>
          우리 어디서 만날까 ?
        </div>
      </button>
    </div>
  );
};

export default PaperDrawer;
