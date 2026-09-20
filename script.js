(function () {
  'use strict';

  function setupMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var navigation = document.querySelector('#primary-nav');
    if (!toggle || !navigation) return;
    var desktopQuery = window.matchMedia('(min-width: 1101px)');
    var backdrop = document.createElement('button');
    backdrop.className = 'nav-backdrop';
    backdrop.type = 'button';
    backdrop.setAttribute('aria-label', 'Close navigation menu');
    backdrop.tabIndex = -1;
    navigation.parentNode.insertBefore(backdrop, navigation);
    var focusable = function () { return Array.from(navigation.querySelectorAll('a, button, summary')).filter(function (element) { return !element.hasAttribute('disabled'); }); };
    var lastTouchActivation = 0;

    var close = function (restoreFocus) {
      navigation.classList.remove('is-open');
      toggle.classList.remove('is-open');
      backdrop.classList.remove('is-visible');
      navigation.inert = !desktopQuery.matches;
      navigation.setAttribute('aria-hidden', desktopQuery.matches ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
      var label = toggle.querySelector('b');
      if (label) label.textContent = 'Menu';
      document.body.classList.remove('menu-open');
      if (restoreFocus) toggle.focus();
    };
    var open = function () {
      navigation.classList.add('is-open');
      toggle.classList.add('is-open');
      backdrop.classList.add('is-visible');
      navigation.inert = false;
      navigation.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation menu');
      var label = toggle.querySelector('b');
      if (label) label.textContent = 'Close';
      document.body.classList.add('menu-open');
      var first = focusable()[0];
      if (first) first.focus();
    };

    var toggleMenu = function () {
      if (navigation.classList.contains('is-open')) close(true);
      else open();
    };
    toggle.addEventListener('pointerup', function (event) {
      if (event.pointerType === 'touch') {
        lastTouchActivation = Date.now();
        toggleMenu();
      }
    });
    toggle.addEventListener('click', function () {
      if (Date.now() - lastTouchActivation < 500) return;
      toggleMenu();
    });
    navigation.addEventListener('click', function (event) {
      if (event.target.closest('a')) close(false);
    });
    backdrop.addEventListener('click', function () { close(true); });
    document.addEventListener('click', function (event) {
      if (navigation.classList.contains('is-open') && !navigation.contains(event.target) && !toggle.contains(event.target) && !backdrop.contains(event.target)) close(true);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
        close(true);
      }
      if (event.key === 'Tab' && navigation.classList.contains('is-open')) {
        var items = focusable();
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items[items.length - 1].focus();
        } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
          event.preventDefault();
          items[0].focus();
        }
      }
    });
    close(false);
    var closeOnDesktop = function (event) {
      if (event.matches) close();
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', closeOnDesktop);
    else desktopQuery.addListener(closeOnDesktop);
  }

  function setupForms() {
    document.querySelectorAll('[data-request-form]').forEach(function (form) {
      var status = form.querySelector('.form-status');
      var submit = form.querySelector('button[type="submit"]');
      var setStatus = function (message, state) {
        if (!status) return;
        status.textContent = message;
        status.dataset.state = state || '';
      };
      var showEmailFallback = function (message) {
        setStatus(message, 'fallback');
        if (!status) return;
        var details = [];
        new FormData(form).forEach(function (value, key) {
          if (value) details.push(key + ': ' + value);
        });
        var link = document.createElement('a');
        link.className = 'text-link';
        link.href = 'mailto:freclean7@gmail.com?subject=' + encodeURIComponent('FreClean service enquiry') + '&body=' + encodeURIComponent(details.join('\n'));
        link.textContent = 'Open email draft';
        status.append(document.createTextNode(' '), link);
      };

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          setStatus('Please check the required fields before sending your enquiry.', 'error');
          return;
        }
        var requestUrl = window.FRECLEAN_PUBLIC_REQUEST_URL;
        if (!requestUrl) {
          showEmailFallback('Online submission is not connected yet. Email FreClean with these details so we can respond.');
          return;
        }
        if (submit) submit.disabled = true;
        setStatus('Sending your enquiry...', 'pending');
        fetch(requestUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        }).then(function (response) {
          if (!response.ok) throw new Error('The request service returned an error.');
          form.reset();
          setStatus('Your enquiry was submitted. FreClean will confirm availability and next steps directly.', 'success');
        }).catch(function () {
          showEmailFallback('We could not submit this enquiry. Email FreClean so your details are not lost.');
        }).finally(function () {
          if (submit) submit.disabled = false;
        });
      });
    });
  }

  function setupBookingFlow() {
    var form = document.querySelector('[data-booking-form]');
    if (!form) return;
    var steps = Array.from(form.querySelectorAll('[data-booking-step]'));
    var progress = Array.from(document.querySelectorAll('[data-progress-step]'));
    var next = form.querySelector('[data-booking-next]');
    var back = form.querySelector('[data-booking-back]');
    var submit = form.querySelector('.booking-submit');
    var review = form.querySelector('[data-booking-review]');
    var status = form.querySelector('.form-status');
    var current = 0;

    var value = function (id) {
      var field = form.querySelector('#' + id);
      return field && field.tagName === 'SELECT' ? field.options[field.selectedIndex].text : field ? field.value : '';
    };
    var renderReview = function () {
      if (!review) return;
      review.textContent = '';
      [['Service', value('booking-service')], ['Property', value('booking-property')], ['Date', value('booking-date')], ['Time', value('booking-time')], ['Name', value('booking-name')], ['Email', value('booking-email')], ['Location', value('booking-location')], ['Payment', (form.querySelector('input[name="payment_method"]:checked') || {}).value || '']].forEach(function (entry) {
        var term = document.createElement('dt');
        var description = document.createElement('dd');
        term.textContent = entry[0];
        description.textContent = entry[1] || 'Not provided';
        review.append(term, description);
      });
    };
    var showStep = function (index) {
      current = index;
      steps.forEach(function (step, stepIndex) {
        step.hidden = stepIndex !== current;
        step.classList.toggle('is-active', stepIndex === current);
      });
      progress.forEach(function (item, itemIndex) {
        item.classList.toggle('is-active', itemIndex === current);
        item.classList.toggle('is-complete', itemIndex < current);
        if (itemIndex === current) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
      if (back) back.hidden = current === 0;
      if (next) next.hidden = current === steps.length - 1;
      if (submit) submit.hidden = current !== steps.length - 1;
      if (current === steps.length - 1) renderReview();
      if (status) status.textContent = '';
      var first = steps[current].querySelector('input, select, textarea, button');
      if (first) first.focus();
    };
    var valid = function () {
      var fields = steps[current].querySelectorAll('input, select, textarea');
      for (var index = 0; index < fields.length; index += 1) {
        if (!fields[index].checkValidity()) {
          fields[index].reportValidity();
          return false;
        }
      }
      return true;
    };

    if (next) next.addEventListener('click', function () { if (valid()) showStep(Math.min(current + 1, steps.length - 1)); });
    if (back) back.addEventListener('click', function () { showStep(Math.max(current - 1, 0)); });
    form.querySelectorAll('input[name="payment_method"]').forEach(function (choice) {
      choice.addEventListener('change', function () {
        var link = form.querySelector('[data-celo-link]');
        if (!link) return;
        link.hidden = choice.value !== 'CRYPTO';
        link.href = window.FRECLEAN_CELOHT_DAPP_URL || 'https://app.celoht.com/';
      });
    });
    showStep(0);
  }

  setupMenu();
  setupForms();
  setupBookingFlow();
}());
