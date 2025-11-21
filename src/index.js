import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// start mock worker in development when REACT_APP_USE_API is false
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_API === 'false') {
  // eslint-disable-next-line no-console
  console.info('Starting dev fetch mock (frontend-only mock)');
  import('./mocks/browser').then(({ start }) => start());
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);