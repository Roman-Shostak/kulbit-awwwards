/**
 * The hero intro after the preloader — timed from the designer's video (after-preloader.mp4, 1920 × 1080, measured frame
 * by frame; its background is a prototype and is not ported). Lengths in rem × our fluid scale (1rem = 16px on the 1920
 * frame), the wordmark's points in its own font units. From the moment the preloader has gone:
 *   0.03  a square grows from a point at the left edge, 58.7 % down the hero; 0.27 it runs right, faster and faster;
 *   0.58  an outlined KULBIT (PP Monument Wide Regular, the container's width, on the bottom edge) draws itself letter
 *         by letter, every letter erasing itself right after it has been drawn (a running stroke, 0.1 s apart);
 *   0.77  the square dives into the L's stem (as wide as the stem, as high as its foot), falls down it, runs along the
 *         foot and fades; 1.23 the hero square glides in from 17rem to the left and stops;
 *   0.3   the video fades in (to 2.2); 1.55 the logo's square, then its letters left to right; 1.6 the statement's blocks
 *         drop in from 4rem above, the last one first; 1.85 «Projects» and the CTA's arrow square fade in;
 *   2.28  the heading rises line by line from under its lines (0.1 s apart), 2.5 the CTA's label; 2.4 the sound button.
 * Gestures and keys wait for its end (`app.intro`); a new width ends it at once.
 * Driven by src/components/sections/Preloader.astro: `prepareHeroIntro()` when the preloader starts to fade (the start
 * state, so nothing shows through the fade), `play()` when it has gone. Only on the hero at its start: a restored later
 * section gets no intro.
 * The engine's own elements (the wrappers with data-kulbit-*) are never touched — the intro moves their contents and
 * copies of the texts: during the intro a text holds an sr-only copy of itself and an aria-hidden copy that is animated
 * (display: contents, so the layout stays); its own nodes come back at the end and every inline style is cleared.
 * Hooks in Hero.astro: data-hero-intro="title | text | pilot | square | overlay | wordmark | runner".
 */
import { gsap } from 'gsap';
import { app, rem } from './app';

// The wordmark's viewBox (hero-wordmark.svg, font units): its left edge and width
const WORD_X = 78;
const WORD_WIDTH = 4117;
// The L: its stem (x, width), the top of its foot and the foot's height; the runner enters the stem 170 units down and
// runs 285 units along the foot
const L_X = 1749;
const L_STEM = 123;
const L_FOOT_TOP = 614;
const L_FOOT = 106;
const L_ENTRY = 170;
const L_RUN = 285;
// The runner stops 355 units before the stem before it dives in
const L_APPROACH = 355;
// The logo (logo.svg, 150 units = 150px at 1920): its square runs 93 units from the K; the letters (0–142.7) are
// clipped at the square's start
const LOGO_RUN = 93;
const LOGO_CLIP_FROM = 64.5;

export interface HeroIntro {
  /** Plays the intro; `done` when it has ended (the texts restored, the inline styles cleared) — at once if a new
   * width has already ended it */
  play: (done: () => void) => void;
}

interface TextCopy {
  visual: HTMLElement;
  restore: () => void;
}

/** The text for assistive tech in an sr-only copy + an aria-hidden copy to animate; restore() puts its nodes back */
const copyText = (el: HTMLElement): TextCopy => {
  const own = [...el.childNodes];
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = el.textContent;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  visual.style.display = 'contents';
  visual.append(...own.map((node) => node.cloneNode(true)));
  el.replaceChildren(label, visual);
  return { visual, restore: () => el.replaceChildren(...own) };
};

/**
 * Every word (split at plain spaces: a no-break space keeps «AI Dimension» whole) in a clipped inline-block around an
 * inline-block that rises from under it — both keep the baseline, so the lines and the justification stay; the risers
 * come back grouped by line, top to bottom, hidden
 */
const splitLines = (root: HTMLElement) => {
  const risers: HTMLElement[] = [];
  const walk = (node: Node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      [...node.childNodes].forEach(walk);
      return;
    }
    const parts = (node.textContent ?? '').split(/([ \t\n\r]+)/);
    if (!parts.some((part) => part.trim())) return;
    const fragment = document.createDocumentFragment();
    parts.forEach((part) => {
      if (!part) return;
      if (!part.trim()) {
        fragment.append(part);
        return;
      }
      const mask = document.createElement('span');
      mask.style.display = 'inline-block';
      mask.style.clipPath = 'inset(0 -0.5em)';
      const riser = document.createElement('span');
      riser.style.display = 'inline-block';
      riser.textContent = part;
      mask.append(riser);
      fragment.append(mask);
      risers.push(riser);
    });
    node.parentNode?.replaceChild(fragment, node);
  };
  [...root.childNodes].forEach(walk);
  const lines = new Map<number, HTMLElement[]>();
  risers.forEach((riser) => {
    const top = Math.round(riser.getBoundingClientRect().top);
    const line = [...lines.keys()].find((key) => Math.abs(key - top) < 4) ?? top;
    lines.set(line, [...(lines.get(line) ?? []), riser]);
  });
  gsap.set(risers, { yPercent: 100 });
  return [...lines.entries()].sort(([a], [b]) => a - b).map(([, line]) => line);
};

/** Sets the start state of the intro, or null when there is none (no hero at its start, its texts missing) */
export const prepareHeroIntro = (): HeroIntro | null => {
  const hero = app.sections[0]?.el;
  if (!hero || app.currentSectionIndex !== 0 || app.currentStep !== 0) return null;
  const title = hero.querySelector<HTMLElement>('[data-hero-intro="title"]');
  const text = hero.querySelector<HTMLElement>('[data-hero-intro="text"]');
  const label = hero.querySelector<HTMLElement>('[data-hero-intro="pilot"] [data-button-label]');
  const overlay = hero.querySelector<HTMLElement>('[data-hero-intro="overlay"]');
  const wordmark = hero.querySelector<SVGSVGElement>('[data-hero-intro="wordmark"]');
  const runner = hero.querySelector<HTMLElement>('[data-hero-intro="runner"]');
  if (!title || !text || !label || !overlay || !wordmark || !runner) return null;
  const arrow = hero.querySelector<SVGElement>('[data-hero-intro="pilot"] [data-button-arrow]');
  const square = text.querySelector<HTMLElement>('[data-hero-intro="square"]');
  const video = hero.querySelector<HTMLElement>('[data-hero-video]');
  const header = document.querySelector<HTMLElement>('[data-kulbit-header]');
  const logo = header ? [...header.querySelectorAll<SVGElement>('.logo svg > *')] : [];
  // The logo's square runs from the K to its place like a cursor and uncovers the letters behind it as they fade in
  // (svgo merges the letters into one path: a clip follows the square); the dark notch of the L stays as it is
  const logoDot = logo.find((part) => (part.getAttribute('fill') ?? '').includes('theme-icon-secondary'));
  const logoLetters = logo.filter((part) => part.getAttribute('fill') === 'currentColor');
  const projects = header?.querySelector<HTMLElement>('.button') ?? null;
  const desktop = window.matchMedia('(min-width: 992px)').matches;
  // Desktop: the sound button waits for the end of the preloader too (the source's CSS hides it ≥ 992px until then)
  const sound = desktop ? hero.querySelector<HTMLElement>('[data-kulbit-sound] [data-hero-magnet]') : null;

  overlay.classList.add('is--active');
  const strokes = [...wordmark.querySelectorAll<SVGPathElement>('path')];
  const lengths = strokes.map((path) => path.getTotalLength());
  // 3px at 1920 (0.1875rem), in the wordmark's units
  const unit = wordmark.getBoundingClientRect().width / WORD_WIDTH || 1;
  gsap.set(wordmark, { strokeWidth: rem(0.1875) / unit });
  strokes.forEach((path, index) => {
    gsap.set(path, { strokeDasharray: `${lengths[index]} ${lengths[index]}`, strokeDashoffset: lengths[index] });
  });
  // Its own hover transition (transform) would chase every frame of the tweens
  gsap.set(runner, { scaleX: 0, scaleY: 0, transformOrigin: '50% 50%', transition: 'none' });
  if (square) gsap.set(square, { opacity: 0, x: -rem(17.125), transition: 'none' });

  if (video) gsap.set(video, { opacity: 0 });
  if (logoDot) gsap.set(logoDot, { opacity: 0 });
  if (logoLetters.length) gsap.set(logoLetters, { opacity: 0, clipPath: `inset(0% ${LOGO_CLIP_FROM}% 0% 0%)` });
  if (projects) gsap.set(projects, { opacity: 0 });
  if (arrow) gsap.set(arrow, { opacity: 0 });
  if (sound) gsap.set(sound, { opacity: 0 });

  const titleCopy = copyText(title);
  const titleLines = splitLines(titleCopy.visual);
  const labelCopy = copyText(label);
  const labelLines = splitLines(labelCopy.visual);
  const blocks = [...text.children].filter(
    (block): block is HTMLElement => block instanceof HTMLElement && block !== square,
  );
  gsap.set(blocks, { opacity: 0, y: -rem(4) });

  let timeline: gsap.core.Timeline | null = null;
  let ended = false;
  let onDone: (() => void) | null = null;
  const end = () => {
    if (ended) return;
    ended = true;
    window.removeEventListener('resize', onResize);
    titleCopy.restore();
    labelCopy.restore();
    overlay.classList.remove('is--active');
    gsap.set([wordmark, ...strokes, runner], { clearProps: 'all' });
    gsap.set(blocks, { clearProps: 'opacity,transform' });
    if (square) gsap.set(square, { clearProps: 'opacity,transform,transition' });
    if (video) gsap.set(video, { clearProps: 'opacity' });
    if (logoDot) gsap.set(logoDot, { clearProps: 'opacity,transform' });
    if (logoLetters.length) gsap.set(logoLetters, { clearProps: 'opacity,clipPath' });
    if (projects) gsap.set(projects, { clearProps: 'opacity' });
    if (arrow) gsap.set(arrow, { clearProps: 'opacity' });
    if (sound) gsap.set(sound, { clearProps: 'opacity' });
    onDone?.();
  };
  // A new width (a rotation, a resized window) would leave the measured paths and the split lines wrong: the intro
  // jumps to its end; a height-only change (the phone's bars) is ignored
  const startWidth = window.innerWidth;
  const onResize = () => {
    if (window.innerWidth === startWidth) return;
    if (timeline) timeline.progress(1);
    else end();
  };
  window.addEventListener('resize', onResize);

  return {
    play: (done) => {
      onDone = done;
      if (ended) {
        done();
        return;
      }
      const tl = gsap.timeline();
      timeline = tl;

      // The runner's places in the hero: its box (size × size, scaled around its centre) over a rect of the hero
      const heroBox = hero.getBoundingClientRect();
      const wordBox = wordmark.getBoundingClientRect();
      const size = runner.offsetWidth || 1;
      const k = wordBox.width / WORD_WIDTH;
      const wx = (u: number) => wordBox.left - heroBox.left + (u - WORD_X) * k;
      const wy = (v: number) => wordBox.top - heroBox.top + v * k;
      const at = (left: number, top: number, width: number, height: number) => ({
        x: left + width / 2 - size / 2,
        y: top + height / 2 - size / 2,
        scaleX: width / size,
        scaleY: height / size,
      });
      const startTop = heroBox.height * 0.587 - size / 2;
      const startLeft = title.getBoundingClientRect().left - heroBox.left + rem(0.625);
      const stem = { width: L_STEM * k, height: L_FOOT * k };
      gsap.set(runner, { ...at(startLeft, startTop, size, size), scaleX: 0, scaleY: 0 });
      tl.to(runner, { scaleX: 1, scaleY: 1, duration: 0.17, ease: 'power2.out' }, 0.03);
      tl.to(runner, { x: wx(L_X - L_APPROACH), duration: 0.5, ease: 'power1.in' }, 0.27);
      tl.to(runner, { ...at(wx(L_X), wy(L_ENTRY), stem.width, stem.height), duration: 0.16, ease: 'none' }, 0.77);
      tl.to(runner, { ...at(wx(L_X), wy(L_FOOT_TOP), stem.width, stem.height), duration: 0.27, ease: 'none' }, 0.93);
      tl.to(runner, { x: `+=${L_RUN * k}`, duration: 0.17, ease: 'none' }, 1.2);
      tl.to(runner, { opacity: 0, duration: 0.13, ease: 'none' }, 1.27);

      // Every letter's strokes draw (0.4 s) and erase themselves (0.4 s), the letters 0.1 s apart
      strokes.forEach((path, index) => {
        const letter = Number(path.dataset.heroLetter) || 0;
        const start = 0.58 + letter * 0.1;
        tl.to(path, { strokeDashoffset: 0, duration: 0.4, ease: 'power1.inOut' }, start);
        tl.to(path, { strokeDashoffset: -lengths[index], duration: 0.4, ease: 'power1.in' }, start + 0.4);
      });

      if (square) {
        tl.set(square, { opacity: 1 }, 1.23);
        tl.to(square, { x: 0, duration: 0.7, ease: 'power2.out' }, 1.23);
      }

      if (video) tl.to(video, { opacity: 1, duration: 1.9, ease: 'power1.inOut' }, 0.3);
      if (logoDot) {
        tl.fromTo(logoDot, { x: -LOGO_RUN }, { x: 0, duration: 0.55, ease: 'power1.out' }, 1.55);
        tl.to(logoDot, { opacity: 1, duration: 0.1, ease: 'none' }, 1.55);
      }
      if (logoLetters.length) {
        tl.to(logoLetters, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power1.out' }, 1.55);
        tl.to(logoLetters, { opacity: 1, duration: 0.5, ease: 'none' }, 1.55);
      }
      // The statement: its last block first
      tl.to([...blocks].reverse(), { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out' }, 1.6);
      if (projects) tl.to(projects, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 1.85);
      if (arrow) tl.to(arrow, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 1.85);

      titleLines.forEach((line, index) => {
        tl.to(line, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, 2.28 + index * 0.1);
      });
      labelLines.forEach((line, index) => {
        tl.to(line, { yPercent: 0, duration: 0.5, ease: 'power3.out' }, 2.5 + index * 0.05);
      });
      if (sound) tl.to(sound, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 2.4);
      tl.call(end, [], tl.duration());
    },
  };
};
