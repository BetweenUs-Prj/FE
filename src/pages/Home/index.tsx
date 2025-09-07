
import styles from './Home.module.css';
import Header from '../../components/Header';
import FadeIn from '@/components/FadeIn';
import KakaoMap from '../../components/KakaoMap';
import { KAKAO_MAP_APP_KEY } from '../../constants/config';
import PaperDrawer from '@/components/PaperDrawer';
import FloatingNav from '@/components/FloatingNav';
import MiddlePlaceRecommendCard from '@/components/MiddlePlaceRecommendCard';
import Toast from '@/components/Toast';
import FriendsModal from '@/components/FriendsModal';
import ScheduleModal from '@/components/ScheduleModal';
import MeetingModal from '@/components/MeetingModal';
import TransportInfoModal from '@/components/TransportInfoModal';
import ScheduleConfirmModal from '@/components/ScheduleConfirmModal';

import { useHomeLogic } from '@/hooks/useHomeLogic';

const Home = () => {
  const {
    // ===== 🎯 통합된 상태 객체들 =====
    uiState,
    mapState,
    modalState,
    
    // ===== 🎯 개별 상태들 =====
    friends,
    schedules,
    cards,
    toast,
    
    // ===== 🎯 상태 업데이트 함수들 =====
    updateModalState,
    
    // ===== 🎯 핸들러들 =====
    hideToast,
    handleFriendClick,
    handleScheduleClick,
    handleMeetingClick,
    handleFindMiddle,
    handleHideCards,
    handleCardClick,
    handleAddSchedule,
    handleSendInvitation,
    handleGoToSchedule,
    handleCloseScheduleConfirmModal,
    handleCloseTransportModal,
    handleRemoveSchedule
  } = useHomeLogic();

  return (
    <div className={styles.homePage}>
      <Header />
      <div className={styles.mapBackground}>
                <KakaoMap
          containerId="home-map"
          center={mapState.center}
          level={mapState.level}
          zoomable={mapState.interaction.zoomable}
          draggable={mapState.interaction.draggable}
          appKey={KAKAO_MAP_APP_KEY}
          className={styles.homeMapContainer}
          markers={mapState.markers}
          routes={mapState.routes}
          disableAutoCenter={false}
          onMarkerClick={(marker) => {
            console.log('KakaoMap에 전달된 markers:', mapState.markers);
            // 친구 마커 클릭 처리
            if (marker.id.startsWith('friend-')) {
              const friendId = parseInt(marker.id.replace('friend-', ''));
              const friend = friends.find(f => f.id === friendId);
              if (friend) {
                console.log(`친구 마커 클릭: ${friend.name} - ${friend.location}`);
                
                // 경로는 유지 (기존 경로가 있으면 그대로 유지)
                console.log('친구 마커 클릭 - 기존 경로 유지, 현재 경로 개수:', mapState.routes.length);
                
                // 경로가 사라지지 않도록 명시적으로 다시 설정 (같은 경로)
                if (mapState.routes.length > 0) {
                  console.log('기존 경로 유지를 위해 경로 재설정');
                  // setMapRoutes([...mapState.routes]); // 같은 경로를 다시 설정하여 유지
                }
              }
              return;
            }
          }}
        />
      </div>
      
      {uiState.showHomeContent && (
        <div className={styles.homeContent}>
          <FadeIn delay={0.2} direction="up">
            <h1 className={styles.homeTitle}>우리 사이</h1>
            <p className={styles.mapDescription}>
              친구들과의 만남 장소를 쉽게 찾아보세요
            </p>
          </FadeIn>
        </div>
      )}
      
      <PaperDrawer 
        onFindMiddle={handleFindMiddle} 
        onHideCards={handleHideCards}
      />
      
      <MiddlePlaceRecommendCard
        isVisible={uiState.showCardList}
        onCardClick={handleCardClick}
        onResetSelection={() => {
          if ((window as any).resetMiddlePlaceCardSelection) {
            (window as any).resetMiddlePlaceCardSelection();
          }
        }}
        cards={cards}
        currentView={uiState.currentView}
        selectedCardId={null} // 🎯 selectedCardId 제거됨
      />
      
      <FloatingNav
        onFriendClick={handleFriendClick}
        onScheduleClick={handleScheduleClick}
        onMeetingClick={handleMeetingClick}
      />
      
      {/* 🗑️ 제거: 삼육대학교 이스터 에그 */}
      {/* {showEasterEgg && (
        <div className={styles.easterEgg}>
          <div className={styles.easterEggContent}>
            <div className={styles.easterEggIcon}>🎓</div>
            <div className={styles.easterEggTitle}>삼육대학교 발견!</div>
            <div className={styles.easterEggMessage}>
              개발자의 모교를 찾으셨네요! 🎉
            </div>
          </div>
        </div>
      )} */}
      
      {/* 토스트 메시지 */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
        duration={3000}
      />

      {/* 모달들 */}
      <FriendsModal
        isVisible={modalState.showFriends}
        onClose={() => updateModalState({ showFriends: false })}
        currentUserId={1} // TODO: 실제 사용자 ID로 교체
      />
      
      <ScheduleModal
        isVisible={modalState.showSchedule}
        onClose={() => updateModalState({ showSchedule: false })}
        schedules={schedules}
        onRemoveSchedule={handleRemoveSchedule}

      />
      
      <MeetingModal
        isVisible={modalState.showMeeting}
        onClose={() => updateModalState({ showMeeting: false })}
      />
      
      <TransportInfoModal
        isVisible={modalState.showTransport}
        onClose={handleCloseTransportModal}
        stationName={modalState.selectedStationInfo?.name || ''}
        stationPosition={modalState.selectedStationInfo?.position || { lat: 0, lng: 0 }}
        friends={friends.map(friend => ({
          id: friend.id,
          name: friend.name,
          location: friend.location,
          position: friend.coordinates || { lat: 0, lng: 0 }
        }))}
        onRouteUpdate={(routes) => {
          console.log('TransportInfoModal에서 경로 업데이트:', routes);
        }}
        onMapRouteUpdate={(routes) => {
          console.log('TransportInfoModal에서 맵 경로 업데이트:', routes);
        }}
        isPlaceMode={modalState.selectedStationInfo?.name?.includes('→') || false}
        placePosition={modalState.selectedStationInfo?.placePosition}
        placeInfo={modalState.selectedStationInfo?.placeInfo}
        onAddSchedule={handleAddSchedule}
        middlePointData={modalState.selectedMiddlePointData}
      />
      
      {/* 🎯 약속 추가 확인 모달 */}
      <ScheduleConfirmModal
        isVisible={modalState.showScheduleConfirm}
        onClose={handleCloseScheduleConfirmModal}
        scheduleData={modalState.scheduleData}
        onSendInvitation={handleSendInvitation}
        onGoToSchedule={handleGoToSchedule}
      />


    </div>
  );
};

export default Home;
