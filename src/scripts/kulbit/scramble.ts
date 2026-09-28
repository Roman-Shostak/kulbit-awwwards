/**
 * Text that writes itself when it enters the screen (ADR-017): `[data-kulbit-scramble]` — GSAP ScrambleText,
 * `[data-kulbit-typewriter]` — letter by letter (a number tween, no plugin). Both appear when the element is 60 %
 * in the viewport (its section slides in) and are erased when it leaves it completely (ready to appear again);
 * being covered by the next section is not leaving. The coloured spans of the text are kept: every segment
 * (a text node or a span) is written on its own, the spaces between them stay static text nodes (ScrambleText
 * trims the edges of a text: «atscale»).
 * Screen readers never meet the animation: the element holds `<span class="sr-only">` with the full text and
 * `<span aria-hidden="true">` with the segments, and only the second one is erased and written (splitText). The
 * height is fixed in px (overflow hidden) only while the text is written, erased or empty: random characters are
 * wider and would wrap an extra line. Once written, the box follows its text again (text spacing, zoom).
 * The controllers are in `scrambles` (element → { in, out, setOut, hold }) for sections that drive them by hand.
 * The engine calls rebuildScrambles() on resize (the height of a text depends on the width): every text is rebuilt
 * in the state it was in. morphSegments rewrites a text into other segments (the facts of Our Clients, the head of
 * Traditional). `prefers-reduced-motion` → the texts stay.
 * Source: kulbit-webflow `src/11-scramble.js` (build, makeReveal, parseSegments, buildSegDOM); `01-init.js`
 * registers ScrambleTextPlugin.
 */
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { motion } from './app';

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

const collapseSpaces = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * The two copies of an animated text inside its element, made once from its content: `sr` — the full text for
 * assistive tech, never animated (the utility .sr-only: out of the flow, the layout does not change); `visual`
 * (aria-hidden, inline) — the content itself, the one that is erased and written.
 */
interface TextCopies {
  sr: HTMLElement;
  visual: HTMLElement;
}
const copies = new WeakMap<HTMLElement, TextCopies>();
const splitText = (el: HTMLElement): TextCopies => {
  let pair = copies.get(el);
  if (!pair) {
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.append(...el.childNodes);
    sr.textContent = collapseSpaces(visual.textContent ?? '');
    el.append(sr, visual);
    pair = { sr, visual };
    copies.set(el, pair);
  }
  return pair;
};

/**
 * Rewrites `el` into `segments` by scramble: the whole text is erased quickly, then every segment is written (a
 * coloured span keeps its colour). The copy for screen readers changes at once. `animate` false or reduced motion
 * → the new text at once.
 */
export const morphSegments = (el: HTMLElement, segments: Segment[], animate = true) => {
  const { sr, visual } = splitText(el);
  sr.textContent = collapseSpaces(segments.map(([text]) => text).join(''));
  gsap.killTweensOf(visual);
  if (!animate || !motion) {
    buildSegments(visual, segments, true);
    return;
  }
  gsap.to(visual, {
    duration: 0.35,
    scrambleText: { text: '', ...SCRAMBLE, speed: 3 },
    onComplete: () =>
      buildSegments(visual, segments, false).forEach(([span, value]) =>
        gsap.to(span, { duration: 0.6, scrambleText: { text: value, ...SCRAMBLE } }),
      ),
  });
};

type Mode = 'scramble' | 'typewriter';
export interface ScrambleController {
  /** empty → text */
  in(): void;
  /** text → empty */
  out(): void;
  /** empty at once */
  setOut(): void;
  /** held = a section keeps it erased (e.g. a collapsed title): `in` does nothing until released */
  hold(held: boolean): void;
}

export const scrambles = new Map<HTMLElement, ScrambleController>();
/** The rebuild of every controller (rebuildScrambles) */
const rebuilds: (() => void)[] = [];
/** The original markup of every animated text (the content of its aria-hidden copy), for the rebuilds */
const originals = new WeakMap<HTMLElement, string>();

const makeReveal = (el: HTMLElement, mode: Mode): ScrambleController => {
  const { visual } = splitText(el);
  if (!originals.has(el)) originals.set(el, visual.innerHTML);

  let targets: [HTMLElement, string][] = [];
  let shown = true; // written (or being written)
  let held = false;
  let timeline: gsap.core.Timeline | null = null;
  // The box, measured with the whole text: its whole-pixel height (offsetHeight, the height it has always had) and
  // its exact one; `fixed` = the px height scramble set (null = the box follows its text)
  let rounded = 0;
  let exact = 0;
  let marginBottom = 0;
  let fixed: number | null = null;

  const clearBox = () => {
    el.style.height = '';
    el.style.overflow = '';
    el.style.minHeight = '';
    el.style.marginBottom = '';
  };
  // The text as written, measured with no inline box
  const render = () => {
    visual.innerHTML = originals.get(el) ?? '';
    targets = buildSegments(visual, parseSegments(visual), true);
    clearBox();
    rounded = el.offsetHeight;
    const style = getComputedStyle(el);
    exact = parseFloat(style.height) || rounded;
    marginBottom = parseFloat(style.marginBottom) || 0;
  };
  // Being written, being erased or empty: a fixed height — random characters are wider on average and would wrap an
  // extra line
  const fix = () => {
    if (fixed !== null && el.style.height) return; // fixed already, or a section holds a height of its own (release)
    clearBox();
    fixed = rounded;
    el.style.height = `${rounded}px`;
    el.style.overflow = 'hidden';
  };
  // Written: the box follows its text again (text spacing, zoom) and takes the same room as the fixed height did
  // (min-height; the fraction of a pixel the text is taller comes off the bottom margin): nothing around it moves
  const settle = () => {
    clearBox();
    fixed = null;
    el.style.minHeight = `${rounded}px`;
    if (exact > rounded) el.style.marginBottom = `${marginBottom + rounded - exact}px`;
  };
  // The writing finished: settle, unless a section changed the height meanwhile (Our Services collapses its statement)
  const release = () => {
    const height = el.style.height;
    if (fixed !== null && height && Math.abs(parseFloat(height) - fixed) > 0.5) return;
    settle();
  };
  const erase = () => {
    timeline?.kill();
    fix();
    targets.forEach(([span]) => {
      span.textContent = '';
    });
    shown = false;
  };

  const animateTo = (show: boolean) => {
    timeline?.kill();
    fix();
    timeline = gsap.timeline({ onComplete: show ? release : undefined });
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

  // A rebuild (resize) keeps the state: written → written at once (no new animation), erased → erased with the new
  // fixed height, held → held. A section that changed the height re-applies it in its resize() (Our Services), which
  // the engine calls after the rebuild.
  rebuilds.push(() => {
    timeline?.kill();
    render();
    fixed = null;
    if (shown) settle();
    else erase();
  });

  render();
  return {
    in() {
      if (!shown && !held) animateTo(true);
    },
    out() {
      if (shown) animateTo(false);
    },
    setOut: erase,
    hold(value) {
      held = value;
    },
  };
};

let built = false;

const build = () => {
  const elements = [
    ...[...document.querySelectorAll<HTMLElement>('[data-kulbit-scramble]')].map((el) => [el, 'scramble'] as const),
    ...[...document.querySelectorAll<HTMLElement>('[data-kulbit-typewriter]')].map((el) => [el, 'typewriter'] as const),
  ];
  if (!elements.length) return;
  built = true;
  elements.forEach(([el, mode]) => {
    const controller = makeReveal(el, mode);
    controller.setOut(); // empty at the start: it appears when it enters the screen
    scrambles.set(el, controller);
  });
  const observer = new IntersectionObserver(
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
  elements.forEach(([el]) => observer.observe(el));
};

/** Rebuilds every text for the new size, each in its state (the engine calls it on resize: the heights change) */
export const rebuildScrambles = () => {
  if (built) rebuilds.forEach((rebuild) => rebuild());
};

export const setupScramble = () => {
  if (reducedMotion()) return;
  // After the fonts: the fixed height is measured on the final font
  document.fonts.ready.then(build);
};
