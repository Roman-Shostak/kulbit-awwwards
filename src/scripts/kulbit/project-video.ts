/**
 * Project videos: the user-driven player of the projects section with its own controls (ADR-014, ADR-016).
 * Source: kulbit-webflow `src/10-project-video.js` → initProjectVideo. Vimeo SDK there, a native `<video>` here:
 * object-fit: cover in CSS replaces applyCover, the media events replace the SDK's (timeupdate, progress, play …).
 *
 * Markup (src/components/ui/ProjectVideo.astro), all inside the root `[data-kulbit-project-video]`: the `<video>`,
 * `[data-kulbit-poster]`, `[data-kulbit-play]` (the big start button), `[data-kulbit-controls]` (hidden until the
 * start) with `[data-kulbit-toggle]` (`[data-kulbit-icon-play]` / `[data-kulbit-icon-pause]`),
 * `[data-kulbit-time-current]` / `[data-kulbit-time-total]`, `[data-kulbit-seek]` > `[data-kulbit-seek-fill]` +
 * `[data-kulbit-buffer]`, `[data-kulbit-volume]` > `[data-kulbit-volume-button]` (`[data-kulbit-icon-volume]` /
 * `[data-kulbit-icon-mute]`) + `[data-kulbit-volume-popup]` > `[data-kulbit-volume-track]` > `[data-kulbit-volume-fill]`,
 * `[data-kulbit-fullscreen]`.
 *
 *   start       the other players go back to their poster (only one video plays), the poster and the big button
 *               fade out, the controls in, play() with sound
 *   seek        click or drag on the line, volume on the vertical slider (top = louder): pointer events with pointer
 *               capture, so a drag keeps working outside the element; the keyboard steps both (arrows, Home, End)
 *   volume      desktop: the speaker opens the slider popup (fade + an 8 px rise; a click outside closes it);
 *               ≤ 991px: the speaker mutes (iOS ignores the volume level)
 *   fullscreen  desktop: the root with its own controls, the navigation off meanwhile; ≤ 991px: the <video> itself —
 *               the native player (iPhone: webkitEnterFullscreen). Both set app.videoFullscreen and re-apply the
 *               landscape state: a rotation in fullscreen neither shows the popup nor pauses the video. The screen
 *               turns to landscape by itself where the Screen Orientation API can lock it (Android; ADR-016 p. 7 —
 *               iOS Safari cannot, its native player turns with the phone); held upright, the whole frame shows
 *               (object-fit: contain in ui/ProjectVideo.astro)
 *   hidden      registered in ./video: its section covered, or the landscape popup = pause; it never autoplays
 * `resetProjectVideo(root)` — pause, time 0, the poster back: the projects section calls it for a collapsing card.
 */
import { gsap } from 'gsap';
import { app } from './app';
import { reapplyResponsive } from './responsive';
import { registerVideo } from './video';

const ICON_DUR = 0.15; // play / pause and volume / mute icons
const POPUP_DUR = 0.2; // the volume popup
const FADE_DUR = 0.3; // the poster, the big button and the controls
const COMPACT_MAX = 991; // ≤: fullscreen of the <video>, the speaker = mute
const SEEK_KEY_STEP = 5; // seconds per arrow key (keyboard: not in the source, which had divs)
const VOLUME_KEY_STEP = 0.1;

const isCompact = () => window.innerWidth <= COMPACT_MAX;

type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => void; webkitEnterFullscreen?: () => void };

const fsElement = () => document.fullscreenElement ?? (document as FsDocument).webkitFullscreenElement ?? null;
const exitFullscreen = () => {
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else (document as FsDocument).webkitExitFullscreen?.();
};

// ---------- Landscape while in fullscreen (the lock needs fullscreen; desktop and iOS refuse it: nothing happens) ----------
const portrait = window.matchMedia('(orientation: portrait)');
let turnedFromPortrait = false; // our lock turned an upright screen
const lockLandscape = () => {
  const orientation = screen.orientation;
  if (!orientation?.lock) return;
  const wasPortrait = orientation.type.startsWith('portrait');
  orientation
    .lock('landscape')
    .then(() => {
      turnedFromPortrait = wasPortrait;
    })
    .catch(() => {});
};
/**
 * Unlocks, then calls `done` once the screen is upright again. Until then the site must still count as in fullscreen:
 * for a moment the page is a landscape phone, and the rotate popup would flash and pause the video.
 */
const unlockOrientation = (done: () => void) => {
  try {
    screen.orientation?.unlock();
  } catch {
    // no Screen Orientation API: nothing was locked
  }
  const turned = turnedFromPortrait;
  turnedFromPortrait = false;
  if (!turned || portrait.matches) {
    done();
    return;
  }
  let timer = 0;
  const finish = () => {
    clearTimeout(timer);
    portrait.removeEventListener('change', finish);
    done();
  };
  portrait.addEventListener('change', finish, { once: true });
  timer = window.setTimeout(finish, 1000); // the phone is held in landscape: no turn back comes
};

/** Seconds → M:SS */
const fmt = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Every player: its root → back to the poster. Starting one resets the others (only one video plays). */
const players = new Map<HTMLElement, () => void>();

/** Pause, time 0, the poster and the big button back, the controls away */
export const resetProjectVideo = (root: Element) => players.get(root as HTMLElement)?.();

const initProjectVideo = (root: HTMLElement) => {
  const video = root.querySelector('video');
  const find = (name: string) => root.querySelector<HTMLElement>(`[data-kulbit-${name}]`);
  const poster = find('poster');
  const bigPlay = find('play');
  const controls = find('controls');
  const toggle = find('toggle');
  const iconPlay = find('icon-play');
  const iconPause = find('icon-pause');
  const timeCurrent = find('time-current');
  const timeTotal = find('time-total');
  const seek = find('seek');
  const seekFill = find('seek-fill');
  const buffer = find('buffer');
  const volume = find('volume');
  const volumeButton = find('volume-button');
  const popup = find('volume-popup');
  const track = find('volume-track');
  const level = find('volume-fill');
  const iconVolume = find('icon-volume');
  const iconMute = find('icon-mute');
  const fullscreenButton = find('fullscreen');
  if (!video || !poster || !bigPlay || !controls) {
    console.error('[kulbit] [data-kulbit-project-video] needs a <video>, a poster, the start button and the controls');
    return;
  }

  let duration = 0;
  let seekDrag = false;
  let seekFrac = 0;
  let volumeDrag = false;
  let popupOpen = false;
  let inFullscreen = false;

  const play = () => {
    video.play().catch(() => {}); // refused (power saving): the play icon stays
  };

  // ---------- Icons by the real state of the video ----------
  const setToggleIcon = (playing: boolean) => {
    if (iconPause) gsap.to(iconPause, { autoAlpha: playing ? 1 : 0, duration: ICON_DUR });
    if (iconPlay) gsap.to(iconPlay, { autoAlpha: playing ? 0 : 1, duration: ICON_DUR });
  };
  const setVolumeIcon = (value: number) => {
    const muted = value <= 0.001;
    if (iconVolume) gsap.to(iconVolume, { autoAlpha: muted ? 0 : 1, duration: ICON_DUR });
    if (iconMute) gsap.to(iconMute, { autoAlpha: muted ? 1 : 0, duration: ICON_DUR });
  };

  // ---------- Time: the fill and the current time by the played fraction 0..1 ----------
  const renderProgress = (frac: number) => {
    const time = frac * duration;
    if (seekFill) seekFill.style.width = `${frac * 100}%`;
    if (timeCurrent) timeCurrent.textContent = fmt(time);
    seek?.setAttribute('aria-valuenow', String(Math.round(time)));
    seek?.setAttribute('aria-valuetext', fmt(time));
  };
  const setDuration = () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    duration = video.duration;
    if (timeTotal) timeTotal.textContent = fmt(duration);
    seek?.setAttribute('aria-valuemax', String(Math.round(duration)));
  };
  const renderBuffer = () => {
    if (!buffer || !duration || !video.buffered.length) return;
    // the buffered range that holds the playhead (the last one before it has played)
    let end = video.buffered.end(video.buffered.length - 1);
    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) end = video.buffered.end(i);
    }
    buffer.style.width = `${clamp01(end / duration) * 100}%`;
  };

  // ---------- Volume (vertical slider: top = louder) ----------
  const renderVolume = (value: number) => {
    if (level) level.style.height = `${value * 100}%`;
    track?.setAttribute('aria-valuenow', String(Math.round(value * 100)));
  };
  const applyVolume = (value: number) => {
    renderVolume(value);
    video.volume = value;
    if (value > 0) video.muted = false; // a level above 0 means sound (a native video mutes apart from its level)
    setVolumeIcon(value);
  };

  // ---------- The volume popup: fade + a light rise ----------
  const openPopup = () => {
    popupOpen = true;
    volumeButton?.setAttribute('aria-expanded', 'true');
    if (!popup) return;
    gsap.killTweensOf(popup);
    gsap.fromTo(popup, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: POPUP_DUR, ease: 'power2.out' });
  };
  const closePopup = (instant = false) => {
    popupOpen = false;
    volumeButton?.setAttribute('aria-expanded', 'false');
    if (!popup) return;
    gsap.killTweensOf(popup);
    gsap.to(popup, { autoAlpha: 0, y: 8, duration: instant ? 0 : POPUP_DUR, ease: 'power2.in' });
  };

  // ---------- Start and back to the poster ----------
  const reset = () => {
    video.pause();
    video.currentTime = 0;
    gsap.to([poster, bigPlay], { autoAlpha: 1, duration: FADE_DUR });
    gsap.to(controls, { autoAlpha: 0, duration: FADE_DUR });
    setToggleIcon(false);
    closePopup(true);
    renderProgress(0);
    if (buffer) buffer.style.width = '0%';
  };
  const resetOthers = () =>
    players.forEach((resetOther, other) => {
      if (other !== root) resetOther();
    });
  const startPlayback = () => {
    resetOthers(); // at once, on the click (before the play event)
    gsap.to([poster, bigPlay], { autoAlpha: 0, duration: FADE_DUR });
    gsap.to(controls, { autoAlpha: 1, duration: FADE_DUR });
    play();
  };

  // ---------- Fullscreen ----------
  const enterFullscreen = () => {
    // ≤ 991px: the video alone in the native player (a div cannot go fullscreen on iPhone)
    const target = (isCompact() ? video : root) as FsElement;
    if (target.requestFullscreen) target.requestFullscreen().then(lockLandscape).catch(() => {});
    else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
    else if (target.webkitEnterFullscreen) target.webkitEnterFullscreen();
    else console.warn('[kulbit] the fullscreen API is not available on this device');
  };
  const setFullscreen = (now: boolean) => {
    if (now === inFullscreen) return;
    inFullscreen = now;
    if (now) {
      app.videoFullscreen = true;
      app.observer?.disable(); // the wheel must not move the sections under the video
      reapplyResponsive();
      return;
    }
    unlockOrientation(() => {
      if (inFullscreen) return; // back in fullscreen meanwhile
      app.videoFullscreen = false;
      app.observer?.enable();
      reapplyResponsive();
    });
  };
  const onFullscreenChange = () => {
    const element = fsElement();
    setFullscreen(element === root || element === video);
  };

  // ---------- Controls ----------
  bigPlay.addEventListener('click', startPlayback);
  toggle?.addEventListener('click', () => {
    if (video.paused) play();
    else video.pause();
  });

  // A drag on a slider must not reach the step navigation (GSAP Observer listens to touchstart on window)
  const keepGesture = (element: HTMLElement) =>
    element.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });
  // Arrows / Home / End → the new value, or null for another key (then the page keeps it)
  const keyValue = (event: KeyboardEvent, value: number, step: number, max: number) => {
    const next: Record<string, number> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      Home: 0,
      End: max,
    };
    if (!(event.key in next)) return null;
    event.preventDefault(); // not a section step
    return Math.min(max, Math.max(0, next[event.key]));
  };

  if (seek) {
    keepGesture(seek);
    const fracFromX = (clientX: number) => {
      const rect = seek.getBoundingClientRect();
      return clamp01((clientX - rect.left) / rect.width);
    };
    seek.addEventListener('pointerdown', (event) => {
      seekDrag = true;
      seekFrac = fracFromX(event.clientX);
      renderProgress(seekFrac);
      seek.setPointerCapture(event.pointerId);
    });
    seek.addEventListener('pointermove', (event) => {
      if (!seekDrag) return;
      seekFrac = fracFromX(event.clientX);
      renderProgress(seekFrac);
    });
    seek.addEventListener('pointerup', () => {
      if (!seekDrag) return;
      seekDrag = false;
      video.currentTime = seekFrac * duration;
    });
    seek.addEventListener('keydown', (event) => {
      if (!duration) return;
      const time = keyValue(event, video.currentTime, SEEK_KEY_STEP, duration);
      if (time === null) return;
      video.currentTime = time;
      renderProgress(time / duration);
    });
  }

  volumeButton?.addEventListener('click', () => {
    if (isCompact()) {
      video.muted = !video.muted; // the icon follows volumechange
      return;
    }
    if (popupOpen) closePopup();
    else openPopup();
  });
  document.addEventListener('click', (event) => {
    if (popupOpen && volume && !volume.contains(event.target as Node)) closePopup();
  });

  if (track) {
    keepGesture(track);
    const fracFromY = (clientY: number) => {
      const rect = track.getBoundingClientRect();
      return clamp01((rect.bottom - clientY) / rect.height);
    };
    track.addEventListener('pointerdown', (event) => {
      volumeDrag = true;
      applyVolume(fracFromY(event.clientY));
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener('pointermove', (event) => {
      if (volumeDrag) applyVolume(fracFromY(event.clientY));
    });
    track.addEventListener('pointerup', () => {
      volumeDrag = false;
    });
    track.addEventListener('keydown', (event) => {
      const value = keyValue(event, video.muted ? 0 : video.volume, VOLUME_KEY_STEP, 1);
      if (value !== null) applyVolume(value);
    });
  }

  fullscreenButton?.addEventListener('click', () => {
    if (fsElement()) exitFullscreen();
    else enterFullscreen();
  });
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  // iPhone: the native player of the video element has its own events
  video.addEventListener('webkitbeginfullscreen', () => setFullscreen(true));
  video.addEventListener('webkitendfullscreen', () => setFullscreen(false));

  // ---------- The UI follows the real state of the video ----------
  video.addEventListener('play', () => {
    setToggleIcon(true);
    resetOthers(); // only one plays: the toggle or a programmatic play too
  });
  video.addEventListener('pause', () => setToggleIcon(false));
  video.addEventListener('ended', () => setToggleIcon(false));
  video.addEventListener('volumechange', () => setVolumeIcon(video.muted ? 0 : video.volume));
  video.addEventListener('loadedmetadata', setDuration);
  video.addEventListener('durationchange', setDuration);
  video.addEventListener('timeupdate', () => {
    if (seekDrag || !duration) return;
    renderProgress(video.currentTime / duration);
    renderBuffer();
  });
  video.addEventListener('progress', renderBuffer);

  setDuration(); // the metadata may already be there
  renderVolume(video.muted ? 0 : video.volume);
  players.set(root, reset);

  // Covered by the next section / the landscape popup → pause; never autoplays. The file waits with preload="none"
  // (Safari downloaded both files whole at the page start for their metadata): the metadata (the total time) loads when
  // the section before becomes the current one (warm) or, after a jump, when its own section does (show)
  const loadMetadata = () => {
    if (video.readyState > HTMLMediaElement.HAVE_NOTHING || video.networkState === HTMLMediaElement.NETWORK_LOADING) return;
    video.preload = 'metadata';
    video.load();
  };
  const sectionEl = root.closest('[data-kulbit-section]');
  if (sectionEl) {
    registerVideo({
      get sectionIndex() {
        return app.sections.findIndex((section) => section.el === sectionEl);
      },
      show: loadMetadata,
      hide: () => video.pause(),
      warm: loadMetadata,
    });
  }
};

/** Starts every `[data-kulbit-project-video]` of the page once */
export const setupProjectVideos = () => {
  document.querySelectorAll<HTMLElement>('[data-kulbit-project-video]').forEach((root) => {
    if (!players.has(root)) initProjectVideo(root);
  });
};
