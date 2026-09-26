# Vendors feature

VendorsModule imports ManagementModule. VendorsController uses AuthGuard and delegates GET /api/vendors to ManagementService.snapshot, returning `{data: snapshot.vendors}`. This replaces the previous static sample response with persisted, scope-filtered records. Platform/regional administrators and vendor administrators receive their permitted vendors; staff without vendor-administration visibility receive an empty list. Customers and unassigned/inactive vendor accounts are denied.

The complete vendor model, contact/address fields, application DTO, manual creation, pending/active/rejected/blocked lifecycle, approval promotion transaction, regional permissions and audit history are owned by [management](management.md). Records are stored in management_records with kind vendor; vendorId equals the row ID. New customer applications are disabled for now; admin /vendors handles every business review. Agents can submit businesses within their assigned district. A manually created vendor needs a separately created vendor_admin account.

There is no document upload, identity verification service, banking/payout configuration, notification email, or editable vendor profile screen. Selected state/district names must exist in the reference tables and agree with administrator assignments. Blocking a vendor denies management access to its team and removes its products from the public catalog. It preserves orders and other business history.

All new vendors, including admin-created ones, start pending. Commerce requires an active vendor with approvedAt. Older active businesses without an approval record appear pending for review. See [onboarding](user-types.md).
