# Payments

FreClean's approved payment options are:

- USDT on BNB Smart Chain (BEP20)
- USDT on TRON (TRC20)
- USDT on Solana
- USDT on Celo
- CeloHT DApp as a separate payment option

The payment page loads the receiving addresses from the public Core endpoint
`GET https://api.freclean.com/api/payments/options`; wallet addresses are
centralized in Core and are not duplicated in website code. Transfers are
manual: FreClean confirms the quote and amount directly, and customers share
their transaction reference through the contact form.

The Core API is responsible for independently verifying the selected network,
official USDT token identifier, recipient, amount, transaction success,
confirmations/finality, and transaction uniqueness. A customer-submitted hash
never confirms payment by itself. Manual transfers are not automatically
associated with an order or marked paid. CeloHT remains separate from USDT; a
DApp handoff does not confirm settlement.

The current website does not provide authenticated checkout, order creation,
payment submission, or payment status. Automated USDT verification remains
disabled until production RPC configuration, authoritative token identifiers,
wallet ownership, and payment notifications have been verified.
