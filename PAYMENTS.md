# Payments

Online card checkout is disabled. Cash and direct card arrangements remain business-confirmed options. CeloHT is a separate public handoff at `https://app.celoht.com/`; this repository does not initiate, verify, or confirm a CeloHT transaction.

A future payment integration must use server-side initiation, provider-signed webhooks or an equivalent authorized verification path, idempotency, and explicit pending/failed/refunded states. Browser-submitted transaction hashes must never mark an order paid.