/**
 * Validation of a form submission — shared by the Worker (worker/index.ts, the authority) and the browser
 * (src/scripts/form.ts, so the visitor sees the field and a message instead of a round trip).
 * Rules: name and consent are required; at least one of phone / e-mail; a given e-mail / phone must look like one.
 * No DOM, no Workers API here: the file is compiled into both.
 */

export interface Fields {
  name: string;
  phone: string;
  email: string;
  consent: boolean;
}

/** `code` picks the message (dictionary `form.error<Code>`), `fields` get `aria-invalid` */
export interface Invalid {
  code: 'required' | 'contact' | 'email' | 'phone';
  fields: ('name' | 'phone' | 'email' | 'consent')[];
}

export const MAX_LENGTH = 200;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// "+", digits, spaces, brackets, dashes; 6–20 digits (a short local number up to an international one with an extension)
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;
const phoneDigits = (value: string) => value.replace(/\D/g, '').length;

export const validate = (fields: Fields): Invalid | null => {
  const missing: Invalid['fields'] = [];
  if (!fields.name) missing.push('name');
  if (!fields.consent) missing.push('consent');
  if (missing.length) return { code: 'required', fields: missing };
  if (!fields.phone && !fields.email) return { code: 'contact', fields: ['phone', 'email'] };
  if (fields.email && (fields.email.length > MAX_LENGTH || !EMAIL_PATTERN.test(fields.email))) {
    return { code: 'email', fields: ['email'] };
  }
  if (fields.phone && (!PHONE_PATTERN.test(fields.phone) || phoneDigits(fields.phone) < 6 || phoneDigits(fields.phone) > 20)) {
    return { code: 'phone', fields: ['phone'] };
  }
  return null;
};
