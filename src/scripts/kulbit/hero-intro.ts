/**
 * The hero intro after the preloader — the port of initHeroIntroAnimation() of kulbit.webflow.io
 * (github.com/Roman-Shostak/KULBIT-GSPAP.js, gsap-animation.js): the same timeline, eases and numbers, its lengths
 * rem × our fluid scale. The video fades in (with the sound button on desktop), the header drops in, the heading types
 * itself letter by letter, the CTA's arrow slides in from the bottom left and its label types itself (the label is
 * hidden ≤ 991px; its time stays), the statement scrambles in, the square rises; gestures and keys wait for its end
 * (`app.intro`); a new width ends it at once.
 * Driven by src/components/sections/Preloader.astro: `prepareHeroIntro()` when the preloader starts to fade (the start
 * state, so nothing shows through the fade — the source emptied the texts only once the fade had ended, and on phones
 * they flashed), `play()` when it has gone. Only on the hero at its start: a restored later section gets no intro.
 * The engine's own elements (the wrappers with data-kulbit-*) are never touched — the intro moves their contents: the
 * header's row ([data-kulbit-header] > *), the video ([data-hero-video]), the CTA's arrow ([data-button-arrow]) and
 * copies of the texts: during the intro a text holds an sr-only copy of itself and an aria-hidden copy that is animated
 * (display: contents, so the layout stays); its own nodes come back at the end and every inline style is cleared.
 * Hooks in Hero.astro: data-hero-intro="title | text | pilot | square".
 */
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { app, rem } from './app';

gsap.registerPlugin(ScrambleTextPlugin);

const SCRAMBLE_CHARS = '01!<>-_\\/[]{}—=+*^?#';
// The heading: one letter every 0.025 s, each fading in for 0.04 s, from 0.6 s
const TITLE_START = 0.6;
const TITLE_DURATION = 0.04;
const TITLE_STAGGER = 0.025;
// The source's heading holds ten spaces before its «x» (they make its layout; ours is justified): the typing waits
// there as long as for ten letters — nine steps more for «x» and what follows it; the space after «x» (the source has
// none there) shares its step with «A»: 39 steps, as in the source
const TITLE_GAP = 9;

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

/** Every character in its own hidden span, the elements around them kept (splitIntoCharSpans of the source) */
const splitChars = (root: HTMLElement) => {
  const chars: HTMLElement[] = [];
  const walk = (node: Node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      [...node.childNodes].forEach(walk);
      return;
    }
    const text = node.textContent ?? '';
    if (!text.length) return;
    const fragment = document.createDocumentFragment();
    for (const char of text) {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      fragment.append(span);
      chars.push(span);
    }
    node.parentNode?.replaceChild(fragment, node);
  };
  [...root.childNodes].forEach(walk);
  return chars;
};

/** The text nodes to scramble, their edge spaces split off as static text, emptied (getScrambleItems of the source) */
const scrambleItems = (root: HTMLElement) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const items: { node: Text; text: string }[] = [];
  nodes.forEach((node) => {
    const [, lead = '', core = '', trail = ''] = (node.textContent ?? '').match(/^(\s*)([\s\S]*?)(\s*)$/) ?? [];
    if (!core.trim()) return;
    if (lead) node.before(lead);
    if (trail) node.after(trail);
    items.push({ node, text: core });
  });
  items.forEach(({ node }) => {
    node.textContent = '';
  });
  return items;
};

/** Sets the start state of the intro, or null when there is none (no hero at its start, its texts missing) */
export const prepareHeroIntro = (): HeroIntro | null => {
  const hero = app.sections[0]?.el;
  if (!hero || app.currentSectionIndex !== 0 || app.currentStep !== 0) return null;
  const title = hero.querySelector<HTMLElement>('[data-hero-intro="title"]');
  const text = hero.querySelector<HTMLElement>('[data-hero-intro="text"]');
  const label = hero.querySelector<HTMLElement>('[data-hero-intro="pilot"] [data-button-label]');
  if (!title || !text || !label) return null;
  const arrow = hero.querySelector<SVGElement>('[data-hero-intro="pilot"] [data-button-arrow]');
  const video = hero.querySelector<HTMLElement>('[data-hero-video]');
  const header = document.querySelector<HTMLElement>('[data-kulbit-header] > *');
  const desktop = window.matchMedia('(min-width: 992px)').matches;
  // Desktop: the sound button waits for the end of the preloader too (the source's CSS hides it ≥ 992px until then)
  const sound = desktop ? hero.querySelector<HTMLElement>('[data-kulbit-sound] [data-hero-magnet]') : null;

  // The source's start state: the header 7rem up, the video out, the arrow 6.25em (of its 28px) down and left
  if (header) gsap.set(header, { opacity: 0, y: -rem(7) });
  if (video) gsap.set(video, { opacity: 0 });
  if (arrow) gsap.set(arrow, { x: -rem(10.9375), y: rem(10.9375) });
  if (sound) gsap.set(sound, { opacity: 0 });

  const gapAfter = (title.firstChild?.textContent ?? '').trimEnd().lastIndexOf(' '); // «Vision x»: 16
  const titleCopy = copyText(title);
  const titleChars = splitChars(titleCopy.visual);
  const labelCopy = copyText(label);
  const labelChars = splitChars(labelCopy.visual);
  const textCopy = copyText(text);
  const square = textCopy.visual.querySelector<HTMLElement>('[data-hero-intro="square"]');
  // The blocks keep their size while their text is empty and scrambling (the source locked each text the same way)
  [...textCopy.visual.children].forEach((block) => {
    if (block === square || !(block instanceof HTMLElement)) return;
    const { width, height } = block.getBoundingClientRect();
    Object.assign(block.style, { width: `${width}px`, height: `${height}px`, overflow: 'hidden' });
  });
  const items = scrambleItems(textCopy.visual);
  // 3rem down; its own hover transition (transform) would chase every frame of the tween
  if (square) gsap.set(square, { opacity: 0, y: rem(3), transition: 'none' });

  let timeline: gsap.core.Timeline | null = null;
  let ended = false;
  let onDone: (() => void) | null = null;
  const end = () => {
    if (ended) return;
    ended = true;
    window.removeEventListener('resize', onResize);
    titleCopy.restore();
    labelCopy.restore();
    textCopy.restore();
    if (header) gsap.set(header, { clearProps: 'opacity,transform' });
    if (video) gsap.set(video, { clearProps: 'opacity' });
    if (arrow) gsap.set(arrow, { clearProps: 'transform' });
    if (sound) gsap.set(sound, { clearProps: 'opacity' });
    onDone?.();
  };
  // A new width (a rotation, a resized window) would leave the locked blocks and the half-typed texts wrong: the intro
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
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      timeline = tl;
      if (sound) tl.to(sound, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
      if (video) tl.to(video, { opacity: 1, duration: 0.5, ease: 'power2.inOut' }, 0);
      if (header) tl.to(header, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.3);

      const step = (index: number) => {
        if (gapAfter < 0 || index <= gapAfter) return index;
        return index <= gapAfter + 2 ? index + TITLE_GAP : index + TITLE_GAP - 1;
      };
      const titleTotal = titleChars.length ? (step(titleChars.length - 1) + 1) * TITLE_STAGGER + TITLE_DURATION : 0;
      if (titleChars.length) {
        tl.to(
          titleChars,
          { opacity: 1, duration: TITLE_DURATION, stagger: (index) => step(index) * TITLE_STAGGER, ease: 'none' },
          TITLE_START,
        );
      }
      // The arrow comes in at 80 % of the typing: up, then right
      if (arrow) {
        tl.to(arrow, { y: 0, duration: 0.35, ease: 'power3.out' }, TITLE_START + titleTotal * 0.8);
        tl.to(arrow, { x: 0, duration: 0.4, ease: 'power3.inOut' }, '>-0.05');
      }
      if (labelChars.length) tl.to(labelChars, { opacity: 1, duration: 0.03, stagger: 0.04, ease: 'none' }, '>0.05');
      if (items.length) {
        tl.addLabel('scramble', '>0.05');
        items.forEach(({ node, text: value }) => {
          tl.to(
            node,
            { duration: 0.5, scrambleText: { text: value, chars: SCRAMBLE_CHARS, revealDelay: 0, speed: 1.2 } },
            'scramble',
          );
        });
      }
      // The source rises two squares (its desktop copy, then its tablet / mobile one) with stagger 0.1: ≤ 991px the
      // visible one is the second; the end comes 0.1 s after both
      tl.addLabel('square', '>0.1');
      const squareAt = desktop ? 'square' : 'square+=0.1';
      if (square) tl.to(square, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, squareAt);
      tl.call(end, [], 'square+=0.6');
    },
  };
};
