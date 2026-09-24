# States and districts

## Ownership and schema

The geographic data is database-only. There are no Nest entities, DTOs, services, controllers, or frontend selectors for it. [Database documentation](../database.md) lists every column and constraint.

states has a serial ID, unique name, and State/Union Territory classification. districts has a serial ID, state foreign key, district name, and uniqueness on state_id/name. Deleting a state cascades to its districts. Existing local data was imported from the user's SQL; geographic accuracy and currency were not independently audited.

## district-import.sql, step by step

1. Enable psql ON_ERROR_STOP and begin a transaction.
2. Create temporary district_import with a unique state_name/name pair; drop it on commit.
3. Load the source district pairs.
4. Display unmatched states, then raise an exception if any are unmatched.
5. Join exact state names to public.states.id.
6. Insert district pairs with ON CONFLICT(state_id,name) DO NOTHING; report inserted count.
7. Assert every staged pair exists in public.districts before commit.
8. Commit and report total districts, represented states, and orphan count.

This avoids recreating existing tables or reinserting states, tolerates reruns of existing non-null state/name pairs, and prevents a partial import if state matching or verification fails. It does not rename, remove, or reconcile existing geographic entries.

## Running it

Use a trusted local PostgreSQL connection with write access:

```sh
psql -h localhost -p 5433 -U postgres -d shopping_db -X -f district-import.sql
```

Supply credentials through your local PostgreSQL credential mechanism rather than committing them. The script assumes the tables and matching states already exist; it is not a complete database bootstrap. A brand-new database needs a separately reviewed schema and state seed first.

The checked-in import currently represents the 787-pair dataset used locally. Counts can change with future source revisions and should not be hard-coded into application validation. Verify COUNT(*) and foreign-key consistency after an import. A database client displaying 100 rows usually reflects a display limit, not a failed insert.
