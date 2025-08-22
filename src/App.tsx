import { Outlet } from 'react-router-dom';
import { TransitionProvider } from './contexts/TransitionContext';
import GlobalTransitionOverlay from './components/GlobalTransitionOverlay';
import './styles/App.css';

function App() {
  return (
    <TransitionProvider>
      <div className="App">
        <Outlet />
        <GlobalTransitionOverlay />
      </div>
    </TransitionProvider>
  );
}

export default App;
