(function () {
  'use strict';

  var script = document.currentScript;
  var scriptPath = script ? new URL(script.src).pathname : '/freclean-website/script.js';
  var siteRoot = scriptPath.slice(0, scriptPath.lastIndexOf('/') + 1);
  var pagePath = window.location.pathname;
  var relativePath = pagePath.indexOf(siteRoot) === 0 ? pagePath.slice(siteRoot.length) : '';
  var segments = relativePath.split('/').filter(Boolean);
  if (segments.length && segments[segments.length - 1].indexOf('.html') !== -1) segments.pop();
  var prefix = '../'.repeat(segments.length);
  var route = segments[0] || 'home';
  var navItems = [
    ['Services', 'services/'], ['Products', 'products/'], ['Business', 'business/'],
    ['Entrepreneurship', 'entrepreneurship/'], ['Impact', 'impact/'], ['About', 'about/'],
    ['Resources', 'resources/'], ['Contact', 'contact/']
  ];

  function asset(path) { return prefix + path; }
  function link(path) { return asset(path); }

  function renderHeader() {
    var oldHeader = document.querySelector('.site-header, body > header');
    if (!oldHeader) return;
    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = '<a class="logo-link" href="' + link('index.html') + '" aria-label="FreClean home"><img src="' + asset('assets/logo-landscape-2.png') + '" alt="FreClean" width="1672" height="941"></a>' +
      '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open navigation"><b>Menu</b></button>' +
      '<nav id="primary-nav" aria-label="Primary navigation">' + navItems.map(function (item) {
        var href = link(item[1]);
        var active = route === item[1].split('/')[0] ? ' aria-current="page"' : '';
        return '<a href="' + href + '"' + active + '>' + item[0] + '</a>';
      }).join('') + '<a class="nav-cta" href="' + link('book/') + '">Book a Service <span aria-hidden="true">&rarr;</span></a></nav>';
    oldHeader.replaceWith(header);
  }

  function renderFooter() {
    var oldFooter = document.querySelector('footer');
    if (oldFooter && oldFooter.classList.contains('site-footer')) return;
    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = '<div class="section-wrap footer-main"><div class="footer-brand"><a class="logo-link" href="' + link('index.html') + '"><img src="' + asset('assets/logo-landscape-2.png') + '" alt="FreClean" width="1672" height="941"></a><p>Professional cleaning services<br>and cleaning products from<br>Leogane, Haiti.</p></div><div><p class="footer-title">Explore</p><a href="' + link('services/') + '">Services</a><a href="' + link('products/') + '">Products</a><a href="' + link('business/') + '">Business</a><a href="' + link('entrepreneurship/') + '">Entrepreneurship</a></div><div><p class="footer-title">Company</p><a href="' + link('impact/') + '">Impact</a><a href="' + link('about/') + '">About</a><a href="' + link('resources/') + '">Resources</a><a href="' + link('contact/') + '">Contact</a></div><div><p class="footer-title">Contact</p><p>Leogane, Ouest, Haiti</p><a href="mailto:freclean7@gmail.com">freclean7@gmail.com</a><a href="tel:+18493881969">+1 (849) 388-1969</a><a href="https://www.facebook.com/profile.php?id=61572058283204" rel="noopener">Facebook</a></div></div><div class="section-wrap footer-bottom"><span>&copy; 2026 FreClean. All rights reserved.</span><span><a href="' + link('privacy/') + '">Privacy</a> &middot; <a href="' + link('terms/') + '">Terms</a></span></div>';
    if (oldFooter) oldFooter.replaceWith(footer);
    else document.body.appendChild(footer);
  }

  function closeMenu(toggle, navigation) {
    navigation.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    toggle.querySelector('b').textContent = 'Menu';
    document.body.classList.remove('menu-open');
  }

  function setupMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var navigation = document.querySelector('#primary-nav');
    if (!toggle || !navigation) return;
    var focusable = function () { return Array.from(navigation.querySelectorAll('a, button')).filter(function (element) { return !element.hasAttribute('disabled'); }); };
    toggle.addEventListener('click', function () {
      var open = navigation.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      toggle.querySelector('b').textContent = open ? 'Close' : 'Menu';
      document.body.classList.toggle('menu-open', open);
      if (open) focusable()[0].focus();
      else toggle.focus();
    });
    document.addEventListener('click', function (event) {
      if (!navigation.classList.contains('is-open')) return;
      if (!navigation.contains(event.target) && !toggle.contains(event.target)) {
        closeMenu(toggle, navigation);
      }
    });
    navigation.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu(toggle, navigation);
    });
    document.addEventListener('keydown', function (event) {
      if (!navigation.classList.contains('is-open')) return;
      if (event.key === 'Escape') { closeMenu(toggle, navigation); toggle.focus(); }
      if (event.key === 'Tab') {
        var items = focusable();
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
        if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
      }
    });
  }

  function setupForms() {
    document.querySelectorAll('[data-request-form]').forEach(function (form) {
      var status = form.querySelector('.form-status');
      var submit = form.querySelector('button[type="submit"]');
      if (!status) { status = document.createElement('p'); status.className = 'form-status'; status.setAttribute('role', 'status'); form.appendChild(status); }
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var requestUrl = window.FRECLEAN_PUBLIC_REQUEST_URL;
        if (!requestUrl) { status.textContent = 'Online requests are not connected yet. Please email freclean7@gmail.com to confirm your request.'; return; }
        if (submit) submit.disabled = true;
        status.textContent = 'Sending your request...';
        try {
          var response = await fetch(requestUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
          var body = await response.json().catch(function () { return {}; });
          if (!response.ok) {
            var errorMessage = { 400: 'Some request details need attention.', 409: 'That preferred time is no longer available.', 429: 'We are receiving many requests. Please try again shortly.', 500: 'The request service is temporarily unavailable.' }[response.status] || body.error || 'The request could not be completed.';
            throw new Error(errorMessage);
          }
          form.reset(); status.textContent = 'Your request was received. FreClean will confirm availability and next steps with you.';
        } catch (error) { status.textContent = error.message || 'We could not send the request. Please email freclean7@gmail.com so we can help.'; }
        if (submit) submit.disabled = false;
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
    var fieldValue = function (id) {
      var field = form.querySelector('#' + id);
      if (!field) return '';
      return field.tagName === 'SELECT' ? field.options[field.selectedIndex].text : field.value;
    };
    var renderReview = function () {
      if (!review) return;
      review.textContent = '';
      [['Service', fieldValue('booking-service')], ['Property', fieldValue('booking-property')], ['Date', fieldValue('booking-date')], ['Time', fieldValue('booking-time')], ['Name', fieldValue('booking-name')], ['Email', fieldValue('booking-email')], ['Location', fieldValue('booking-location')], ['Payment', (form.querySelector('input[name="payment_method"]:checked') || {}).value || '']].forEach(function (entry) {
        var term = document.createElement('dt');
        var description = document.createElement('dd');
        term.textContent = entry[0];
        description.textContent = entry[1] || 'Not provided';
        review.append(term, description);
      });
    };
    var showStep = function (index) {
      current = index;
      steps.forEach(function (step, stepIndex) { step.hidden = stepIndex !== current; step.classList.toggle('is-active', stepIndex === current); });
      progress.forEach(function (item, itemIndex) { item.classList.toggle('is-active', itemIndex === current); item.classList.toggle('is-complete', itemIndex < current); if (itemIndex === current) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current'); });
      if (back) back.hidden = current === 0;
      if (next) next.hidden = current === steps.length - 1;
      if (submit) submit.hidden = current !== steps.length - 1;
      if (current === steps.length - 1) renderReview();
      if (status) status.textContent = '';
      steps[current].querySelector('input, select, textarea, button')?.focus();
    };
    var currentIsValid = function () {
      var valid = true;
      steps[current].querySelectorAll('input, select, textarea').forEach(function (field) { if (!field.checkValidity()) valid = false; });
      if (!valid) steps[current].querySelector(':invalid')?.reportValidity();
      return valid;
    };
    next?.addEventListener('click', function () { if (currentIsValid()) showStep(Math.min(current + 1, steps.length - 1)); });
    back?.addEventListener('click', function () { showStep(Math.max(current - 1, 0)); });
    form.querySelectorAll('input[name="payment_method"]').forEach(function (choice) {
      choice.addEventListener('change', function () {
        var link = form.querySelector('[data-celo-link]');
        if (!link) return;
        var dappUrl = window.FRECLEAN_CELOHT_DAPP_URL || 'https://app.celoht.com';
        link.hidden = choice.value !== 'CRYPTO' || !dappUrl;
        if (dappUrl) link.href = dappUrl;
      });
    });
    showStep(0);
  }

  function setupImages() {
    document.querySelectorAll('img[src*="brand-logo"], img[src*="logo-landscape-1"]').forEach(function (image) { image.src = asset('assets/logo-landscape-2.png'); image.width = 1672; image.height = 941; });
    document.querySelectorAll('img[src*="catalog-landscape-1.png"]').forEach(function (image) { image.src = asset('assets/catalog-landscape-2.png'); });
    document.querySelectorAll('img[src*="catalog-portrait-2.png"]').forEach(function (image) { image.src = asset('assets/catalog-portrait-3.png'); });
  }

  renderHeader(); renderFooter(); setupMenu(); setupForms(); setupBookingFlow(); setupImages();
}());
