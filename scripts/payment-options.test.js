'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'payments/payment-options.js'), 'utf8');
const networks = [
  ['BEP20', 'example-address-bep20'],
  ['TRC20', 'example-address-trc20'],
  ['SOLANA', 'example-address-solana'],
  ['CELO', 'example-address-celo']
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

function boot(fetchImplementation, clipboard) {
  const cards = networks.map(([network]) => createCard(network));
  const attributes = {};
  const section = {
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

test('loads centrally configured addresses and enables address copying', async () => {
  let request;
  const clipboardWrites = [];
  const page = boot((url, options) => {
    request = { url, options };
    return response({
      paymentMode: 'MANUAL',
      usdtNetworks: networks.map(([network, receivingAddress]) => ({
        asset: 'USDT',
        network,
        receivingAddress
      }))
    });
  }, { writeText: (address) => {
    clipboardWrites.push(address);
    return Promise.resolve();
  } });

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(request.url, 'https://api.freclean.com/api/payments/options');
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

test('does not show addresses when the API fails or returns an incomplete list', async () => {
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
  const page = boot(() => response({
    paymentMode: 'MANUAL',
    usdtNetworks: networks.map(([network, receivingAddress]) => ({
      asset: 'USDT',
      network,
      receivingAddress
    }))
  }));
  await new Promise((resolve) => setImmediate(resolve));

  page.cards[0].listeners.click();
  assert.equal(page.cards[0].copyStatus.textContent, 'Select the address above to copy it.');
});
