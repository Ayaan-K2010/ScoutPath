import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router';
import { routes } from './routes';

// Hash routing is for hosts that cannot rewrite deep links to index.html (`npm run build:hash`).
const router = import.meta.env.VITE_ROUTER === 'hash' ? createHashRouter(routes) : createBrowserRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
