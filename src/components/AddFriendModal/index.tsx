import React, { useState, useEffect } from 'react';
import styles from './AddFriendModal.module.css';
import Toast from '../Toast';
import { searchUsers, createFriendRequest, validateFriendRequest } from '@/services/friendService';
import type { Friend, SentFriendRequest, FriendRequest } from '@/types/friend.ts';

interface AddFriendModalProps {
  isVisible: boolean;
  onClose: () => void;
  onFriendAdded?: () => void;
  existingFriends: Friend[];
  sentRequests: SentFriendRequest[];
  receivedRequests: FriendRequest[];
  currentUserId: number;
}

interface SearchResult {
  id: number;
  name: string;
  email: string;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isVisible,
  onClose,
  onFriendAdded,
  existingFriends,
  sentRequests,
  receivedRequests,
  currentUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 검색 디바운싱
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        await handleSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await searchUsers(searchQuery);
      if (response.success) {
        setSearchResults(response.data);
      } else {
        showToast('사용자 검색에 실패했습니다.', 'error');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('사용자 검색 오류:', error);
      showToast('사용자 검색 중 오류가 발생했습니다.', 'error');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: SearchResult) => {
    setSelectedUser(user);
    setSearchQuery(user.name);
    setSearchResults([]);
  };

  const handleSendRequest = async () => {
    if (!selectedUser) {
      showToast('사용자를 선택해주세요.', 'warning');
      return;
    }

    // 친구 요청 검증
    const validation = validateFriendRequest(
      selectedUser.id,
      currentUserId,
      existingFriends,
      sentRequests,
      receivedRequests
    );

    if (!validation.isValid) {
      showToast(validation.errorMessage!, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createFriendRequest({
        receiverId: selectedUser.id,
        message: message.trim() || undefined
      });

      if (response.success) {
        showToast('친구 요청을 보냈습니다!', 'success');
        onFriendAdded?.();
        handleClose();
      } else {
        showToast(response.message || '친구 요청 전송에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('친구 요청 전송 오류:', error);
      showToast('친구 요청 전송 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setMessage('');
    onClose();
  };

  const getValidationStatus = (user: SearchResult) => {
    // 이미 친구인지 확인
    const isAlreadyFriend = existingFriends.some(friend => friend.id === user.id);
    if (isAlreadyFriend) {
      return { status: 'friend', message: '이미 친구입니다' };
    }

    // 보낸 요청이 있는지 확인
    const hasSentRequest = sentRequests.some(request => 
      request.receiverId === user.id && request.status === 'pending'
    );
    if (hasSentRequest) {
      return { status: 'sent', message: '요청을 보냈습니다' };
    }

    // 받은 요청이 있는지 확인
    const hasReceivedRequest = receivedRequests.some(request => 
      request.senderId === user.id && request.status === 'pending'
    );
    if (hasReceivedRequest) {
      return { status: 'received', message: '요청을 받았습니다' };
    }

    return { status: 'available', message: '친구 요청 가능' };
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>친구 추가</h2>
            <button className={styles.closeButton} onClick={handleClose}>
              ✕
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.searchSection}>
              <div className={styles.searchInputContainer}>
                <input
                  type="text"
                  placeholder="이름 또는 이메일로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {isSearching && (
                  <div className={styles.loadingSpinner}></div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {searchResults.map((user) => {
                    const validation = getValidationStatus(user);
                    return (
                      <div
                        key={user.id}
                        className={`${styles.searchResultItem} ${
                          validation.status === 'available' ? styles.selectable : styles.disabled
                        }`}
                        onClick={() => validation.status === 'available' && handleUserSelect(user)}
                      >
                        <div className={styles.userInfo}>
                          <div className={styles.avatar}>
                            {user.name.charAt(0)}
                          </div>
                          <div className={styles.userDetails}>
                            <h3 className={styles.userName}>{user.name}</h3>
                            <p className={styles.userEmail}>{user.email}</p>
                          </div>
                        </div>
                        <div className={`${styles.status} ${styles[validation.status]}`}>
                          {validation.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className={styles.noResults}>
                  <p>검색 결과가 없습니다.</p>
                </div>
              )}
            </div>

            {selectedUser && (
              <div className={styles.selectedUserSection}>
                <div className={styles.selectedUserInfo}>
                  <div className={styles.avatar}>
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div className={styles.userDetails}>
                    <h3 className={styles.userName}>{selectedUser.name}</h3>
                    <p className={styles.userEmail}>{selectedUser.email}</p>
                  </div>
                </div>

                <div className={styles.messageSection}>
                  <label htmlFor="message" className={styles.messageLabel}>
                    메시지 (선택사항)
                  </label>
                  <textarea
                    id="message"
                    placeholder="친구 요청과 함께 보낼 메시지를 입력하세요..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={styles.messageInput}
                    rows={3}
                    maxLength={200}
                  />
                  <div className={styles.messageCounter}>
                    {message.length}/200
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.cancelButton}
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  <button
                    className={styles.sendButton}
                    onClick={handleSendRequest}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '전송 중...' : '친구 요청 보내기'}
                  </button>
                </div>
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

export default AddFriendModal;
