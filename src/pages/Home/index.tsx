import './Home.css';
import Header from '../../components/Header';
import FadeIn from '@/components/FadeIn';
import KakaoMap from '../../components/KakaoMap';
import { KAKAO_MAP_APP_KEY, MAP_PRESETS } from '../../constants/config';

const Home = () => {
  return (
    <div className="home-page">
      <Header />
      <div className="map-background">
        <KakaoMap
          containerId="home-map"
          {...MAP_PRESETS.SEOUL}
          zoomable={false}
          scrollwheel={false}
          disableDoubleClickZoom={true}
          disableDoubleTapZoom={true}
          draggable={true}
          appKey={KAKAO_MAP_APP_KEY}
          className="home-map-container"
        />
        <div className="home-content">
          <FadeIn delay={0.2} direction="up">
            <h1 className="home-title">우리 사이</h1>
            <p className="map-description">
              친구들과의 만남 장소를 쉽게 찾아보세요
            </p>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default Home;
