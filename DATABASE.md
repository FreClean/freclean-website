# Database

No database is implemented in this repository. The contact API currently has no persistence layer and must not claim that enquiries are stored or retrievable.

The required next layer is a versioned relational schema owned by the Core API, with migrations for users, roles, customers, addresses, products, inventory, services, bookings, orders, payments, invoices, notifications, business clients, affiliates, support tickets, and audit logs. Production migration and backup evidence must come from the Core/database owner.