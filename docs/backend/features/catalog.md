# Catalog feature

## Files and implementation

`catalog.module.ts` registers CatalogController. `catalog.controller.ts` exposes public GET /api/catalog. listProducts() returns { items } containing three fixed examples: Premium Hoodie (prod_1001, HD-1001, 89), Running Sneakers (prod_1002, SN-1002, 129), and Travel Backpack (prod_1003, BP-1003, 149).

There is no product table, entity, DTO, service, repository query, pagination, inventory check, currency field, search, or mutation endpoint. Numeric prices are illustrative; no monetary precision policy has been implemented.

## Design status

The controller is a demonstration contract so the shell can be developed before commerce persistence. The admin product cards and shop catalog independently hard-code similar values; neither fetches this endpoint. Their apparent agreement is not data synchronization.

Future implementation needs product ownership, schema, currency and decimal handling, availability, query DTOs, authorization for mutations, and frontend API integration. Document these as new behavior rather than presenting this stub as a completed catalog.
