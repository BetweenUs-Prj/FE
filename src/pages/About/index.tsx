import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <div className="about-container">
      <div className="about-content">
        <h1 className="about-title">
          우리사이에 대하여
        </h1>
        <p className="about-description">
          우리사이는 함께하는 공간을 만들어가는 플랫폼입니다. 
          서로의 이야기를 나누고, 함께 성장할 수 있는 환경을 제공합니다.
        </p>
        <div className="about-buttons">
          <Link to="/" className="about-button">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
