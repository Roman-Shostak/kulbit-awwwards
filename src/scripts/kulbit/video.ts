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
 * `prefers-reduced-motion: reduce`: no autoplay — the video starts only when the user turns the sound on.
 */
import { gsap } from 'gsap';
import { app } from './app';

export interface VideoRecord {
  sectionIndex: number;
  show: () => void;
  hide: () => void;
}

const videos: VideoRecord[] = [];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// muted → the crossed speaker; sound → the speaker
const setSoundIcons = (button: HTMLElement, muted: boolean, animate: boolean) => {
  const duration = animate ? 0.2 : 0;
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

const initVideo = (box: HTMLElement): VideoRecord | null => {
  const video = box.querySelector('video');
  if (!video) {
    console.error('[kulbit] [data-kulbit-video] has no <video> inside');
    return null;
  }
  let soundOn = false; // the user's intention (starts muted: autoplay requires it)
  const sectionEl = box.closest<HTMLElement>('[data-kulbit-section]');
  const sectionIndex = sectionEl ? app.sections.findIndex((section) => section.el === sectionEl) : 0;
  const isShown = () => sectionIndex === app.currentSectionIndex && !app.landscapeBlocked;

  const button = (sectionEl ?? document).querySelector<HTMLElement>('[data-kulbit-sound]');
  if (button) {
    setSoundIcons(button, true, false);
    button.addEventListener('click', () => {
      soundOn = !soundOn;
      video.muted = !soundOn;
      // Reduced motion: the sound toggle is the only way to start (and stop) the picture
      if (reduceMotion) {
        if (soundOn && isShown()) play(video);
        else if (!soundOn) video.pause();
      }
      setSoundIcons(button, !soundOn, true);
    });
  }

  return {
    sectionIndex,
    show: () => {
      video.muted = !soundOn;
      if (!reduceMotion || soundOn) play(video);
    },
    hide: () => {
      video.pause();
      video.muted = true;
    },
  };
};

export const setupVideos = () => {
  document.querySelectorAll<HTMLElement>('[data-kulbit-video]').forEach((box) => {
    const record = initVideo(box);
    if (record) videos.push(record);
  });
};

/** Adds another module's video (the future project videos) to the visibility logic */
export const registerVideo = (record: VideoRecord) => {
  videos.push(record);
};

/** Plays the current section's video (at once, while its section slides in) */
export const showCurrentVideo = () => {
  if (app.videoFullscreen || app.landscapeBlocked) return;
  videos.forEach((record) => {
    if (record.sectionIndex === app.currentSectionIndex) record.show();
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
