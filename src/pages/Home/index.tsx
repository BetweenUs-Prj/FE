
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
    // 상태
    showCardList,
    showHomeContent,
    isHomeContentFading,
    currentView,
    cards,
    mapCenter,
    mapLevel,
    mapMarkers,
    mapRoutes,
    selectedCardId,
    showEasterEgg,
    friends,
    mapInteraction,
    toast,
    showTransportModal,
    selectedStationInfo,
    showScheduleConfirmModal,
    scheduleData,
    showFriendsModal,
    showScheduleModal,
    showMeetingModal,
    schedules,
    
    // 핸들러
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
    handleRemoveSchedule = () => {},
    
    // 액션
    setShowFriendsModal,
    setShowScheduleModal,
    setShowMeetingModal,
    setShowTransportModal
  } = useHomeLogic();

  return (
    <div className={styles.homePage}>
      <Header />
      <div className={styles.mapBackground}>
                <KakaoMap
          containerId="home-map"
          center={mapCenter}
          level={mapLevel}
          zoomable={mapInteraction.zoomable}
          draggable={mapInteraction.draggable}
          appKey={KAKAO_MAP_APP_KEY}
          className={styles.homeMapContainer}
          markers={mapMarkers}
          routes={mapRoutes}
          disableAutoCenter={false}
          onMarkerClick={(marker) => {
            console.log('KakaoMap에 전달된 markers:', mapMarkers);
            // 친구 마커 클릭 처리
            if (marker.id.startsWith('friend-')) {
              const friendId = parseInt(marker.id.replace('friend-', ''));
              const friend = friends.find(f => f.id === friendId);
              if (friend) {
                console.log(`친구 마커 클릭: ${friend.name} - ${friend.location}`);
                
                // 경로는 유지 (기존 경로가 있으면 그대로 유지)
                console.log('친구 마커 클릭 - 기존 경로 유지, 현재 경로 개수:', mapRoutes.length);
                
                // 경로가 사라지지 않도록 명시적으로 다시 설정 (같은 경로)
                if (mapRoutes.length > 0) {
                  console.log('기존 경로 유지를 위해 경로 재설정');
                  // setMapRoutes([...mapRoutes]); // 같은 경로를 다시 설정하여 유지
                }
              }
              return;
            }
          }}
        />
      </div>
      
      {showHomeContent && (
        <div className={`${styles.homeContent} ${isHomeContentFading ? styles.fadeOut : ''}`}>
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
        isVisible={showCardList}
        onCardClick={handleCardClick}
        onResetSelection={() => {
          if ((window as any).resetMiddlePlaceCardSelection) {
            (window as any).resetMiddlePlaceCardSelection();
          }
        }}
        cards={cards}
        currentView={currentView}
        selectedCardId={selectedCardId}
      />
      
      <FloatingNav
        onFriendClick={handleFriendClick}
        onScheduleClick={handleScheduleClick}
        onMeetingClick={handleMeetingClick}
      />
      
      {/* 삼육대학교 이스터 에그 */}
      {showEasterEgg && (
        <div className={styles.easterEgg}>
          <div className={styles.easterEggContent}>
            <div className={styles.easterEggIcon}>🎓</div>
            <div className={styles.easterEggTitle}>삼육대학교 발견!</div>
            <div className={styles.easterEggMessage}>
              개발자의 모교를 찾으셨네요! 🎉
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

      {/* 모달들 */}
      <FriendsModal
        isVisible={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
      />
      
      <ScheduleModal
        isVisible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        schedules={schedules}
        onRemoveSchedule={handleRemoveSchedule}
      />
      
      <MeetingModal
        isVisible={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
      />
      
      <TransportInfoModal
        isVisible={showTransportModal}
        onClose={() => {
          console.log('TransportInfoModal 닫기');
          setShowTransportModal(false);
        }}
        stationName={selectedStationInfo?.name || ''}
        stationPosition={selectedStationInfo?.position || { lat: 0, lng: 0 }}
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
        isPlaceMode={selectedStationInfo?.name?.includes('→') || false}
        placePosition={selectedStationInfo?.placePosition}
        placeInfo={selectedStationInfo?.placeInfo}
        onAddSchedule={handleAddSchedule}
      />
      
      {/* 🎯 약속 추가 확인 모달 */}
      <ScheduleConfirmModal
        isVisible={showScheduleConfirmModal}
        onClose={handleCloseScheduleConfirmModal}
        scheduleData={scheduleData}
        onSendInvitation={handleSendInvitation}
        onGoToSchedule={handleGoToSchedule}
      />
    </div>
  );
};

export default Home;
