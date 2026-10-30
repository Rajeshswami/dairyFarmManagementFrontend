import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  BrowserRouter,
} from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';

import './index.css';

import App from './App';

import {
  AuthProvider,
} from './context/AuthContext';

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
// Load the final visual theme after Bootstrap, legacy global CSS, and page CSS.
import './modern-organic-palette.css';

// Reference-inspired solid pastel card system; intentionally loaded last.
import './soft-card-dairy-theme.css';

// Apply the shared soft-card design consistently to every module.
import './soft-card-pages.css';
