# Ecommerce

The public product pages are a static catalogue with a client-side cart and manual order-request flow. Customers can combine products, review estimated USD totals, choose an available payment method, and open a prefilled email draft to FreClean. Price ranges remain estimates; FreClean confirms the final amount and availability.

The cart does not create an order, reserve inventory, take payment, or verify a transfer. Product data is not supplied by an inventory API. A production store requires database-backed products and variants, server-calculated totals, stock reservations, delivery zones, payment verification, order states, receipts, and admin controls.