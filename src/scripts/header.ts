/**
 * Hiding header — `.header-fixed` gets `is--hidden` (slides up, utilities.css) after the page has been
 * scrolled down by SCROLL_OFFSET and loses it after SCROLL_OFFSET of scrolling up, both counted from
 * the point where the scroll direction last changed, so small jitter (trackpad, touch) never toggles it.
 * Never hidden near the top (within the header height), while the mobile menu or a language list is open
 * (`[data-menu-toggle]` / `[data-lang-toggle]` with `aria-expanded="true"`; the list hangs below the header
 * and would stay on screen) or while the hero intro holds it (`is--intro`, motion.ts).
 * Keyboard focus inside a hidden header brings it back (utilities.css `.is--hidden:has(:focus-visible)`).
 * Listens to the native `scroll` event, so it works with and without Lenis.
 * Enabled alone with `<BaseLayout hidingHeader>`; `<BaseLayout motion>` includes it.
 */

// Distance in px to scroll in one direction before the header hides or shows again
const SCROLL_OFFSET = 40;

const header = document.querySelector<HTMLElement>('.header-fixed');
if (header) {
  let lastScroll = Math.max(window.scrollY, 0);
  let anchor = lastScroll;
  let goingDown = true;
  let ticking = false;

  const update = () => {
    ticking = false;
    // iOS rubber-band scrolling reports negative values at the top
    const scroll = Math.max(window.scrollY, 0);
    if (scroll === lastScroll) return;
    const down = scroll > lastScroll;
    if (down !== goingDown) {
      goingDown = down;
      anchor = lastScroll;
    }
    lastScroll = scroll;
    if (header.classList.contains('is--intro')) return;
    const menuOpen = header.querySelector('[data-menu-toggle][aria-expanded="true"], [data-lang-toggle][aria-expanded="true"]');
    if (scroll <= header.offsetHeight || menuOpen) {
      header.classList.remove('is--hidden');
    } else if (Math.abs(scroll - anchor) >= SCROLL_OFFSET) {
      header.classList.toggle('is--hidden', down);
    }
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
}
