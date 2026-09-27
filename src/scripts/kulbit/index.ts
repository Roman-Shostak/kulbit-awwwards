/**
 * Kulbit step scroll — entry (loaded by `<BaseLayout steps>`). Port of the production GSAP navigation of the
 * Webflow build (github.com/Roman-Shostak/kulbit-webflow, branch `prod`, `src/01…13-*.js`, docs/adr.md):
 * no free scroll, the sections stack on top of each other, one gesture = one step or one section.
 *
 *   app.ts            state + config (the source's window.KulbitApp), SectionController, registerSectionBuilder
 *   observer.ts       wheel / touch (Observer, inertia filter, direction by event type) + keyboard
 *   sections.ts       registration, stacking, reveal steps, desktop attribute timelines, goToSection, advance
 *   hero.ts           tablet / mobile hero choreography (3 steps, hand-off to section 1)
 *   responsive.ts     gsap.matchMedia breakpoints + the landscape phone popup
 *   video.ts          native <video>: play / pause / mute by visibility, the sound toggle
 *   navigation.ts     [data-target-section] / [data-target-step] buttons
 *   hero-height.ts    the hero's height = visualViewport height
 *   button-border.ts  [data-kulbit-border] hover border
 *   scramble.ts       [data-kulbit-scramble] / [data-kulbit-typewriter] texts written on entering the screen (ADR-017)
 *
 * LEFT TO PORT — each with its section, as a `registerSectionBuilder((mode) => …)` that sets `section.controller`
 * (source file → functions):
 *   projects           03-sections.js buildProjects (l. 507–644: window swap WIN, slotHeight, resetItem, progress);
 *                      10-project-video.js initProjectVideo (custom controls, registry / pauseOthers, fullscreen →
 *                      app.videoFullscreen + reapplyResponsive from ./responsive; its records → registerVideo in ./video)
 *   our services       03-sections.js buildHSwipe (l. 645–764)
 *   working process    03-sections.js buildWorkingProcess (l. 765–1045: revealTL, stepTo, setStateInstant, SVG clones)
 *   traditional prod.  03-sections.js buildTraditional (l. 1178–1495: radar, data-kulbit-progress)
 *   footer             03-sections.js buildFooterScroll + FT_STEP_RATIO (l. 1087–1177, tablet / mobile only: its
 *                      controller's prepare() = reset()); 13-misc.js copyright year (#copyright-year)
 *   popup form         07-popup-form.js — empty in the source (placeholder)
 *   landscape popup    only its markup: `[data-kulbit-landscape-popup] hidden` (the logic is in ./responsive)
 * Ported with their sections: our clients (buildOurClients → src/components/sections/OurClients.astro).
 * 05-header.js is empty in the source: the header moves only through its data-kulbit-* attributes (hero timeline).
 */
import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { app } from './app';
import { setupButtonBorders } from './button-border';
import { setupHeroHeight } from './hero-height';
import { setupNavigation } from './navigation';
import { setupKeyboard, setupObserver } from './observer';
import { registerAnimations, setupLandscape } from './responsive';
import { setupScramble } from './scramble';
import { handleResize, registerSections, registerSteps, setupStacking } from './sections';
import { setupVideos } from './video';

export { registerSectionBuilder, type SectionController } from './app';

gsap.registerPlugin(Observer);

const init = () => {
  const content = document.querySelector<HTMLElement>('main[data-scenes]');
  if (app.initialized || !content) return;
  app.initialized = true;
  app.content = content;
  app.wrapper = content.parentElement;
  document.documentElement.dataset.steps = '';
  window.scrollTo(0, 0);

  registerSections();
  if (!app.sections.length) return;
  setupStacking();
  registerSteps();
  setupVideos(); // before the breakpoints: resetHeroState starts the hero video
  // A broken section build must never kill the navigation of the whole site
  try {
    registerAnimations();
  } catch (error) {
    console.error('[kulbit] building the sections failed; the navigation still starts', error);
  }
  setupObserver();
  setupKeyboard();
  window.addEventListener('resize', handleResize);
  setupNavigation();
  setupLandscape();
  setupHeroHeight();
  setupButtonBorders();
  setupScramble();
};

// Module scripts run before DOMContentLoaded: waiting for it lets every section script register its builder first
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
