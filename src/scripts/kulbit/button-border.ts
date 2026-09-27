/**
 * Hover border drawn from the cursor point on `[data-kulbit-border]`: an SVG rect over the element traces its
 * perimeter; on hover a segment grows from the perimeter point nearest to the cursor (opacity with it), on focus
 * the full outline fades in. The line width = the element's outline width (fallback: border width, then 2),
 * the colour = `--swatch-blue`.
 * Source: kulbit-webflow `src/09-button-border.js` (setupElement). Its setupHeroColors (colours of
 * `.button.is-hero` on hover) is not ported: the Button component styles its own hover / focus.
 */
import { gsap } from 'gsap';

const NS = 'http://www.w3.org/2000/svg';
const settings = {
  duration: 0.3, // draw / collapse
  ease: 'none',
  sampleN: 64, // precision of the entry point search on the perimeter
  offset: 0, // stroke offset outwards from the border centre (px)
};

const blue = () => getComputedStyle(document.documentElement).getPropertyValue('--swatch-blue').trim() || '#62b0ff';

const setupElement = (el: HTMLElement) => {
  const colour = blue();
  const state = {
    p: 0,
    center: 0,
    mode: 'hover' as 'hover' | 'focus',
    rect: null as SVGRectElement | null,
    svg: null as SVGSVGElement | null,
    L: 0,
    w: 0,
    h: 0,
  };

  // Hover: a visible segment of frac × L centred on `center` (wraps around the outline)
  const draw = (center: number, frac: number) => {
    if (!state.rect) return;
    const length = frac * state.L;
    state.rect.style.strokeDasharray = `${length} ${state.L - length}`;
    state.rect.style.strokeDashoffset = `${length / 2 - center}`;
    state.rect.style.opacity = String(frac);
  };
  // Focus: the full outline, only its opacity changes
  const drawFull = (frac: number) => {
    if (!state.rect) return;
    state.rect.style.strokeDasharray = `${state.L} 0`;
    state.rect.style.strokeDashoffset = '0';
    state.rect.style.opacity = String(frac);
  };
  const render = () => {
    if (state.mode === 'focus') drawFull(state.p);
    else draw(state.center, state.p);
  };

  // Rebuilds the overlay for the current size (init + resize)
  const build = () => {
    const styles = getComputedStyle(el);
    if (styles.position === 'static') el.style.position = 'relative';
    // Layout size (immune to transforms)
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const strokeWidth = parseFloat(styles.outlineWidth) || parseFloat(styles.borderTopWidth) || 2;
    const radius = parseFloat(styles.borderTopLeftRadius) || 0;
    // No layout (display: none on this breakpoint): no rect, rebuilt on resize / the first hover
    if (w <= 0 || h <= 0) {
      state.svg?.remove();
      state.svg = null;
      state.rect = null;
      return;
    }
    state.svg?.remove();

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    Object.assign(svg.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'visible',
      zIndex: '2',
    });
    const inset = strokeWidth / 2;
    const off = settings.offset;
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', String(inset - off));
    rect.setAttribute('y', String(inset - off));
    rect.setAttribute('width', String(Math.max(0, w - strokeWidth + 2 * off)));
    rect.setAttribute('height', String(Math.max(0, h - strokeWidth + 2 * off)));
    rect.setAttribute('rx', String(Math.max(0, radius - inset + off)));
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', colour);
    rect.setAttribute('stroke-width', String(strokeWidth));
    svg.appendChild(rect);
    el.appendChild(svg);

    state.svg = svg;
    state.rect = rect;
    state.w = w;
    state.h = h;
    state.L = rect.getTotalLength();
    render();
  };

  // The perimeter point nearest to the cursor (offset along the outline)
  const offsetFromMouse = (event: MouseEvent) => {
    const rect = state.rect;
    if (!rect) return 0;
    const box = el.getBoundingClientRect();
    const mx = (event.clientX - box.left) * (state.w / box.width);
    const my = (event.clientY - box.top) * (state.h / box.height);
    let best = 0;
    let bestDistance = Infinity;
    for (let k = 0; k <= settings.sampleN; k++) {
      const point = rect.getPointAtLength((k / settings.sampleN) * state.L);
      const distance = (point.x - mx) ** 2 + (point.y - my) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = (k / settings.sampleN) * state.L;
      }
    }
    return best;
  };

  const tweenP = (target: number) => {
    gsap.killTweensOf(state);
    gsap.to(state, { p: target, duration: settings.duration, ease: settings.ease, onUpdate: render });
  };

  // The line stays while hovered OR focused; at p = 1 both modes draw the same full outline
  let hovered = false;
  let focused = false;
  el.addEventListener('mouseenter', (event) => {
    if (!state.rect) build(); // became visible without a resize
    if (!state.rect) return;
    hovered = true;
    state.mode = 'hover';
    state.center = offsetFromMouse(event);
    tweenP(1);
  });
  el.addEventListener('mouseleave', () => {
    hovered = false;
    if (focused) {
      state.mode = 'focus';
      tweenP(1);
    } else tweenP(0);
  });
  el.addEventListener('focusin', () => {
    focused = true;
    if (!hovered) {
      state.mode = 'focus';
      tweenP(1);
    }
  });
  el.addEventListener('focusout', () => {
    focused = false;
    if (!hovered) tweenP(0);
  });

  build();
  return build;
};

export const setupButtonBorders = () => {
  const elements = document.querySelectorAll<HTMLElement>('[data-kulbit-border]');
  if (!elements.length) return;
  const rebuilders = Array.from(elements, setupElement);
  let timer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => rebuilders.forEach((rebuild) => rebuild()), 150);
  });
};
