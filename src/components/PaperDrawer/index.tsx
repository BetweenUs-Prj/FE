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
    { id: 1, name: '친구 1', location: '' },
    { id: 2, name: '친구 2', location: '' }
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
    setFriends(prev => [...prev, { id: newId, name: `친구 ${newId}`, location: '' }]);
  };

  const handleRemoveFriend = (id: number) => {
    if (friends.length > 1) {
      setFriends(prev => prev.filter(friend => friend.id !== id));
    }
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
                    <input
                      type="text"
                      value={friend.name}
                      onChange={(e) => handleFriendChange(friend.id, 'name', e.target.value)}
                      className={styles.friendNameInput}
                      placeholder="친구 이름"
                    />
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className={styles.removeFriendBtn}
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={friend.location}
                    onChange={(e) => handleFriendChange(friend.id, 'location', e.target.value)}
                    className={styles.friendLocationInput}
                    placeholder="위치를 입력해주세요"
                  />
                </div>
              ))}
              <button onClick={handleAddFriend} className={styles.addFriendBtn}>
                + 친구 추가하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperDrawer;
