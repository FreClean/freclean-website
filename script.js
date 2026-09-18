(function () {
  document.querySelectorAll('.brand:not(:has(img))').forEach(function (brand) {
    const image = document.createElement('img');
    image.src = brand.closest('header') ? brand.getAttribute('href').replace(/index\.html$/, '') + 'assets/brand-logo.jpg' : 'assets/brand-logo.jpg';
    image.alt = 'FreClean';
    image.width = 72;
    image.height = 72;
    brand.replaceChildren(image);
    brand.classList.add('logo-link');
  });

  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#primary-nav');

  if (!toggle || !navigation) return;

  toggle.addEventListener('click', function () {
    const isOpen = navigation.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? 'Close' : 'Menu';
  });

  document.querySelectorAll('[data-request-form]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const status = form.querySelector('.form-status');
      const submit = form.querySelector('button[type="submit"]');
      const apiUrl = window.FRECLEAN_API_URL;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (!apiUrl) {
        status.textContent = 'Online submission is not available yet. Please contact freclean7@gmail.com to confirm your request.';
        return;
      }

      submit.disabled = true;
      status.textContent = 'Sending your request...';
      try {
        const response = await fetch(apiUrl.replace(/\/$/, '') + '/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        if (!response.ok) throw new Error('Request failed');
        form.reset();
        status.textContent = 'Thank you. FreClean will be in touch soon.';
      } catch (error) {
        status.textContent = 'We could not send your request. Please email freclean7@gmail.com.';
      } finally {
        submit.disabled = false;
      }
    });
  });
})();
