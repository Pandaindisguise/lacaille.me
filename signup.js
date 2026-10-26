'use strict';
(() => {
  const form = document.getElementById('signup-form');
  const button = document.getElementById('notify');
  const email = document.getElementById('email');
  const status = document.getElementById('signup-status');
  let pending = false;
  function message(text, error = false) {
    status.textContent = text;
    status.dataset.error = String(error);
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const signupUrl = window.LACAILLE_CONFIG?.signupUrl;
    if (!signupUrl) {
      message('Email signup is opening soon. In the meantime, say hello above.');
      return;
    }
    let url;
    try { url = new URL(signupUrl); } catch { message('Signup is temporarily unavailable. Please try again later.', true); return; }
    if (url.protocol !== 'https:') { message('Signup is temporarily unavailable. Please try again later.', true); return; }
    pending = true;
    button.disabled = true;
    button.textContent = 'One moment…';
    message('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      // Form encoding avoids an unnecessary cross-origin preflight.
      const response = await fetch(url.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ email: email.value.trim().toLowerCase(), company: form.elements.company.value, source: 'lacaille.me', consent: 'launch-notification-v1' }),
        signal: controller.signal,
        credentials: 'omit',
        redirect: 'error',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        throw new Error(response.status === 429 ? 'Please wait a little before trying again.' : 'Signup did not complete. Please try again, or say hello above.');
      }
      message('You’re on the list. I’ll let you know when it’s ready!');
      form.reset();
    } catch (error) {
      message(error.name === 'AbortError' ? 'That took too long. Please try again.' : error instanceof TypeError ? 'Could not connect. Please try again, or say hello above.' : error.message, true);
    } finally {
      clearTimeout(timeout);
      pending = false;
      button.disabled = false;
      button.textContent = 'Notify me';
    }
  });
})();
