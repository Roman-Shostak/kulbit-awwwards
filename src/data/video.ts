/**
 * The `type` of a video <source>, so a browser picks the first file it can play: the AV1 copy (SVT-AV1, 10-bit, Main
 * profile, made from the client's masters in video-masters/) goes before the H.264 file, and a browser without AV1
 * (Safari on devices without an AV1 decoder) skips it for the H.264 one.
 *   height  720 → level 3.1 (av01.0.05M.10), 1080 → level 4.0 (av01.0.08M.10): what the encoder wrote (ffprobe level)
 *   audio   the file carries AAC-LC sound (the hero, the projects); the service loops are silent
 */
export const av1Type = (height: 720 | 1080, audio: boolean) =>
  `video/mp4; codecs="av01.0.${height === 1080 ? '08' : '05'}M.10${audio ? ', mp4a.40.2' : ''}"`;
