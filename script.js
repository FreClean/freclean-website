(function () {
  'use strict';

  function safeStorageGet() {
    try {
      return JSON.parse(window.localStorage.getItem('freclean_cookie_consent_v1') || 'null');
    } catch (error) {
      return null;
    }
  }

  function safeStorageSet(value) {
    try {
      window.localStorage.setItem('freclean_cookie_consent_v1', JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function setupCookieConsent() {
    var consent = safeStorageGet();
    var effectiveConsent = consent || {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
      version: '2026-09-20'
    };
    window.FRECLEAN_COOKIE_CONSENT = effectiveConsent;

    var banner = document.querySelector('[data-cookie-banner]');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'cookie-banner';
      banner.setAttribute('data-cookie-banner', 'true');
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-live', 'polite');
      banner.setAttribute('aria-label', 'Cookie preferences');
      banner.innerHTML = '<div class="cookie-banner__inner"><div class="cookie-banner__copy"><p class="cookie-banner__title">Your cookie choices</p><p>FreClean uses necessary cookies for the site to work. Optional preferences, analytics, and marketing cookies remain off until you choose otherwise.</p></div><div class="cookie-banner__controls"><label class="cookie-option"><input type="checkbox" checked disabled> <span>Necessary</span></label><label class="cookie-option"><input type="checkbox" name="preferences" ' + (effectiveConsent.preferences ? 'checked' : '') + '> <span>Preferences</span></label><label class="cookie-option"><input type="checkbox" name="analytics" ' + (effectiveConsent.analytics ? 'checked' : '') + '> <span>Analytics</span></label><label class="cookie-option"><input type="checkbox" name="marketing" ' + (effectiveConsent.marketing ? 'checked' : '') + '> <span>Marketing</span></label></div><div class="cookie-banner__actions"><button type="button" class="button button-outline cookie-accept-necessary">Only necessary cookies</button><button type="button" class="button button-primary cookie-save">Save preferences</button><button type="button" class="button button-dark cookie-accept-all">Accept all</button></div><p class="cookie-banner__meta"><a href="/legal/cookie-policy/" class="text-link">Cookie policy</a></p></div>';
      document.body.insertBefore(banner, document.body.firstChild);
    }

    var acceptAll = function () {
      var chosen = { necessary: true, preferences: true, analytics: true, marketing: true, version: '2026-09-20' };
      banner.querySelectorAll('input[name]').forEach(function (input) {
        input.checked = chosen[input.name] || false;
      });
      safeStorageSet(chosen);
      window.FRECLEAN_COOKIE_CONSENT = chosen;
      banner.setAttribute('hidden', 'hidden');
    };

    var savePreferences = function () {
      var chosen = {
        necessary: true,
        preferences: !!banner.querySelector('input[name="preferences"]').checked,
        analytics: !!banner.querySelector('input[name="analytics"]').checked,
        marketing: !!banner.querySelector('input[name="marketing"]').checked,
        version: '2026-09-20'
      };
      safeStorageSet(chosen);
      window.FRECLEAN_COOKIE_CONSENT = chosen;
      banner.setAttribute('hidden', 'hidden');
    };

    var necessaryOnly = function () {
      var chosen = { necessary: true, preferences: false, analytics: false, marketing: false, version: '2026-09-20' };
      banner.querySelectorAll('input[name]').forEach(function (input) {
        input.checked = false;
      });
      banner.querySelector('input[name="preferences"]').checked = false;
      banner.querySelector('input[name="analytics"]').checked = false;
      banner.querySelector('input[name="marketing"]').checked = false;
      safeStorageSet(chosen);
      window.FRECLEAN_COOKIE_CONSENT = chosen;
      banner.setAttribute('hidden', 'hidden');
    };

    banner.querySelector('.cookie-save').addEventListener('click', savePreferences);
    banner.querySelector('.cookie-accept-all').addEventListener('click', acceptAll);
    banner.querySelector('.cookie-accept-necessary').addEventListener('click', necessaryOnly);

    if (window.location.pathname.indexOf('/legal/') !== -1 || window.location.pathname.indexOf('/privacy/') !== -1 || window.location.pathname.indexOf('/terms/') !== -1) {
      banner.querySelector('.cookie-banner__meta a').href = '../cookie-policy/';
    }

    if (!window.localStorage.getItem('freclean_cookie_consent_v1')) {
      banner.removeAttribute('hidden');
    } else {
      banner.setAttribute('hidden', 'hidden');
    }
  }

  function setupMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var navigation = document.querySelector('#primary-nav');
    if (!toggle || !navigation) return;
    if (navigation.dataset.menuReady === 'true') return;
    navigation.dataset.menuReady = 'true';
    var desktopQuery = window.matchMedia('(min-width: 1101px)');
    var backdrop = document.createElement('button');
    backdrop.className = 'nav-backdrop';
    backdrop.type = 'button';
    backdrop.setAttribute('aria-label', 'Close navigation menu');
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.tabIndex = -1;
    navigation.parentNode.insertBefore(backdrop, navigation);
    navigation.querySelectorAll('.nav-close').forEach(function (button) { button.remove(); });
    var closeButton = document.createElement('button');
    closeButton.className = 'nav-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close navigation');
    closeButton.dataset.navClose = 'true';
    closeButton.innerHTML = '<span aria-hidden="true">&times;</span>';
    navigation.insertBefore(closeButton, navigation.firstChild);
    var focusable = function () { return Array.from(navigation.querySelectorAll('a, button, summary')).filter(function (element) { return !element.hasAttribute('disabled'); }); };

    var close = function (restoreFocus) {
      navigation.classList.remove('is-open');
      toggle.classList.remove('is-open');
      backdrop.classList.remove('is-visible');
      backdrop.setAttribute('aria-hidden', 'true');
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
      backdrop.setAttribute('aria-hidden', 'false');
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
    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      toggleMenu();
    });
    closeButton.addEventListener('click', function () { close(true); });
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
      var isSubmitting = false;
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
        link.textContent = 'Draft an email to FreClean';
        status.append(document.createTextNode(' '), link);
      };

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (isSubmitting) return;
        if (!form.checkValidity()) {
          form.reportValidity();
          setStatus('Please check the required fields before sending your enquiry.', 'error');
          return;
        }
        var requestUrl = window.FRECLEAN_PUBLIC_REQUEST_URL || 'https://freclean.onrender.com/api/public/requests';
        try {
          var parsedRequestUrl = new URL(requestUrl);
          if (parsedRequestUrl.protocol !== 'https:' || parsedRequestUrl.username || parsedRequestUrl.password || !parsedRequestUrl.hostname || parsedRequestUrl.hostname === 'localhost' || parsedRequestUrl.hostname.endsWith('.localhost') || parsedRequestUrl.hostname.endsWith('.local')) {
            throw new Error('The public request URL is not an approved HTTPS destination.');
          }
          requestUrl = parsedRequestUrl.href;
        } catch (error) {
          showEmailFallback('Online submission is unavailable. Your enquiry has not been sent; draft an email with these details and send it to FreClean.');
          return;
        }
        var values = Object.fromEntries(new FormData(form));
        var dataset = form.dataset || {};
        var requestType = dataset.requestType === 'SERVICE' ? 'SERVICE' : 'CONTACT';
        var bookingDetails = [values.service, values.property_type, values.date, values.time, values.location, values.notes].filter(Boolean);
        var message = (values.message || values.notes || bookingDetails.join('; ')).trim();
        if (!message || message.length < 10) {
          setStatus('Please provide at least 10 characters in the message or additional information field.', 'error');
          return;
        }
        var payload = {
          type: requestType,
          fullName: (values.fullName || values.name || '').trim(),
          email: (values.email || '').trim(),
          phone: (values.phone || '').trim(),
          service: (values.service || values.subject || '').trim(),
          message: message,
          website: ''
        };
        isSubmitting = true;
        if (submit) {
          submit.disabled = true;
          submit.setAttribute('aria-busy', 'true');
        }
        setStatus('Sending your enquiry...', 'pending');
        fetch(requestUrl, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (response) {
          if (response.status === 400) throw Object.assign(new Error('validation'), { status: 400 });
          if (response.status === 409) throw Object.assign(new Error('duplicate'), { status: 409 });
          if (response.status === 413) throw Object.assign(new Error('large'), { status: 413 });
          if (response.status === 429) throw Object.assign(new Error('rate-limit'), { status: 429 });
          if (response.status === 403) throw Object.assign(new Error('origin'), { status: 403 });
          if (!response.ok) throw new Error('The request service returned an error.');
          return response.json().then(function (receipt) {
            if (!receipt || receipt.received !== true) {
              throw new Error('The request service did not confirm receipt.');
            }
          });
        }).then(function () {
          form.reset();
          setStatus('Your enquiry was received. FreClean will confirm availability and next steps directly; this is not an appointment confirmation.', 'success');
        }).catch(function (error) {
          if (error && error.status === 400) {
            setStatus('Please check your name, email, phone and message details before sending again.', 'error');
          } else if (error && error.status === 409) {
            setStatus('This enquiry appears to have already been submitted. Please use the email option if you need to add information.', 'error');
          } else if (error && error.status === 429) {
            showEmailFallback('Too many submissions were received recently. Please wait before trying again or draft an email to FreClean.');
          } else if (error && error.status === 403) {
            showEmailFallback('This browser origin could not be verified. Your enquiry has not been sent; draft an email with these details and send it to FreClean.');
          } else {
            showEmailFallback('We could not confirm receipt of your enquiry. It has not been confirmed; draft an email with these details and send it to FreClean.');
          }
        }).finally(function () {
          isSubmitting = false;
          if (submit) {
            submit.disabled = false;
            submit.removeAttribute('aria-busy');
          }
        });
      });
    });
  }

  function setupPageMotion() {
    var reducedMotionQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    if (reducedMotionQuery && reducedMotionQuery.matches) return;

    var selectors = '.hero-copy > *, .hero-media, .metric-grid > div, .intro-grid > *, .services-intro > *, .service-feature, .service-row, .split-section > *, .business-heading, .business-copy, .entrepreneurship-grid > *, .payments-section > *, .celoht-partner-inner > *, .impact-section > *, .process-grid > div, .journal-grid article, .partnership-cta-inner > *, .trust-section > *, .final-cta-inner > *';
    var elements = Array.from(document.querySelectorAll(selectors));

    if (!('IntersectionObserver' in window)) {
      elements.forEach(function (element) { element.classList.add('is-visible'); });
      return;
    }

    elements.forEach(function (element, index) {
      element.classList.add('reveal');
      element.style.setProperty('--reveal-delay', Math.min(index % 4, 3) * 70 + 'ms');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    elements.forEach(function (element) { observer.observe(element); });

    var heroMedia = document.querySelector('.hero-media');
    var hoverQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(hover: none)')
      : null;
    if (!heroMedia || (hoverQuery && hoverQuery.matches)) return;

    var frameRequested = false;
    var pointerX = 0;
    var pointerY = 0;
    heroMedia.addEventListener('pointermove', function (event) {
      var bounds = heroMedia.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
      pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(function () {
        heroMedia.style.setProperty('--hero-shift-x', pointerX.toFixed(2) + 'px');
        heroMedia.style.setProperty('--hero-shift-y', pointerY.toFixed(2) + 'px');
        frameRequested = false;
      });
    });
    heroMedia.addEventListener('pointerleave', function () {
      heroMedia.style.setProperty('--hero-shift-x', '0px');
      heroMedia.style.setProperty('--hero-shift-y', '0px');
    });
  }

  function setupVerifiedPublications() {
    var container = document.querySelector('[data-verified-publications]');
    if (!container) return;

    fetch('../verified-publications.json')
      .then(function (response) { if (!response.ok) throw new Error('Publication data unavailable'); return response.json(); })
      .then(function (data) {
        var approved = (data.publications || []).filter(function (item) {
          return item && item.verifiedPublication === true && item.consent === true && item.quote && item.clientLabel;
        });
        if (!approved.length) return;

        container.textContent = '';
        approved.forEach(function (item) {
          var article = document.createElement('article');
          var quote = document.createElement('blockquote');
          var attribution = document.createElement('small');
          article.className = 'verified-publication';
          quote.textContent = '“' + item.quote + '”';
          attribution.textContent = item.clientLabel + (item.service ? ' · ' + item.service : '') + (item.date ? ' · ' + item.date : '') + ' · Verified publication';
          article.append(quote, attribution);
          container.appendChild(article);
        });
      })
      .catch(function () {
        // Keep the truthful empty-state copy when the source is unavailable.
      });
  }

  function setupServiceEstimate() {
    var form = document.querySelector('[data-booking-form]');
    var output = document.querySelector('[data-service-estimate]');
    if (!form || !output) return;

    var update = function () {
      var service = form.querySelector('#booking-service');
      var property = form.querySelector('#booking-property');
      var size = form.querySelector('#booking-size');
      var serviceValue = service ? service.value : '';
      var propertyValue = property ? property.value : '';
      var sizeValue = size ? size.value : '';

      if (!serviceValue || !propertyValue || !sizeValue) {
        output.textContent = 'This estimate range helps FreClean prepare a quote. It is not a price, availability confirmation or booking.';
        return;
      }

      output.textContent = 'Quote request prepared: ' + serviceValue + ' for a ' + propertyValue.toLowerCase() + ', approximately ' + sizeValue.toLowerCase() + '. FreClean will confirm the exact price, scope, availability and payment terms.';
    };

    ['booking-service', 'booking-property', 'booking-size'].forEach(function (id) {
      var field = form.querySelector('#' + id);
      if (field) field.addEventListener('change', update);
    });
    update();
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
        var celoUrl = 'https://app.celoht.com/';
        try {
          var configuredCeloUrl = new URL(window.FRECLEAN_CELOHT_DAPP_URL || celoUrl);
          if (configuredCeloUrl.origin === 'https://app.celoht.com' && configuredCeloUrl.pathname === '/' && !configuredCeloUrl.search && !configuredCeloUrl.hash && !configuredCeloUrl.username && !configuredCeloUrl.password) {
            celoUrl = configuredCeloUrl.href;
          }
        } catch (error) {
          celoUrl = 'https://app.celoht.com/';
        }
        link.href = celoUrl;
      });
    });
    showStep(0);
  }

  setupCookieConsent();
  setupMenu();
  setupForms();
  setupPageMotion();
  setupVerifiedPublications();
  setupServiceEstimate();
  setupBookingFlow();
}());
