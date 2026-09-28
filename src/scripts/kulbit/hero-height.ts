/**
 * The hero's height = the real visible height (visualViewport), not 100vh: on iOS / Arc Mobile 100vh includes
 * the browser UI and the bottom-aligned hero content would hide behind it. Runs after the stacking (which gives
 * every section 100% of the fixed viewport) and overrides the hero (section 0) only.
 * Source: kulbit-webflow `src/12-hero-vh.js` (it matched `.section.is-hero`; the hero is always section 0 here).
 */
import { app, realViewportHeight } from './app';

export const setupHeroHeight = () => {
  const hero = app.sections[0]?.el;
  if (!hero) return;
  const apply = () => {
    hero.style.height = `${realViewportHeight()}px`;
  };
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(apply);
  };
  apply();
  window.visualViewport?.addEventListener('resize', schedule);
  window.addEventListener('resize', schedule);
  // After a rotation the browser reports the final height a little later
  window.addEventListener('orientationchange', () => setTimeout(apply, 150));
};
