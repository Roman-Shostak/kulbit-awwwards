/**
 * Background videos: play / pause / mute by visibility + the sound toggle.
 * Source: kulbit-webflow `src/08-video.js` (Vimeo there; here a native `<video muted loop playsinline>`,
 * object-fit: cover in CSS, so the source's applyCover is gone).
 *
 * Markup: `[data-kulbit-video]` holds the `<video>`; the sound button `[data-kulbit-sound]` in the same section
 * with `[data-sound-icon="on"]` (speaker) and `[data-sound-icon="off"]` (muted) inside; `aria-pressed` = sound on.
 * A video plays only while its section is the current one: covered → pause + mute; back → play + the sound the
 * user chose (`soundOn`). Showing the current video happens at once (it plays while its section slides in),
 * hiding the covered ones at the END of the move (`goToSection` / the tablet hero hand-off).
 * No autoplay under `prefers-reduced-motion: reduce` (the download the parser started is stopped too; the poster
 * stays) or after the visitor paused the background videos (`setBackgroundVideosPaused`, kept for the tab in
 * sessionStorage): the video then starts only when the user turns the sound on — an explicit play of that video.
 * A module's video (`registerVideo`) may also have `warm`: called when its section becomes the next one, so a video that
 * waits with preload="none" is loaded before the user gets there; `background: true` marks an autoplaying one (the
 * service cards) that the visitor's pause stops too.
 * The lazy media of the stacked sections is warmed here as well (warmSection): see showCurrentVideo, setupWarmUp.
 */
import { gsap } from 'gsap';
import { app } from './app';

export interface VideoRecord {
  sectionIndex: number;
  show: () => void;
  hide: () => void;
  /** Its section is the next one: start loading ahead (a video with preload="none") */
  warm?: () => void;
  /**
   * An autoplaying background video (not a user-driven player): setBackgroundVideosPaused hides it (pause) and, on
   * resume, shows it again when its section is current; its show() must not autoplay while backgroundVideosPaused()
   */
  background?: boolean;
}

const videos: VideoRecord[] = [];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PAUSED_KEY = 'kulbit-videos-paused';
const storedPause = () => {
  try {
    return sessionStorage.getItem(PAUSED_KEY) === '1';
  } catch {
    return false; // storage unavailable (private mode)
  }
};
/** The visitor paused the background videos (the menu's toggle): no autoplay until they resume them */
let paused = storedPause();
/** The own records' explicit plays and sound (the sound turned on), cleared by the visitor's pause */
const explicitPlays: (() => void)[] = [];

// muted → the crossed speaker; sound → the speaker
const setSoundIcons = (button: HTMLElement, muted: boolean, animate: boolean) => {
  const duration = animate && !reduceMotion ? 0.2 : 0;
  const iconOn = button.querySelector('[data-sound-icon="on"]');
  const iconOff = button.querySelector('[data-sound-icon="off"]');
  if (iconOn) gsap.to(iconOn, { autoAlpha: muted ? 0 : 1, duration });
  if (iconOff) gsap.to(iconOff, { autoAlpha: muted ? 1 : 0, duration });
  button.setAttribute('aria-pressed', String(!muted));
};

const play = (video: HTMLVideoElement) => {
  // Autoplay may be refused (power saving, data saver): the poster stays, nothing to report
  video.play().catch(() => {});
};

const isShown = (record: VideoRecord) =>
  record.sectionIndex === app.currentSectionIndex && !app.landscapeBlocked && !app.videoFullscreen;

const initVideo = (box: HTMLElement): VideoRecord | null => {
  const video = box.querySelector('video');
  if (!video) {
    console.error('[kulbit] [data-kulbit-video] has no <video> inside');
    return null;
  }
  // Reduced motion: it never autoplays, so the download the parser started (preload="auto") is stopped — with its
  // sources taken out: Chromium reads an explicit load() as "ignore preload=none" and would fetch the file again. The
  // poster stays; the first explicit play (the sound button) puts them back, and play() loads the file
  let parked: HTMLSourceElement[] = [];
  if (reduceMotion) {
    parked = [...video.querySelectorAll<HTMLSourceElement>(':scope > source')];
    parked.forEach((source) => source.remove());
    video.preload = 'none';
    video.load();
  }
  const start = () => {
    if (parked.length) video.append(...parked);
    parked = [];
    play(video);
  };
  let soundOn = false; // the user's intention (starts muted: autoplay requires it)
  let started = false; // the sound turned on = an explicit play, also without autoplay
  const autoplay = () => !reduceMotion && !paused;
  const sectionEl = box.closest<HTMLElement>('[data-kulbit-section]');
  const sectionIndex = sectionEl ? app.sections.findIndex((section) => section.el === sectionEl) : 0;
  const record: VideoRecord = {
    sectionIndex,
    background: true,
    show: () => {
      video.muted = !soundOn;
      if (autoplay() || started) start();
    },
    hide: () => {
      video.pause();
      video.muted = true;
    },
  };
  const button = (sectionEl ?? document).querySelector<HTMLElement>('[data-kulbit-sound]');
  // The visitor's pause ends the explicit play and the sound (hide() mutes the video): the button shows muted, so one
  // click on it plays the video again
  explicitPlays.push(() => {
    started = false;
    soundOn = false;
    if (button) setSoundIcons(button, true, false);
  });
  if (button) {
    setSoundIcons(button, true, false);
    button.addEventListener('click', () => {
      soundOn = !soundOn;
      started = soundOn;
      video.muted = !soundOn;
      // Without autoplay the sound toggle is the only way to start (and stop) the picture
      if (!autoplay()) {
        if (soundOn && isShown(record)) start();
        else if (!soundOn) video.pause();
      }
      setSoundIcons(button, !soundOn, true);
    });
  }

  return record;
};

export const setupVideos = () => {
  paused = storedPause();
  document.querySelectorAll<HTMLElement>('[data-kulbit-video]').forEach((box) => {
    const record = initVideo(box);
    if (record) videos.push(record);
  });
  setupWarmUp();
};

/**
 * The visitor's pause of every background video (WCAG 2.2.2): `true` stops them (the hero, every `background`
 * record) and keeps them stopped, `false` lets the current one play again (no autoplay under reduced motion). Kept for
 * the tab in sessionStorage.
 */
export const setBackgroundVideosPaused = (value: boolean) => {
  paused = value;
  try {
    if (value) sessionStorage.setItem(PAUSED_KEY, '1');
    else sessionStorage.removeItem(PAUSED_KEY);
  } catch {
    // storage unavailable (private mode): the choice lasts until the reload
  }
  if (value) explicitPlays.forEach((clear) => clear());
  videos.forEach((record) => {
    if (!record.background) return;
    if (value) record.hide();
    else if (isShown(record)) record.show();
  });
};
export const backgroundVideosPaused = () => paused;

/** Adds another module's video (the project videos, ./project-video) to the visibility logic */
export const registerVideo = (record: VideoRecord) => {
  videos.push(record);
};

// ---------- Warming the lazy media of the stacked sections ----------
// In the clipped stack a lazy image starts loading only once it is on the screen — too late. A section's
// `img[loading="lazy"]` turn eager and its videos get their `data-poster` as `poster` when it becomes the current or
// the next one; once the hero video can play through (or 4 s after the load, whichever comes first) every section is
// warmed, so a jump from the menu never shows an empty box.
const warmSection = (index: number) => {
  const el = app.sections[index]?.el;
  if (!el) return;
  el.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
    img.loading = 'eager';
  });
  el.querySelectorAll<HTMLVideoElement>('video[data-poster]').forEach((video) => {
    const poster = video.dataset.poster;
    if (poster && !video.getAttribute('poster')) video.poster = poster;
  });
};

const setupWarmUp = () => {
  let warmed = false;
  const warmAll = () => {
    if (warmed) return;
    warmed = true;
    app.sections.forEach((section) => warmSection(section.index));
  };
  const heroVideo = app.sections[0]?.el.querySelector<HTMLVideoElement>('[data-kulbit-video] video');
  if (heroVideo?.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) warmAll();
  else heroVideo?.addEventListener('canplaythrough', warmAll, { once: true });
  const afterLoad = () => window.setTimeout(warmAll, 4000);
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
};

/**
 * Plays the current section's video (at once, while its section slides in); the next section's videos load ahead.
 * Runs on every change of the current section (a move, a restore, the tablet hero hand-off): the current and the next
 * section's lazy media are warmed first. Under the preloader nothing plays: it calls this again when it leaves.
 */
export const showCurrentVideo = () => {
  warmSection(app.currentSectionIndex);
  warmSection(app.currentSectionIndex + 1);
  if (app.videoFullscreen || app.landscapeBlocked || app.preloading) return;
  videos.forEach((record) => {
    if (record.sectionIndex === app.currentSectionIndex) record.show();
    else if (record.sectionIndex === app.currentSectionIndex + 1) record.warm?.();
  });
};

/** Pauses the covered videos (at the end of a move) — every video under the landscape popup */
export const hideOtherVideos = () => {
  if (app.videoFullscreen) return;
  videos.forEach((record) => {
    if (app.landscapeBlocked || record.sectionIndex !== app.currentSectionIndex) record.hide();
  });
};

/** Instant update (instant moves, the popup, a breakpoint change): hide first, then show */
export const updateVideoVisibility = () => {
  hideOtherVideos();
  showCurrentVideo();
};
