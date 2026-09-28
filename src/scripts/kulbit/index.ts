/**
 * Kulbit step scroll — entry (loaded by `<BaseLayout steps>`). Port of the production GSAP navigation of the
 * Webflow build (github.com/Roman-Shostak/kulbit-webflow, branch `prod`, `src/01…13-*.js`, docs/adr.md):
 * no free scroll, the sections stack on top of each other, one gesture = one step or one section.
 *
 *   app.ts            state + config (the source's window.KulbitApp), SectionController, registerSectionBuilder
 *   observer.ts       wheel / touch (Observer, inertia filter, direction by event type) + keyboard
 *   sections.ts       registration, stacking, reveal steps, desktop attribute timelines, goToSection, advance, the
 *                     button jump (autoAdvanceTo), the resize within a breakpoint
 *   hero.ts           tablet / mobile hero choreography (3 steps, hand-off to section 1)
 *   responsive.ts     gsap.matchMedia breakpoints + the landscape phone popup
 *   video.ts          native <video>: play / pause / mute by visibility, the sound toggle, the visitor's pause of the
 *                     background videos, warming the lazy media of the stack
 *   navigation.ts     [data-target-section] buttons + the keyboard focus that shows its screen
 *   hero-height.ts    the hero's height = visualViewport height
 *   button-border.ts  [data-kulbit-border] hover border
 *   scramble.ts       [data-kulbit-scramble] / [data-kulbit-typewriter] texts written on entering the screen (ADR-017)
 *   project-video.ts  the project video player (ADR-014/016), started by src/components/ui/ProjectVideo.astro
 *
 * LEFT TO PORT — each with its section, as a `registerSectionBuilder((mode) => …)` that sets `section.controller`
 * (source file → functions):
 *   popup form         07-popup-form.js — empty in the source (placeholder)
 * Ported with their sections: our clients (buildOurClients → src/components/sections/OurClients.astro), projects
 * (buildProjects → src/components/sections/Projects.astro), our services (buildHSwipe →
 * src/components/sections/OurServices.astro), working process (buildWorkingProcess →
 * src/components/sections/WorkingProcess.astro), traditional production (buildTraditional →
 * src/components/sections/TraditionalProduction.astro), the footer (buildFooterScroll →
 * src/components/sections/SiteFooter.astro; 13-misc.js's copyright year is site.copyrightYear at build time), the
 * landscape popup (its markup src/components/sections/LandscapePopup.astro, its logic ./responsive).
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
import { handleResize, registerSections, registerSteps, setupStacking, watchFades } from './sections';
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
  watchFades(); // before the first fade: an element faded to 0 is inert
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
