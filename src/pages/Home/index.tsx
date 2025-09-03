import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">
          우리사이
        </h1>
        <p className="home-subtitle">
          함께하는 공간, 우리만의 이야기
        </p>
        <div className="home-buttons">
          <Link to="/about" className="home-button">
            시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}
