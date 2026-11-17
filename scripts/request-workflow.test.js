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
      return {
        className: '',
        href: '',
        textContent: '',
        click() {
          this.clicked = true;
          forms.window.location.href = this.href;
        }
      };
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
  forms.window = window;
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

test('About page includes the verified company profile, distinct programs and exact press-kit lengths', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'about/index.html'), 'utf8');
  const press = fs.readFileSync(path.join(root, 'press/index.html'), 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id));

  assert.match(html, /<title>About FreClean \| Cleaning Services, Products &amp; Entrepreneurship<\/title>/);
  assert.match(html, /<h1 id="about-title">About FreClean<\/h1>/);
  assert.doesNotMatch(html, /class="about-hero/);
  assert.match(html, /<link rel="canonical" href="https:\/\/freclean\.com\/about\/">/);
  assert.match(html, /"foundingDate": "2025-04-16"/);
  assert.match(html, /"name": "Johnny Dubic"/);
  assert.match(html, /CeloHT is currently an official FreClean partner for payment services/);
  assert.match(html, /FreClean's current official payment partnership is with CeloHT/);
  for (const section of [
    'who-we-are',
    'our-mission',
    'what-we-do',
    'entrepreneurship',
    'community-support',
    'contribution-transparency',
    'privacy',
    'impact',
    'partnerships',
    'vision',
    'values',
    'trust',
    'our-story',
    'founder',
    'who-we-serve',
    'business-model',
    'payments',
    'press-kit'
  ]) {
    assert.match(html, new RegExp('id="' + section + '"'));
  }
  for (const label of ['50-word description', '100-word description']) {
    const match = html.match(new RegExp('<p class="eyebrow">' + label + '</p><p>([\\s\\S]*?)</p>'));
    assert.ok(match, label + ' should be present');
    const words = match[1].replace(/<[^>]+>/g, '').trim().split(/\s+/);
    assert.equal(words.length, label.startsWith('50-') ? 50 : 100);
  }
  assert.match(html, /wrong network may result in permanent loss/i);
  assert.match(html, /Support should never require a person to give up their dignity or privacy/);
  assert.match(html, /"@type": "LocalBusiness"/);
  assert.doesNotMatch(html, /Downloadable press materials|expanded transparency resources|about-status--planned/);
  assert.doesNotMatch(html, /Press &amp; Brand Assets|brand-assets|about-coming-soon|Coming soon/i);
  assert.doesNotMatch(html, /cUSD|USDm|Lorem ipsum|guaranteed income|guaranteed profits/i);
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(target), `About page anchor #${target} has a matching section`);
  }
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) continue;
    const target = href.split(/[?#]/, 1)[0];
    let targetPath = path.resolve(root, 'about', target);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, 'index.html');
    }
    assert.ok(fs.existsSync(targetPath), `About page link ${href} resolves to a local page`);
  }
  assert.match(press, /href="\.\.\/about\/#press-kit"/);
  assert.match(press, /alt="Official FreClean logo"/);
  assert.match(press, /src="\.\.\/assets\/FreClean-logo\.png"/);
  assert.match(press, /src="\.\.\/assets\/logo-landscape-2\.png"/);
  assert.match(press, /src="\.\.\/assets\/catalog-portrait-3\.png"/);
  assert.match(press, /src="\.\.\/assets\/catalog-portrait-1\.png"/);
  assert.match(press, /href="mailto:freclean7@gmail\.com\?subject=FreClean%20media%20assets%20request"/);
  assert.doesNotMatch(press, /coming soon|about\/#brand-assets/i);
  assert.doesNotMatch(press, /accessible digital commerce|locally developed cleaning products/i);
  for (const asset of ['FreClean-logo.png', 'logo-landscape-2.png', 'catalog-portrait-3.png', 'catalog-portrait-1.png']) {
    assert.ok(fs.existsSync(path.join(root, 'assets', asset)), `Press image ${asset} exists`);
  }
});

test('booking and contact pages expose required email validation and a live status region', () => {
  for (const page of ['book/index.html', 'contact/index.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    assert.match(html, /<form[^>]*data-request-form/);
    assert.match(html, /name="email" type="email"[^>]*required/);
    assert.match(html, /class="form-status"[^>]*aria-live="polite"/);
    if (page === 'contact/index.html') {
      assert.match(html, /Leogane, Ouest, Haiti/);
      assert.match(html, /data-email-recipient="freclean7@gmail\.com"/);
      assert.match(html, /script\.js\?v=contact-email-draft-20261117/);
      assert.match(html, /mailto:contact@freclean\.com/);
      assert.match(html, /tel:\+50946128022/);
      assert.match(html, /name="message" required/);
    }
  }
});

test('contact enquiry opens a prefilled email draft addressed to FreClean', () => {
  const form = createForm('contact');
  form.dataset.emailRecipient = 'freclean7@gmail.com';
  const forms = boot([form], 'https://api.freclean.com/api/public/requests', () => {
    assert.fail('direct email enquiries must not submit through the API');
  });

  submit(form);

  const [recipient, query] = forms.window.location.href.split('?');
  const parameters = new URLSearchParams(query);
  assert.equal(recipient, 'mailto:freclean7@gmail.com');
  assert.equal(parameters.get('subject'), 'New FreClean Contact Enquiry');
  assert.equal(emailDraft(form.status).clicked, true);
  assert.match(parameters.get('body'), /Name: Ada Customer/);
  assert.match(parameters.get('body'), /Email: ada@example\.com/);
  assert.match(parameters.get('body'), /Message:\nPlease contact me/);
  assert.match(form.status.message, /Review the draft and press Send/);
  assert.equal(form.status.dataset.state, 'email-draft');
  assert.equal(form.resetCalled, false);
});

test('partnership enquiry opens an email draft with every provided form detail', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'partners/index.html'), 'utf8');
  assert.match(html, /data-email-recipient="freclean7@gmail\.com"/);
  assert.match(html, /data-email-subject="New FreClean Partnership Enquiry"/);
  const form = createForm('partners');
  form.dataset.emailRecipient = 'freclean7@gmail.com';
  form.dataset.emailSubject = 'New FreClean Partnership Enquiry';
  form.fields = [
    ['name', 'Ada Partner'],
    ['organization', 'Example Organization'],
    ['email', 'ada@example.com'],
    ['partnership_type', 'Product distribution'],
    ['message', 'I would like to explore working together.']
  ];
  const forms = boot([form], 'https://api.freclean.com/api/public/requests', () => {
    assert.fail('partnership enquiries must open an email draft without submitting through the API');
  });

  submit(form);

  const [recipient, query] = forms.window.location.href.split('?');
  const parameters = new URLSearchParams(query);
  assert.equal(recipient, 'mailto:freclean7@gmail.com');
  assert.equal(parameters.get('subject'), 'New FreClean Partnership Enquiry');
  assert.equal(emailDraft(form.status).clicked, true);
  assert.match(parameters.get('body'), /Name: Ada Partner/);
  assert.match(parameters.get('body'), /Organization: Example Organization/);
  assert.match(parameters.get('body'), /Email: ada@example\.com/);
  assert.match(parameters.get('body'), /Partnership Type: Product distribution/);
  assert.match(parameters.get('body'), /Message:\nI would like to explore working together\./);
});

test('product cards show sizes and prices and submit a quantity-specific order enquiry', () => {
  const root = path.join(__dirname, '..');
  const products = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8')).products;
  const html = fs.readFileSync(path.join(root, 'products/index.html'), 'utf8');

  assert.deepEqual(products.slice(0, 2).map(({ id, availableSizes }) => [id, availableSizes[0]]), [
    ['all-purpose-cleaner-750ml', '750 mL'],
    ['room-freshener-linen-breeze-300ml', '300 mL']
  ]);
  for (const product of products.slice(0, 2)) {
    assert.ok(fs.existsSync(path.join(root, product.image)));
    assert.match(html, new RegExp('name="product" value="' + product.id + '"'));
    assert.match(html, /name="quantity" min="1" max="99" value="1"/);
  }
  assert.match(html, /\$6\.99–\$7\.99 US each/);
});

test('bracelet uses the shared catalog card and keeps its fixed price, size and category', () => {
  const root = path.join(__dirname, '..');
  const { products } = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8'));
  const bracelet = products.find(({ id }) => id === 'freclean-bracelet');
  const html = fs.readFileSync(path.join(root, 'products/index.html'), 'utf8');
  const catalogScript = fs.readFileSync(path.join(root, 'products/catalog.js'), 'utf8');

  assert.ok(bracelet);
  assert.equal(bracelet.name, 'FreClean Bracelet');
  assert.equal(bracelet.category, 'Accessories');
  assert.equal(bracelet.brand, 'FreClean');
  assert.equal(bracelet.type, 'Branded accessory');
  assert.equal(bracelet.price.display, '$4.99 USD');
  assert.deepEqual(bracelet.availableSizes, ['Standard size']);
  assert.equal(bracelet.status, 'Available');
  assert.equal(bracelet.image, 'assets/freclean-bracelet.png');
  assert.equal(bracelet.imageAlt, 'FreClean branded bracelet');
  assert.equal(bracelet.description, 'A simple FreClean-branded bracelet designed for everyday wear and brand supporters.');
  assert.ok(fs.existsSync(path.join(root, bracelet.image)));
  assert.match(html, /data-product-list="Accessories"/);
  assert.match(html, /<template id="product-card-template">/);
  assert.match(html, /<script src="catalog\.js" defer><\/script>/);
  assert.match(catalogScript, /fetch\('\.\.\/products\.json'\)/);
  assert.match(catalogScript, /image\.src = '\.\.\/' \+ product\.image/);
  assert.match(catalogScript, /Request to order ' \+ product\.name/);
  assert.match(fs.readFileSync(path.join(root, 'style.css'), 'utf8'), /\.product-item img \{[^}]*object-fit: contain/s);
});

test('accessory catalog renders the bracelet image and enquiry from structured product data', async () => {
  const root = path.join(__dirname, '..');
  const { products } = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8'));
  const bracelet = products.find(({ id }) => id === 'freclean-bracelet');
  const productList = {
    parentElement: {
      attributes: { hidden: '' },
      removeAttribute(name) {
        delete this.attributes[name];
      }
    },
    children: [],
    appendChild(card) {
      this.children.push(card);
    }
  };
  const template = {
    content: {
      firstElementChild: {
        cloneNode() {
          const image = {};
          const fields = Object.fromEntries([
            'availability',
            'category',
            'name',
            'description',
            'size',
            'price',
            'brand',
            'type'
          ].map((field) => [field, {}]));
          const inputs = Object.fromEntries(['product', 'product_name', 'product_size'].map((name) => [name, {}]));
          const button = {
            attributes: {},
            setAttribute(name, value) {
              this.attributes[name] = value;
            }
          };
          const form = {
            querySelector(selector) {
              if (selector === 'button') return button;
              return inputs[selector.match(/name="([^"]+)"/)[1]];
            }
          };
          return {
            image,
            fields,
            inputs,
            button,
            querySelector(selector) {
              if (selector === 'img') return image;
              if (selector === 'form') return form;
              return fields[selector.match(/data-product-field="([^"]+)"/)[1]];
            }
          };
        }
      }
    }
  };
  const heading = {};
  const document = {
    querySelector: () => productList,
    getElementById: (id) => id === 'product-card-template' ? template : heading
  };
  const fetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ products })
  });

  vm.runInNewContext(fs.readFileSync(path.join(root, 'products/catalog.js'), 'utf8'), { document, fetch });
  await waitForRequest();

  assert.equal(productList.children.length, 1);
  assert.equal(heading.textContent, 'Accessories');
  assert.equal(productList.parentElement.attributes.hidden, undefined);
  const [card] = productList.children;
  assert.equal(card.image.src, '../assets/freclean-bracelet.png');
  assert.equal(card.image.alt, 'FreClean branded bracelet');
  assert.equal(card.fields.name.textContent, 'FreClean Bracelet');
  assert.equal(card.fields.category.textContent, 'Accessories');
  assert.equal(card.fields.price.textContent, '$4.99 USD');
  assert.equal(card.fields.size.textContent, 'Standard size');
  assert.equal(card.fields.availability.textContent, 'Available');
  assert.equal(card.fields.brand.textContent, 'FreClean');
  assert.equal(card.fields.type.textContent, 'Branded accessory');
  assert.equal(card.inputs.product.value, 'freclean-bracelet');
  assert.equal(card.inputs.product_name.value, 'FreClean Bracelet');
  assert.equal(card.inputs.product_size.value, 'Standard size');
  assert.equal(card.button.attributes['aria-label'], 'Request to order FreClean Bracelet');
});

test('bracelet enquiry pre-fills its product and standard size in the contact form', () => {
  const form = createForm('contact');
  boot([form], 'https://api.freclean.com/api/public/requests', () => assert.fail('prefill must not submit'), '?product=freclean-bracelet&product_name=FreClean+Bracelet&product_size=Standard+size&quantity=2', {
    ready: () => true,
    getLanguage: () => 'en',
    t: () => ''
  });

  assert.match(form.messageField.value, /FreClean Bracelet \(Standard size\).*Quantity: 2/);
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
    ['notes', 'Please focus on the kitchen and living room.'],
    ['payment_method', 'USDT TRC20']
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
  assert.equal(form.status.dataset.state, 'success');
});

test('booking request opens a prefilled email draft with all booking details', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'book/index.html'), 'utf8');
  assert.match(html, /data-email-recipient="freclean7@gmail\.com"/);
  assert.match(html, /data-email-subject="New FreClean Booking Enquiry"/);
  assert.match(html, /email app will open with the details addressed to FreClean/);
  const booking = createForm('booking');
  booking.dataset.emailRecipient = 'freclean7@gmail.com';
  booking.dataset.emailSubject = 'New FreClean Booking Enquiry';
  booking.fields = [
    ['service', 'Residential'],
    ['property_type', 'Home or apartment'],
    ['space_size', '501 to 1,000 sq ft'],
    ['date', '2026-12-15'],
    ['time', '09:30'],
    ['name', 'Ada Customer'],
    ['phone', '+50955501234'],
    ['email', 'ada@example.com'],
    ['location', 'Leogane, Haiti'],
    ['notes', 'Please focus on the kitchen.'],
    ['payment_method', 'USDT TRC20']
  ];
  const forms = boot([booking], 'https://api.freclean.com/api/public/requests', () => {
    assert.fail('booking requests must open an email draft without submitting through the API');
  });

  submit(booking);

  const [recipient, query] = forms.window.location.href.split('?');
  const parameters = new URLSearchParams(query);
  const body = parameters.get('body');
  assert.equal(recipient, 'mailto:freclean7@gmail.com');
  assert.equal(parameters.get('subject'), 'New FreClean Booking Enquiry');
  assert.equal(emailDraft(booking.status).clicked, true);
  for (const [label, value] of [
    ['Service', 'Residential'],
    ['Property Type', 'Home or apartment'],
    ['Space Size', '501 to 1,000 sq ft'],
    ['Date', '2026-12-15'],
    ['Time', '09:30'],
    ['Name', 'Ada Customer'],
    ['Phone', '+50955501234'],
    ['Email', 'ada@example.com'],
    ['Location', 'Leogane, Haiti'],
    ['Notes', 'Please focus on the kitchen.'],
    ['Payment Method', 'USDT TRC20']
  ]) {
    assert.ok(body.includes(label + ': ' + value), 'email draft should include ' + label);
  }
});

test('payment choices are restricted to the four USDT networks and separate CeloHT handoff', () => {
  const root = path.join(__dirname, '..');
  const paymentPage = fs.readFileSync(path.join(root, 'payments/index.html'), 'utf8');
  const bookingPage = fs.readFileSync(path.join(root, 'book/index.html'), 'utf8');
  const methods = Array.from(bookingPage.matchAll(/name="payment_method" value="([^"]+)"/g), (match) => match[1]);

  assert.deepEqual(methods, ['USDT BEP20', 'USDT TRC20', 'USDT Solana', 'USDT Celo', 'CELOHT_DAPP']);
  assert.match(paymentPage, /USDT on BNB Smart Chain \(BEP20\), TRON \(TRC20\), Solana, and Celo/);
  assert.match(paymentPage, /data-payment-network="BEP20"/);
  assert.match(paymentPage, /data-payment-network="TRC20"/);
  assert.match(paymentPage, /data-payment-network="SOLANA"/);
  assert.match(paymentPage, /data-payment-network="CELO"/);
  assert.match(paymentPage, /payment-options\.js/);
  assert.doesNotMatch(paymentPage, /permanent loss of funds|does not initiate checkout or display receiving addresses/i);
  assert.match(paymentPage, /href="https:\/\/app\.celoht\.com\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(paymentPage, /Cash at physical points of sale/);
  assert.match(paymentPage, /accepted only in person.*authorized physical points of sale.*not available online or remotely/s);
  assert.match(paymentPage, /not confirmed bookings, purchases or payments/);
  assert.match(paymentPage, /class="cash-pos-illustration"[^>]*role="img"[^>]*aria-label="Illustration of a woman selling FreClean products"/);
  assert.match(paymentPage, /class="button button-primary" href="\.\.\/contact\/">Contact FreClean/);
  assert.match(bookingPage, /href="\.\.\/payments\/">View payment options/);
  assert.doesNotMatch(bookingPage, /permanent loss of funds/i);
  assert.match(bookingPage, /href="https:\/\/app\.celoht\.com\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(script, /configuredCeloUrl\.origin === 'https:\/\/app\.celoht\.com'/);
  assert.match(script, /choice\.value !== 'CELOHT_DAPP'/);
  assert.doesNotMatch(script, /payment (?:was |has been )?(?:received|confirmed|successful)/i);
});
