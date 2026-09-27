/**
 * Breakpoints (ADR-011/012) and the landscape phone (ADR-004).
 * Source: kulbit-webflow `src/03-sections.js` → registerAnimations; `src/06-responsive.js`.
 *
 * gsap.matchMedia rebuilds the hero without a reload (Webflow's breakpoints 992 / 768 / 479):
 *   ≥ 992      desktop attribute timelines
 *   480–991    the tablet hero choreography (the source started at 768: a portrait tablet of 744 — the tablet
 *              frame itself, iPad mini — got no hero step at all; the landscape phone is the popup's case, below)
 *   ≤ 479      the same choreography (mobile portrait = tablet)
 * Every branch starts clean on the hero, builds the hero, runs the section builders, then restores the saved
 * section. Leaving a branch GSAP reverts everything created inside it; teardownHero drops our references.
 *
 * Landscape phone: `(orientation: landscape) and (max-height: 500px) and (pointer: coarse)` shows
 * `[data-kulbit-landscape-popup]` (rendered with `hidden`), turns the navigation off and pauses every video.
 */
import { gsap } from 'gsap';
import { app, config, sectionBuilders, type Breakpoint } from './app';
import { buildTabletHero } from './hero';
import { buildDesktopAnimations, resetHeroState, restoreSection, teardownHero } from './sections';
import { updateVideoVisibility } from './video';

const branch = (mode: Breakpoint) => () => {
  resetHeroState();
  if (mode === 'desktop') buildDesktopAnimations();
  else buildTabletHero();
  sectionBuilders.forEach((build) => build(mode));
  restoreSection();
  return teardownHero;
};

export const registerAnimations = () => {
  app.mm?.kill();
  app.mm = gsap.matchMedia();
  app.mm.add('(min-width: 992px)', branch('desktop'));
  app.mm.add('(min-width: 480px) and (max-width: 991px)', branch('tablet'));
  app.mm.add('(max-width: 479px)', branch('mobile'));
};

/** Re-applies the landscape state (the future project-video module calls it after a fullscreen change) */
export let reapplyResponsive = () => {};

export const setupLandscape = () => {
  const popup = document.querySelector<HTMLElement>('[data-kulbit-landscape-popup]');
  if (!popup) return;
  const query = window.matchMedia(
    `(orientation: landscape) and (max-height: ${config.landscapeMaxHeight}px) and (pointer: coarse)`,
  );
  const apply = () => {
    // A video in fullscreen: a rotation must neither show the popup nor pause it
    if (app.videoFullscreen) {
      app.landscapeBlocked = false;
      popup.hidden = true;
      return;
    }
    app.landscapeBlocked = query.matches;
    popup.hidden = !query.matches;
    if (query.matches) app.observer?.disable();
    else app.observer?.enable();
    updateVideoVisibility();
  };
  reapplyResponsive = apply;
  query.addEventListener('change', apply);
  setTimeout(apply, 0);
};
