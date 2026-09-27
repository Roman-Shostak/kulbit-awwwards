/**
 * Form submission — every `<form data-form>` (ui/Form.astro) posts to the Worker (worker/index.ts, POST /api/form)
 * with fetch instead of a page load. The check from worker/validate.ts runs here first, so the visitor sees the
 * field (`aria-invalid`) and a message instead of a round trip; the Worker repeats it and is the authority.
 * States: `is--sending` on the form (the button is disabled and shows `data-sending`), `is--sent` (the form fades
 * out and is hidden, the success block next to it fades in), an error (`data-error-<code>` or `data-error` in the
 * message, the button is enabled again). The message and the success block fade in on `is--visible` (Form.astro).
 * Without JS the browser validates `required` and the Worker answers with a plain page: `novalidate` is set here.
 */
import { validate, type Invalid } from '../../worker/validate';

type Code = Invalid['code'] | 'rate' | 'error';
type Result = { ok: true } | { ok: false; code: Code; fields?: Invalid['fields'] };

document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
  form.noValidate = true;
  const message = form.querySelector<HTMLElement>('[data-form-message]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const submitLabel = submit?.textContent ?? '';
  const control = (name: string) => {
    const element = form.elements.namedItem(name);
    return element instanceof HTMLInputElement ? element : null;
  };
  control('started')?.setAttribute('value', String(Date.now()));

  const show = (text: string, error: boolean) => {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle('text-color-error', error);
    message.hidden = false;
    message.getBoundingClientRect(); // commits `hidden = false` so the opacity transition runs
    message.classList.add('is--visible');
  };
  const messageFor = (code: Code) => form.dataset[`error${code[0].toUpperCase()}${code.slice(1)}`] ?? form.dataset.error ?? '';
  const markInvalid = (fields: Invalid['fields'] = []) => {
    form.querySelectorAll('[aria-invalid]').forEach((element) => element.removeAttribute('aria-invalid'));
    fields.forEach((name) => control(name)?.setAttribute('aria-invalid', 'true'));
    control(fields[0] ?? '')?.focus();
  };
  const setSending = (sending: boolean) => {
    form.classList.toggle('is--sending', sending);
    if (submit) {
      submit.disabled = sending;
      submit.textContent = sending ? (form.dataset.sending ?? submitLabel) : submitLabel;
    }
  };

  // A corrected field drops its error state at once; the message stays until the next submit
  form.addEventListener('input', (event) => {
    if (event.target instanceof Element) event.target.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.classList.contains('is--sending') || form.classList.contains('is--sent')) return;

    const invalid = validate({
      name: control('name')?.value.trim() ?? '',
      phone: control('phone')?.value.trim() ?? '',
      email: control('email')?.value.trim() ?? '',
      consent: control('consent')?.checked ?? true,
    });
    if (invalid) {
      markInvalid(invalid.fields);
      show(messageFor(invalid.code), true);
      return;
    }

    markInvalid();
    setSending(true);
    const body = new FormData(form);
    body.set('page', location.pathname);
    let result: Result;
    try {
      const response = await fetch(form.action, { method: 'POST', body, headers: { Accept: 'application/json' } });
      result = (await response.json()) as Result;
    } catch {
      result = { ok: false, code: 'error' };
    }
    setSending(false);

    if (result.ok) {
      // The form fades out (Form.astro), leaves the flow when the transition has finished, the success block fades in
      const success = form.nextElementSibling instanceof HTMLElement && form.nextElementSibling.matches('[data-form-success]') ? form.nextElementSibling : null;
      // Measured before the form goes: with `keepHeight` (Form.astro) the block takes the same height
      if (success?.hasAttribute('data-form-keep-height')) success.style.setProperty('--form-height', `${form.offsetHeight}px`);
      form.classList.add('is--sent');
      if (submit) submit.disabled = true;
      await Promise.allSettled(form.getAnimations().map((animation) => animation.finished));
      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.getBoundingClientRect();
        success.classList.add('is--visible');
      }
    } else {
      markInvalid(result.fields);
      show(messageFor(result.code), true);
    }
  });
});
