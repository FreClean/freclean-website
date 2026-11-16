'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

function createForm(name, valid = true) {
  const listeners = {};
  const messageField = {
    value: '',
    addEventListener(event, listener) {
      listeners['message:' + event] = listener;
    }
  };
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
    dataset: { requestType: name === 'booking' ? 'SERVICE' : 'CONTACT' },
    fields: [['name', 'Ada Customer'], ['email', 'ada@example.com'], ['message', 'Please contact me']],
    listeners,
    status,
    button,
    resetCalled: false,
    querySelector(selector) {
      if (selector === '.form-status') return status;
      if (selector === 'button[type="submit"]') return button;
      if (selector === 'textarea[name="message"]') return messageField;
      return null;
    },
    messageField,
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

function boot(forms, requestUrl, fetchImplementation, search = '', languageCatalog = null) {
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
    listeners: {},
    addEventListener(event, listener) {
      this.listeners[event] = listener;
    },
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
    FRECLEAN_I18N: languageCatalog,
    location: { pathname: forms[0] && forms[0].name === 'booking' ? '/book/' : '/contact/', search },
    localStorage: { getItem: () => '{"necessary":true}', setItem() {} }
  };
  const context = {
    window,
    document,
    URL,
    URLSearchParams,
    FormData: class {
      constructor(form) {
        this.fields = form.fields.map(([key, value]) => [key, key === 'message' && form.messageField.value ? form.messageField.value : value]);
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
    if (page === 'contact/index.html') {
      assert.match(html, /mailto:contact@freclean\.com/);
      assert.match(html, /mailto:freclean7@gmail\.com/);
      assert.match(html, /tel:\+50946128022/);
      assert.match(html, /name="message" required/);
    }
  }
});

test('product cards show sizes without unverified prices and submit quantity-specific enquiries', () => {
  const root = path.join(__dirname, '..');
  const products = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8')).products;
  const html = fs.readFileSync(path.join(root, 'products/index.html'), 'utf8');

  assert.deepEqual(products.map(({ id, availableSizes }) => [id, availableSizes[0]]), [
    ['all-purpose-cleaner-750ml', '750 mL'],
    ['room-freshener-linen-breeze-300ml', '300 mL']
  ]);
  for (const product of products) {
    assert.ok(fs.existsSync(path.join(root, product.image)));
    assert.match(html, new RegExp('name="product" value="' + product.id + '"'));
    assert.match(html, /name="quantity" min="1" max="99" value="1"/);
    assert.equal(product.price, null);
  }
  assert.match(html, /No prices are published here/);
  assert.match(html, /Price confirmed directly/);
  assert.doesNotMatch(html, /\$[0-9]+\.[0-9]{2}/);
});

test('product order enquiry pre-fills the chosen product, size and quantity in the contact form', async () => {
  const form = createForm('contact');
  let submittedBody;
  const localizedText = {
    'products.index.cleanerName': 'Netwayan tout itilizasyon',
    'products.index.cleanerSize': '750 mL',
    'products.index.orderMessage': 'Mwen ta renmen kòmande {product} ({size}). Kantite: {quantity}. Tanpri konfime pri total egzak la, disponiblite, ranmasaj oswa livrezon, ak enstriksyon peman yo pa imèl.'
  };
  boot([form], 'https://api.freclean.com/api/public/requests', (url, options) => {
    submittedBody = JSON.parse(options.body);
    return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ received: true }) });
  }, '?product=all-purpose-cleaner-750ml&quantity=4', {
    ready: () => true,
    getLanguage: () => 'ht',
    t: (key) => localizedText[key] || ''
  });

  assert.match(form.messageField.value, /Netwayan tout itilizasyon \(750 mL\).*Kantite: 4/);
  submit(form);
  await waitForRequest();

  assert.equal(submittedBody.type, 'CONTACT');
  assert.match(submittedBody.message, /750 mL.*Kantite: 4/);
});

test('blank configuration uses the production public enquiries endpoint', () => {
  const booking = createForm('booking');
  boot([booking], '', (url) => {
    assert.equal(url, 'https://api.freclean.com/api/public/requests');
    return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ received: true }) });
  });

  submit(booking);
  assert.equal(booking.status.dataset.state, 'pending');
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
    assert.match(emailDraft(form.status).href, /mailto:contact@freclean\.com/);
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
  resolveFetch({ ok: true, status: 201, json: () => Promise.resolve({ received: true }) });
  await waitForRequest();

  assert.equal(form.status.dataset.state, 'success');
  assert.match(form.status.message, /not an appointment confirmation/);
  assert.equal(form.resetCalled, true);
  assert.equal(form.button.disabled, false);
});

test('HTTP 201 with a received receipt is an explicit successful submission', async () => {
  const form = createForm('contact');
  let submittedBody;
  boot([form], 'https://api.freclean.com/api/public/requests', (url, options) => {
    submittedBody = JSON.parse(options.body);
    return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ received: true, requestId: '9f1d3f6f-7ab8-44aa-b23f-0a8d0e0c9ad1' }) });
  });

  submit(form);
  await waitForRequest();

  assert.equal(submittedBody.type, 'CONTACT');
  assert.equal(form.status.dataset.state, 'success');
  assert.match(form.status.message, /received your contact enquiry/i);
  assert.equal(form.resetCalled, true);
});

test('invalid contact email and overlong messages are rejected before submission', () => {
  for (const fields of [
    [['name', 'Ada Customer'], ['email', 'not-an-email'], ['message', 'Please contact me']],
    [['name', 'Ada Customer'], ['email', 'ada@example.com'], ['message', 'x'.repeat(5001)]]
  ]) {
    const form = createForm('contact');
    form.fields = fields;
    boot([form], 'https://api.freclean.com/api/public/requests', () => assert.fail('invalid input must not fetch'));

    submit(form);

    assert.equal(form.status.dataset.state, 'error');
    assert.equal(form.resetCalled, false);
  }
});

test('booking submission preserves every submitted business field', async () => {
  const form = createForm('booking');
  form.fields = [
    ['service', 'Residential'],
    ['property_type', 'Home or apartment'],
    ['space_size', '501 to 1,000 sq ft'],
    ['date', '2026-12-15'],
    ['time', '09:30'],
    ['name', 'Ada Customer'],
    ['phone', '+50955501234'],
    ['email', 'ada@example.com'],
    ['location', 'Leogane, Haiti'],
    ['notes', 'Please focus on the kitchen and living room.']
  ];
  let submittedBody;
  boot([form], 'https://api.freclean.com/api/public/requests', (url, options) => {
    submittedBody = JSON.parse(options.body);
    return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ received: true, requestId: 'test-request-id' }) });
  });

  submit(form);
  await waitForRequest();

  for (const [key, value] of form.fields) {
    assert.equal(submittedBody[key], value);
  }
  assert.equal(submittedBody.type, 'SERVICE');
  assert.equal(Object.hasOwn(submittedBody, 'payment_method'), false);
  assert.equal(form.status.dataset.state, 'success');
});

test('public payment content fails closed and only describes approved payment boundaries', () => {
  const root = path.join(__dirname, '..');
  const homePage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const paymentPage = fs.readFileSync(path.join(root, 'payments/index.html'), 'utf8');
  const bookingPage = fs.readFileSync(path.join(root, 'book/index.html'), 'utf8');
  const entrepreneurshipPage = fs.readFileSync(path.join(root, 'entrepreneurship/index.html'), 'utf8');
  const paymentConfiguration = JSON.parse(fs.readFileSync(path.join(root, 'payments/payment-addresses.json'), 'utf8'));

  assert.equal(paymentConfiguration.paymentMode, 'DISABLED');
  assert.deepEqual(paymentConfiguration.usdtNetworks, []);
  assert.doesNotMatch(homePage, /BEP20|TRC20|Solana|data-payment-address|receiving address/i);
  assert.match(homePage, /cash exclusively in person at authorized physical points of sale/i);
  assert.doesNotMatch(paymentPage, /data-payment-options|data-payment-address|BEP20|TRC20|Solana/i);
  assert.match(paymentPage, /No USDT network is currently verified and production-enabled for public use/i);
  assert.match(paymentPage, /independent ecosystem and is not owned or operated by FreClean/i);
  assert.match(paymentPage, /Cash payments, if made, are exclusively in person at FreClean-authorized physical points of sale/i);
  assert.match(paymentPage, /No authorized point-of-sale location or cash-recording workflow is currently verified or published/i);
  assert.doesNotMatch(bookingPage, /name="payment_method"|data-booking-step="5"|<legend>Payment<\/legend>/);
  assert.match(entrepreneurshipPage, /does not collect donations or accept payments for community support/i);
  assert.doesNotMatch(entrepreneurshipPage, /data-payment-options|data-payment-address/);
  assert.doesNotMatch(script, /payment (?:was |has been )?(?:received|confirmed|successful)/i);
});

test('legal-status wording and both active email addresses remain available', () => {
  const root = path.join(__dirname, '..');
  const aboutPage = fs.readFileSync(path.join(root, 'about/index.html'), 'utf8');
  const termsPage = fs.readFileSync(path.join(root, 'terms/index.html'), 'utf8');
  const contactPage = fs.readFileSync(path.join(root, 'contact/index.html'), 'utf8');

  for (const page of [aboutPage, termsPage]) {
    assert.match(page, /FreClean is currently working with legal counsel in Haiti to process its official business documentation and related legal requirements\./);
  }
  for (const email of ['contact@freclean.com', 'freclean7@gmail.com']) {
    assert.ok(contactPage.includes(email));
  }
});
