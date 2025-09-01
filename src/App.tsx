import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { ToastContainer } from './components/common/Toast';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}