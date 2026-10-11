// OWNER: frontend. UI wiring only.
import { StrictMode } from 'react';
import { MotionConfig } from 'motion/react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { UpdatePrompt } from './ui/UpdatePrompt';
// Bundled locally so phones without Inter installed get the same type, offline too.
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/inter/wght-italic.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}>
      <App />
    </MotionConfig>
    <UpdatePrompt />
  </StrictMode>,
);
