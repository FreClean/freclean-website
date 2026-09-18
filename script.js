(function () {
  document.querySelectorAll('.brand:not(:has(img))').forEach(function (brand) {
    var path = brand.getAttribute('href') || 'index.html';
    var assetPath = path.indexOf('../') === 0 ? '../assets/brand-logo.jpg' : 'assets/brand-logo.jpg';
    var image = document.createElement('img');
    image.src = assetPath;
    image.alt = 'FreClean';
    image.width = 72;
    image.height = 72;
    brand.replaceChildren(image);
    brand.classList.add('logo-link');
  });

  document.querySelectorAll('img[src*="catalog-landscape-1.png"]').forEach(function (image) {
    image.addEventListener('error', function () {
      image.src = image.src.replace('catalog-landscape-1.png', 'catalog-landscape-2.png');
    }, {once: true});
  });

  var toggle = document.querySelector('.menu-toggle');
  var navigation = document.querySelector('#primary-nav');

  if (toggle && navigation) {
    if (!toggle.querySelector('b')) {
      toggle.replaceChildren(
        document.createElement('span'),
        document.createElement('span'),
        document.createElement('span'),
        document.createElement('b')
      );
      toggle.querySelector('b').textContent = 'Menu';
    }

    var logo = document.querySelector('.site-header .logo-link, .site-header .brand');
    var homeUrl = logo ? new URL(logo.getAttribute('href'), document.baseURI) : new URL('index.html', document.baseURI);
    var menuItems = [
      ['Services', 'services/'],
      ['Products', 'products/'],
      ['Business', 'business/'],
      ['Entrepreneurship', 'entrepreneurship/'],
      ['Impact', 'impact/'],
      ['About', 'about/'],
      ['Resources', 'resources/'],
      ['Contact', 'contact/']
    ];
    var existingHrefs = Array.from(navigation.querySelectorAll('a')).map(function (link) { return new URL(link.href).pathname; });
    var callToAction = navigation.querySelector('.nav-cta');
    menuItems.forEach(function (item) {
      var itemUrl = new URL(item[1], homeUrl);
      if (!existingHrefs.includes(itemUrl.pathname)) {
        var link = document.createElement('a');
        link.href = itemUrl.href;
        link.textContent = item[0];
        navigation.insertBefore(link, callToAction);
      }
    });

    toggle.addEventListener('click', function () {
      var isOpen = navigation.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.querySelector('b').textContent = isOpen ? 'Close' : 'Menu';
    });

    navigation.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navigation.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('b').textContent = 'Menu';
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
        navigation.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('b').textContent = 'Menu';
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (navigation.classList.contains('is-open') && !navigation.contains(event.target) && !toggle.contains(event.target)) {
        navigation.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('b').textContent = 'Menu';
      }
    });
  }

  document.querySelectorAll('[data-request-form]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var status = form.querySelector('.form-status');
      var submit = form.querySelector('button[type="submit"]');
      var apiUrl = window.FRECLEAN_API_URL;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (!apiUrl) {
        status.textContent = 'Online submission is not available yet. Please email freclean7@gmail.com to confirm your request.';
        return;
      }
      submit.disabled = true;
      status.textContent = 'Sending your request...';
      try {
        var response = await fetch(apiUrl.replace(/\/$/, '') + '/requests', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        if (!response.ok) throw new Error('Request failed');
        form.reset();
        status.textContent = 'Thank you. FreClean will be in touch soon.';
      } catch (error) {
        status.textContent = 'We could not send your request. Please email freclean7@gmail.com.';
      } finally { submit.disabled = false; }
    });
  });
}());
