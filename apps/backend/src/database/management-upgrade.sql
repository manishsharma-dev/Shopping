-- Run once against a backed-up database before deploying the management API.
-- Development can instead use DB_SYNCHRONIZE=true. Never enable it in production.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "userType" varchar(100) NOT NULL DEFAULT 'Customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "userTypeId" uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS district varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "vendorId" uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
UPDATE users SET "userType" = replace(role, '_', ' ') WHERE "userType" = 'Customer' AND role <> 'customer';
CREATE TABLE IF NOT EXISTS management_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind varchar NOT NULL,
  name varchar(150) NOT NULL, status varchar NOT NULL DEFAULT 'active',
  state varchar, district varchar, "vendorId" uuid, "createdBy" uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}', version integer NOT NULL DEFAULT 1,
  "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS management_kind_vendor ON management_records (kind, "vendorId");
CREATE INDEX IF NOT EXISTS management_kind_region ON management_records (kind, state, district);
COMMIT;
-- Rollback: deploy the prior application while preserving these additive columns/table.
-- Dropping management_records or user scope columns would lose business data.
