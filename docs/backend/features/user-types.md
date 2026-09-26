# User Types, hierarchy and onboarding

## Current rules

Administrative authority descends through Super Admin (70), Admin (60), State Admin (50), District Admin (40), Agent (30), Vendor (20), and Staff (10). Customer is outside this administration hierarchy and can only be created through shopping-app registration. Vendor is stored as vendor_admin; legacy vendor is interpreted at the same level. Numeric ranks are internal policy constants, not editable form values.

A user needs the team permission and a selected active userTypeId to create a user. The server derives role and label from the selected type; request role text cannot grant authority. Target rank must be strictly lower, permissions must be a subset of the creator's effective permissions, and region/vendor scope cannot expand. Peers, superiors and customers cannot be created through administration. Changing an existing subordinate's type requires the same hierarchy level and valid scope; promotion and scope-transfer workflows are intentionally not provided.

## Default and custom types

ManagementService.onModuleInit inserts missing default records with stable UUIDs in management_records under the existing transaction lock. It does not create user accounts, reset passwords, replace existing type records or recreate soft-deleted defaults. Defaults are Super Admin, Admin, State Admin, District Admin, Agent, Vendor and Staff. Super Admin and Admin are protected by their stable IDs, and their names are reserved. Neither can be deleted or recreated as a custom type. Other default/custom types can be deleted by a scoped superior with types permission if no users are assigned. Inactive users also count as assigned. Legacy users without userTypeId count against their fallback default, so deletion cannot silently strand them.

Custom types choose an existing lower hierarchy level and a subset of allowed permissions. Levels cannot be invented or reordered through the UI. Platform types may be shared, regional types inherit the creator's geography, and vendor-local types inherit a validated vendor. Vendor-specific types cannot define regional authority. Names must be unique among active types within the same scope. Existing legacy custom types without data.role are interpreted as Staff.

Type definitions remain immutable. To change permissions, create a replacement type, reassign subordinate users at that same level, then delete the unused old type. Deletion is version-checked, requires a reason, sets status deleted, preserves history and appends an audit record. There is no destructive database delete or automatic user reassignment.

## Permission and menu contract

Permissions are products, categories, orders_accept, orders_manage, team, reports, types, vendors and vendors_approve. Role ceilings prevent assigning vendor approval to Agents or vendor teams. Default regional administrators have all listed capabilities; Vendor has commerce/team/types/reporting capabilities; Agent has vendors only; Staff initially has products only. Custom regional types can omit Vendors access. Protected platform defaults retain their full permissions.

GET /manage/access returns effective permissions, hierarchy and vendorStatus. Each protected frontend navigation loads this endpoint. AccessService stores permissions for the current identity only, derives the sidebar menu, and clears permissions before refresh/failure. It never trusts localStorage. Direct denied routes redirect to dashboard; dashboard is the common landing page, including pending vendors. APIs independently enforce permissions and scope even if a caller manually constructs a request. Existing page snapshots refresh the menu too. Permission changes take effect on the next API request/navigation/refresh, not by push notification.

| Menu | Required permission |
| --- | --- |
| Dashboard | Authenticated administration identity; reports permission controls metrics |
| Users | team |
| User types | types |
| Vendors | vendors OR vendors_approve |
| Products | products |
| Categories & fields | categories |
| Orders | orders_accept OR orders_manage |

POST /manage/type creates a lower type from data.name, data.role, data.permissions and optional vendorId. POST /manage/type/:id deletes with data.status=deleted, data.reason and expected version. Attempts to delete defaults return 403; assigned-type deletion returns 409. GET /manage now includes hierarchy, typeLevels with allowed permissions, assignableTypes, and minimal vendorOptions for forms. Vendor records and contact data require vendors or vendors_approve permission; vendorOptions only expose ID/name/status for permitted team/commerce configuration.

## Mandatory geography

GET /manage/geography reads public.states and public.districts, which are already imported separately from TypeORM. It returns states [{id,name}] and districts [{id,name,state}]. If the reference tables are missing it returns empty lists. The UI shows an unavailable-data message; creation requiring geography then fails rather than accepting arbitrary text.

State Admin requires a selected existing state. District Admin and Agent require both a state and a district belonging to that state. State changes reset the district choice. The service validates the pair and the creator's scope. Stored scope remains canonical name strings rather than new foreign-key columns. Vendor businesses also require valid state/district selections. Vendor/staff accounts inherit the selected business's geography rather than trusting form text. Type-specific regional restrictions are validated again during assignment.

## Vendor and agent workflow

1. A district administrator creates an Agent by selecting its lower User Type and assigned district. Higher administrators can also create agents inside their allowed scope.
2. An Agent with vendors permission submits a business via POST /manage/vendor, providing name, selected state/district, contact email, phone and address. Admin-created businesses use the same route and also start pending. Agents can view vendors in their district, but cannot approve or reject them, manage products or create users with their default permissions.
3. A scoped State/District Admin (or platform administrator) with vendors_approve approves/rejects through the versioned vendor action. Approval records approvedAt and approvedBy. Creation never auto-approves, even for Super Admin. A regional approver may explicitly approve a record they created; two-person review is not currently required.
4. An administrator creates the Vendor login through Users, selecting the Vendor type and a pending or approved business. This is separate from creating the business record. Pending vendor accounts may sign in to the dashboard, but have no business permissions until approval. Blocked/rejected/unassigned businesses do not receive management access.

All commerce writes and public catalog visibility require an active vendor with recorded approval. Older active vendors without approvedAt appear as pending in the administration snapshot and must be explicitly approved; the underlying old status is preserved until that review. No business data is deleted. Existing active/blocked status transitions and audits remain supported. Historical pending customer applications can still be reviewed, but new POST /manage/apply requests return 403 and the shopping account no longer renders the application form. Public vendor and Agent registration are deferred to a future feature. Shopping registration continues to create customers only.

## Files, storage and compatibility

management.types.ts owns levels, ceilings and stable default definitions; management.policy.ts owns regional/vendor scope; management.service.ts owns seeding, capabilities, geography validation, type selection, creation/deletion and approval. Controller DTO remains {data:object, version?:positiveInteger}; business-specific validation is in the service. Auth UserRole and both frontend SessionUser unions include Agent. No new table/column is added for this revision; the existing management schema upgrade is still required for a pre-management database.

Default creation requires write access to the existing records table at startup. Its createdBy value is the stable Super Admin type ID as a system initializer marker, not a newly created person. These columns are logical identifiers with no FK, as previously documented. The seed is idempotent; it does not widen legacy custom type permissions. Existing users without a type ID resolve their default by role. There is no hardcoded administrator password or extra login account.

Backend integration tests use isolated schemas and mocked geographic fixtures for deterministic region validation. They cover lower-only creation, mandatory state/district matching, permission-restricted regional types, protected/assigned type deletion, Agent submission without approval, pending vendor access, and existing stock/security workflows. Frontend tests cover dynamic menus, denied direct links and required Material geography controls. They do not certify imported geographic data or a full browser accessibility audit.
