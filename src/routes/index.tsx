import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Landing from '../pages/Landing';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      // 추가 라우트들을 여기에 정의할 수 있습니다
      // {
      //   path: 'about',
      //   element: <About />,
      // },
      // {
      //   path: 'contact',
      //   element: <Contact />,
      // },
      // {
      //   path: 'login',
      //   element: <Login />,
      // },
    ],
  },
]);
