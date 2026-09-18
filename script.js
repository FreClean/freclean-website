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
      '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open navigation"><span></span><span></span><span></span><b>Menu</b></button>' +
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
        var apiUrl = window.FRECLEAN_API_URL;
        if (!apiUrl) { status.textContent = 'Online submission is not connected yet. Please email freclean7@gmail.com to confirm your request.'; return; }
        submit.disabled = true; status.textContent = 'Sending your request...';
        try {
          var response = await fetch(apiUrl.replace(/\/$/, '') + '/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
          if (!response.ok) throw new Error('Request failed');
          form.reset(); status.textContent = 'Thank you. FreClean will be in touch soon.';
        } catch (error) { status.textContent = 'We could not send your request. Please email freclean7@gmail.com.'; }
        submit.disabled = false;
      });
    });
  }

  function setupImages() {
    document.querySelectorAll('img[src*="brand-logo"], img[src*="logo-landscape-1"]').forEach(function (image) { image.src = asset('assets/logo-landscape-2.png'); image.width = 1672; image.height = 941; });
    document.querySelectorAll('img[src*="catalog-landscape-1.png"]').forEach(function (image) { image.src = asset('assets/catalog-landscape-2.png'); });
  }

  renderHeader(); renderFooter(); setupMenu(); setupForms(); setupImages();
}());
