/**
 * The default language — the reference shape of every dictionary: another language repeats these
 * keys (`const en: Dictionary = { … }`, texts only from the client's translations). One key per
 * component, texts exactly as in Figma: copy, image alt, aria-labels, field labels, page titles and
 * descriptions. Nothing here may be invented: a missing text is a `TODO`.
 */
export default {
  pages: {
    home: {
      title: 'TODO: page title',
      description: 'TODO: page description',
    },
  },
};
