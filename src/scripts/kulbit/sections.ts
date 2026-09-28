/**
 * Sections: registration from the DOM, stacking (ADR-010), reveal steps, desktop attribute timelines (ADR-009),
 * the move between sections and `advance` — the one function every gesture, key and button goes through.
 * Source: kulbit-webflow `src/03-sections.js` (registerSections, registerSteps, resetHeroState, teardownHero,
 * buildDesktopAnimations, buildSectionTimeline, setupStacking, applyStackingPositions, resetSteps, playStep,
 * reverseStep, goToSection, passHero, restoreSection, advance, autoAdvanceTo). The button jump (autoAdvanceTo) is
 * ours: the source moved there like a scroll and opened a section above at its end. The source's goToSectionStep
 * (a button with data-target-step) is not ported: no markup used it.
 * Every tween created here outside the gsap.matchMedia context is tracked (./app → track): a breakpoint change kills
 * it. Every duration comes from config (0 under reduced motion: the moves happen at once).
 * The section-specific branches of the source (`oc` / `pv` / `hswipe` / `wp` / `ft` / `tp`) are one generic
 * `section.controller` here (see SectionController in ./app).
 */
import { gsap } from 'gsap';
import {
  app,
  config,
  killTracked,
  motion,
  num,
  persistSection,
  playTimeline,
  savedSection,
  track,
  type Direction,
  type KulbitSection,
} from './app';
import { heroBuiltWidth, setTabletHeroStep, tabletHeroStep, teardownTabletHero } from './hero';
import { rebuildScrambles } from './scramble';
import { hideOtherVideos, showCurrentVideo, updateVideoVisibility } from './video';

// Elements of the desktop attribute timeline
const ANIM_SELECTOR = '[data-kulbit-y],[data-kulbit-scale],[data-kulbit-fade]';

/**
 * Every `[data-kulbit-section]` in DOM order; the index comes from the DOM (reorder-safe). Each one is a focus anchor
 * (tabindex="-1": focusable by script, never a Tab stop): the keyboard focus moves to the current section when the
 * screen changes (./app → persistSection)
 */
export const registerSections = () => {
  const elements = document.querySelectorAll<HTMLElement>('[data-kulbit-section]');
  app.sections = Array.from(elements, (el, index) => {
    el.setAttribute('data-section-index', String(index));
    el.tabIndex = -1;
    return {
      el,
      index,
      isFooter: el.matches('footer, .footer'),
      steps: [],
      isStepped: false,
      timeline: null,
      isAnimated: false,
      tabletTL: null,
      isTabletHero: false,
      controller: null,
    };
  });
  if (!app.sections.length) console.error('[kulbit] no [data-kulbit-section] on the page');
};

// ---------- Stacking (ADR-010): sections lie on top of each other, the next one higher ----------
// Applied at runtime: without the module the sections stay in the normal flow. The height is the stacking
// container's (100% of the fixed .wrapper = the visible viewport), not 100vh: on mobile the browser bars make 100vh
// taller than what is visible.
export const setupStacking = () => {
  app.sections.forEach((section) => {
    Object.assign(section.el.style, { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%' });
    section.el.style.zIndex = String(section.index);
  });
  applyStackingPositions();
};

/**
 * Discrete positions: sections 0..current stacked (yPercent 0), the rest below the screen (100). `keep` = an index
 * left where it is (section 1 while the tablet hero is current: its position belongs to the hero timeline).
 */
export const applyStackingPositions = (keep = -1) => {
  app.sections.forEach((section) => {
    if (section.index === keep) return;
    gsap.set(section.el, { yPercent: section.index <= app.currentSectionIndex ? 0 : 100 });
  });
};

// ---------- Resize within a breakpoint (crossing one rebuilds everything: ./responsive) ----------
// Debounced; while a move or a step plays it waits for the end instead of being skipped. The texts are rebuilt first
// (their fixed heights change), then the discrete stack positions and every controller's px state (`resize()`).
// The tablet hero measures its geometry once (the 16:9 band, the sound button's targets): a WIDTH change while it is
// current rebuilds the breakpoint and puts the hero back on its step; a height-only change (the mobile browser bars)
// never rebuilds, and section 1 stays where the hero timeline put it.
let resizeTimer = 0;
const applyResize = () => {
  if (app.isAnimating) {
    resizeTimer = window.setTimeout(applyResize, 100);
    return;
  }
  const onTabletHero = app.currentSectionIndex === 0 && !!app.sections[0]?.isTabletHero;
  rebuildScrambles();
  if (onTabletHero && window.innerWidth !== heroBuiltWidth()) {
    const step = app.currentStep;
    gsap.matchMediaRefresh();
    setTabletHeroStep(step);
    return;
  }
  applyStackingPositions(onTabletHero ? 1 : -1);
  app.sections.forEach((section) => {
    try {
      section.controller?.resize?.();
    } catch (error) {
      console.error('[kulbit] a section failed to follow the resize', error);
    }
  });
};
export const handleResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(applyResize, 150);
};

// ---------- Reveal steps: [data-kulbit-step] in DOM order, one gesture shows the next ----------
export const registerSteps = () => {
  app.sections.forEach((section) => {
    const elements = section.el.querySelectorAll<HTMLElement>('[data-kulbit-step]');
    elements.forEach((el, i) => el.setAttribute('data-step-index', String(i)));
    section.steps = Array.from(elements);
    section.isStepped = section.steps.length > 0;
    if (section.isStepped) resetSteps(section, false);
  });
};

const resetSteps = (section: KulbitSection, shown: boolean) => {
  if (!section.isStepped) return;
  section.steps.forEach((el) => gsap.set(el, shown ? { autoAlpha: 1, y: 0 } : { autoAlpha: 0, y: 40 }));
};

const playStep = (section: KulbitSection, i: number) => {
  const el = section.steps[i];
  if (!el) return;
  app.isAnimating = true;
  track(
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: config.stepDuration,
      ease: config.ease,
      onComplete: () => {
        app.isAnimating = false;
      },
    }),
  );
};

const reverseStep = (section: KulbitSection, i: number) => {
  const el = section.steps[i];
  if (!el) return;
  app.isAnimating = true;
  track(
    gsap.to(el, {
      autoAlpha: 0,
      y: 40,
      duration: config.stepDuration,
      ease: config.ease,
      onComplete: () => {
        app.isAnimating = false;
      },
    }),
  );
};

// ---------- Breakpoint lifecycle (called by the gsap.matchMedia branches in ./responsive) ----------
/** A clean start on the hero before a breakpoint builds */
export const resetHeroState = () => {
  app.currentSectionIndex = 0;
  app.currentStep = 0;
  app.isAnimating = false;
  applyStackingPositions();
  updateVideoVisibility();
};

/**
 * Leaving a breakpoint: GSAP reverts the context's timelines and sets; the engine's in-flight tweens (outside the
 * context) are killed and the jump backdrop hidden; our references and controllers go
 */
export const teardownHero = () => {
  killTracked();
  resetBackdrop();
  teardownTabletHero();
  app.sections.forEach((section) => {
    section.timeline = null;
    section.isAnimated = false;
    section.tabletTL = null;
    section.isTabletHero = false;
    section.controller?.dispose?.();
    section.controller = null;
  });
};

// ---------- Desktop attribute timelines (ADR-009) ----------
/**
 * One paused timeline per section from the attributes of its elements. Elements outside every section
 * (the header) belong to the hero (section 0).
 */
export const buildDesktopAnimations = () => {
  const elements = document.querySelectorAll<HTMLElement>(ANIM_SELECTOR);
  if (!elements.length) return;
  const bySection = new Map<number, HTMLElement[]>();
  elements.forEach((el) => {
    const sectionEl = el.closest('[data-kulbit-section]');
    const index = sectionEl ? parseInt(sectionEl.getAttribute('data-section-index') ?? '0', 10) : 0;
    const list = bySection.get(index) ?? [];
    list.push(el);
    bySection.set(index, list);
  });
  bySection.forEach((list, index) => {
    const section = app.sections[index];
    if (!section) return;
    section.timeline = buildSectionTimeline(list);
    section.isAnimated = true;
  });
};

/**
 * Step 0 = the start state (gsap.set), step 1 = the end of the timeline.
 *   data-kulbit-y="<n>"           target yPercent
 *   data-kulbit-scale="<n>"       target scale; data-kulbit-scale-from="<n>" its start (default 1)
 *   data-kulbit-fade="<n>"        target autoAlpha
 *   data-kulbit-order="<0|1|…>"   phase: 0 first, the next ones one after another; one phase plays together
 */
const buildSectionTimeline = (elements: HTMLElement[]) => {
  elements.forEach((el) => {
    const start: gsap.TweenVars = {};
    if (el.hasAttribute('data-kulbit-y')) start.yPercent = 0;
    if (el.hasAttribute('data-kulbit-scale')) {
      start.scale = num(el, 'data-kulbit-scale-from', 1);
      start.transformOrigin = '50% 50%';
    }
    if (el.hasAttribute('data-kulbit-fade')) start.autoAlpha = 1;
    gsap.set(el, start);
  });

  const orderOf = (el: HTMLElement) => parseInt(el.getAttribute('data-kulbit-order') || '0', 10);
  const orders = [...new Set(elements.map(orderOf))].sort((a, b) => a - b);

  const timeline = gsap.timeline({
    paused: true,
    defaults: { duration: config.timelineStep, ease: config.ease },
    onComplete: () => {
      app.isAnimating = false;
    },
    onReverseComplete: () => {
      app.isAnimating = false;
    },
  });
  // Phases one after another ('>'), inside a phase together ('<')
  orders.forEach((order, phase) => {
    elements
      .filter((el) => orderOf(el) === order)
      .forEach((el, i) => {
        const to: gsap.TweenVars = {};
        if (el.hasAttribute('data-kulbit-y')) to.yPercent = num(el, 'data-kulbit-y', 0);
        if (el.hasAttribute('data-kulbit-scale')) to.scale = num(el, 'data-kulbit-scale', 1);
        if (el.hasAttribute('data-kulbit-fade')) to.autoAlpha = num(el, 'data-kulbit-fade', 0);
        timeline.to(el, to, i === 0 ? (phase === 0 ? 0 : '>') : '<');
      });
  });
  return timeline;
};

// ---------- Moves ----------
/** The hero's animation to its end: the header leaves the regular way (jump / restore to another section) */
export const passHero = () => {
  const hero = app.sections[0];
  if (!hero) return;
  if (hero.isAnimated && hero.timeline) hero.timeline.progress(1).pause();
  if (hero.isTabletHero && hero.tabletTL) hero.tabletTL.progress(1).pause();
};

/**
 * Stacking move: down — the target slides in from below over the current one; up — the current one slides
 * down and reveals the target. `dir` sets the target's inner state: from above at its start, from below at its end.
 */
export const goToSection = (index: number, instant: boolean, dir: Direction) => {
  if (!app.sections.length) return;
  const clamped = Math.max(0, Math.min(index, app.sections.length - 1));
  const prev = app.currentSectionIndex;
  if (clamped === prev && !instant) return;

  const target = app.sections[clamped];
  const controller = target.controller;
  if (clamped > 0) passHero();

  if (controller) {
    app.currentStep = 0; // its own state lives in the controller
  } else if (target.isAnimated && target.timeline) {
    const atEnd = dir < 0;
    target.timeline.progress(atEnd ? 1 : 0).pause();
    app.currentStep = atEnd ? 1 : 0;
  } else if (target.isStepped) {
    const shown = dir < 0;
    resetSteps(target, shown);
    app.currentStep = shown ? target.steps.length : 0;
  } else {
    app.currentStep = 0;
  }

  if (instant) {
    app.currentSectionIndex = clamped;
    persistSection();
    applyStackingPositions();
    controller?.reset?.(dir < 0);
    updateVideoVisibility();
    return;
  }

  app.isAnimating = true;
  app.currentSectionIndex = clamped;
  persistSection();
  // The new current video plays at once (while its section slides in); the covered ones pause at the end
  showCurrentVideo();
  const finish = () => {
    app.isAnimating = false;
    hideOtherVideos();
  };
  if (dir > 0) {
    // Sections between the current one and the target go straight into the stack (a smooth jump over several)
    for (let i = prev + 1; i < clamped; i++) gsap.set(app.sections[i].el, { yPercent: 0 });
    controller?.prepare?.();
    track(
      gsap.to(target.el, {
        yPercent: 0,
        duration: config.scrollDuration,
        ease: config.ease,
        onComplete: () => {
          finish();
          controller?.enter?.();
        },
      }),
    );
  } else {
    for (let i = clamped + 1; i < prev; i++) gsap.set(app.sections[i].el, { yPercent: 100 });
    controller?.reset?.(true); // revealed from above: at its end
    const leaving = app.sections[prev];
    leaving.controller?.collapse?.();
    track(
      gsap.to(leaving.el, { yPercent: 100, duration: config.scrollDuration, ease: config.ease, onComplete: finish }),
    );
  }
};

/** Back to the section of the last visit (reload, breakpoint change); the inner step starts over */
export const restoreSection = () => {
  const saved = savedSection();
  if (Number.isNaN(saved) || saved <= 0 || saved >= app.sections.length) return;
  goToSection(saved, true, 1);
};

/** One gesture: the next step inside the current section, or the move to the neighbouring section */
export const advance = (dir: Direction) => {
  // The tablet / mobile hero owns its steps and the border with section 1
  const hero = app.sections[0];
  if (hero?.isTabletHero && tabletHeroStep(dir)) return;

  const section = app.sections[app.currentSectionIndex];
  if (!section) return;

  if (section.controller) {
    if (section.controller.step(dir)) return;
    goToSection(app.currentSectionIndex + dir, false, dir);
    return;
  }

  // Desktop attribute timeline: step 0 ↔ 1 (its onComplete / onReverseComplete release the lock; under reduced
  // motion it lands on the step at once)
  const timeline = section.timeline;
  if (section.isAnimated && timeline) {
    const release = () => {
      app.isAnimating = false;
    };
    if (dir > 0 && app.currentStep < 1) {
      app.isAnimating = true;
      app.currentStep = 1;
      if (motion) timeline.play();
      else playTimeline(timeline, timeline.duration(), undefined, release);
      return;
    }
    if (dir < 0 && app.currentStep > 0) {
      app.isAnimating = true;
      app.currentStep = 0;
      if (motion) timeline.reverse();
      else playTimeline(timeline, 0, undefined, release);
      return;
    }
  }

  if (section.isStepped) {
    if (dir > 0 && app.currentStep < section.steps.length) {
      playStep(section, app.currentStep);
      app.currentStep++;
      return;
    }
    if (dir < 0 && app.currentStep > 0) {
      app.currentStep--;
      reverseStep(section, app.currentStep);
      return;
    }
  }

  goToSection(app.currentSectionIndex + dir, false, dir);
};

// ---------- Button jump (ADR-003, the header button, the menu): the target always at its start ----------
// Down: a black backdrop slides in over the current section first, the sections in between go into the stack under
// it (their states never show), then the target slides in over the backdrop and plays its appearance. Up: the current
// section slides away and reveals the target, already at its start. anchorDuration in total whatever the distance
// (down: half the backdrop, half the target).
let backdrop: HTMLElement | null = null;
/** Hidden below the screen (a breakpoint change killed a jump halfway) */
const resetBackdrop = () => {
  if (backdrop) gsap.set(backdrop, { yPercent: 100, autoAlpha: 0 });
};
const jumpBackdrop = () => {
  if (backdrop?.isConnected) return backdrop;
  backdrop = document.createElement('div');
  backdrop.setAttribute('data-kulbit-jump-backdrop', '');
  backdrop.setAttribute('aria-hidden', 'true');
  Object.assign(backdrop.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%', // the stacking container's, like the sections
    backgroundColor: 'var(--theme-page-bg)',
    pointerEvents: 'none',
  });
  // First in the stacking container: with the target's z-index it lies right under the target, over the rest
  app.content?.prepend(backdrop);
  gsap.set(backdrop, { yPercent: 100, autoAlpha: 0 });
  return backdrop;
};

/** A section without a controller at its start: the desktop timeline at 0, the reveal steps hidden */
const setSectionStart = (section: KulbitSection) => {
  if (section.isAnimated && section.timeline) section.timeline.progress(0).pause();
  else if (section.isStepped) resetSteps(section, false);
};

const jumpDown = (target: KulbitSection, prev: number) => {
  const half = config.anchorDuration / 2;
  const hero = app.sections[0];
  const cover = jumpBackdrop();
  app.isAnimating = true;
  app.currentSectionIndex = target.index;
  app.currentStep = 0;
  persistSection();
  showCurrentVideo();
  target.controller?.prepare?.();
  if (!target.controller) setSectionStart(target);
  gsap.set(cover, { zIndex: target.index, yPercent: 100, autoAlpha: 1 });
  // From the hero: its step (the header leaving) plays while the backdrop comes
  if (prev === 0 && hero?.isAnimated && hero.timeline) {
    playTimeline(hero.timeline, hero.timeline.duration(), half);
  } else if (prev === 0 && hero?.isTabletHero && hero.tabletTL) {
    const s1 = hero.tabletTL.labels.s1 ?? hero.tabletTL.duration();
    if (hero.tabletTL.time() < s1) playTimeline(hero.tabletTL, s1, half);
  }
  track(
    gsap.to(cover, {
      yPercent: 0,
      duration: half,
      ease: config.ease,
      onComplete: () => {
        passHero(); // the hero at its end (tablet: its hand-off puts section 1 into the stack)
        app.isAnimating = true; // the hero timeline's own onComplete released it
        for (let i = prev + 1; i < target.index; i++) gsap.set(app.sections[i].el, { yPercent: 0 });
        gsap.set(target.el, { yPercent: 100 }); // the tablet hand-off may have moved section 1
        track(
          gsap.to(target.el, {
            yPercent: 0,
            duration: half,
            ease: config.ease,
            onComplete: () => {
              resetBackdrop();
              app.isAnimating = false;
              hideOtherVideos();
              target.controller?.enter?.();
            },
          }),
        );
      },
    }),
  );
};

const jumpUp = (target: KulbitSection, prev: number) => {
  const duration = config.anchorDuration;
  const hero = app.sections[0];
  const leaving = app.sections[prev];
  app.isAnimating = true;
  app.currentSectionIndex = target.index;
  app.currentStep = 0;
  persistSection();
  showCurrentVideo();
  const finish = () => {
    app.isAnimating = false;
    hideOtherVideos();
  };
  // Section 1 → the tablet hero: section 1 is the hero timeline's own target, so the whole choreography runs back
  // from its end (section 1 slides away, the 16:9 band grows back to the full video, the header returns)
  if (target.index === 0 && prev === 1 && hero?.isTabletHero && hero.tabletTL) {
    const timeline = hero.tabletTL;
    leaving.controller?.collapse?.();
    timeline.progress(1).pause();
    playTimeline(timeline, 0, duration, () => {
      finish();
      app.currentStep = 0;
      leaving.controller?.prepare?.(); // below the screen now: hidden again for its next appearance under the band
    });
    return;
  }
  for (let i = target.index + 1; i < prev; i++) gsap.set(app.sections[i].el, { yPercent: 100 });
  if (target.controller) target.controller.reset?.(false);
  else if (target.index === 0 && hero?.isAnimated && hero.timeline) {
    // The hero's step back while the section slides away (the header returns)
    playTimeline(hero.timeline, 0, duration);
  } else if (target.index === 0 && hero?.isTabletHero && hero.tabletTL) {
    // The hand-off undone at once (under the leaving section), the first step back with the slide
    const s1 = hero.tabletTL.labels.s1 ?? 0;
    hero.tabletTL.progress(0).time(s1).pause();
    playTimeline(hero.tabletTL, 0, duration);
  } else setSectionStart(target);
  leaving.controller?.collapse?.();
  track(gsap.to(leaving.el, { yPercent: 100, duration, ease: config.ease, onComplete: finish }));
};

export const autoAdvanceTo = (targetIndex: number) => {
  const target = Math.max(0, Math.min(targetIndex, app.sections.length - 1));
  const prev = app.currentSectionIndex;
  if (target === prev || app.isAnimating) return;
  if (target > prev) jumpDown(app.sections[target], prev);
  else jumpUp(app.sections[target], prev);
};
