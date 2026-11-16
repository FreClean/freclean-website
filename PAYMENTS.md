# Payments

FreClean's approved payment policy has three categories:

1. **USDT** only on a network that is independently verified and specifically
   confirmed by FreClean for a transaction. The website has no public USDT
   checkout or receiving-address display. `payments/payment-addresses.json`
   remains explicitly disabled and contains no networks or addresses. No
   network is available for public self-service payment until Core production
   configuration, token identifiers, recipient ownership, and verification
   have been confirmed.
2. **CeloHT route** as an independent external ecosystem. CeloHT is not owned
   or operated by FreClean. A link to its DApp is an external handoff only;
   redirect, customer-provided transaction references, and frontend messages
   do not verify settlement or confirm an order.
3. **Cash** exclusively in person at FreClean-authorized physical points of
   sale. The website does not list a verified point-of-sale location, and cash
   is not an online or remote payment option.

The website's `/book/` form submits a service enquiry only. It does not collect
a payment method, create a confirmed booking, process checkout, or change
payment status. Product enquiries likewise are not confirmed orders. FreClean
confirms scope, availability, pricing, and approved payment instructions
directly.

The Core repository contains code-level USDT adapters, but that does not make
any network production-enabled or publicly available. See the Core
[`docs/payments.md`](https://github.com/FreClean/FreClean/blob/main/docs/payments.md)
for adapter-level details and production blockers. No transaction or
production configuration was changed as part of this audit.
