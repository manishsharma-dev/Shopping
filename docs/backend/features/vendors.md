# Vendors feature

## Files and controller

`vendors.module.ts` registers VendorsController. `vendors.controller.ts` applies AuthGuard followed by AdminGuard at class level.

GET /api/vendors invokes listVendors() and returns { data } with Northwind Labs (ven_1, active) and Blue River Goods (ven_2, pending). The response is static. Unauthorized callers receive 401; authenticated roles other than admin/superadmin receive 403.

There is no vendor table, DTO, service, repository, onboarding/approval endpoint, or relationship between a user and vendor. The role names vendor and vendor_admin exist in account typing but are not sufficient to access this endpoint.

## Why and limitations

Guarding the demonstration administration endpoint establishes the intended access boundary before persistence is added. It does not implement tenant isolation or vendor self-service. Admin VendorsPage displays its own fixed examples without calling this route.

A future vendor implementation must specify ownership, role scope, lifecycle statuses, validation, and whether platform administrators and vendor users receive different views.
