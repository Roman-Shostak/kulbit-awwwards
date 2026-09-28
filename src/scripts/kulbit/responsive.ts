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
 * section. Each build step is isolated: a failing builder is reported and the rest still build, the saved section is
 * restored and teardownHero is returned. Leaving a branch GSAP reverts everything created inside it; teardownHero
 * kills the engine's in-flight tweens and drops our references.
 *
 * Landscape phone: `(orientation: landscape) and (max-height: 500px) and (pointer: coarse)` shows
 * `[data-kulbit-landscape-popup]` (src/components/sections/LandscapePopup.astro in the header slot, rendered
 * `hidden`, a modal: role="dialog" aria-modal="true" tabindex="-1"), turns the navigation off and pauses every
 * video; while it is shown everything behind it is inert (every sibling on its way up to <body>: the header's other
 * children, main, the footer, the skip link) and the focus is on it.
 */
import { gsap } from 'gsap';
import { app, config, sectionBuilders, type Breakpoint } from './app';
import { buildTabletHero } from './hero';
import { buildDesktopAnimations, resetHeroState, restoreSection, syncFadeInert, teardownHero } from './sections';
import { updateVideoVisibility } from './video';

const attempt = (what: string, run: () => void) => {
  try {
    run();
  } catch (error) {
    console.error(`[kulbit] ${what} failed; the rest still builds`, error);
  }
};

const branch = (mode: Breakpoint) => () => {
  attempt('resetting the hero', resetHeroState);
  attempt('building the hero', mode === 'desktop' ? buildDesktopAnimations : buildTabletHero);
  sectionBuilders.forEach((build) => attempt('a section builder', () => build(mode)));
  attempt('restoring the section', restoreSection);
  return teardownHero;
};

export const registerAnimations = () => {
  app.mm?.kill();
  app.mm = gsap.matchMedia();
  app.mm.add('(min-width: 992px)', branch('desktop'));
  app.mm.add('(min-width: 480px) and (max-width: 991px)', branch('tablet'));
  app.mm.add('(max-width: 479px)', branch('mobile'));
};

/** Re-applies the landscape state (./project-video calls it after a fullscreen change) */
export let reapplyResponsive = () => {};

export const setupLandscape = () => {
  const popup = document.querySelector<HTMLElement>('[data-kulbit-landscape-popup]');
  if (!popup) return;
  const query = window.matchMedia(
    `(orientation: landscape) and (max-height: ${config.landscapeMaxHeight}px) and (pointer: coarse)`,
  );
  // Behind the popup: every sibling on its way up to <body> — the header's other children (the logo, the menu), main,
  // the footer, the skip link
  const behind = () => {
    const list: HTMLElement[] = [];
    for (let el: HTMLElement | null = popup; el && el !== document.body; el = el.parentElement) {
      const parent: HTMLElement | null = el.parentElement;
      if (!parent) break;
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== el && sibling instanceof HTMLElement) list.push(sibling);
      }
    }
    return list;
  };
  let inerted: HTMLElement[] = []; // only what we made inert (the menu panel keeps its own)
  const show = (shown: boolean) => {
    if (shown === !popup.hidden) return;
    popup.hidden = !shown;
    if (shown) {
      inerted = behind().filter((el) => !el.inert);
      inerted.forEach((el) => {
        el.inert = true;
      });
      popup.focus({ preventScroll: true });
    } else {
      inerted.forEach((el) => {
        el.inert = false;
      });
      inerted = [];
      syncFadeInert(); // a faded element stays inert (./sections → watchFades waited while the popup was up)
    }
  };
  const apply = () => {
    // A video in fullscreen: a rotation must neither show the popup nor pause it
    if (app.videoFullscreen) {
      app.landscapeBlocked = false;
      show(false);
      return;
    }
    app.landscapeBlocked = query.matches;
    // A modal popup (the contact form) would stay above the rotate screen in the top layer: it closes (its own close
    // handler keeps the navigation off while the rotate screen is up)
    if (query.matches) document.querySelector<HTMLDialogElement>('dialog:modal')?.close();
    show(query.matches);
    if (query.matches) app.observer?.disable();
    // a modal popup open over the page (the contact popup) keeps the navigation off: it enables it when it closes
    else if (!document.querySelector('dialog:modal')) app.observer?.enable();
    updateVideoVisibility();
  };
  reapplyResponsive = apply;
  query.addEventListener('change', apply);
  setTimeout(apply, 0);
};
