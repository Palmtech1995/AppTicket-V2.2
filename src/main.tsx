/**
 * ============================================================================
 * [ENTRY POINT: CLIENT-SIDE REACT MOUNT]
 * File: /src/main.tsx
 * Description: Main React 18 entry point initializing the Root DOM tree
 *              with StrictMode and Tailwind CSS global styles.
 * ============================================================================
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
