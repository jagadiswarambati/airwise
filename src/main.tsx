import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';

// Minimal shell placeholder for Phase A foundation
export function App(): React.JSX.Element {
  return (
    <main style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto' }}>
      <h1>AirWise</h1>
      <p>Clean-Air Decision Assistant — Phase A Foundation &amp; Domain Core Ready.</p>
    </main>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

