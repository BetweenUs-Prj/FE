import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/Home';
import AboutPage from '../pages/About';
import GameHomePage from '../pages/Game/GameHomePage';
import GameCreatePage from '../pages/Game/GameCreatePage';
import QuizLobbyPage from '../pages/Game/QuizLobbyPage';
import QuizLobbySessionPage from '../pages/Game/QuizLobbySessionPage';
import QuizGamePage from '../pages/Game/QuizGamePage';
import ReactionLobbyPage from '../pages/Game/ReactionLobbyPage';
import ReactionLobbySessionPage from '../pages/Game/ReactionLobbySessionPage';
import StableReactionPage from '../pages/Game/StableReactionPage';
import ReactionResultPage from '../pages/Game/ReactionResultPage';
import ReactionGameREST from '../pages/Game/ReactionGameREST';
import ResultPageREST from '../pages/Game/ResultPageREST';
import PenaltyPage from '../pages/Game/PenaltyPage';
import JoinPage from '../pages/Game/JoinPage';
import AppointmentPage from '../pages/Appointment/AppointmentPage';
import GlassPreviewPage from '../pages/dev/GlassPreview';
import ReactionSpeedDemo from '../pages/dev/ReactionSpeedDemo';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GameHomePage />} />
      <Route path="/about" element={<AboutPage />} />
      
      {/* 게임 관련 라우트 */}
      <Route path="/game" element={<HomePage />} />
      <Route path="/game/choice" element={<GameHomePage />} />
      <Route path="/game/create" element={<GameCreatePage />} />
      
      {/* 퀴즈 게임 */}
      <Route path="/game/quiz/lobby" element={<QuizLobbyPage />} />
      <Route path="/game/quiz/lobby/:sessionId" element={<QuizLobbySessionPage />} />
      {/* 👇 More SPECIFIC route comes FIRST */}
      <Route path="/game/quiz/result/:sessionId" element={<ResultPageREST />} />
      {/* 👇 More GENERAL route comes LAST */}
      <Route path="/game/quiz/:sessionId" element={<QuizGamePage />} />
      
      {/* 반응속도 게임 */}
      <Route path="/game/reaction/lobby" element={<ReactionLobbyPage />} />
      <Route path="/game/reaction/lobby/:sessionId" element={<ReactionLobbySessionPage />} />
      {/* 👇 More SPECIFIC route comes FIRST */}
      <Route path="/game/reaction/result/:sessionId" element={<ResultPageREST />} />
      <Route path="/game/reaction/play/:sessionId" element={<ReactionGameREST />} />
      {/* 👇 More GENERAL route comes LAST */}
      <Route path="/game/reaction/:sessionId" element={<StableReactionPage />} />
      
      {/* 공통 */}
      <Route path="/game/result/:sessionId" element={<ResultPageREST />} />
      <Route path="/game/penalty" element={<PenaltyPage />} />
      <Route path="/game/join" element={<JoinPage />} />
      <Route path="/join" element={<JoinPage />} />
      
      {/* 약속 페이지 */}
      <Route path="/appointment" element={<AppointmentPage />} />
      
      {/* 개발용 */}
      <Route path="/dev/glass" element={<GlassPreviewPage />} />
      <Route path="/demo/reaction" element={<ReactionSpeedDemo />} />
    </Routes>
  );
}