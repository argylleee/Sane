// OWNER: frontend. UI wiring only.
import { StrictMode } from 'react';
import { MotionConfig } from 'motion/react';
import { createRoot } from 'react-dom/client';
import { inject as injectAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { App } from './ui/App';
import { UpdatePrompt } from './ui/UpdatePrompt';
// Bundled locally so phones without Inter installed get the same type, offline too.
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/inter/wght-italic.css';
import './styles.css';

// Page views and load-speed metrics only, sent to our own origin by Vercel (see RULES.md rule 13).
// Never pass message text here. Skipped in dev and tests so local runs stay silent.
if (import.meta.env.PROD) {
  injectAnalytics();
  injectSpeedInsights();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}>
      <App />
    </MotionConfig>
    <UpdatePrompt />
  </StrictMode>,
);
