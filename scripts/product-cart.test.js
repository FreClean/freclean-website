'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const { calculateTotals } = require('../products/cart.js');
const { products } = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8'));

test('cart totals preserve price ranges and include fixed-price accessories', () => {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const quantities = new Map([
    ['all-purpose-cleaner-750ml', 2],
    ['freclean-bracelet', 1]
  ]);

  assert.deepEqual(calculateTotals(productMap, quantities), { minimum: 2897, maximum: 3097 });
});

test('cart rejects prices in unsupported currencies or malformed ranges', () => {
  assert.throws(() => calculateTotals(new Map([['item', {
    id: 'item',
    price: { kind: 'fixed', currency: 'HTG', amount: 10 }
  }]]), new Map([['item', 1]])), /Unsupported product currency/);

  assert.throws(() => calculateTotals(new Map([['item', {
    id: 'item',
    price: { kind: 'fixedRange', currency: 'USD', minimum: 8, maximum: 7 }
  }]]), new Map([['item', 1]])), /Product price is not supported/);
});

test('product page offers a manual-payment cart request addressed to FreClean', () => {
  const html = fs.readFileSync(path.join(root, 'products/index.html'), 'utf8');

  assert.match(html, /data-product-cart/);
  assert.match(html, /data-email-recipient="freclean7@gmail\.com"/);
  assert.match(html, /data-email-subject="FreClean Product Order Request"/);
  assert.match(html, /data-cart-summary/);
  assert.match(html, /data-cart-total-field/);
  assert.match(html, /data-cart-payment-address/);
  assert.match(html, /data-cart-screenshot-note/);
  assert.match(html, /data-address-config="\.\.\/payments\/payment-addresses\.json"/);
  assert.match(html, /After you pay manually, attach a screenshot of the payment/);
  for (const network of ['BEP20', 'TRC20', 'SOLANA', 'CELO']) {
    assert.match(html, new RegExp('data-payment-network="' + network + '"'));
  }
  assert.match(html, /value="CeloHT DApp"/);
  assert.match(html, /Request &amp; Send/);
});
