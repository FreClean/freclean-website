(function () {
  var productList = document.querySelector('[data-product-list="Accessories"]');
  var template = document.getElementById('product-card-template');
  if (!productList || !template) return;

  fetch('../products.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Product catalog request failed: ' + response.status);
      return response.json();
    })
    .then(function (catalog) {
      var products = catalog.products.filter(function (product) {
        return product.category === 'Accessories';
      });
      if (products.length) {
        document.getElementById('accessories-heading').textContent = products[0].category;
        productList.parentElement.removeAttribute('hidden');
      }

      products.forEach(function (product) {
        var card = template.content.firstElementChild.cloneNode(true);
        var image = card.querySelector('img');
        var size = product.availableSizes.join(', ');
        var fields = {
          availability: product.status,
          category: product.category,
          name: product.name,
          description: product.description,
          size: size,
          price: product.price.display,
          brand: product.brand,
          type: product.type
        };

        image.src = '../' + product.image;
        image.alt = product.imageAlt;
        Object.keys(fields).forEach(function (field) {
          card.querySelector('[data-product-field="' + field + '"]').textContent = fields[field];
        });

        var form = card.querySelector('form');
        form.querySelector('[name="product"]').value = product.id;
        form.querySelector('[name="product_name"]').value = product.name;
        form.querySelector('[name="product_size"]').value = size;
        form.querySelector('button').setAttribute('aria-label', 'Request to order ' + product.name);
        productList.appendChild(card);
      });
    })
    .catch(function (error) {
      console.error('Unable to load the FreClean product catalog.', error);
    });
})();
