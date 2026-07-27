-- =============================================================================
-- ACTI-TECH OPERATIONS PORTAL — BASELINE SCHEMA SNAPSHOT
-- Generated 2026-07-23 via direct live query against project genocndtsqocsnhqflcl
-- (information_schema.columns + pg_policies), NOT reconstructed from code or
-- from MASTER_BUILD_SPEC.md. This is what is ACTUALLY live right now.
--
-- PURPOSE: this file is a snapshot for version control / disaster recovery,
-- not a script meant to be re-run against the current database (the tables
-- already exist). If rebuilding from scratch in a new environment, this is
-- your starting point.
--
-- Commit this to the repo under supabase/migrations/ so the live schema is
-- finally visible in version control — this was flagged as a real gap
-- (Codex code review) and confirmed true.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — TABLES CONFIRMED LIVE AND MATCHING MASTER_BUILD_SPEC.md
-- Safe to build against, no known drift.
-- =============================================================================

create table if not exists profiles (
  id uuid primary key,
  full_name text not null,
  role text not null,
  department_id uuid references departments(id),
  title text,
  created_at timestamptz default now(),
  email text,
  avatar_url text,
  phone text
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists req_items (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid references requisitions(id),
  item_name text not null,
  quantity integer not null default 1,
  remarks text,
  availability text default 'pending',
  source text,
  supplied boolean default false,
  outsourcing_reason text,
  outsourcing_vendor text,
  outsourcing_cost numeric,
  outsourcing_notes text,
  payment_reference text
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid references requisitions(id),
  approver_id uuid references profiles(id),
  stage text not null,
  action text not null,
  comment text,
  created_at timestamptz default now(),
  signature_name text,
  signature_image text,
  stamp_image text,
  action_title text
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid not null references requisitions(id),
  author_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text,
  body text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  project_name text,       -- NOTE: not client_name, see v5 changelog in spec
  location text,
  status text,
  priority text,
  created_by uuid references profiles(id),
  assigned_by uuid references profiles(id),
  created_at timestamptz default now(),
  start_date date,
  due_date date,
  completed_at timestamptz,
  completed_by uuid references profiles(id),
  signature_url text,
  client_name text,        -- added later, coexists with project_name
  project_type text,
  lead_engineer uuid references profiles(id),
  hod_id uuid references profiles(id),
  requisition_id uuid references requisitions(id),
  updated_at timestamptz default now()
);

create table if not exists job_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id),
  engineer_id uuid references profiles(id),
  accepted boolean default false,
  completed boolean default false,
  created_at timestamptz default now(),
  role text,
  assigned_at timestamptz default now()
);

create table if not exists job_updates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id),
  author_id uuid references profiles(id),
  update_type text not null,
  content text,
  created_at timestamptz default now()
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid references requisitions(id),
  job_id uuid references jobs(id),
  report_id uuid references reports(id),
  form_submission_id uuid references form_submissions(id),
  uploaded_by uuid references profiles(id),
  file_url text not null,
  file_name text,
  file_type text,
  created_at timestamptz default now()
  -- NOTE: category column planned (spec) but NOT yet live — see Section 3
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid references requisitions(id),
  job_id uuid references jobs(id),
  created_at timestamptz default now()
  -- NOTE: title column planned (spec) but NOT yet live — see Section 3
);

create table if not exists conversation_members (
  conversation_id uuid references conversations(id),
  user_id uuid references profiles(id),
  joined_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id),
  department_id uuid references departments(id),
  content text not null,
  created_at timestamptz default now(),
  conversation_id uuid references conversations(id),
  edited_at timestamptz
);

create table if not exists message_reads (
  message_id uuid references messages(id),
  user_id uuid references profiles(id),
  read_at timestamptz default now()
);

create table if not exists maintenance_schedule (
  id uuid primary key default gen_random_uuid(),
  client text,
  location text,           -- NOTE: not "site" as originally specced
  frequency text,
  next_date date,
  assigned_engineer uuid references profiles(id),
  status text
);

create table if not exists requisitions (
  id uuid primary key default gen_random_uuid(),
  req_number text,
  requester_id uuid references profiles(id),
  department_id uuid references departments(id),
  purpose text,
  purpose_type text default 'Project/Job',
  priority text default 'Normal',
  status text default 'draft',
  location text,
  invoice_no text,
  supervisor text,
  comments text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  returned_reason text,
  job_id uuid references jobs(id),
  job_reference text,
  completed_at timestamptz
  -- workflow_stage and current_holder also exist live — see Section 2, DO NOT USE
);


-- =============================================================================
-- SECTION 2 — CONFIRMED LIVE BUT ⚠️ DRIFTED FROM SPEC ⚠️
-- These exist in the database right now. Origin unknown — not applied by any
-- SQL in this conversation's history. Flagged 2026-07-23. DO NOT write app
-- code against the items marked "DO NOT USE" without a deliberate decision
-- first — `status` remains the single source of truth for requisitions.
-- =============================================================================

-- requisitions.workflow_stage (text) — DO NOT USE. Duplicate of `status`.
-- requisitions.current_holder (uuid) — DO NOT USE. Duplicate of `status`.

-- reports table exists with a DIFFERENT column set than MASTER_BUILD_SPEC.md
-- specified (has `body`, not `content`; missing `approved_at`, `reviewed_by`,
-- `created_at` entirely):
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id),
  author_id uuid references profiles(id),
  report_type text,
  title text,
  body text,               -- NOTE: spec says "content" — reconcile before Pass 3
  status text default 'draft',
  submitted_at timestamptz
);

-- form_templates matches spec correctly:
create table if not exists form_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  category text,
  json_schema jsonb,
  version integer default 1,
  active boolean default true,
  created_at timestamptz default now()
);

-- form_submissions does NOT match spec. Live columns are form_id/payload
-- (matches a REJECTED earlier draft), not template_id/form_data as specced:
create table if not exists form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid,             -- NOTE: spec says "template_id"
  submitted_by uuid references profiles(id),
  job_id uuid references jobs(id),
  payload jsonb,             -- NOTE: spec says "form_data"
  status text,
  created_at timestamptz default now()
);

-- A standalone "forms" table also exists — this was the SINGLE-TABLE design
-- explicitly rejected in favor of form_templates + form_submissions.
-- DO NOT build against this table. Coexists, unused, alongside the above.
create table if not exists forms (
  id uuid primary key default gen_random_uuid(),
  title text,
  slug text,
  json_schema jsonb,
  created_at timestamptz default now()
);


-- =============================================================================
-- SECTION 3 — SPECCED BUT NOT YET LIVE
-- These were designed in MASTER_BUILD_SPEC.md and a migration file
-- (migration-audit.sql) was written for some of them, but confirmed via
-- direct query NOT applied to the live database as of 2026-07-23.
-- Do not assume these exist until re-verified.
-- =============================================================================

-- job_milestones — table does not exist yet
-- floor_plans — table does not exist yet
-- attachments.category — column does not exist yet
-- reports.content/approved_at/reviewed_by/created_at — do not exist (see Section 2's actual reports schema)
-- conversations.title — column does not exist yet
-- maintenance_schedule.site/equipment/next_due/created_at — do not exist (table has client/location/frequency/next_date/assigned_engineer/status only)


-- =============================================================================
-- SECTION 4 — ROW LEVEL SECURITY (live as of 2026-07-23)
-- =============================================================================

-- Baseline "must be logged in" policy, present on every table below:
-- approvals, attachments, comments, conversation_members, conversations,
-- departments, form_submissions, form_templates, job_assignments,
-- job_updates, jobs, maintenance_schedule, message_reads, messages,
-- profiles, req_items, requisitions
--
-- create policy "authenticated_only" on <table>
--   for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- departments has an ADDITIONAL public-read policy (fixes the signup
-- dropdown bug — anonymous users need to read departments before login):
-- create policy "public_read_departments" on departments
--   for select using (true);

-- notifications has its own finer-grained policies (pre-existing, not
-- from tonight's work) instead of the blanket baseline:
-- create policy "notifications_insert" on notifications for insert with check (true);
-- create policy "notifications_user_read" on notifications for select using (auth.uid() = user_id);
-- create policy "notifications_user_update" on notifications for update using (auth.uid() = user_id);

-- requests (legacy, unused table) also has its own pre-existing policies,
-- irrelevant since nothing live reads/writes this table.

-- ⚠️ NOT FOUND in pg_policies at all: job_milestones, floor_plans (tables
-- don't exist yet, see Section 3), and notably `forms` (exists but has NO
-- RLS policy at all — if this table is ever used, it is currently wide open).
