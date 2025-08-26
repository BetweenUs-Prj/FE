import React, { useState, useEffect, useRef } from 'react';
import styles from './PaperDrawer.module.css';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';
import { unifiedSearch } from '../../utils/kakaoMapUtils';
import type { UnifiedSearchResult } from '../../utils/kakaoMapUtils';

interface Friend {
  id: number;
  name: string;
  location: string;
  coordinates?: { lat: number, lng: number };
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
  
  // 장소 검색 관련 상태
  const [searchResults, setSearchResults] = useState<{ [key: number]: UnifiedSearchResult[] }>({});
  const [isSearching, setIsSearching] = useState<{ [key: number]: boolean }>({});
  const [showSearchResults, setShowSearchResults] = useState<{ [key: number]: boolean }>({});
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
    setIsExpanded(!isExpanded);
    
    // PaperDrawer가 열릴 때 카드들 숨기고 상태 리셋 (닫혀있을 때 클릭)
    if (!isExpanded && onHideCards) {
      onHideCards();
      setHasFoundMiddle(false); // 중간거리 찾기 상태 리셋
    }
  };

  const handleFriendChange = (id: number, field: 'name' | 'location', value: string) => {
    setFriends(prev => prev.map(friend => 
      friend.id === id ? { 
        ...friend, 
        [field]: value,
        // 위치가 변경되면 좌표 초기화 (드롭다운에서 선택한 것이 아니므로)
        ...(field === 'location' ? { coordinates: undefined } : {})
      } : friend
    ));

    // 위치가 변경된 경우 검색 실행
    if (field === 'location' && value.trim()) {
      handleLocationSearch(id, value);
    } else if (field === 'location' && !value.trim()) {
      // 입력값이 비어있으면 검색 결과 숨기기
      setSearchResults(prev => ({ ...prev, [id]: [] }));
      setShowSearchResults(prev => ({ ...prev, [id]: false }));
    }
  };

  // 장소 검색 처리
  const handleLocationSearch = async (friendId: number, keyword: string) => {
    console.log('검색 시작:', keyword); // 디버깅 로그
    
    // 이전 검색 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 검색 중 상태 설정
    setIsSearching(prev => ({ ...prev, [friendId]: true }));

    // 디바운싱: 500ms 후에 검색 실행
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('통합 검색 API 호출 중...'); // 디버깅 로그
        const results = await unifiedSearch(keyword);
        console.log('검색 결과:', results); // 디버깅 로그
        
        // 검색 결과가 없거나 너무 적은 경우 토스트 메시지 표시
        if (results.length === 0) {
          showToast('구체적인 장소나 주소를 입력해주세요. (예: 강남역, 강남대로 123, 스타벅스 강남점)', 'error');
        } else if (results.length < 3) {
          showToast('더 구체적인 장소를 입력하시면 더 정확한 결과를 찾을 수 있습니다.', 'error');
        }
        
        setSearchResults(prev => ({ ...prev, [friendId]: results }));
        setShowSearchResults(prev => ({ ...prev, [friendId]: true }));
      } catch (error) {
        console.error('장소 검색 실패:', error);
        setSearchResults(prev => ({ ...prev, [friendId]: [] }));
        showToast('검색 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
      } finally {
        setIsSearching(prev => ({ ...prev, [friendId]: false }));
      }
    }, 500);
  };

  // 토스트 메시지 표시 함수 (중복 방지)
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

  // 장소 선택 처리
  const handlePlaceSelect = (friendId: number, place: UnifiedSearchResult) => {
    console.log('장소 선택됨:', place);
    
    setFriends(prev => prev.map(friend => 
      friend.id === friendId 
        ? { 
            ...friend, 
            location: place.name,
            coordinates: place.coordinates
          } 
        : friend
    ));
    
    // 검색 결과 숨기기
    setShowSearchResults(prev => ({ ...prev, [friendId]: false }));
    
    // 포커스 아웃 이벤트 방지를 위해 잠시 대기
    setTimeout(() => {
      const inputElement = document.querySelector(`input[data-friend-id="${friendId}"]`) as HTMLInputElement;
      if (inputElement) {
        inputElement.blur();
      }
    }, 100);
  };

  // 검색 결과 외부 클릭 시 숨기기
  const handleClickOutside = (friendId: number) => {
    setShowSearchResults(prev => ({ ...prev, [friendId]: false }));
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.inputContainer}`)) {
        setShowSearchResults({});
        
        // 좌표가 없는 입력 필드 정리
        setFriends(prev => prev.map(friend => {
          if (friend.location && !friend.coordinates) {
            console.log(`좌표가 없는 입력 정리: ${friend.location}`);
            return { ...friend, location: '' };
          }
          return friend;
        }));
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

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
    // 모든 친구의 위치가 입력되었는지 확인
    const emptyLocations = friends.filter(friend => !friend.location || !friend.coordinates);
    if (emptyLocations.length > 0) {
      const emptyCount = emptyLocations.length;
      const totalCount = friends.length;
      showToast(`${totalCount}명 중 ${emptyCount}명의 위치가 입력되지 않았습니다. 모든 친구의 구체적인 위치를 입력해주세요.`, 'error');
      return;
    }
    
    // 좌표가 없는 입력이 있는지 확인 (임의로 입력한 텍스트)
    const invalidFriends = friends.filter(friend => friend.location && !friend.coordinates);
    if (invalidFriends.length > 0) {
      console.log('좌표가 없는 입력 발견:', invalidFriends);
      showToast('구체적인 장소를 선택해주세요. 임의로 입력한 텍스트는 좌표가 없어 길찾기를 할 수 없습니다.', 'error');
      return;
    }
    
    // 로딩 시작
    setIsLoading(true);
    
    try {
      // 중간거리 찾기 버튼 클릭 시 PaperDrawer 토글 및 부모 컴포넌트에 알림
      setIsExpanded(!isExpanded);
      if (onFindMiddle) {
        onFindMiddle();
      }
      console.log('중간거리 찾기 버튼 클릭됨');
      console.log('전송할 좌표 데이터:', friends.map(f => ({ name: f.name, location: f.location, coordinates: f.coordinates })));
      
      // TODO: API 연동 시 이 부분을 실제 API 호출로 대체
      // 예시:
      // const response = await fetch('/api/calculate-middle-distance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     locations: friends.map(f => ({ location: f.location, coordinates: f.coordinates })),
      //     preferences: userPreferences // 사용자 선호도
      //   })
      // });
      // const result = await response.json();
      // console.log('중간거리 계산 결과:', result);
      
      // TODO: API 연동 시 이 부분을 삭제하고 실제 API 호출로 대체
      // 예시: API 호출이나 계산 로직
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      
      // 중간거리 찾기 완료 상태로 변경
      setHasFoundMiddle(true);
      
    } catch (error) {
      console.error('중간거리 찾기 중 오류 발생:', error);
      // TODO: API 연동 시 에러 처리 로직 추가
      // 예시: 사용자에게 에러 메시지 표시
    } finally {
      // 로딩 종료
      setIsLoading(false);
    }
  };

  // 중간거리 찾기 가능 여부 확인
  const canFindMiddle = () => {
    return friends.every(friend => friend.location && friend.coordinates);
  };

  // 버튼 텍스트 결정
  const getButtonText = () => {
    if (!canFindMiddle()) {
      const emptyCount = friends.filter(friend => !friend.location || !friend.coordinates).length;
      const totalCount = friends.length;
      return `${totalCount}명 중 ${emptyCount}명 입력 필요`;
    }
    return '우리 어디서 만날까 ?';
  };

  // 버튼 툴팁 텍스트 결정
  const getButtonTitle = () => {
    if (!canFindMiddle()) {
      return '모든 친구의 구체적인 위치를 입력해주세요';
    }
    return '중간거리 찾기';
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
                        <div className={styles.locationInputWrapper}>
                          <input
                            type="text"
                            value={friend.location}
                            onChange={(e) => handleFriendChange(friend.id, 'location', e.target.value)}
                            className={`${styles.friendLocationInput} ${friend.coordinates ? styles.validInput : ''}`}
                            placeholder="위치를 입력해주세요"
                            data-friend-id={friend.id}
                            onFocus={(e) => {
                              e.stopPropagation();
                              if (friend.location.trim() && searchResults[friend.id]?.length > 0) {
                                setShowSearchResults(prev => ({ ...prev, [friend.id]: true }));
                              }
                            }}
                            onBlur={(e) => {
                              // 포커스를 잃을 때 좌표가 없는 입력 정리
                              setTimeout(() => {
                                // 검색 결과가 표시되어 있거나 검색 중이면 정리하지 않음
                                if (showSearchResults[friend.id] || isSearching[friend.id]) {
                                  return;
                                }
                                
                                if (friend.location && !friend.coordinates) {
                                  console.log(`포커스 아웃 시 좌표가 없는 입력 정리: ${friend.location}`);
                                  setFriends(prev => prev.map(f => 
                                    f.id === friend.id ? { ...f, location: '' } : f
                                  ));
                                }
                              }, 300); // 검색 결과 클릭을 위한 지연 시간 증가
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {isSearching[friend.id] && (
                            <div className={styles.searchSpinner}>🔍</div>
                          )}
                        </div>
                        

                        
                        {/* 장소 검색 결과 드롭다운 */}
                        {showSearchResults[friend.id] && searchResults[friend.id] && searchResults[friend.id].length > 0 && (
                          <div className={styles.searchResultsDropdown}>
                            {searchResults[friend.id].slice(0, 5).map((place, index) => (
                              <div
                                key={place.id}
                                className={styles.searchResultItem}
                                onMouseDown={(e) => {
                                  e.preventDefault(); // 포커스 아웃 방지
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handlePlaceSelect(friend.id, place);
                                }}
                              >
                                <div className={styles.placeName}>
                                  {place.name}
                                  <span className={styles.searchType}>
                                    {place.type === 'place' ? '📍' : '🏠'}
                                  </span>
                                </div>
                                <div className={styles.placeAddress}>
                                  {place.address}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
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
          className={`${styles.findMiddleButton} ${!canFindMiddle() ? styles.disabled : ''}`}
          title={getButtonTitle()}
          disabled={isLoading || !canFindMiddle()}
        >
          <div className={styles.findMiddleButtonText}>
            {isLoading ? '찾는 중...' : getButtonText()}
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
      
      {/* 토스트 메시지 */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
        duration={4000}
      />
    </>
  );
};

export default PaperDrawer;
