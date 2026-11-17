(function () {
  'use strict';

  var section = document.querySelector('[data-payment-options]');
  if (!section) return;

  var status = document.querySelector('[data-payment-status]');
  var networks = ['BEP20', 'TRC20', 'SOLANA', 'CELO'];
  var isDonation = section.getAttribute('data-payment-purpose') === 'donation';
  var statusKey = isDonation
    ? 'pages.entrepreneurship.donationLoadingAddresses'
    : 'pages.payments.loadingAddresses';
  var copyMessages = [];
  var englishMessages = {
    'pages.payments.loadingAddresses': 'Loading payment addresses...',
    'pages.payments.addressReady': 'USDT addresses are ready. FreClean confirms manual transfers directly.',
    'pages.payments.addressUnavailable': 'Payment addresses are currently unavailable. Please contact FreClean.',
    'pages.payments.addressCopied': 'Address copied.',
    'pages.payments.copyManually': 'Select the address above to copy it.',
    'pages.entrepreneurship.donationLoadingAddresses': 'Loading donation addresses...',
    'pages.entrepreneurship.donationAddressesReady': 'Donation addresses are ready. Send only USDT on the selected network.',
    'pages.entrepreneurship.donationAddressesUnavailable': 'Donation addresses are currently unavailable. Please contact FreClean before sending.'
  };
  var translate = function (key) {
    var i18n = window.FRECLEAN_I18N;
    return i18n && i18n.ready() ? i18n.t(key) : englishMessages[key];
  };
  var setStatus = function (key) {
    statusKey = key;
    if (status) status.textContent = translate(key);
  };
  var setCopyStatus = function (element, key) {
    if (!element) return;
    var entry = copyMessages.find(function (message) { return message.element === element; });
    if (entry) entry.key = key;
    else copyMessages.push({ element: element, key: key });
    element.textContent = translate(key);
  };

  document.addEventListener('freclean:languagechange', function () {
    setStatus(statusKey);
    copyMessages.forEach(function (message) {
      message.element.textContent = translate(message.key);
    });
  });

  fetch(section.getAttribute('data-address-config') || 'payment-addresses.json', {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    headers: { Accept: 'application/json' }
  }).then(function (response) {
    if (!response.ok) throw new Error('Payment options are unavailable.');
    return response.json();
  }).then(function (options) {
    if (!options || options.paymentMode !== 'MANUAL' || !Array.isArray(options.usdtNetworks)) {
      throw new Error('Payment options response is invalid.');
    }

    var networkOptions = new Map();
    options.usdtNetworks.forEach(function (option) {
      if (!option || networks.indexOf(option.network) === -1 ||
          option.asset !== 'USDT' || typeof option.receivingAddress !== 'string' ||
          !option.receivingAddress.trim() || networkOptions.has(option.network)) {
        throw new Error('Payment options response is invalid.');
      }
      networkOptions.set(option.network, option.receivingAddress.trim());
    });

    if (networkOptions.size !== networks.length) throw new Error('Payment options response is incomplete.');

    section.querySelectorAll('[data-payment-network]').forEach(function (card) {
      var network = card.getAttribute('data-payment-network');
      var address = networkOptions.get(network);
      var addressElement = card.querySelector('[data-payment-address]');
      var copyButton = card.querySelector('[data-copy-address]');
      var copyStatus = card.querySelector('[data-copy-status]');
      var paymentChoice = card.querySelector('[data-payment-select]');
      if (!address || !addressElement || !copyButton) throw new Error('Payment address display is incomplete.');

      addressElement.textContent = address;
      copyButton.disabled = false;
      if (paymentChoice) paymentChoice.disabled = false;
      copyButton.addEventListener('click', function () {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          setCopyStatus(copyStatus, 'pages.payments.copyManually');
          return;
        }
        navigator.clipboard.writeText(address).then(function () {
          setCopyStatus(copyStatus, 'pages.payments.addressCopied');
        }).catch(function () {
          setCopyStatus(copyStatus, 'pages.payments.copyManually');
        });
      });
    });

    section.setAttribute('aria-busy', 'false');
    setStatus(isDonation
      ? 'pages.entrepreneurship.donationAddressesReady'
      : 'pages.payments.addressReady');
  }).catch(function () {
    section.setAttribute('aria-busy', 'false');
    setStatus(isDonation
      ? 'pages.entrepreneurship.donationAddressesUnavailable'
      : 'pages.payments.addressUnavailable');
  });
})();
