import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App = React.lazy(() => import('./App'));

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <React.Suspense fallback={
      <div style={{ 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        display: 'flex', 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <img 
          style={{
            width: '80%',
            maxWidth: '400px', // Prevent too large on desktop
            height: 'auto', // Maintain aspect ratio
            display: 'block',
            animation: 'pulse 2s ease-in-out infinite'
          }} 
          src="/O.webp" 
          alt="Gudino Custom Cabinets Loading..." 
          loading="eager" // Load immediately
          decoding="async" // Decode asynchronously
        />
        <p style={{
          color: '#fff',
          fontSize: '18px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0
        }}>Loading...</p>
      </div>
    }>
      <App />
    </React.Suspense>
  </React.StrictMode>
);


