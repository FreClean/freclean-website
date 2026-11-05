# Testing

Run:

```sh
npm test
node --test scripts/request-workflow.test.js
sh scripts/validate-site.sh
node --check script.js
```

These checks cover the contact API, browser request workflow, static links/metadata, and JavaScript syntax. They do not prove live Resend delivery, database behavior, authentication, payment verification, inventory, admin workflows, mobile rendering, or external provider availability.