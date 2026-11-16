'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'payments/payment-options.js'), 'utf8');
const paymentOptions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'payments/payment-addresses.json'), 'utf8'));
const networks = [
  ['BEP20', '0xcbe30a91dbc6a2423c30d8c8dd0547b8dcb0e044'],
  ['TRC20', 'TSnbTib4DAEpGbesxUzjN2pgtcJigs8veR'],
  ['SOLANA', '33FM1eKWBNWfA6qDf1EFZ8Ab6U6RiXhJkG6NyFL1wTYf'],
  ['CELO', '0xcbe30a91dbc6a2423c30d8c8dd0547b8dcb0e044']
];

function createCard(network) {
  const listeners = {};
  const address = { textContent: '' };
  const copyStatus = { textContent: '' };
  const button = {
    disabled: true,
    addEventListener(event, listener) {
      listeners[event] = listener;
    }
  };
  return {
    address,
    button,
    copyStatus,
    listeners,
    getAttribute(name) {
      return name === 'data-payment-network' ? network : null;
    },
    querySelector(selector) {
      if (selector === '[data-payment-address]') return address;
      if (selector === '[data-copy-address]') return button;
      if (selector === '[data-copy-status]') return copyStatus;
      return null;
    }
  };
}

function boot(fetchImplementation, clipboard, purpose) {
  const cards = networks.map(([network]) => createCard(network));
  const attributes = {};
  const section = {
    getAttribute(name) {
      if (name === 'data-payment-purpose') return purpose === 'donation' ? 'donation' : null;
      if (name === 'data-address-config') return purpose === 'donation' ? '../payments/payment-addresses.json' : null;
      return null;
    },
    querySelectorAll(selector) {
      return selector === '[data-payment-network]' ? cards : [];
    },
    setAttribute(name, value) {
      attributes[name] = value;
    }
  };
  const status = { textContent: '' };
  const document = {
    querySelector(selector) {
      if (selector === '[data-payment-options]') return section;
      if (selector === '[data-payment-status]') return status;
      return null;
    },
    addEventListener() {
      return undefined;
    }
  };
  vm.runInNewContext(script, {
    document,
    fetch: fetchImplementation,
    navigator: clipboard === undefined ? {} : { clipboard },
    window: {},
    Map,
    Promise
  });
  return { cards, attributes, section, status };
}

function response(options, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(options) });
}

test('loads public addresses and enables address copying', async () => {
  let request;
  const clipboardWrites = [];
  const page = boot((url, options) => {
    request = { url, options };
    return response(paymentOptions);
  }, { writeText: (address) => {
    clipboardWrites.push(address);
    return Promise.resolve();
  } });

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(request.url, 'payment-addresses.json');
  assert.equal(request.options.credentials, 'omit');
  assert.deepEqual(page.cards.map((card) => card.address.textContent), networks.map(([, address]) => address));
  assert.ok(page.cards.every((card) => card.button.disabled === false));
  assert.equal(page.attributes['aria-busy'], 'false');
  assert.match(page.status.textContent, /addresses are ready/i);

  page.cards[0].listeners.click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(clipboardWrites, [networks[0][1]]);
  assert.equal(page.cards[0].copyStatus.textContent, 'Address copied.');
});

test('loads the shared USDT addresses for donations and enables copying', async () => {
  let requestUrl;
  const clipboardWrites = [];
  const page = boot((url) => {
    requestUrl = url;
    return response(paymentOptions);
  }, {
    writeText: (address) => {
      clipboardWrites.push(address);
      return Promise.resolve();
    }
  }, 'donation');

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(requestUrl, '../payments/payment-addresses.json');
  assert.deepEqual(page.cards.map((card) => card.address.textContent), networks.map(([, address]) => address));
  assert.ok(page.cards.every((card) => card.button.disabled === false));
  assert.match(page.status.textContent, /donation addresses are ready/i);

  page.cards[0].listeners.click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(clipboardWrites, [networks[0][1]]);
});

test('entrepreneurship page offers donations on every supported USDT network', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'entrepreneurship/index.html'), 'utf8');

  assert.match(page, /data-payment-purpose="donation"/);
  assert.match(page, /data-address-config="\.\.\/payments\/payment-addresses\.json"/);
  for (const [network] of networks) {
    assert.match(page, new RegExp(`data-payment-network="${network}"`));
  }
  assert.match(page, /USDT only\. Choose the exact network shown for the address/);
});

test('does not show addresses when the configuration is unavailable or incomplete', async () => {
  for (const fetchImplementation of [
    () => response({}, false),
    () => response({ paymentMode: 'MANUAL', usdtNetworks: [] })
  ]) {
    const page = boot(fetchImplementation);
    await new Promise((resolve) => setImmediate(resolve));

    assert.ok(page.cards.every((card) => card.address.textContent === '' && card.button.disabled));
    assert.match(page.status.textContent, /currently unavailable/i);
    assert.equal(page.attributes['aria-busy'], 'false');
  }
});

test('offers manual copy guidance when browser clipboard access is unavailable', async () => {
  const page = boot(() => response(paymentOptions));
  await new Promise((resolve) => setImmediate(resolve));

  page.cards[0].listeners.click();
  assert.equal(page.cards[0].copyStatus.textContent, 'Select the address above to copy it.');
});
