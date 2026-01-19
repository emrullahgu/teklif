import React from 'react'
import ReactDOM from 'react-dom/client'
import SimpleAppWithAuth from './SimpleAppWithAuth.jsx'
import './index.css'

const rootElement = document.getElementById('root');

// Sadece bir kez root oluştur
if (!rootElement.__root) {
  rootElement.__root = ReactDOM.createRoot(rootElement);
  rootElement.__root.render(
    <React.StrictMode>
      <SimpleAppWithAuth />
    </React.StrictMode>
  );
}
