'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

function createForm(name, valid = true) {
  const listeners = {};
  const status = {
    dataset: {},
    children: [],
    set textContent(value) {
      this.message = value;
      this.children = [];
    },
    append(...nodes) {
      this.children.push(...nodes);
    }
  };
  const button = {
    disabled: false,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    }
  };
  return {
    name,
    fields: [['name', 'Ada Customer'], ['email', 'ada@example.com'], ['message', 'Please contact me']],
    listeners,
    status,
    button,
    resetCalled: false,
    querySelector(selector) {
      if (selector === '.form-status') return status;
      if (selector === 'button[type="submit"]') return button;
      return null;
    },
    addEventListener(event, listener) {
      listeners[event] = listener;
    },
    checkValidity() {
      return valid;
    },
    reportValidity() {
      this.reportedValidity = true;
    },
    reset() {
      this.resetCalled = true;
    }
  };
}

function boot(forms, requestUrl, fetchImplementation) {
  const cookieButton = { addEventListener() {} };
  const cookieBanner = {
    querySelector() {
      return cookieButton;
    },
    querySelectorAll() {
      return [];
    },
    setAttribute() {},
    removeAttribute() {}
  };
  const document = {
    body: {},
    querySelector(selector) {
      if (selector === '[data-cookie-banner]') return cookieBanner;
      return null;
    },
    querySelectorAll(selector) {
      return selector === '[data-request-form]' ? forms : [];
    },
    createElement() {
      return { className: '', href: '', textContent: '' };
    },
    createTextNode(text) {
      return { text };
    }
  };
  const window = {
    FRECLEAN_PUBLIC_REQUEST_URL: requestUrl,
    location: { pathname: '/contact/' },
    localStorage: { getItem: () => '{"necessary":true}', setItem() {} }
  };
  const context = {
    window,
    document,
    URL,
    FormData: class {
      constructor(form) {
        this.fields = form.fields;
      }
      forEach(callback) {
        this.fields.forEach(([key, value]) => callback(value, key));
      }
      [Symbol.iterator]() {
        return this.fields[Symbol.iterator]();
      }
    },
    fetch: fetchImplementation
  };
  vm.runInNewContext(script, context, { filename: 'script.js' });
  return forms;
}

function submit(form) {
  form.listeners.submit({ preventDefault() {} });
}

function emailDraft(status) {
  return status.children.find((child) => child && child.href && child.href.startsWith('mailto:'));
}

function waitForRequest() {
  return new Promise((resolve) => setImmediate(resolve));
}

test('booking and contact pages expose required email validation and a live status region', () => {
  for (const page of ['book/index.html', 'contact/index.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    assert.match(html, /<form[^>]*data-request-form/);
    assert.match(html, /name="email" type="email"[^>]*required/);
    assert.match(html, /class="form-status"[^>]*aria-live="polite"/);
  }
});

test('missing endpoint keeps details and offers an email draft for booking and contact', () => {
  const booking = createForm('booking');
  const contact = createForm('contact');
  boot([booking, contact], '', () => assert.fail('fetch must not run without an endpoint'));

  submit(booking);
  submit(contact);

  for (const form of [booking, contact]) {
    assert.equal(form.status.dataset.state, 'fallback');
    assert.match(form.status.message, /has not been sent/);
    assert.match(decodeURIComponent(emailDraft(form.status).href), /Ada Customer/);
    assert.equal(form.resetCalled, false);
  }
});

test('invalid fields stop submission and allow the user to correct the form', () => {
  const form = createForm('booking', false);
  boot([form], 'https://requests.example.test/public', () => assert.fail('invalid input must not fetch'));

  submit(form);

  assert.equal(form.reportedValidity, true);
  assert.equal(form.status.dataset.state, 'error');
  assert.equal(form.resetCalled, false);
});

test('non-HTTPS endpoints are rejected without sending request data', () => {
  const form = createForm('contact');
  boot([form], 'http://requests.example.test/public', () => assert.fail('insecure endpoint must not fetch'));

  submit(form);

  assert.equal(form.status.dataset.state, 'fallback');
  assert.ok(emailDraft(form.status));
});

test('server errors and ambiguous receipts fall back without clearing details', async () => {
  for (const response of [
    { ok: false, status: 503 },
    { ok: true, status: 200, json: () => Promise.resolve({ received: false }) }
  ]) {
    const form = createForm('contact');
    boot([form], 'https://requests.example.test/public', () => Promise.resolve(response));

    submit(form);
    await waitForRequest();

    assert.equal(form.status.dataset.state, 'fallback');
    assert.ok(emailDraft(form.status));
    assert.equal(form.resetCalled, false);
    assert.equal(form.button.disabled, false);
  }
});

test('successful server receipt is the only JSON response that reports receipt', async () => {
  const form = createForm('booking');
  let resolveFetch;
  boot([form], 'https://requests.example.test/public', () => new Promise((resolve) => { resolveFetch = resolve; }));

  submit(form);
  assert.equal(form.status.dataset.state, 'pending');
  assert.equal(form.button.disabled, true);
  assert.equal(form.button.attributes['aria-busy'], 'true');
  resolveFetch({ ok: true, status: 200, json: () => Promise.resolve({ accepted: true }) });
  await waitForRequest();

  assert.equal(form.status.dataset.state, 'success');
  assert.match(form.status.message, /not an appointment confirmation/);
  assert.equal(form.resetCalled, true);
  assert.equal(form.button.disabled, false);
});

test('HTTP 204 is an explicit successful receipt', async () => {
  const form = createForm('contact');
  boot([form], 'https://requests.example.test/public', () => Promise.resolve({ ok: true, status: 204 }));

  submit(form);
  await waitForRequest();

  assert.equal(form.status.dataset.state, 'success');
  assert.equal(form.resetCalled, true);
});

test('payment copy keeps card checkout inactive and CeloHT clearly separate and safe', () => {
  const root = path.join(__dirname, '..');
  const paymentPage = fs.readFileSync(path.join(root, 'payments/index.html'), 'utf8');
  const bookingPage = fs.readFileSync(path.join(root, 'book/index.html'), 'utf8');

  assert.match(paymentPage, /Online card checkout is not available/);
  assert.match(paymentPage, /href="https:\/\/app\.celoht\.com\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(bookingPage, /href="https:\/\/app\.celoht\.com\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(script, /configuredCeloUrl\.origin === 'https:\/\/app\.celoht\.com'/);
  assert.doesNotMatch(script, /payment (?:was |has been )?(?:received|confirmed|successful)/i);
});