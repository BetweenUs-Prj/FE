import React, { useState, useEffect, useRef } from 'react';
import styles from './PaperDrawer.module.css';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';
import { unifiedSearch } from '../../utils/kakaoMapUtils';
import type { UnifiedSearchResult } from '../../utils/kakaoMapUtils';

// 카테고리 타입 정의
export type MeetingCategory = 
  | 'DRINKING'    // 술약속
  | 'COFFEE'      // 커피약속
  | 'DINING'      // 식사약속
  | 'MEETING'     // 회의약속
  | 'DATE'        // 데이트약속
  | 'STUDY'       // 스터디약속
  | 'ENTERTAINMENT' // 오락약속
  | 'SHOPPING'    // 쇼핑약속
  | 'EXERCISE'    // 운동약속
  | 'CULTURE'     // 문화약속
  | 'CUSTOM';     // 기타 (사용자 입력)

// 카테고리 옵션 정의
export const CATEGORY_OPTIONS: { value: MeetingCategory; label: string; emoji: string }[] = [
  { value: 'DRINKING', label: '술약속', emoji: '🍺' },
  { value: 'COFFEE', label: '커피약속', emoji: '☕' },
  { value: 'DINING', label: '식사약속', emoji: '🍽️' },
  { value: 'MEETING', label: '회의약속', emoji: '💼' },
  { value: 'DATE', label: '데이트약속', emoji: '💕' },
  { value: 'STUDY', label: '스터디약속', emoji: '📚' },
  { value: 'ENTERTAINMENT', label: '오락약속', emoji: '🎮' },
  { value: 'SHOPPING', label: '쇼핑약속', emoji: '🛍️' },
  { value: 'EXERCISE', label: '운동약속', emoji: '💪' },
  { value: 'CULTURE', label: '문화약속', emoji: '🎭' },
  { value: 'CUSTOM', label: '기타', emoji: '✏️' }
];

interface Friend {
  id: number;
  name: string;
  location: string;
  coordinates?: { lat: number, lng: number };
}

interface PaperDrawerProps {
  onFindMiddle?: (friends?: Friend[], category?: MeetingCategory, customCategoryText?: string, middlePoints?: any[]) => void;
  onHideCards?: () => void; // 카드 숨기기 기능 추가
}

const PaperDrawer: React.FC<PaperDrawerProps> = ({ onFindMiddle, onHideCards }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFoundMiddle, setHasFoundMiddle] = useState(false); // 중간거리 찾기 완료 상태
  const [isProcessing, setIsProcessing] = useState(false); // 추가 보호 장치
  const [lastClickTime, setLastClickTime] = useState(0); // 클릭 시간 추적
  const [friends, setFriends] = useState<Friend[]>([
    { id: 1, name: '나', location: '' },
    { id: 2, name: '친구', location: '' }
  ]);
  
  // 카테고리 선택 상태 (기본값으로 설정)
  const [selectedCategory, setSelectedCategory] = useState<MeetingCategory>('DINING');
  const [customCategory, setCustomCategory] = useState<string>('');
  
  // 드롭다운 상태
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  
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

  // JWT 토큰을 가져오는 함수 (쿠키에서 읽기)
  const getAuthToken = (): string | null => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'jwt_token') {
        return value;
      }
    }
    return null;
  };

  // 사용자 위치 데이터를 백엔드로 전송하는 함수
  const sendUserLocationsToBackend = async (friendsData: Friend[], category: MeetingCategory, customCategoryText?: string) => {
    try {
      // JWT 토큰 가져오기 (임시로 토큰 없이도 진행)
      const token = getAuthToken();
      console.log('🔍 JWT 토큰 상태:', token ? '토큰 있음' : '토큰 없음');
            
      const requestData = {
        locations: friendsData.map(friend => ({
          userId: friend.id,
          address: friend.location,
          latitude: friend.coordinates?.lat,
          longitude: friend.coordinates?.lng
        })),
        category: category,
        customCategory: customCategoryText || null,
        timestamp: new Date().toISOString()
      };

      console.log('🔍 백엔드로 전송할 데이터:', requestData);
      console.log('🔍 JWT 토큰:', token);

      // 헤더 구성 (토큰이 있을 때만 Authorization 헤더 추가)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/middle/points/multiple-locations', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('❌ 백엔드 에러 응답:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('❌ 에러 응답 파싱 실패:', parseError);
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('✅ 백엔드 응답:', responseData);
      
      // 성공 토스트 메시지
      showToast('위치 정보가 성공적으로 전송되었습니다!', 'success');
      
      // 백엔드 응답이 배열인 경우 중간지점 데이터 추출
      if (Array.isArray(responseData) && responseData.length > 0) {
        console.log('🎯 백엔드에서 받은 중간지점 배열:', responseData);
        
        // 각 중간지점에서 필요한 정보 추출 (segments 포함)
        const middlePoints = responseData.map((point, index) => ({
          id: index + 1,
          latitude: point.latitude,
          longitude: point.longitude,
          lastEndStation: point.lastEndStation,
          totalTravelTime: point.totalTravelTime,
          transportType: point.transportType,
          travelCost: point.travelCost,
          fairnessScore: point.fairnessScore,
          segments: point.segments, // 🎯 segments 데이터 추가
          trafficDistance: point.trafficDistance, // 🎯 교통거리 추가
          totalWalk: point.totalWalk // 🎯 도보거리 추가
        }));
        
        console.log('🎯 추출된 중간지점 데이터:', middlePoints);
        
        // onFindMiddle 콜백에 중간지점 데이터 전달
        if (onFindMiddle) {
          onFindMiddle(friends, selectedCategory, selectedCategory === 'CUSTOM' ? customCategory : undefined, middlePoints);
        }
      }
      
      return responseData;
      
    } catch (error) {
      console.error('❌ 백엔드 전송 실패:', error);
      
      // JWT 토큰 관련 에러인지 확인
      if (error instanceof Error && error.message.includes('인증 토큰')) {
        showToast('로그인이 필요합니다. 다시 로그인해주세요.', 'error');
        throw error; // 인증 에러는 dummy data 없이 재던짐
      } else {
        console.log('🎭 API 호출 실패, 더미 데이터로 대체합니다.');
        showToast('서버 연결에 문제가 있어 테스트 데이터로 표시합니다.', 'warning');
        
        // 더미 중간지점 데이터 생성
        const dummyMiddlePoints = [
          {
            id: 1,
            latitude: 37.5665,
            longitude: 126.9780,
            lastEndStation: "강남역",
            totalTravelTime: 20,
            transportType: "SUBWAY",
            travelCost: 1470.0,
            fairnessScore: 95.5,
            segments: [
              {
                trafficTypeName: "지하철",
                startX: 127.0276,
                startY: 37.4979,
                endX: 126.9780,
                endY: 37.5665,
                passStops: [
                  { stationName: "강남역", x: 126.9780, y: 37.5665, index: 0 }
                ]
              }
            ],
            trafficDistance: 12.3,
            totalWalk: 500,
            formattedAddress: "서울특별시 강남구 강남대로 396",
            stationName: "강남역",
            recommendationReason: "모든 참가자에게 가장 공평한 교통 접근성을 제공합니다.",
            advantages: ["지하철 접근성 우수", "상업시설 밀집", "교통 편리"]
          },
          {
            id: 2,
            latitude: 37.5651,
            longitude: 126.9895,
            lastEndStation: "명동역",
            totalTravelTime: 22,
            transportType: "SUBWAY",
            travelCost: 1470.0,
            fairnessScore: 92.3,
            segments: [
              {
                trafficTypeName: "지하철",
                startX: 127.0276,
                startY: 37.4979,
                endX: 126.9895,
                endY: 37.5651,
                passStops: [
                  { stationName: "명동역", x: 126.9895, y: 37.5651, index: 0 }
                ]
              }
            ],
            trafficDistance: 13.8,
            totalWalk: 360,
            formattedAddress: "서울특별시 중구 명동길 26",
            stationName: "명동역",
            recommendationReason: "쇼핑과 관광을 함께 즐길 수 있는 최적의 위치입니다.",
            advantages: ["쇼핑 편리", "관광명소 근접", "음식점 다양"]
          },
          {
            id: 3,
            latitude: 37.5547,
            longitude: 126.9707,
            lastEndStation: "용산역",
            totalTravelTime: 25,
            transportType: "BUS_SUBWAY",
            travelCost: 1780.0,
            fairnessScore: 88.7,
            segments: [
              {
                trafficTypeName: "지하철",
                startX: 127.0276,
                startY: 37.4979,
                endX: 126.9707,
                endY: 37.5547,
                passStops: [
                  { stationName: "용산역", x: 126.9707, y: 37.5547, index: 0 }
                ]
              }
            ],
            trafficDistance: 15.2,
            totalWalk: 640,
            formattedAddress: "서울특별시 용산구 한강대로 405", 
            stationName: "용산역",
            recommendationReason: "다양한 교통수단 이용 가능한 교통의 요충지입니다.",
            advantages: ["KTX 연결", "대형 쇼핑몰", "한강 근접"]
          }
        ];

        console.log('🎭 더미 중간지점 데이터:', dummyMiddlePoints);
        
        // onFindMiddle 콜백에 더미 데이터 전달
        if (onFindMiddle) {
          onFindMiddle(friends, selectedCategory, selectedCategory === 'CUSTOM' ? customCategory : undefined, dummyMiddlePoints);
        }
        
        return dummyMiddlePoints; // 더미 데이터 반환
      }
    }
  };

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

    // 위치가 변경된 경우 검색 실행 (입력 중에는 토스트 메시지 표시하지 않음)
    if (field === 'location' && value.trim()) {
      handleLocationSearch(id, value, false);
    } else if (field === 'location' && !value.trim()) {
      // 입력값이 비어있으면 검색 결과 숨기기
      setSearchResults(prev => ({ ...prev, [id]: [] }));
      setShowSearchResults(prev => ({ ...prev, [id]: false }));
    }
  };

  // 장소 검색 처리 (입력 중에는 토스트 메시지 표시하지 않음)
  const handleLocationSearch = async (friendId: number, keyword: string, showToastMessage: boolean = false) => {
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
        
        // 검색 결과가 없거나 너무 적은 경우 토스트 메시지 표시 (showToastMessage가 true일 때만)
        if (showToastMessage) {
          if (results.length === 0) {
            showToast('수도권(서울, 경기, 인천) 내의 구체적인 장소나 주소를 입력해주세요. (예: 강남역, 강남대로 123, 스타벅스 강남점)', 'error');
          } else if (results.length < 3) {
            showToast('수도권 내에서 더 구체적인 장소를 입력하시면 더 정확한 결과를 찾을 수 있습니다.', 'error');
          }
        }
        
        setSearchResults(prev => ({ ...prev, [friendId]: results }));
        setShowSearchResults(prev => ({ ...prev, [friendId]: true }));
      } catch (error) {
        console.error('장소 검색 실패:', error);
        setSearchResults(prev => ({ ...prev, [friendId]: [] }));
        if (showToastMessage) {
          showToast('검색 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        }
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
      
      // 카테고리 드롭다운 외부 클릭 감지
      if (!target.closest(`.${styles.categoryDropdownContainer}`)) {
        setIsCategoryDropdownOpen(false);
      }
      
      // 검색 결과 드롭다운 외부 클릭 감지
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
    const now = Date.now();
    
    // 1. 클릭 간격 체크 (100ms 이내 연타 방지)
    if (now - lastClickTime < 100) {
      console.log('너무 빠른 클릭 감지, 무시됨');
      return;
    }
    
    // 2. 로딩 중이거나 이미 실행 중이면 중복 실행 방지
    if (isLoading || isProcessing) {
      console.log('중간거리 찾기 이미 실행 중입니다.');
      return;
    }
    
    // 3. 클릭 시간 업데이트
    setLastClickTime(now);
    
    // 4. 모든 친구의 위치가 입력되었는지 확인
    const emptyLocations = friends.filter(friend => !friend.location || !friend.coordinates);
    if (emptyLocations.length > 0) {
      const emptyCount = emptyLocations.length;
      const totalCount = friends.length;
      showToast(`${totalCount}명 중 ${emptyCount}명의 위치가 입력되지 않았습니다. 모든 친구의 구체적인 위치를 입력해주세요.`, 'error');
      return;
    }
    
    // 5. 좌표가 없는 입력이 있는지 확인 (임의로 입력한 텍스트)
    const invalidFriends = friends.filter(friend => friend.location && !friend.coordinates);
    if (invalidFriends.length > 0) {
      console.log('좌표가 없는 입력 발견:', invalidFriends);
      showToast('구체적인 장소를 선택해주세요. 임의로 입력한 텍스트는 좌표가 없어 길찾기를 할 수 없습니다.', 'error');
      return;
    }
    
    // 6. 모든 보호 장치 통과 후 처리 시작
    setIsLoading(true);
    setIsProcessing(true);
    
    try {
      console.log('중간거리 찾기 버튼 클릭됨');
      console.log('전송할 좌표 데이터:', friends.map(f => ({ name: f.name, location: f.location, coordinates: f.coordinates })));

      // 백엔드로 사용자 위치 데이터 전송 (sendUserLocationsToBackend에서 onFindMiddle 호출됨)
      await sendUserLocationsToBackend(friends, selectedCategory, selectedCategory === 'CUSTOM' ? customCategory : undefined);

      // 중간거리 찾기 버튼 클릭 시 PaperDrawer 닫기
      setIsExpanded(false); // 항상 닫기로 고정
      
      setHasFoundMiddle(true);
      
    } catch (error) {
      console.error('중간거리 찾기 중 오류 발생:', error);
      showToast('중간거리 찾기 중 오류가 발생했습니다.', 'error');
    } finally {
      // 로딩 종료
      setIsLoading(false);
      setIsProcessing(false);
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
            {/* 오른쪽 상단 카테고리 드롭다운 */}
            <div className={styles.categoryDropdownContainer}>
              <button
                className={styles.categoryDropdownButton}
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              >
                <span className={styles.categoryDropdownEmoji}>
                  {CATEGORY_OPTIONS.find(cat => cat.value === selectedCategory)?.emoji}
                </span>
                <span className={styles.categoryDropdownText}>
                  {selectedCategory === 'CUSTOM' && customCategory 
                    ? customCategory 
                    : CATEGORY_OPTIONS.find(cat => cat.value === selectedCategory)?.label}
                </span>
                <span className={`${styles.categoryDropdownArrow} ${isCategoryDropdownOpen ? styles.open : ''}`}>
                </span>
              </button>
              
              {/* 드롭다운 메뉴 */}
              {isCategoryDropdownOpen && (
                <div className={styles.categoryDropdownMenu}>
                  {/* 커스텀 입력 필드 (상단에 배치) */}
                  <div className={styles.customCategoryDropdownInput}>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => {
                        setCustomCategory(e.target.value);
                        if (e.target.value.trim()) {
                          setSelectedCategory('CUSTOM');
                        }
                      }}
                      placeholder="직접 입력하기..."
                      className={styles.customCategoryTextInput}
                      onFocus={() => setIsCategoryDropdownOpen(true)}
                      tabIndex={0}
                    />
                  </div>
                  
                  {/* 구분선 */}
                  <div className={styles.categoryDropdownDivider}></div>
                  
                  {/* 카테고리 옵션들 */}
                  {CATEGORY_OPTIONS.map((category) => (
                    <button
                      key={category.value}
                      className={`${styles.categoryDropdownItem} ${selectedCategory === category.value ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedCategory(category.value);
                        if (category.value !== 'CUSTOM') {
                          setCustomCategory('');
                        }
                        setIsCategoryDropdownOpen(false);
                      }}
                    >
                      <span className={styles.categoryItemEmoji}>{category.emoji}</span>
                      <span className={styles.categoryItemLabel}>{category.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
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
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 e.preventDefault();
                                 // 엔터 키를 눌렀을 때 토스트 메시지와 함께 검색 실행
                                 if (friend.location.trim()) {
                                   handleLocationSearch(friend.id, friend.location, true);
                                 }
                                 e.currentTarget.blur();
                               }
                             }}
                             onBlur={() => {
                               // 포커스를 잃을 때 좌표가 없는 입력 정리 및 토스트 메시지 표시
                               setTimeout(() => {
                                 // 현재 포커스된 요소가 다른 입력 필드인지 확인
                                 const activeElement = document.activeElement;
                                 const isFocusingAnotherInput = activeElement && 
                                   activeElement.tagName === 'INPUT' && 
                                   activeElement.getAttribute('data-friend-id') !== friend.id.toString();
                                 
                                 // 다른 입력 필드로 이동하는 경우 드롭다운 숨기기
                                 if (isFocusingAnotherInput) {
                                   setShowSearchResults(prev => ({ ...prev, [friend.id]: false }));
                                   return;
                                 }
                                 
                                 // 검색 결과가 표시되어 있거나 검색 중이면 정리하지 않음
                                 if (showSearchResults[friend.id] || isSearching[friend.id]) {
                                   return;
                                 }
                                 
                                 if (friend.location && !friend.coordinates) {
                                   console.log(`포커스 아웃 시 좌표가 없는 입력 정리: ${friend.location}`);
                                   // 포커스 아웃 시 토스트 메시지와 함께 검색 실행
                                   handleLocationSearch(friend.id, friend.location, true);
                                   setFriends(prev => prev.map(f => 
                                     f.id === friend.id ? { ...f, location: '' } : f
                                   ));
                                 }
                               }, 300); // 검색 결과 클릭을 위한 지연 시간 증가
                             }}
                             onClick={() => {}}
                           />
                           {isSearching[friend.id] && (
                             <div className={styles.searchSpinner}>🔍</div>
                           )}
                         </div>
                         
                         {/* 장소 검색 결과 드롭다운 */}
                         {showSearchResults[friend.id] && searchResults[friend.id] && searchResults[friend.id].length > 0 && (
                           <div className={styles.searchResultsDropdown}>
                             {searchResults[friend.id].slice(0, 5).map((place) => (
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
          onDoubleClick={(e) => e.preventDefault()}
          className={`${styles.findMiddleButton} ${(!canFindMiddle() || isLoading || isProcessing) ? styles.disabled : ''}`}
          title={getButtonTitle()}
          disabled={isLoading || isProcessing || !canFindMiddle()}
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
