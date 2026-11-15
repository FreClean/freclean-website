# Payments

FreClean's approved payment options are:

- USDT on BNB Smart Chain (BEP20)
- USDT on TRON (TRC20)
- USDT on Solana
- USDT on Celo
- CeloHT DApp as a separate payment option

The website's booking and contact forms collect enquiries, not payments. A
payment must be initiated through an authorized Core API flow linked to a
confirmed order or booking. Do not send funds or submit a transaction hash based
on this information page. The payment interface must display the amount,
network, receiving address, and network warning returned by Core; receiving
addresses must not be duplicated in website code.

The Core API is responsible for independently verifying the selected network,
official USDT token identifier, recipient, amount, transaction success,
confirmations/finality, and transaction uniqueness. A customer-submitted hash
never confirms payment by itself. CeloHT remains separate from USDT; a DApp
handoff does not confirm settlement.

The current website does not provide authenticated checkout, order creation,
payment submission, or payment status. Do not claim that a payment is
operational until the website-to-Core checkout, production RPC configuration,
token identifiers, and payment notifications have been verified.
