import React, { useState } from 'react';
import styles from './PaperDrawer.module.css';
import LoadingSpinner from '../LoadingSpinner';

interface Friend {
  id: number;
  name: string;
  location: string;
}

interface PaperDrawerProps {
  onFindMiddle?: () => void;
  onHideCards?: () => void; // 카드 숨기기 기능 추가
}

const PaperDrawer: React.FC<PaperDrawerProps> = ({ onFindMiddle, onHideCards }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFoundMiddle, setHasFoundMiddle] = useState(false); // 중간거리 찾기 완료 상태
  const [friends, setFriends] = useState<Friend[]>([
    { id: 1, name: '나', location: '' },
    { id: 2, name: '친구', location: '' }
  ]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    
    // PaperDrawer가 열릴 때 카드들 숨기고 상태 리셋 (닫혀있을 때 클릭)
    if (!isExpanded && onHideCards) {
      onHideCards();
      setHasFoundMiddle(false); // 중간거리 찾기 상태 리셋
    }
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

  const handleFindMiddle = async () => {
    // 로딩 시작
    setIsLoading(true);
    
    try {
      // 중간거리 찾기 버튼 클릭 시 PaperDrawer 토글 및 부모 컴포넌트에 알림
      setIsExpanded(!isExpanded);
      if (onFindMiddle) {
        onFindMiddle();
      }
      console.log('중간거리 찾기 버튼 클릭됨');
      
      // TODO: 실제 중간거리 계산 로직 구현
      // 예시: API 호출이나 계산 로직
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      
      // 중간거리 찾기 완료 상태로 변경
      setHasFoundMiddle(true);
      
    } catch (error) {
      console.error('중간거리 찾기 중 오류 발생:', error);
    } finally {
      // 로딩 종료
      setIsLoading(false);
    }
  };

  // 헤더 버튼의 텍스트와 아이콘 결정
  const getHeaderContent = () => {
    if (hasFoundMiddle) {
      return { text: '다른 곳에서 만날래?', icon: '🔄' };
    }
    return { text: '우리의 어디서 만날까 ?', icon: '📅' };
  };

  const headerContent = getHeaderContent();

  return (
    <>
      <div className={`${styles.paperDrawer} ${isExpanded ? styles.expanded : ''}`}>
        <div className={styles.paperDrawerContent}>
          <div className={styles.paperDrawerHeader} onClick={handleToggle}>
            <div className={styles.paperTab}>
              <div className={styles.paperTabIcon}>{headerContent.icon}</div>
              <div className={styles.paperTabText}>{headerContent.text}</div>
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
          disabled={isLoading}
        >
          <div className={styles.findMiddleButtonText}>
            {isLoading ? '찾는 중...' : '우리 어디서 만날까 ?'}
          </div>
        </button>
      </div>
      
      {/* 로딩 오버레이 */}
      {isLoading && (
        <LoadingSpinner 
          size="large" 
          text="중간 거리를 찾고 있어요..." 
          overlay={true} 
        />
      )}
    </>
  );
};

export default PaperDrawer;
