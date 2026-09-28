/**
 * Kulbit step scroll — shared state and config (the source's `window.KulbitApp`, now a module-level object).
 * Source: kulbit-webflow `src/02-app-core.js` (state, config) + `03-sections.js` (section shape, persistence).
 */
import { gsap } from 'gsap';
import type { Observer } from 'gsap/Observer';

export type Direction = 1 | -1;
export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

/**
 * A section with its own step choreography (the source's `section.oc` / `pv` / `hswipe` / `wp` / `ft` / `tp`).
 * A section builder (see `registerSectionBuilder`) sets it on `section.controller`; the engine calls:
 *   step(dir)       every gesture while the section is current; `false` at its edge → the engine moves to the
 *                   neighbouring section
 *   prepare()       the section starts sliding in from below (hidden start state)
 *   enter()         the slide-in finished (the section covers the screen): its appearance
 *   collapse()      the section slides away downwards (the user went up)
 *   reset(toEnd)    instant state: a jump / restore (toEnd = false) or revealed from above (toEnd = true)
 *   dispose()       the breakpoint changes: remove listeners and inline state outside the matchMedia context
 *   resize()        the viewport changed size within the same breakpoint: re-apply the current state with the new
 *                   measurements (px offsets, heights); never animates
 *   reveal(el)      keyboard focus landed on `el` inside the current section: make it visible (the step that shows it)
 *   state           its current inner step (> 0 = not at its start); read by the tablet hero for section 1
 */
export interface SectionController {
  step(dir: Direction): boolean;
  prepare?(): void;
  enter?(): void;
  collapse?(): void;
  reset?(toEnd: boolean): void;
  dispose?(): void;
  resize?(): void;
  reveal?(el: HTMLElement): void;
  readonly state?: number;
}

export interface KulbitSection {
  el: HTMLElement;
  index: number;
  isFooter: boolean;
  /** Reveal steps: `[data-kulbit-step]` elements in DOM order */
  steps: HTMLElement[];
  isStepped: boolean;
  /** Desktop attribute timeline (ADR-009) */
  timeline: gsap.core.Timeline | null;
  isAnimated: boolean;
  /** Tablet / mobile hero choreography (ADR-011), only on section 0 */
  tabletTL: gsap.core.Timeline | null;
  isTabletHero: boolean;
  /** Own step choreography of a section-specific module */
  controller: SectionController | null;
}

/** `prefers-reduced-motion: reduce`: the moves and steps happen at once (no slide over the whole screen) */
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Every duration of the step scroll is multiplied by this: 1, or 0 under reduced motion (the sections' own too) */
export const motion = reducedMotion ? 0 : 1;

// All numbers of the engine (identical to the Webflow build)
export const config = {
  scrollDuration: 0.7 * motion, // move between sections
  stepDuration: 0.6 * motion, // one step of a section's animation
  anchorDuration: 1 * motion, // button jump (ADR-003): the same duration whatever the distance
  // The same lengths never scaled: the engine's paused timelines (desktop attribute timelines, the tablet hero) are
  // built with them — their labels must stay apart; under reduced motion they are jumped, never played (playTimeline)
  timelineScroll: 0.7,
  timelineStep: 0.6,
  ease: 'power2.inOut',
  accelRatio: 1.4, // velocity growth that counts as a NEW flick (trackpad inertia filter)
  minVelocity: 60, // below it the input is the inertia tail
  landscapeMaxHeight: 500, // a landscape screen this low with a coarse pointer = a phone → the rotate popup
};

export const app = {
  sections: [] as KulbitSection[],
  currentSectionIndex: 0,
  /** Step inside the current section: reveal steps / desktop timeline (0↔1) / tablet hero (0..3) */
  currentStep: 0,
  /** A move or a step is playing: gestures are ignored */
  isAnimating: false,
  observer: null as Observer | null,
  mm: null as gsap.MatchMedia | null,
  /** The fixed viewport (.wrapper) and the stacking container (<main data-scenes>) */
  wrapper: null as HTMLElement | null,
  content: null as HTMLElement | null,
  /** The landscape "rotate your phone" popup is shown: videos stay paused, navigation is off */
  landscapeBlocked: false,
  /** A video is in fullscreen (set by ./project-video): rotation must not pause it */
  videoFullscreen: false,
  initialized: false,
};

// In-flight animations of the engine created outside the gsap.matchMedia context (in event handlers: the moves, the
// jumps and their backdrop, the tablet hero steps). A breakpoint change kills them (teardownHero): the context does
// not revert them, and a stale onComplete would run on the rebuilt state (JS-01). A killed tween never completes.
const running = new Set<gsap.core.Animation>();
/** Tracks an engine animation until it completes or is interrupted; returns it */
export const track = <T extends gsap.core.Animation>(animation: T): T => {
  if (animation.totalProgress() >= 1) return animation; // already done (0 s under reduced motion)
  running.add(animation);
  const forget = () => running.delete(animation);
  (['onComplete', 'onInterrupt'] as const).forEach((type) => {
    const own = animation.eventCallback(type);
    animation.eventCallback(type, function (this: gsap.core.Animation, ...args: unknown[]) {
      forget();
      own?.apply(this, args);
    });
  });
  return animation;
};
/** Kills every tracked animation (their onComplete never fires) */
export const killTracked = () => {
  const list = [...running];
  running.clear();
  list.forEach((animation) => animation.kill());
};

/**
 * Plays a paused engine timeline to `position` (a label or a time) in `duration` s — its own speed when omitted —
 * then `onComplete`; tracked. Under reduced motion it lands there at once (tweenTo cannot: 0 s there means "its own
 * speed").
 */
export const playTimeline = (
  timeline: gsap.core.Timeline,
  position: string | number,
  duration?: number,
  onComplete?: () => void,
) => {
  if (!motion) {
    timeline.pause(position);
    onComplete?.();
    return;
  }
  track(timeline.tweenTo(position, { duration, onComplete }));
};

/** Numeric attribute with a fallback */
export const num = (el: Element, attr: string, fallback: number) => {
  const value = parseFloat(el.getAttribute(attr) ?? '');
  return Number.isNaN(value) ? fallback : value;
};

/** The real visible height (the browser UI excluded), `innerHeight` without visualViewport */
export const realViewportHeight = () => window.visualViewport?.height || window.innerHeight;

/** The visible height of the fixed viewport (not 100vh: on mobile the address bar makes them differ) */
export const visibleHeight = () => app.wrapper?.clientHeight ?? window.innerHeight;

// Keyboard focus follows the screen: focus left inside another section moves to the current one (every section is a
// focus anchor, tabindex="-1", see registerSections), so the next Tab starts on the visible screen. Focus in the
// header or the menu is never moved.
const keepFocusOnScreen = () => {
  const active = document.activeElement;
  const owner = active instanceof Element ? active.closest('[data-kulbit-section]') : null;
  const current = app.sections[app.currentSectionIndex]?.el;
  if (owner && current && owner !== current) current.focus({ preventScroll: true });
};

// Position persistence (sessionStorage): a reload or a breakpoint change keeps the current section. Every change of
// the current section goes through here, so it also moves the keyboard focus and tells the page: `kulbit:section` on
// document, detail.index (the menu marks its item)
const SECTION_KEY = 'kulbit-section';
export const SECTION_EVENT = 'kulbit:section';
export const persistSection = () => {
  try {
    sessionStorage.setItem(SECTION_KEY, String(app.currentSectionIndex));
  } catch {
    // storage unavailable (private mode): nothing to keep
  }
  keepFocusOnScreen();
  document.dispatchEvent(new CustomEvent(SECTION_EVENT, { detail: { index: app.currentSectionIndex } }));
};
export const savedSection = () => {
  try {
    return parseInt(sessionStorage.getItem(SECTION_KEY) ?? '', 10);
  } catch {
    return NaN;
  }
};

// Section-specific modules plug in here: a builder runs on every breakpoint (inside the gsap.matchMedia
// context, so its gsap.set/tweens are reverted on exit) after the hero, and sets `section.controller`.
type SectionBuilder = (mode: Breakpoint) => void;
export const sectionBuilders: SectionBuilder[] = [];

/**
 * Registers a section-specific module (call it at the top level of the section's <script>):
 *   registerSectionBuilder((mode) => {
 *     const section = app.sections.find((s) => s.el.contains(document.querySelector('[data-my-group]')));
 *     if (!section) return;
 *     section.controller = { step: (dir) => …, prepare, enter, collapse, reset, dispose };
 *   });
 * A builder registered after the engine started rebuilds every breakpoint (the position is kept).
 */
export const registerSectionBuilder = (builder: SectionBuilder) => {
  sectionBuilders.push(builder);
  if (app.initialized) gsap.matchMediaRefresh();
};
