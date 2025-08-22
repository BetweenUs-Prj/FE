import styles from './Home.module.css';
import Header from '../../components/Header';
import FadeIn from '@/components/FadeIn';
import KakaoMap from '../../components/KakaoMap';
import { KAKAO_MAP_APP_KEY, MAP_PRESETS } from '../../constants/config';
import PaperDrawer from '@/components/PaperDrawer';
import FloatingNav from '@/components/FloatingNav';

const Home = () => {
  const handleFriendClick = () => {
    console.log('친구 메뉴 클릭');
    // TODO: 친구 관리 페이지로 이동
  };

  const handleScheduleClick = () => {
    console.log('일정 메뉴 클릭');
    // TODO: 일정 관리 페이지로 이동
  };

  const handleMeetingClick = () => {
    console.log('만남 메뉴 클릭');
    // TODO: 만남 관리 페이지로 이동
  };

  return (
    <div className={styles.homePage}>
      <Header />
      <div className={styles.mapBackground}>
        <KakaoMap
          containerId="home-map"
          {...MAP_PRESETS.SEOUL}
          zoomable={false}
          scrollwheel={false}
          disableDoubleClickZoom={true}
          disableDoubleTapZoom={true}
          draggable={true}
          appKey={KAKAO_MAP_APP_KEY}
          className={styles.homeMapContainer}
        />
      </div>
      <div className={styles.homeContent}>
          <FadeIn delay={0.2} direction="up">
            <h1 className={styles.homeTitle}>우리 사이</h1>
            <p className={styles.mapDescription}>
              친구들과의 만남 장소를 쉽게 찾아보세요
            </p>
          </FadeIn>
        </div>
      <PaperDrawer />
      <FloatingNav
        onFriendClick={handleFriendClick}
        onScheduleClick={handleScheduleClick}
        onMeetingClick={handleMeetingClick}
      />
    </div>
  );
};

export default Home;
