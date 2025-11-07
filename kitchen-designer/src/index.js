import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import LoadingAnimation from './components/LoadingAnimation';

const App = React.lazy(() => import('./App'));

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <React.Suspense fallback={<LoadingAnimation />}>
      <App />
    </React.Suspense>
  </React.StrictMode>
);



