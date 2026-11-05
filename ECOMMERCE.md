# Ecommerce

The public product pages are a static catalogue and enquiry surface. Product data is not supplied by an inventory API, and the repository has no cart, checkout, order, stock reservation, delivery, invoice, or refund implementation.

Do not add client-authoritative prices or inventory. A production store requires database-backed products and variants, server-calculated totals, stock reservations, delivery zones, payment verification, order states, receipts, and admin controls.