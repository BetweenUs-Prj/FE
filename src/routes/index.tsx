import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import About from '../pages/About';
import GameHomePage from '../pages/Game/GameHomePage';
import PenaltyPage from '../pages/Game/PenaltyPage';
import CategoryPage from '../pages/Game/CategoryPage';
import QuizPage from '../pages/Game/QuizPage';
import ReactionPage from '../pages/Game/ReactionPage';
import ResultPage from '../pages/Game/ResultPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      {/* Game namespace */}
      <Route path="/game" element={<GameHomePage />} />
      {/* penalty can be invoked either with a session id (legacy) or via query string */}
      <Route path="/game/penalty" element={<PenaltyPage />} />
      <Route path="/game/penalty/:sessionId" element={<PenaltyPage />} />
      <Route path="/game/category/:sessionId" element={<CategoryPage />} />
      <Route path="/game/quiz/:sessionId" element={<QuizPage />} />
      <Route path="/game/quiz/:sessionId/round/:roundId" element={<QuizPage />} />
      <Route path="/game/reaction/:sessionId" element={<ReactionPage />} />
      <Route path="/game/result/:sessionId" element={<ResultPage />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}