/**
 * The fill of a section's ui/ProgressLine ([data-progress-fill] inside `root`), driven the same way by every section:
 *   to(fraction, animate)  the width (0…1), tweened on the section's step timing or set at once
 *   prepare()              empty at once (the section starts sliding in: no backward run)
 *   enter(fraction)        prepare + fill the first part (the section has covered the previous one)
 *   collapse()             empty with the step timing (the section slides away)
 *   dispose()              the breakpoint changes: tweens killed, back to the CSS start width
 * Without a line every call is a no-op.
 */
import { gsap } from 'gsap';

export interface ProgressLine {
  fill: HTMLElement | null;
  to(fraction: number, animate: boolean): void;
  prepare(): void;
  enter(fraction: number): void;
  collapse(): void;
  dispose(): void;
}

export function progressLine(root: ParentNode, duration: number, ease: string): ProgressLine {
  const fill = root.querySelector<HTMLElement>('[data-progress-fill]');
  const to = (fraction: number, animate: boolean) => {
    if (!fill) return;
    const width = `${fraction * 100}%`;
    if (animate) gsap.to(fill, { width, duration, ease });
    else gsap.set(fill, { width });
  };
  const prepare = () => {
    if (!fill) return;
    gsap.killTweensOf(fill);
    gsap.set(fill, { width: '0%' });
  };
  return {
    fill,
    to,
    prepare,
    enter(fraction) {
      prepare();
      to(fraction, true);
    },
    collapse() {
      if (!fill) return;
      gsap.killTweensOf(fill);
      gsap.to(fill, { width: '0%', duration, ease });
    },
    dispose() {
      if (!fill) return;
      gsap.killTweensOf(fill);
      gsap.set(fill, { clearProps: 'width' });
    },
  };
}
