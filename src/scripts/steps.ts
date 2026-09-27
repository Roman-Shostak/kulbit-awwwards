/**
 * Step scroll (GSAP) — the page never scrolls freely: one gesture (a wheel flick, a touch swipe, a key)
 * is one step. A step plays the next part of the current scene's animation or, when the scene has
 * nothing left to play, moves to the next scene. Enabled per page with `<BaseLayout steps>`: `data-scenes`
 * on <main>, `data-steps` on <html> (an inline script in <head>, before the first paint; the module sets
 * it too), which locks the native scroll (utilities.css). Without JS the page scrolls as usual.
 *
 * Scenes: every section in <main> and the footer, in DOM order. The default move between scenes is a
 * scroll to the next scene's top, `--transition-duration-slow` on `--transition-easing` (tokens.css).
 *
 * A section with its own steps registers a paused timeline in its <script>. Its stops are the start,
 * every label and the end; one gesture plays from one stop to the next (backwards on the way up):
 *
 *   import { gsap } from 'gsap';
 *   import { scene } from '@/scripts/steps';
 *
 *   const root = document.querySelector<HTMLElement>('.section--hero');
 *   const timeline = gsap.timeline({ paused: true })
 *     .to('.hero_title', { … })   // gesture 1: start → 'text'
 *     .addLabel('text')
 *     .to('.hero_text', { … });   // gesture 2: 'text' → end, gesture 3: the next scene
 *   scene(root, { timeline, onEnter: (direction) => …, onLeave: (direction) => … });
 *
 * - A scene reached from above starts at its first stop, from below (going back) at its last one.
 *   Scenes above the current one stay finished, scenes below it stay at the start.
 * - onEnter(direction) / onLeave(direction): every arrival / departure (1 = down, -1 = up), also on
 *   the first scene when the page opens (its intro). A returned tween, timeline or promise is awaited:
 *   onLeave before the move, onEnter after it; no input is taken meanwhile.
 * - Input: wheel and touch (GSAP Observer); ArrowDown / PageDown / Space and ArrowUp / PageUp /
 *   Shift+Space; Home / End. A trackpad flick keeps sending wheel events for about a second: the next
 *   gesture counts only after the input has been still for STOP_DELAY, so one flick is one step.
 * - Same-page anchors (`/#about`, the skip link, back/forward between them) move to the scene that holds the target; keyboard
 *   focus in another scene jumps there with the scene finished, so the focused element is visible.
 * - A modal <dialog> or the open mobile menu (`menu:toggle`, the same event as motion.ts) pauses the
 *   steps; <dialog> and elements with `data-lenis-prevent` (the menu panel) keep their own native scroll.
 * - `prefers-reduced-motion: reduce` → every step lands instantly.
 * - On a page without `steps` a registered timeline is shown finished and the hooks never run.
 * Never together with `<BaseLayout motion>` (Lenis would fight the lock): BaseLayout loads only this one.
 */
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { Observer } from 'gsap/Observer';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(CustomEase, Observer, ScrollToPlugin);

export type Direction = 1 | -1;

export interface SceneOptions {
  /** A paused timeline; its stops are the start, every label and the end */
  timeline?: gsap.core.Timeline;
  /** Runs on every arrival; a returned tween/promise is awaited before the next step */
  onEnter?: (direction: Direction) => unknown;
  /** Runs on every departure; a returned tween/promise is awaited before the move */
  onLeave?: (direction: Direction) => unknown;
}

// Seconds of still input after which the next wheel/touch movement counts as a new gesture
const STOP_DELAY = 0.2;
// Movement in px before a wheel or a touch counts as a gesture
const TOLERANCE = 10;

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const registry = new Map<Element, SceneOptions>();
const isStepPage = () => !!document.querySelector('main[data-scenes]');

let scenes: HTMLElement[] = [];
let index = 0; // the current scene
let stop = 0; // the current stop of its timeline
let active = false;
let busy = false;
let armed = true;
let menuOpen = false;

// The motion tokens, read on the first move (the stylesheet may arrive after the module on a cold load)
let motion: { duration: number; ease: string | gsap.EaseFunction } | undefined;
const motionTokens = () => {
  if (motion) return motion;
  const styles = getComputedStyle(root);
  const duration = styles.getPropertyValue('--transition-duration-slow').trim();
  const bezier = styles.getPropertyValue('--transition-easing').match(/cubic-bezier\(([^)]+)\)/)?.[1];
  motion = {
    duration: duration.endsWith('ms') ? parseFloat(duration) / 1000 : parseFloat(duration) || 0.8,
    ease: bezier ? CustomEase.create('site', bezier) : 'power3.out',
  };
  return motion;
};

const stopsOf = (element: Element) => {
  const timeline = registry.get(element)?.timeline;
  if (!timeline) return [0];
  return [...new Set([0, ...Object.values(timeline.labels), timeline.duration()])].sort((a, b) => a - b);
};

const sceneOf = (element: Element | null) => {
  if (!element) return -1;
  const inside = scenes.findIndex((scene) => scene.contains(element));
  return inside >= 0 ? inside : scenes.findIndex((scene) => element.contains(scene));
};

// Scenes above the target finished, below it at the start; the target at its stop
const settle = (target: number, targetStop: number) => {
  scenes.forEach((scene, i) => {
    const timeline = registry.get(scene)?.timeline;
    if (!timeline) return;
    if (i === target) timeline.pause(stopsOf(scene)[targetStop]);
    else timeline.pause(i < target ? timeline.duration() : 0);
  });
};

const scrollToScene = (scene: HTMLElement, immediate: boolean) =>
  gsap.to(window, {
    scrollTo: { y: scene, autoKill: false },
    duration: immediate || reduceMotion ? 0 : motionTokens().duration,
    ease: motionTokens().ease,
    overwrite: true,
  });

const move = async (target: number, direction: Direction, { immediate = false, finished = direction < 0 } = {}) => {
  busy = true;
  try {
    await registry.get(scenes[index])?.onLeave?.(direction);
    const scene = scenes[target];
    index = target;
    stop = finished ? stopsOf(scene).length - 1 : 0;
    settle(target, stop);
    await scrollToScene(scene, immediate);
    await registry.get(scene)?.onEnter?.(direction);
  } finally {
    busy = false;
  }
};

const play = async (targetStop: number) => {
  const timeline = registry.get(scenes[index])?.timeline;
  if (!timeline) return;
  busy = true;
  try {
    const time = stopsOf(scenes[index])[targetStop];
    stop = targetStop;
    if (reduceMotion) timeline.pause(time);
    else await timeline.tweenTo(time);
  } finally {
    busy = false;
  }
};

const step = (direction: Direction) => {
  const nextStop = stop + direction;
  if (nextStop >= 0 && nextStop < stopsOf(scenes[index]).length) return play(nextStop);
  const target = index + direction;
  if (target >= 0 && target < scenes.length) return move(target, direction);
};

const paused = () => menuOpen || !!document.querySelector('dialog:modal');

// Keeps the current scene in place after a resize or a layout change above it (fonts, images)
let snapFrame = 0;
const snap = () => {
  cancelAnimationFrame(snapFrame);
  snapFrame = requestAnimationFrame(() => {
    if (!busy) gsap.set(window, { scrollTo: { y: scenes[index], autoKill: false } });
  });
};

const init = () => {
  if (active || !isStepPage()) return;
  const main = document.querySelector('main[data-scenes]')!;
  scenes = [...main.children, document.querySelector('.footer')].filter(
    (element): element is HTMLElement => element instanceof HTMLElement && !element.matches('script, style, template'),
  );
  if (!scenes.length) return;
  active = true;
  root.dataset.steps = '';
  history.scrollRestoration = 'manual';

  // Opened with a hash: start at the scene that holds the target
  const hashTarget = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  index = Math.max(sceneOf(hashTarget), 0);
  stop = 0;
  settle(index, stop);
  gsap.set(window, { scrollTo: { y: scenes[index], autoKill: false } });

  // Wheel and touch: one gesture = one step; movement during a step or right after it is inertia
  Observer.create({
    target: window,
    type: 'wheel,touch',
    wheelSpeed: -1,
    tolerance: TOLERANCE,
    preventDefault: true,
    ignore: 'dialog, [data-lenis-prevent]',
    onChangeY: (self) => {
      if (busy || !armed) {
        armed = false;
        return;
      }
      if (paused()) return;
      armed = false;
      step(self.deltaY < 0 ? 1 : -1);
    },
    onStop: () => {
      armed = true;
    },
    onStopDelay: STOP_DELAY,
  });

  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || paused()) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, select, [contenteditable], dialog, [data-lenis-prevent]')) return;
    let action: (() => unknown) | undefined;
    if (event.key === 'ArrowDown' || event.key === 'PageDown') action = () => step(1);
    else if (event.key === 'ArrowUp' || event.key === 'PageUp') action = () => step(-1);
    else if (event.key === ' ' && !target?.closest('button, summary, [role="button"]')) action = () => step(event.shiftKey ? -1 : 1);
    else if (event.key === 'Home' && index > 0) action = () => move(0, -1, { finished: false });
    else if (event.key === 'End' && index < scenes.length - 1) action = () => move(scenes.length - 1, 1);
    if (!action) return;
    event.preventDefault();
    if (!busy && !event.repeat) action();
  });

  // Same-page anchors move to the target's scene; the skip link lands at once and focuses <main>
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (!link) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    const sceneIndex = sceneOf(target);
    if (!target || sceneIndex < 0) return;
    event.preventDefault();
    history.pushState(null, '', url.hash);
    const skip = link.classList.contains('skip-link');
    if (skip) target.focus();
    if (busy || sceneIndex === index) return;
    move(sceneIndex, sceneIndex > index ? 1 : -1, { immediate: skip, finished: false });
  });

  // Back / forward between anchors (or a hash typed in the address bar): the browser has already jumped,
  // land on the target's scene (no hash = the first scene)
  window.addEventListener('hashchange', () => {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    const sceneIndex = target ? sceneOf(target) : 0;
    if (sceneIndex < 0) return;
    if (sceneIndex === index) snap();
    else move(sceneIndex, sceneIndex > index ? 1 : -1, { immediate: true, finished: false });
  });

  // Keyboard focus in another scene: jump there with the scene finished
  document.addEventListener('focusin', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (busy || !target?.matches(':focus-visible')) return;
    const sceneIndex = sceneOf(target);
    if (sceneIndex < 0 || sceneIndex === index) return;
    move(sceneIndex, sceneIndex > index ? 1 : -1, { immediate: true, finished: true });
  });

  document.addEventListener('menu:toggle', (event) => {
    menuOpen = (event as CustomEvent<{ open: boolean }>).detail.open;
  });
  window.addEventListener('resize', snap);
  new ResizeObserver(snap).observe(document.body);

  // The first scene's arrival (its intro): no steps until it has played
  busy = true;
  Promise.resolve(registry.get(scenes[index])?.onEnter?.(1)).finally(() => {
    busy = false;
  });
};

/** Registers a scene's own steps (a paused timeline with labels) and its enter/leave hooks */
export const scene = (element: Element | null, options: SceneOptions) => {
  if (!element) return;
  registry.set(element, options);
  const timeline = options.timeline;
  if (!timeline) return;
  if (!isStepPage()) {
    timeline.progress(1).pause();
    return;
  }
  const i = scenes.indexOf(element as HTMLElement);
  if (!active || i < 0) timeline.pause(0);
  else timeline.pause(i < index ? timeline.duration() : i > index ? 0 : stopsOf(element)[stop]);
};

// Module scripts run before DOMContentLoaded: waiting for it lets every section register first
if (document.readyState === 'complete') init();
else {
  document.addEventListener('DOMContentLoaded', init, { once: true });
  window.addEventListener('load', init, { once: true });
}
