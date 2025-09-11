import React, { useState } from 'react';
import styles from './FloatingNav.module.css';
import Toast from '../Toast';

interface Friend {
  id: number;
  name: string;
  location: string;
  status?: 'pending' | 'accepted';
}

interface FloatingNavProps {
  onFriendClick?: () => void;
  onScheduleClick?: () => void;
  onMeetingClick?: () => void;
}

const FloatingNav: React.FC<FloatingNavProps> = ({
  onFriendClick,
  onScheduleClick,
  onMeetingClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showFriendSection, setShowFriendSection] = useState(false);
  
  // 친구 요청 관련 상태
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendLocation, setFriendLocation] = useState('');
  const [sentRequests, setSentRequests] = useState<Friend[]>([
    { id: 200, name: '김민지', location: '강남역', status: 'pending' },
    { id: 201, name: '박지훈', location: '홍대입구역', status: 'accepted' }
  ]);
  
  // 내 친구 목록
  const [myFriends, setMyFriends] = useState<Friend[]>([
    { id: 300, name: '이수진', location: '신촌역', status: 'accepted' },
    { id: 301, name: '최민호', location: '건대입구역', status: 'accepted' },
    { id: 302, name: '정유진', location: '잠실역', status: 'accepted' }
  ]);
  
  // 받은 요청 목록
  const [receivedRequests, setReceivedRequests] = useState<Friend[]>([
    { id: 400, name: '한소영', location: '사당역', status: 'pending' },
    { id: 401, name: '윤태호', location: '왕십리역', status: 'pending' }
  ]);
  
  // 토스트 메시지 상태
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  const handleToggle = () => {
    console.log('플로팅 버튼 클릭됨!', { isOpen });
    if (isOpen) {
      // 닫을 때 바로 X로 바뀌고 순차적으로 사라지도록
      setIsOpen(false);
      setIsClosing(true);
      setShowFriendSection(false); // 친구관리 섹션도 함께 닫기
      setTimeout(() => {
        setIsClosing(false);
      }, 600); // 모든 애니메이션이 끝날 시간
    } else {
      setIsOpen(true);
    }
  };

  const handleFriendClick = () => {
    console.log('친구 클릭됨!');
    setShowFriendSection(!showFriendSection);
    // onFriendClick 콜백을 제거하여 중복 모달 방지
    // onFriendClick?.();
    // 메뉴 클릭 시에는 닫히지 않도록 handleToggle() 제거
  };

  const handleScheduleClick = () => {
    console.log('일정 클릭됨!');
    setShowFriendSection(false); // 친구관리 섹션 닫기
    onScheduleClick?.();
    // 메뉴 클릭 시에는 닫히지 않도록 handleToggle() 제거
  };

  const handleMeetingClick = () => {
    console.log('만남 클릭됨!');
    setShowFriendSection(false); // 친구관리 섹션 닫기
    onMeetingClick?.();
    // 메뉴 클릭 시에는 닫히지 않도록 handleToggle() 제거
  };

  // 토스트 메시지 표시 함수
  const showToast = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  // 토스트 메시지 숨기기
  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // 친구 요청 보내기
  const handleSendFriendRequest = () => {
    if (friendName.trim() && friendLocation.trim()) {
      const newRequest: Friend = {
        id: Date.now(),
        name: friendName,
        location: friendLocation,
        status: 'pending'
      };
      
      setSentRequests(prev => [...prev, newRequest]);
      showToast(`${friendName}님에게 친구 요청을 보냈습니다!`, 'success');
      
      // 모달 닫기 및 폼 초기화
      setShowFriendRequestModal(false);
      setFriendName('');
      setFriendLocation('');
    } else {
      showToast('이름과 위치를 모두 입력해주세요.', 'warning');
    }
  };

  // 친구 요청 모달 닫기
  const handleCloseFriendRequestModal = () => {
    setShowFriendRequestModal(false);
    setFriendName('');
    setFriendLocation('');
  };

  // 보낸 요청 취소
  const handleCancelRequest = (requestId: number) => {
    const request = sentRequests.find(req => req.id === requestId);
    if (request) {
      setSentRequests(prev => prev.filter(req => req.id !== requestId));
      showToast(`${request.name}님의 친구 요청을 취소했습니다.`, 'info');
    }
  };

  // 받은 요청 수락
  const handleAcceptRequest = (requestId: number) => {
    const request = receivedRequests.find(req => req.id === requestId);
    if (request) {
      setMyFriends(prev => [...prev, { ...request, status: 'accepted' }]);
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      
      // 보낸 요청에서도 해당 요청을 수락 상태로 업데이트
      setSentRequests(prev => prev.map(req => 
        req.name === request.name && req.location === request.location 
          ? { ...req, status: 'accepted' }
          : req
      ));
      
      showToast(`${request.name}님의 친구 요청을 수락했습니다!`, 'success');
    }
  };

  // 받은 요청 거절
  const handleRejectRequest = (requestId: number) => {
    const request = receivedRequests.find(req => req.id === requestId);
    if (request) {
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      showToast(`${request.name}님의 친구 요청을 거절했습니다.`, 'info');
    }
  };

  // 친구 삭제
  const handleRemoveFriend = (friendId: number) => {
    const friend = myFriends.find(f => f.id === friendId);
    if (friend) {
      setMyFriends(prev => prev.filter(f => f.id !== friendId));
      showToast(`${friend.name}님을 친구 목록에서 삭제했습니다.`, 'info');
    }
  };

  // 수락된 요청 확인 (삭제)
  const handleDismissAcceptedRequest = (requestId: number) => {
    const request = sentRequests.find(req => req.id === requestId);
    if (request) {
      setSentRequests(prev => prev.filter(req => req.id !== requestId));
      showToast(`${request.name}님의 친구 요청 수락을 확인했습니다!`, 'success');
    }
  };


  return (
    <>
      <div className={styles.floatingNav}>
        {/* 친구관리 섹션 */}
        {showFriendSection && (
          <div className={styles.friendManagementSection}>
            <div className={styles.friendManagementHeader}>
              <h3>친구 관리</h3>
              <div className={styles.headerButtons}>
                <button 
                  className={styles.sendRequestBtn}
                  onClick={() => setShowFriendRequestModal(true)}
                >
                  ➕ 친구 요청
                </button>
                <button 
                  className={styles.closeSectionBtn}
                  onClick={() => setShowFriendSection(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className={styles.friendManagementContent}>
              {/* 받은 요청 섹션 */}
              {receivedRequests.length > 0 && (
                <div className={styles.requestsSection}>
                  <h4 className={styles.sectionTitle}>
                    받은 요청 ({receivedRequests.length})
                  </h4>
                  <div className={styles.requestsList}>
                    {receivedRequests.map((request) => (
                      <div key={request.id} className={styles.requestItem}>
                        <div className={styles.requestInfo}>
                          <div className={styles.requestMainInfo}>
                            <span className={styles.requestName}>{request.name}</span>
                            <span className={styles.requestLocation}>{request.location}</span>
                          </div>
                        </div>
                        <div className={styles.requestActions}>
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className={styles.acceptBtn}
                            title="수락"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className={styles.rejectBtn}
                            title="거절"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 내 친구 목록 */}
              <div className={styles.friendsSection}>
                <h4 className={styles.sectionTitle}>
                  내 친구 ({myFriends.length})
                </h4>
                <div className={styles.friendsList}>
                  {myFriends.map((friend) => (
                    <div key={friend.id} className={styles.friendListItem}>
                      <div className={styles.friendInfo}>
                        <span className={styles.friendName}>{friend.name}</span>
                        <span className={styles.friendLocation}>{friend.location}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className={styles.removeFriendBtn}
                        title="친구 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 보낸 요청 섹션 */}
              {sentRequests.length > 0 && (
                <div className={styles.sentRequestsSection}>
                  <h4 className={styles.sectionTitle}>
                    보낸 요청 ({sentRequests.length})
                  </h4>
                  <div className={styles.sentRequestsList}>
                    {sentRequests.map((request) => (
                      <div key={request.id} className={styles.sentRequestItem}>
                        <div className={styles.requestInfo}>
                          <div className={styles.requestMainInfo}>
                            <span className={styles.requestName}>{request.name}</span>
                            <span className={styles.requestLocation}>{request.location}</span>
                            <span className={`${styles.requestStatus} ${styles[request.status || 'pending']}`}>
                              {request.status === 'pending' ? '대기중' : '수락됨'}
                            </span>
                          </div>
                        </div>
                        {request.status === 'pending' ? (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className={styles.cancelRequestBtn}
                            title="요청 취소"
                          >
                            ✕
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDismissAcceptedRequest(request.id)}
                            className={styles.dismissBtn}
                            title="확인"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 메뉴 아이템들 */}
        <div className={`${styles.navItem} ${styles.friendItem} ${isOpen && !isClosing ? styles.show : ''} ${isClosing ? styles.closing : ''} ${showFriendSection ? styles.active : ''}`} onClick={handleFriendClick}>
          <div className={styles.navIcon}>👥</div>
          <span className={styles.navText}>친구</span>
        </div>
        
        <div className={`${styles.navItem} ${styles.scheduleItem} ${isOpen && !isClosing ? styles.show : ''} ${isClosing ? styles.closing : ''}`} onClick={handleScheduleClick}>
          <div className={styles.navIcon}>📅</div>
          <span className={styles.navText}>일정</span>
        </div>
        
        <div className={`${styles.navItem} ${styles.meetingItem} ${isOpen && !isClosing ? styles.show : ''} ${isClosing ? styles.closing : ''}`} onClick={handleMeetingClick}>
          <div className={styles.navIcon}>🤝</div>
          <span className={styles.navText}>만남</span>
        </div>

        {/* 플로팅 버튼 */}
        <div className={`${styles.floatingButton} ${isOpen ? styles.open : ''}`} onClick={handleToggle}>
          <div className={styles.buttonIcon}>
            <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
            <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
            <span className={`${styles.hamburgerLine} ${isOpen ? styles.open : ''}`}></span>
          </div>
        </div>
      </div>

      {/* 친구 요청 모달 */}
      {showFriendRequestModal && (
        <div className={styles.modalOverlay} onClick={handleCloseFriendRequestModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>친구 요청 보내기</h3>
              <button className={styles.closeButton} onClick={handleCloseFriendRequestModal}>
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>친구 이름</label>
                <input
                  type="text"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="친구의 이름을 입력하세요"
                  className={styles.input}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>친구 위치</label>
                <input
                  type="text"
                  value={friendLocation}
                  onChange={(e) => setFriendLocation(e.target.value)}
                  placeholder="친구의 현재 위치를 입력하세요"
                  className={styles.input}
                />
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={handleCloseFriendRequestModal}>
                취소
              </button>
              <button className={styles.sendButton} onClick={handleSendFriendRequest}>
                친구 요청 보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 메시지 */}
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

export default FloatingNav;
