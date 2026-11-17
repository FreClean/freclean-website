(function () {
  'use strict';

  function productBounds(product) {
    var price = product.price;
    if (price.currency !== 'USD') throw new Error('Unsupported product currency: ' + product.id);
    if (price.kind === 'fixed' && Number.isFinite(price.amount)) {
      var amount = Math.round(price.amount * 100);
      return { minimum: amount, maximum: amount };
    }
    if (price.kind === 'fixedRange' && Number.isFinite(price.minimum) &&
        Number.isFinite(price.maximum) && price.minimum <= price.maximum) {
      return {
        minimum: Math.round(price.minimum * 100),
        maximum: Math.round(price.maximum * 100)
      };
    }
    throw new Error('Product price is not supported: ' + product.id);
  }

  function calculateTotals(products, quantities) {
    var amounts = { minimum: 0, maximum: 0 };
    quantities.forEach(function (quantity, id) {
      var bounds = productBounds(products.get(id));
      amounts.minimum += bounds.minimum * quantity;
      amounts.maximum += bounds.maximum * quantity;
    });
    return amounts;
  }

  if (typeof module !== 'undefined') {
    module.exports = { calculateTotals: calculateTotals, productBounds: productBounds };
  }
  if (typeof document === 'undefined') return;

  var section = document.querySelector('[data-product-cart]');
  var form = document.getElementById('product-cart-form');
  if (!section || !form) return;

  var productPage = section.closest('.page-content') || document;
  var itemsElement = section.querySelector('[data-cart-items]');
  var totalElement = section.querySelector('[data-cart-total]');
  var cartStatus = section.querySelector('[data-cart-status]');
  var submitButton = form.querySelector('button[type="submit"]');
  var cartSummary = form.querySelector('[data-cart-summary]');
  var totalField = form.querySelector('[data-cart-total-field]');
  var addressField = form.querySelector('[data-cart-payment-address]');
  var screenshotNoteField = form.querySelector('[data-cart-screenshot-note]');
  var loadStatus = document.querySelector('[data-cart-load-status]');
  var products = new Map();
  var quantities = new Map();

  function translate(key, fallback) {
    var i18n = window.FRECLEAN_I18N;
    return i18n && i18n.ready() ? i18n.t(key) : fallback;
  }

  function money(cents) {
    return '$' + (cents / 100).toFixed(2) + ' USD';
  }

  function totals() {
    return calculateTotals(products, quantities);
  }

  function estimateText(amounts) {
    return amounts.minimum === amounts.maximum
      ? money(amounts.minimum)
      : money(amounts.minimum) + ' – ' + money(amounts.maximum);
  }

  function render() {
    itemsElement.textContent = '';
    cartStatus.textContent = '';
    var hasItems = quantities.size > 0;
    if (!hasItems) {
      var emptyMessage = document.createElement('p');
      emptyMessage.textContent = translate('pages.products.index.cartEmpty', 'Your cart is empty. Add a product to get started.');
      itemsElement.appendChild(emptyMessage);
    }

    quantities.forEach(function (quantity, id) {
      var product = products.get(id);
      var bounds = productBounds(product);
      var row = document.createElement('article');
      row.className = 'cart-item';

      var details = document.createElement('div');
      var name = document.createElement('h3');
      name.textContent = product.name;
      var price = document.createElement('p');
      price.textContent = estimateText({
        minimum: bounds.minimum * quantity,
        maximum: bounds.maximum * quantity
      });
      details.append(name, price);

      var controls = document.createElement('div');
      controls.className = 'cart-item-controls';
      var quantityLabel = document.createElement('label');
      quantityLabel.textContent = translate('pages.products.index.cartQuantity', 'Quantity');
      var quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.min = '1';
      quantityInput.max = '99';
      quantityInput.value = String(quantity);
      quantityInput.setAttribute('aria-label', product.name + ' ' + translate('pages.products.index.cartQuantity', 'quantity'));
      quantityLabel.appendChild(quantityInput);
      quantityInput.addEventListener('change', function () {
        var next = Number(quantityInput.value);
        if (!Number.isInteger(next) || next < 1 || next > 99) {
          quantityInput.value = String(quantity);
          return;
        }
        quantities.set(id, next);
        render();
      });

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button button-outline';
      remove.textContent = translate('pages.products.index.cartRemove', 'Remove');
      remove.setAttribute('aria-label', translate('pages.products.index.cartRemoveProduct', 'Remove') + ' ' + product.name);
      remove.addEventListener('click', function () {
        quantities.delete(id);
        render();
      });

      controls.append(quantityLabel, remove);
      row.append(details, controls);
      itemsElement.appendChild(row);
    });

    var amounts = totals();
    var totalText = estimateText(amounts);
    totalElement.textContent = totalText;
    submitButton.disabled = !hasItems;
    cartSummary.value = Array.from(quantities.entries()).map(function (entry) {
      var product = products.get(entry[0]);
      return product.name + ' x ' + entry[1] + ' — ' + estimateText({
        minimum: productBounds(product).minimum * entry[1],
        maximum: productBounds(product).maximum * entry[1]
      });
    }).join('\n');
    totalField.value = totalText;
  }

  document.addEventListener('submit', function (event) {
    var addForm = event.target.closest('[data-cart-add]');
    if (!addForm) return;
    event.preventDefault();
    var id = addForm.querySelector('[name="product"]').value;
    var product = products.get(id);
    var quantity = Number(addForm.querySelector('[name="quantity"]').value);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
    var combined = (quantities.get(id) || 0) + quantity;
    if (combined > 99) {
      cartStatus.textContent = translate(
        'pages.products.index.cartQuantityLimit',
        'You can add up to 99 of each product to one request.'
      );
      return;
    }
    quantities.set(id, combined);
    render();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('submit', function (event) {
    if (!quantities.size) {
      event.preventDefault();
      event.stopImmediatePropagation();
      cartStatus.textContent = translate(
        'pages.products.index.cartEmpty',
        'Your cart is empty. Add a product to get started.'
      );
      return;
    }
    var selected = form.querySelector('[name="payment_choice"]:checked');
    var paymentCard = selected && selected.closest('[data-payment-network]');
    var paymentAddress = paymentCard && paymentCard.querySelector('[data-payment-address]');
    addressField.value = paymentAddress ? paymentAddress.textContent : '';
    screenshotNoteField.value = translate(
      'pages.products.index.cartScreenshotNote',
      'After you pay manually, attach a screenshot of the payment to your email so FreClean can check it. Selecting a method or sending this request does not complete or confirm payment.'
    );
  });

  document.addEventListener('freclean:languagechange', render);

  fetch('../products.json', { headers: { Accept: 'application/json' } })
    .then(function (response) {
      if (!response.ok) throw new Error('Product catalog request failed: ' + response.status);
      return response.json();
    })
    .then(function (catalog) {
      if (!catalog || !Array.isArray(catalog.products)) throw new Error('Product catalog is invalid.');
      catalog.products.forEach(function (product) {
        if (!product || typeof product.id !== 'string' || typeof product.name !== 'string' || !product.price) {
          throw new Error('Product catalog entry is invalid.');
        }
        productBounds(product);
        products.set(product.id, product);
      });
      productPage.querySelectorAll('[data-cart-add] button[type="submit"]').forEach(function (button) {
        button.disabled = false;
      });
      var observer = new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            var buttons = node.matches('[data-cart-add] button[type="submit"]')
              ? [node]
              : Array.from(node.querySelectorAll('[data-cart-add] button[type="submit"]'));
            buttons.forEach(function (button) { button.disabled = false; });
          });
        });
      });
      observer.observe(productPage, { childList: true, subtree: true });
      render();
    })
    .catch(function (error) {
      console.error('Unable to prepare the FreClean product cart.', error);
      loadStatus.textContent = translate(
        'pages.products.index.cartLoadError',
        'Products could not be loaded. Please contact FreClean to place an order.'
      );
      loadStatus.hidden = false;
    });
})();
