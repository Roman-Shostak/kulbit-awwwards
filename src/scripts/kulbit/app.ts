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
 *   state           its current inner step (> 0 = not at its start); read by the tablet hero for section 1
 */
export interface SectionController {
  step(dir: Direction): boolean;
  prepare?(): void;
  enter?(): void;
  collapse?(): void;
  reset?(toEnd: boolean): void;
  dispose?(): void;
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

// All numbers of the engine (identical to the Webflow build)
export const config = {
  scrollDuration: 0.7, // move between sections
  stepDuration: 0.6, // one step of a section's animation
  autoPlayStepDuration: 0.3, // fast replay of reveal steps for a button with data-target-step
  anchorDuration: 1, // button jump (ADR-003): the same duration whatever the distance
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

/** Numeric attribute with a fallback */
export const num = (el: Element, attr: string, fallback: number) => {
  const value = parseFloat(el.getAttribute(attr) ?? '');
  return Number.isNaN(value) ? fallback : value;
};

/** The real visible height (the browser UI excluded), `innerHeight` without visualViewport */
export const realViewportHeight = () => window.visualViewport?.height || window.innerHeight;

/** The visible height of the fixed viewport (not 100vh: on mobile the address bar makes them differ) */
export const visibleHeight = () => app.wrapper?.clientHeight ?? window.innerHeight;

// Position persistence (sessionStorage): a reload or a breakpoint change keeps the current section. Every change of
// the current section goes through here, so it also tells the page: `kulbit:section` on document, detail.index
// (the menu marks its item)
const SECTION_KEY = 'kulbit-section';
export const SECTION_EVENT = 'kulbit:section';
export const persistSection = () => {
  try {
    sessionStorage.setItem(SECTION_KEY, String(app.currentSectionIndex));
  } catch {
    // storage unavailable (private mode): nothing to keep
  }
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
