import styles from './Home.module.css';
import Header from '../../components/Header';
import FadeIn from '@/components/FadeIn';
import KakaoMap from '../../components/KakaoMap';
import { KAKAO_MAP_APP_KEY } from '../../constants/config';
import PaperDrawer from '@/components/PaperDrawer';
import FloatingNav from '@/components/FloatingNav';

// 랜덤 좌표 생성 함수
const generateRandomLocation = () => {
  // 서울 지역 내 랜덤 좌표 (위도: 37.4~37.7, 경도: 126.8~127.2)
  const lat = 37.4 + Math.random() * 0.3;
  const lng = 126.8 + Math.random() * 0.4;
  return { lat, lng };
};

const Home = () => {
  // 컴포넌트가 마운트될 때마다 랜덤 좌표 생성
  const randomLocation = generateRandomLocation();

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
          center={randomLocation}
          level={5}
          zoomable={false}
          scrollwheel={false}
          disableDoubleClickZoom={true}
          disableDoubleTapZoom={true}
          draggable={false}
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
