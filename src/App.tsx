import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { ToastContainer } from './components/common/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  );
}