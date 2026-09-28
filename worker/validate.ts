/**
 * Validation of a form submission — shared by the Worker (worker/index.ts, the authority) and the browser
 * (src/scripts/form.ts, so the visitor sees the field and a message instead of a round trip).
 * Kulbit's contact popup (Figma «Get in touch»): the e-mail is required and must look like one, at least one subject of
 * the list, the consent to data processing; the name and the message are optional (length-capped).
 * Every failing field is reported at once (the Figma error state marks the e-mail and the subjects together); `code`
 * is the first one's, for a single message.
 * No DOM, no Workers API here: the file is compiled into both.
 */

/** The subjects of the message: the checkbox values of the form, stored in D1 and listed in the notification */
export const SUBJECTS = ['strategy', 'brand-videos', 'product-videos', 'global-campaigns', 'social-media', 'other'] as const;
export type Subject = (typeof SUBJECTS)[number];

export interface Fields {
  name: string;
  email: string;
  subjects: string[];
  message: string;
  consent: boolean;
}

export type Field = 'name' | 'email' | 'subject' | 'message' | 'consent';
/** Picks the message (dictionary `form.error<Code>`) */
export type Code = 'emailRequired' | 'email' | 'subject' | 'consent' | 'length';

export interface Invalid {
  /** the first error: the message shown when one line is enough */
  code: Code;
  /** every field that failed: they get `aria-invalid` */
  fields: Field[];
  /** every error with its field, in the order of the form */
  errors: { field: Field; code: Code }[];
}

export const MAX_LENGTH = 200;
export const MESSAGE_MAX_LENGTH = 3000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isSubject = (value: string): value is Subject => (SUBJECTS as readonly string[]).includes(value);

export const validate = (fields: Fields): Invalid | null => {
  const errors: Invalid['errors'] = [];
  if (fields.name.length > MAX_LENGTH) errors.push({ field: 'name', code: 'length' });
  if (!fields.email) errors.push({ field: 'email', code: 'emailRequired' });
  else if (fields.email.length > MAX_LENGTH || !EMAIL_PATTERN.test(fields.email)) errors.push({ field: 'email', code: 'email' });
  if (!fields.subjects.length || !fields.subjects.every(isSubject)) errors.push({ field: 'subject', code: 'subject' });
  if (fields.message.length > MESSAGE_MAX_LENGTH) errors.push({ field: 'message', code: 'length' });
  if (!fields.consent) errors.push({ field: 'consent', code: 'consent' });
  if (!errors.length) return null;
  return { code: errors[0].code, fields: errors.map((error) => error.field), errors };
};
