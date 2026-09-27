/**
 * Transition buttons (ADR-003), delegated — works for any element added at any time:
 *   data-target-section="3"          section by index
 *   data-target-section="projects"   the section with data-section-name="projects" (reorder-safe, preferred)
 *   data-target-step="2"             + that step of the section, instantly (goToSectionStep)
 * Without data-target-step: one smooth jump with a constant duration (autoAdvanceTo). A target that does not
 * exist (yet) is a no-op.
 * Source: kulbit-webflow `src/04-navigation.js`.
 */
import { app } from './app';
import { autoAdvanceTo, goToSectionStep } from './sections';

const resolveIndex = (target: string | null) => {
  if (target === null) return -1;
  if (/^\d+$/.test(target)) return parseInt(target, 10);
  const found = app.sections.find((section) => section.el.getAttribute('data-section-name') === target);
  return found ? found.index : -1;
};

export const setupNavigation = () => {
  document.addEventListener('click', (event) => {
    const trigger = event.target instanceof Element ? event.target.closest('[data-target-section]') : null;
    if (!trigger) return;
    event.preventDefault();
    const index = resolveIndex(trigger.getAttribute('data-target-section'));
    if (index < 0) return;
    const step = trigger.getAttribute('data-target-step');
    if (step !== null) goToSectionStep(index, parseInt(step, 10));
    else autoAdvanceTo(index);
  });
};
