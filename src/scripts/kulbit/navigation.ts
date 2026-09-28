/**
 * Transition buttons (ADR-003), delegated — works for any element added at any time:
 *   data-target-section="3"          section by index
 *   data-target-section="projects"   the section with data-section-name="projects" (reorder-safe, preferred)
 * One smooth jump with a constant duration (autoAdvanceTo), the target at its start. A target that does not exist
 * (yet) is a no-op. A jump asked while something plays (a move, a section's appearance) waits for its end instead of
 * being lost; a newer request replaces it.
 * Keyboard focus shows its screen (the carousel pattern: every screen stays in the accessibility tree): a keyboard
 * focus (:focus-visible, not a click) landing in another section jumps there, then — like a focus inside the
 * current section — asks the section's controller to reveal it (`reveal(el)`: the step that shows it). Tab from
 * outside the screens (the header, the menu) enters on the current screen (entryControl).
 * Source: kulbit-webflow `src/04-navigation.js` (its data-target-step is not ported: no markup used it).
 */
import { gsap } from 'gsap';
import { app } from './app';
import { autoAdvanceTo } from './sections';

let pending: (() => void) | null = null;
const whenIdle = (run: () => void) => {
  if (pending) gsap.ticker.remove(pending);
  pending = null;
  if (!app.isAnimating) return run();
  const check = () => {
    if (app.isAnimating) return;
    gsap.ticker.remove(check);
    pending = null;
    run();
  };
  pending = check;
  gsap.ticker.add(check);
};

const resolveIndex = (target: string | null) => {
  if (target === null) return -1;
  if (/^\d+$/.test(target)) return parseInt(target, 10);
  const found = app.sections.find((section) => section.el.getAttribute('data-section-name') === target);
  return found ? found.index : -1;
};

// The focused control's section becomes the current one (if it is not), then the control is revealed — as long as
// the focus is still on it
const showFocused = (target: HTMLElement, index: number) =>
  whenIdle(() => {
    if (app.currentSectionIndex !== index) autoAdvanceTo(index);
    whenIdle(() => {
      if (document.activeElement !== target || app.currentSectionIndex !== index) return;
      app.sections[index]?.controller?.reveal?.(target);
    });
  });

// What Tab can reach, in DOM order (the site sets no positive tabindex)
const TABBABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]';
// Rendered and not visibility: hidden (a browser without checkVisibility: rendered at all)
const visible = (el: HTMLElement) =>
  el.checkVisibility?.({ checkVisibilityCSS: true, visibilityProperty: true }) ?? el.getClientRects().length > 0;
const tabbables = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert]') && visible(el),
  );
/**
 * Tab from outside the screens (the header after a button jump, the menu, the skip link) continues as if the focus
 * stood at the edge of the current screen: forward → the first control of the current screen or a later one,
 * backward → the last one of the current screen or an earlier one. Without it the DOM order would send it to the
 * hero (or the footer) and away from the screen the visitor just chose.
 */
const entryControl = (back: boolean) => {
  const from = app.currentSectionIndex;
  const order = back ? app.sections.slice(0, from + 1).reverse() : app.sections.slice(from);
  for (const section of order) {
    const list = tabbables(section.el);
    const found = back ? list.at(-1) : list[0];
    if (found) return found;
  }
  return null;
};

// The last Tab: its direction, only for the focus move it causes (the default action of the same keydown)
let tabbing: { back: boolean } | null = null;

export const setupNavigation = () => {
  document.addEventListener('click', (event) => {
    const trigger = event.target instanceof Element ? event.target.closest('[data-target-section]') : null;
    if (!trigger) return;
    event.preventDefault();
    const index = resolveIndex(trigger.getAttribute('data-target-section'));
    if (index < 0) return;
    whenIdle(() => autoAdvanceTo(index));
  });

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Tab') return;
      tabbing = { back: event.shiftKey };
      window.setTimeout(() => {
        tabbing = null;
      });
    },
    true,
  );

  document.addEventListener('focusin', (event) => {
    if (app.landscapeBlocked) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target?.matches(':focus-visible')) return;
    const section = app.sections.find((s) => s.el !== target && s.el.contains(target));
    if (!section) return;
    const previous = event.relatedTarget instanceof Node ? event.relatedTarget : null;
    const fromOutside = !previous || !app.sections.some((s) => s.el.contains(previous));
    if (tabbing && fromOutside && section.index !== app.currentSectionIndex) {
      const entry = entryControl(tabbing.back);
      tabbing = null;
      if (entry && entry !== target) {
        entry.focus(); // its own focusin reveals it (or jumps to its screen)
        return;
      }
    }
    showFocused(target, section.index);
  });
};
