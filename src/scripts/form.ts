/**
 * Form submission — every `<form data-form>` (ui/Form.astro) posts to the Worker (worker/index.ts, POST /api/form)
 * with fetch instead of a page load. The check of worker/validate.ts runs here first, so the visitor sees the fields
 * (`aria-invalid` on every control of every failing field: the six `subject` checkboxes together) and the first
 * error's message (`aria-describedby` → the message on the controls of the field it is about, so no control is described
 * by another field's text) instead of a round trip; the Worker repeats it and is the authority.
 * Controls by name: `name`, `email`, `message` (text), `subject` (checkboxes, every checked value), `consent`.
 * States: `is--sending` on the form (the submit button is disabled and its `[data-button-label]` shows
 * `data-sending`), `is--sent` (the form fades out and is hidden, the success block next to it fades in and takes the
 * focus), an error (`data-error-<code>` or `data-error` in the message, the button is enabled again). A field that
 * becomes valid while the visitor corrects it drops its error at once; when none is left the message fades out.
 * `form:reset` (FORM_RESET) on a form brings it back to its empty state (the contact popup, closed after a success).
 * Without JS the browser validates `required` and the Worker answers with a plain page: `novalidate` is set here.
 */
import { validate, type Code, type Field, type Fields, type Invalid } from '../../worker/validate';

type ResultCode = Code | 'rate' | 'error';
type Result = { ok: true } | { ok: false; code: ResultCode; fields?: Field[]; errors?: Invalid['errors'] };
type Control = HTMLInputElement | HTMLTextAreaElement;

/** Dispatch on a `form[data-form]` to reset it: the fields, the errors, the sent state and the fill-time stamp */
export const FORM_RESET = 'form:reset';

const settled = (element: Element) => Promise.allSettled(element.getAnimations().map((animation) => animation.finished));

document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
  form.noValidate = true;
  const message = form.querySelector<HTMLElement>('[data-form-message]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const submitLabel = submit?.querySelector<HTMLElement>('[data-button-label]') ?? submit;
  const idleLabel = submitLabel?.textContent ?? '';
  const next = form.nextElementSibling;
  const success = next instanceof HTMLElement && next.matches('[data-form-success]') ? next : null;
  const started = form.querySelector<HTMLInputElement>('input[name="started"]');
  const stamp = () => {
    if (started) started.value = String(Date.now());
  };
  stamp();

  const controls = (name: string) => [...form.querySelectorAll<Control>(`input[name="${name}"], textarea[name="${name}"]`)];
  const text = (name: string) => controls(name)[0]?.value.trim() ?? '';
  const checked = (name: string) =>
    controls(name).filter((control): control is HTMLInputElement => control instanceof HTMLInputElement && control.checked);
  const fields = (): Fields => ({
    name: text('name'),
    email: text('email'),
    subjects: checked('subject').map((control) => control.value),
    message: text('message'),
    // a form without the consent checkbox has nothing to confirm (the Worker still decides)
    consent: controls('consent').length ? checked('consent').length > 0 : true,
  });

  const messageFor = (code: ResultCode) =>
    form.dataset[`error${code[0].toUpperCase()}${code.slice(1)}`] ?? form.dataset.error ?? '';
  // The message: shown with a fade (commit `hidden = false` first so the transition runs), hidden after it
  const show = (value: string) => {
    if (!message) return;
    message.textContent = value;
    message.hidden = false;
    message.getBoundingClientRect();
    message.classList.add('is--visible');
  };
  const hide = async () => {
    if (!message || message.hidden) return;
    message.classList.remove('is--visible');
    await settled(message);
    if (!message.classList.contains('is--visible')) message.hidden = true;
  };

  // The fields marked invalid now, and whether the message is theirs (a server / network message stays until the
  // next submit)
  let invalid: Field[] = [];
  let validationMessage = false;
  const mark = (list: Field[]) => {
    form.querySelectorAll('[aria-invalid]').forEach((element) => element.removeAttribute('aria-invalid'));
    invalid = [...new Set(list)];
    invalid.forEach((name) => controls(name).forEach((control) => control.setAttribute('aria-invalid', 'true')));
  };
  // `aria-describedby` ties the controls of the field the message is about to it (null: none)
  const describe = (field: Field | null | undefined) => {
    if (!message?.id) return;
    form.querySelectorAll(`[aria-describedby="${message.id}"]`).forEach((element) => element.removeAttribute('aria-describedby'));
    if (field) controls(field).forEach((control) => control.setAttribute('aria-describedby', message.id));
  };
  // The first failing field takes the focus; a group whose inputs are hidden (the mobile subject list, closed)
  // focuses its `[data-form-focus]` control instead
  const focusFirst = () => {
    const target = invalid[0] ? controls(invalid[0])[0] : undefined;
    if (!target) return;
    target.focus();
    if (document.activeElement !== target) target.closest('fieldset')?.querySelector<HTMLElement>('[data-form-focus]')?.focus();
  };
  const setSending = (sending: boolean) => {
    form.classList.toggle('is--sending', sending);
    if (submit) submit.disabled = sending;
    if (submitLabel) submitLabel.textContent = sending ? (form.dataset.sending ?? idleLabel) : idleLabel;
  };

  // A corrected field drops its error at once; the message follows the first error still shown (an empty e-mail
  // being typed turns «enter» into «check»), or fades out when none is left
  form.addEventListener('input', () => {
    if (!invalid.length) return;
    const errors = validate(fields())?.errors ?? [];
    const still = invalid.filter((name) => errors.some((error) => error.field === name));
    if (still.length !== invalid.length) mark(still);
    if (!validationMessage) return;
    const first = errors.find((error) => error.field === still[0]);
    describe(first?.field);
    if (!first) void hide();
    else if (message && message.textContent !== messageFor(first.code)) show(messageFor(first.code));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.classList.contains('is--sending') || form.classList.contains('is--sent')) return;

    const failed = validate(fields());
    if (failed) {
      mark(failed.fields);
      describe(failed.errors[0]?.field);
      validationMessage = true;
      show(messageFor(failed.code));
      focusFirst();
      return;
    }

    mark([]);
    describe(null);
    validationMessage = false;
    void hide();
    setSending(true);
    const body = new FormData(form);
    body.set('page', location.pathname);
    let result: Result;
    try {
      const response = await fetch(form.action, { method: 'POST', body, headers: { Accept: 'application/json' } });
      result = (await response.json()) as Result;
      if (typeof result?.ok !== 'boolean') result = { ok: false, code: 'error' };
    } catch {
      result = { ok: false, code: 'error' };
    }
    setSending(false);

    if (result.ok) {
      // Measured before the form goes: with `keepHeight` (Form.astro) the block takes the same height
      if (success?.hasAttribute('data-form-keep-height')) success.style.setProperty('--form-height', `${form.offsetHeight}px`);
      form.classList.add('is--sent');
      if (submit) submit.disabled = true;
      await settled(form);
      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.getBoundingClientRect();
        success.classList.add('is--visible');
        success.focus({ preventScroll: true });
      }
    } else {
      mark(result.fields ?? []);
      describe(result.errors?.[0]?.field ?? invalid[0]);
      validationMessage = invalid.length > 0;
      show(messageFor(result.code));
      focusFirst();
    }
  });

  // Back to the empty form (the caller does it while the form is out of sight: nothing to animate)
  form.addEventListener(FORM_RESET, () => {
    form.reset();
    mark([]);
    describe(null);
    validationMessage = false;
    if (message) {
      message.classList.remove('is--visible');
      message.hidden = true;
    }
    form.classList.remove('is--sending', 'is--sent');
    form.hidden = false;
    setSending(false);
    if (success) {
      success.classList.remove('is--visible');
      success.hidden = true;
    }
    stamp();
  });
});
