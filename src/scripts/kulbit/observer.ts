/**
 * Input: wheel and touch through GSAP Observer (ADR-008) + the keyboard. One gesture = one `advance`.
 * Source: kulbit-webflow `src/02-app-core.js` → handleGesture, setupObserver. The keyboard is new (the source had
 * none): ArrowDown / PageDown / Space → next, ArrowUp / PageUp / Shift+Space → previous.
 *
 * Trackpad inertia: one flick is a long stream of wheel events. A NEW flick is told from the inertia tail by
 * velocity: the tail slows down (ignored), a new flick spikes (> accelRatio × the previous velocity and
 * > minVelocity). Direction by the event TYPE, not the device (some desktops report `pointer: coarse`): the wheel
 * is natural (down = next), a touch swipe inverted (a swipe up = next, like native scrolling). No 'pointer' type:
 * a held mouse button + a drag must not scroll.
 */
import { Observer } from 'gsap/Observer';
import { app, config, type Direction } from './app';
import { advance } from './sections';

let flinging = false; // the previous gesture's inertia is still coming
let previousVelocity = 0;

const handleGesture = (dir: Direction, self: Observer) => {
  const velocity = Math.abs(self.velocityY);
  const accelerating = velocity > previousVelocity * config.accelRatio && velocity > config.minVelocity;
  previousVelocity = velocity;
  if (app.isAnimating) return; // a move / step is playing
  if (flinging && !accelerating) return; // the inertia tail
  flinging = true;
  advance(dir);
};

const gestureDir = (down: boolean, self: Observer): Direction => {
  const isWheel = self.event?.type === 'wheel';
  if (isWheel) return down ? 1 : -1;
  return down ? -1 : 1;
};

export const setupObserver = () => {
  app.observer?.kill();
  app.observer = Observer.create({
    target: window,
    type: 'wheel,touch',
    tolerance: 10,
    preventDefault: true, // the native scroll is blocked: the page moves only by sections
    onDown: (self) => handleGesture(gestureDir(true, self), self),
    onUp: (self) => handleGesture(gestureDir(false, self), self),
    onStop: () => {
      // new input counts only once everything has settled
      flinging = false;
      previousVelocity = 0;
    },
  });
};

export const setupKeyboard = () => {
  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    // Navigation off (the landscape popup) or a modal dialog open
    if (!app.observer?.isEnabled || document.querySelector('dialog:modal')) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), dialog')) return;

    let dir: Direction | 0 = 0;
    if (event.key === 'ArrowDown' || event.key === 'PageDown') dir = 1;
    else if (event.key === 'ArrowUp' || event.key === 'PageUp') dir = -1;
    else if (event.key === ' ' && !target?.closest('button, summary, [role="button"]')) dir = event.shiftKey ? -1 : 1;
    if (!dir) return;
    event.preventDefault();
    if (event.repeat || app.isAnimating) return; // a held key is one step
    advance(dir);
  });
};
