/**
 * Motion module — the typical animation set for client sites, enabled per page with
 * `<BaseLayout motion>`. Without it the page ships no JavaScript and every `data-reveal`
 * element is simply visible (the reveal styles in utilities.css are gated by `[data-motion]`).
 *
 * 1. Lenis smooth scrolling (autoRaf), also to an anchor of the same page (`anchors`: nav items such
 *    as `/#about` on the home page; the native jump is prevented here, otherwise the page flashes at
 *    the target for a frame before Lenis animates — the hash still lands in the address, the skip link
 *    still moves focus to <main>). A header that opens a mobile menu dispatches
 *    `menu:toggle` ({ detail: { open } }) on `document`; scrolling stops while it is open and while
 *    a modal <dialog> is open. The menu panel and the dialog carry `data-lenis-prevent` to scroll natively.
 * 2. Reveal on scroll: `[data-reveal]` gets `is--visible` when it enters the viewport;
 *    `data-reveal="stagger"` animates the element's children one by one;
 *    `data-reveal-delay="1…5"` delays a single element by that many stagger steps.
 *    An element that contains a photo waits for the photo to load first. Reveals start after the
 *    stylesheets and `document.fonts.ready` so the first paint is never caught half-hidden.
 * 3. Hiding header: src/scripts/header.ts (also available alone via `<BaseLayout hidingHeader>`).
 * 4. Intro: the section with `data-intro` (the hero) reveals its elements in order
 *    (data-reveal-delay 0 → 1 → 2 …); the header keeps `is--intro` (hidden, no transition) only until
 *    the reveals start and slides in together with the first element — it never waits for the whole
 *    sequence or for the hero photo to load.
 * `prefers-reduced-motion: reduce` → everything static, header still hides/shows.
 *
 * Do not put `data-reveal` on an element with its own scoped `transition` (a button): scoped styles
 * are unlayered and would override the utility animation — reveal a wrapper <div> instead.
 */
import Lenis from 'lenis';
// Inlined as a string and added only when this module runs: a plain CSS import would ship Lenis' rules with every
// page whose layout mentions the module, even a page that never loads it
import lenisStyles from 'lenis/dist/lenis.css?inline';
import './header';

const lenisStyle = document.createElement('style');
lenisStyle.textContent = lenisStyles;
document.head.append(lenisStyle);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Bottom part of the viewport (10 %) in which an element does not count as visible yet (observer rootMargin)
const REVEAL_MARGIN = 0.1;
// Turns on the reveal styles; without this attribute the page renders as is
document.documentElement.dataset.motion = '';

// Smooth scrolling; the page behind the open mobile menu or a modal <dialog> (popups) stays still.
// Panels that scroll themselves carry data-lenis-prevent (the menu, a popup).
const lenis = new Lenis({ autoRaf: true, anchors: true });
let menuOpen = false;
const syncScroll = () => {
  if (menuOpen || document.querySelector('dialog:modal')) lenis.stop();
  else lenis.start();
};
document.addEventListener('menu:toggle', (event) => {
  menuOpen = (event as CustomEvent<{ open: boolean }>).detail.open;
  syncScroll();
});
// showModal() and close() set and remove the dialog's `open` attribute
new MutationObserver(syncScroll).observe(document.body, { attributeFilter: ['open'], subtree: true });

// Same-page anchors: Lenis animates on the same click (`anchors`), but does not cancel the browser's own
// jump — without this the page shows the target for one frame and then scrolls from the start.
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
  if (!link) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
  const target = document.querySelector<HTMLElement>(decodeURIComponent(url.hash));
  if (!target) return;
  event.preventDefault();
  history.pushState(null, '', url.hash);
  if (link.classList.contains('skip-link')) {
    // Keyboard users skip the header: land at once and move the focus like the native jump would
    lenis.scrollTo(target, { immediate: true });
    target.focus();
  }
});

// Intro: the header stays hidden until the reveals start, then slides in with the first element
// of the data-intro section (released in the reveal start below)
const header = document.querySelector<HTMLElement>('.header-fixed');
if (header && document.querySelector('[data-intro]') && !reduceMotion) header.classList.add('is--intro');

// Reveal on scroll; an element that holds a photo waits for it to load first
const show = (target: Element) => {
  const photo = target.querySelector('img');
  if (photo && !photo.complete) {
    photo.addEventListener('load', () => target.classList.add('is--visible'), { once: true });
    photo.addEventListener('error', () => target.classList.add('is--visible'), { once: true });
  } else {
    target.classList.add('is--visible');
  }
};
const reveal = () => {
  const targets = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach((target) => target.classList.add('is--visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        show(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: `0px 0px -${REVEAL_MARGIN * 100}% 0px` },
  );
  targets.forEach((target) => observer.observe(target));
};
// The module can run before the stylesheet arrives on a cold load: wait for it, and for the fonts
const stylesReady = Promise.all(
  [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((link) =>
    link.sheet
      ? Promise.resolve()
      : new Promise((resolve) => {
          link.addEventListener('load', resolve, { once: true });
          link.addEventListener('error', resolve, { once: true });
        }),
  ),
);
Promise.all([stylesReady, document.fonts.ready]).then(() => {
  reveal();
  // The observer reports the visible elements on the next frame: the header starts in the same one
  requestAnimationFrame(() => header?.classList.remove('is--intro'));
});
