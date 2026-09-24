# Users feature

## Files and data model

`users.module.ts` registers TypeOrmModule.forFeature([User]) and UsersController. User is defined in auth/auth.entities.ts and maps to [users](../database.md). There is no separate users DTO or service.

## Controller

UsersController injects Repository&lt;User&gt;. Class-level UseGuards(AuthGuard, AdminGuard) protects GET /api/users.

listUsers() calls repository.find with createdAt descending and take:100, maps each result through publicUser, and returns { data }. This produces id, name, email, and role without passwordHash or createdAt.

This is a real database query, but there is no offset/cursor, total count, filtering, search, or deterministic secondary ordering when creation timestamps tie. More than 100 accounts will not all appear in one response. There are no create/update/delete/role-management endpoints.

## Design and frontend relationship

Using the auth entity and public projection avoids a second definition of account identity and prevents accidental password exposure. Direct repository use keeps a single read operation small; a users service becomes useful once reusable business rules exist.

The admin UsersPage currently shows fixed counts and does not call this endpoint. Do not treat those counts as database totals. Backend role checks are authoritative even when a user tampers with frontend state.

## Verification

Authentication integration tests expect 401 without a session, 403 for a customer, and 200 after assigning admin in the isolated schema. Changes to ordering, projection, pagination, or roles require corresponding contract and frontend documentation.
