/**
 * Text that writes itself when it enters the screen (ADR-017): `[data-kulbit-scramble]` — GSAP ScrambleText,
 * `[data-kulbit-typewriter]` — letter by letter (a number tween, no plugin). Both appear when the element is 60 %
 * in the viewport (its section slides in) and are erased when it leaves it completely (ready to appear again);
 * being covered by the next section is not leaving. The coloured spans of the text are kept: every segment
 * (a text node or a span) is written on its own, the spaces between them stay static text nodes (ScrambleText
 * trims the edges of a text: «atscale»).
 * The controllers are in `scrambles` (element → { in, out, setOut }) for sections that drive them by hand.
 * Rebuilt on resize (the height of the text depends on the breakpoint); `prefers-reduced-motion` → the texts stay.
 * Source: kulbit-webflow `src/11-scramble.js` (build, makeReveal, parseSegments, buildSegDOM); `01-init.js`
 * registers ScrambleTextPlugin.
 */
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrambleTextPlugin);

/** The characters and speed of every scramble (the source's SC) */
export const SCRAMBLE = { chars: 'upperCase', speed: 1 };
const DURATION = 1.2; // appearing / erasing, seconds

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** One piece of a text: its raw text and, for an element, a shallow copy of it (class + scoped attributes) */
export type Segment = [text: string, element: Element | null];

/** The text of an element (or a <template>'s content) as segments, one per child node */
export const parseSegments = (root: ParentNode): Segment[] => {
  const segments: Segment[] = [];
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) segments.push([node.textContent ?? '', null]);
    else if (node instanceof Element) segments.push([node.textContent ?? '', node.cloneNode(false) as Element]);
  });
  return segments;
};

/**
 * Rebuilds `container` from segments: one span per non-empty segment (a copy of the original element, or a plain
 * span for a text node), single spaces between them as text nodes. Returns [span, text] for the tweens; with
 * `fillText` false the spans stay empty (to be written).
 */
export const buildSegments = (container: Element, segments: Segment[], fillText: boolean) => {
  container.textContent = '';
  const targets: [HTMLElement, string][] = [];
  let pendingSpace = false;
  segments.forEach(([raw, element]) => {
    const text = raw.replace(/\s+/g, ' ').trim();
    if (/^\s/.test(raw)) pendingSpace = true;
    if (text) {
      if (pendingSpace && container.lastChild) container.appendChild(document.createTextNode(' '));
      pendingSpace = false;
      const span = (element?.cloneNode(false) ?? document.createElement('span')) as HTMLElement;
      if (fillText) span.textContent = text;
      container.appendChild(span);
      targets.push([span, text]);
    }
    if (/\s$/.test(raw)) pendingSpace = true;
  });
  return targets;
};

type Mode = 'scramble' | 'typewriter';
export interface ScrambleController {
  /** empty → text */
  in(): void;
  /** text → empty */
  out(): void;
  /** empty at once */
  setOut(): void;
}

export const scrambles = new Map<HTMLElement, ScrambleController>();

const makeReveal = (el: HTMLElement, mode: Mode): ScrambleController => {
  // The original markup survives every rebuild (the text is empty or segmented at that moment)
  if (el.dataset.scrOrig == null) el.dataset.scrOrig = el.innerHTML;
  else el.innerHTML = el.dataset.scrOrig;
  el.style.height = '';
  el.style.overflow = '';
  const targets = buildSegments(el, parseSegments(el), true);
  // A fixed height: random characters are wider on average and would wrap an extra line while writing
  el.style.height = `${el.offsetHeight}px`;
  el.style.overflow = 'hidden';

  let shown = true;
  let timeline: gsap.core.Timeline | null = null;
  const animateTo = (show: boolean) => {
    timeline?.kill();
    timeline = gsap.timeline();
    // typewriter: the spans one after another, each for its share of the duration (the same speed per letter)
    const totalChars = mode === 'typewriter' ? targets.reduce((sum, [, text]) => sum + text.length, 0) || 1 : 0;
    targets.forEach(([span, text]) => {
      if (mode === 'typewriter') {
        const progress = { p: show ? 0 : 1 };
        timeline!.to(progress, {
          p: show ? 1 : 0,
          duration: (text.length / totalChars) * DURATION,
          ease: 'none',
          onUpdate: () => {
            span.textContent = text.slice(0, Math.ceil(progress.p * text.length));
          },
        });
      } else {
        timeline!.to(span, { duration: DURATION, scrambleText: { text: show ? text : '', ...SCRAMBLE } }, 0);
      }
    });
    shown = show;
  };
  return {
    in() {
      if (!shown) animateTo(true);
    },
    out() {
      if (shown) animateTo(false);
    },
    setOut() {
      timeline?.kill();
      targets.forEach(([span]) => {
        span.textContent = '';
      });
      shown = false;
    },
  };
};

let observer: IntersectionObserver | null = null;

const build = () => {
  observer?.disconnect();
  scrambles.clear();
  const elements = [
    ...[...document.querySelectorAll<HTMLElement>('[data-kulbit-scramble]')].map((el) => [el, 'scramble'] as const),
    ...[...document.querySelectorAll<HTMLElement>('[data-kulbit-typewriter]')].map((el) => [el, 'typewriter'] as const),
  ];
  if (!elements.length) return;
  elements.forEach(([el, mode]) => {
    const controller = makeReveal(el, mode);
    controller.setOut(); // empty at the start: it appears when it enters the screen
    scrambles.set(el, controller);
  });
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const controller = scrambles.get(entry.target as HTMLElement);
        if (!controller) return;
        if (entry.intersectionRatio >= 0.6) controller.in();
        else if (!entry.isIntersecting) controller.out();
      });
    },
    { threshold: [0, 0.6] },
  );
  elements.forEach(([el]) => observer!.observe(el));
};

export const setupScramble = () => {
  if (reducedMotion()) return;
  // After the fonts: the fixed height is measured on the final font
  document.fonts.ready.then(build);
  let timer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = window.setTimeout(build, 200);
  });
};
