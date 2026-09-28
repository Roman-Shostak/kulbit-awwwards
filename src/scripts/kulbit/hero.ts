/**
 * Tablet (480–991; the source started at 768) and mobile portrait (≤ 479) hero — one choreography (ADR-011), read
 * from the `-tablet` attributes on the same elements as the desktop ones (`data-kulbit-y-tablet`, `-scale-tablet`,
 * `-scale-from-tablet`, `-fade-tablet`; the header `[data-kulbit-header]` too):
 *   step 1  the attribute tweens + the sound button `[data-kulbit-sound]` moves to the centre of the visible screen
 *   step 2  `[data-hero-video]` shrinks to a 16:9 band at the top, section 2 slides in under it, the button moves
 *           to the centre of the band
 *   step 3  section 2 covers the screen = the move to section 1 (the hand-off)
 * Steps 2 and 3 need a second `[data-kulbit-section]`: with the hero alone the choreography is step 1 only.
 * The geometry (the 16:9 band, the button's targets) is measured once per build: a width change while the hero is
 * current rebuilds the breakpoint and puts it back on its step (./sections → handleResize, setTabletHeroStep).
 * The timeline is built with the unscaled lengths (config.timeline*) and played through playTimeline: under reduced
 * motion every step lands at once.
 * Source: kulbit-webflow `src/03-sections.js` → buildTabletHero, tabletHeroStep.
 */
import { gsap } from 'gsap';
import { app, config, num, persistSection, playTimeline, visibleHeight, type Direction } from './app';
import { updateVideoVisibility } from './video';

const SUFFIX = '-tablet';
let labels: (string | number)[] = [0];
let cleanup: (() => void) | null = null;
let builtWidth = 0;

/** The viewport width the current tablet hero was measured at (0 = not built) */
export const heroBuiltWidth = () => builtWidth;

/** Removes the resize listener of the hero video (a breakpoint change) */
export const teardownTabletHero = () => {
  cleanup?.();
  cleanup = null;
  builtWidth = 0;
};

export const buildTabletHero = () => {
  const hero = app.sections[0];
  if (!hero) return;
  const heroVideo = hero.el.querySelector<HTMLElement>('[data-hero-video]');
  if (!heroVideo) {
    console.error('[kulbit] the hero has no [data-hero-video]: the tablet hero is not built');
    return;
  }
  const section2 = app.sections[1]?.el ?? null;
  const button = hero.el.querySelector<HTMLElement>('[data-kulbit-sound]');

  const STEP = config.timelineStep;
  const EASE = config.ease;
  const has = (el: Element, name: string) => el.hasAttribute(`data-kulbit-${name}${SUFFIX}`);
  const value = (el: Element, name: string, fallback: number) => num(el, `data-kulbit-${name}${SUFFIX}`, fallback);
  const selector = `[data-kulbit-y${SUFFIX}],[data-kulbit-scale${SUFFIX}],[data-kulbit-fade${SUFFIX}]`;
  const header = document.querySelector('[data-kulbit-header]');
  const elements = [...hero.el.querySelectorAll(selector)];
  if (header?.matches(selector)) elements.push(header);

  // Step 0
  elements.forEach((el) => {
    const start: gsap.TweenVars = {};
    if (has(el, 'y')) start.yPercent = 0;
    if (has(el, 'scale')) {
      start.scale = value(el, 'scale-from', 1);
      start.transformOrigin = '50% 50%';
    }
    if (has(el, 'fade')) start.autoAlpha = 1;
    gsap.set(el, start);
  });
  // The video's full height comes from the REAL viewport: after a rotation this runs before the hero height
  // fix sets the final section height, and the video froze at an intermediate height
  const fullVideoHeight = () => window.visualViewport?.height || visibleHeight();
  const syncHeroVideoFull = () => {
    // Only while the hero is full (step 0) — never over the 16:9 band of step 2
    if (app.currentSectionIndex === 0 && app.currentStep === 0) gsap.set(heroVideo, { height: fullVideoHeight() });
  };
  gsap.set(heroVideo, { bottom: 'auto', height: fullVideoHeight() });
  if (section2) gsap.set(section2, { yPercent: 100 });
  if (button) gsap.set(button, { y: 0 });

  // 16:9 geometry from the RENDERED sizes, not innerHeight: on mobile the address bar makes 100vh (CSS) differ
  // from innerHeight (JS), and a gap would open between the band and section 2
  const video16h = Math.round((heroVideo.clientWidth * 9) / 16);
  const partial = section2 ? (video16h / section2.offsetHeight) * 100 : 0;
  let buttonYScreen = 0;
  let buttonY16 = 0;
  if (button) {
    const rect = button.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    buttonYScreen = visibleHeight() / 2 - center; // step 1: the centre of the visible screen
    buttonY16 = video16h / 2 - center; // step 2: the centre of the 16:9 band
  }

  const timeline = gsap.timeline({ paused: true });
  elements.forEach((el) => {
    const to: gsap.TweenVars = { duration: STEP, ease: EASE };
    if (has(el, 'y')) to.yPercent = value(el, 'y', 0);
    if (has(el, 'scale')) to.scale = value(el, 'scale', 1);
    if (has(el, 'fade')) to.autoAlpha = value(el, 'fade', 0);
    timeline.to(el, to, 0);
  });
  if (button) timeline.to(button, { y: buttonYScreen, duration: STEP, ease: EASE }, 0);
  timeline.addLabel('s1');
  if (section2) {
    timeline.to(heroVideo, { height: video16h, duration: STEP, ease: EASE }, 's1');
    timeline.to(section2, { yPercent: partial, duration: STEP, ease: EASE }, 's1');
    if (button) timeline.to(button, { y: buttonY16, duration: STEP, ease: EASE }, 's1');
    timeline.addLabel('s2');
    timeline.to(section2, { yPercent: 0, duration: config.timelineScroll, ease: EASE }, 's2');
    timeline.addLabel('s3');
  }
  labels = section2 ? [0, 's1', 's2', 's3'] : [0, 's1'];

  hero.tabletTL = timeline;
  hero.isTabletHero = true;
  app.currentStep = 0;

  // Re-sync the video height after a rotation / viewport change (the hero height fix lands asynchronously)
  teardownTabletHero();
  builtWidth = window.innerWidth;
  let timer = 0;
  const onResize = () => {
    clearTimeout(timer);
    timer = window.setTimeout(syncHeroVideoFull, 200);
  };
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  const initialSync = window.setTimeout(syncHeroVideoFull, 250);
  cleanup = () => {
    clearTimeout(timer);
    clearTimeout(initialSync);
    window.removeEventListener('resize', onResize);
    window.visualViewport?.removeEventListener('resize', onResize);
  };
};

/** Puts the current tablet hero on its `step` (0–2) at once, after a rebuild for a new width */
export const setTabletHeroStep = (step: number) => {
  const timeline = app.sections[0]?.tabletTL;
  if (!timeline || app.currentSectionIndex !== 0 || step <= 0 || step >= labels.length) return;
  timeline.pause(labels[step]);
  app.currentStep = step;
};

/**
 * One gesture on the tablet hero; `true` = handled. On the hero it steps the timeline; the last step hands over
 * to section 1. Going up from section 1 rewinds the choreography (section 2 back to the band, the video full)
 * instead of the regular stacking move — once section 1's own controller is back at its start.
 */
export const tabletHeroStep = (dir: Direction) => {
  const hero = app.sections[0];
  const timeline = hero?.tabletTL;
  if (!timeline) return false;
  const max = labels.length - 1;
  const handOff = max === 3;
  const index = app.currentSectionIndex;

  if (index === 0) {
    if (dir > 0 && app.currentStep < max) {
      app.isAnimating = true;
      const next = app.currentStep + 1;
      playTimeline(timeline, labels[next], undefined, () => {
        app.isAnimating = false;
        if (handOff && next === max) {
          app.currentSectionIndex = 1;
          app.currentStep = 0;
          persistSection(); // hero → section 1 bypasses goToSection
          updateVideoVisibility();
          app.sections[1]?.controller?.enter?.(); // section 1 covered the screen: its appearance
        } else app.currentStep = next;
      });
    } else if (dir < 0 && app.currentStep > 0) {
      app.isAnimating = true;
      const next = app.currentStep - 1;
      playTimeline(timeline, labels[next], undefined, () => {
        app.isAnimating = false;
        app.currentStep = next;
      });
    }
    return true; // the hero is fully under the tablet logic
  }
  if (handOff && index === 1 && dir < 0) {
    const controller = app.sections[1]?.controller;
    // Section 1 not at its own start: it rewinds first (advance calls its step)
    if (controller && (controller.state ?? 0) > 0) return false;
    app.isAnimating = true;
    app.currentSectionIndex = 0;
    persistSection(); // section 1 → hero bypasses goToSection
    controller?.prepare?.(); // hidden again for its next appearance
    updateVideoVisibility();
    playTimeline(timeline, labels[max - 1], undefined, () => {
      app.isAnimating = false;
      app.currentStep = max - 1;
    });
    return true;
  }
  return false; // the regular stacking move
};
