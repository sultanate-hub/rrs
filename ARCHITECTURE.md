# RRS Anti-Social Vices Management System — Architecture

Status: design for Commander demo → pilot → production
Source: `RRS_Anti-Social_Vices_Management_System_Proposal-1.docx`
Prepared: 2026-10-26

---

## 1. What we are building

A secure case, suspect, evidence, and reporting system for RRS.

**V1 (demo + pilot):**
- Officer accounts, roles, units, activation.
- Case registration, assignment, status.
- Suspect/person records, photos, links to cases.
- Arrest records.
- Victims, complainants, witnesses (separate).
- Evidence upload + SHA-256 hash + chain of custody.
- Statements (text + scanned file).
- Court charges, hearings, outcomes.
- Wanted persons derived from warrants/court status.
- Search, dashboard, monthly returns, audit log.

**Deferred:**
- Fingerprint matching, face recognition.
- Inter-state sharing.
- Full crime mapping (store lat/long now; map later).
- Native Android app (PWA first).
- SMS/WhatsApp notifications.

---

## 2. Supabase verdict

| Need | Supabase | Caveat |
|---|---|---|
| Postgres database | Yes | Use RLS on every table |
| Auth (accounts, JWT) | Yes | MFA/TOTP, admin-created users |
| Row-level security | Yes | Must be tested; misconfiguration is the #1 risk |
| File storage | Yes | Private bucket, signed URLs, RLS policies |
| Audit triggers | Yes | Append-only + revoke update/delete |
| Full-text/trigram search | Yes | `tsvector`, `pg_trgm` |
| Realtime | Yes | Optional for dashboard |
| Edge Functions | Yes | Admin tasks, reports, signed upload, scan |
| Backups | Yes | Pro plan daily; PITR is an add-on |
| Offline sync | Partial | PWA + IndexedDB queue; robust offline needs PowerSync/ElectricSQL or native SQLite |
| Data residency | **Depends** | Supabase Cloud has no Nigeria region; real police data may require self-hosted/approved hosting |
| WORM audit | No native WORM | Append-only + hash chain + export to immutable storage |
| Virus scanning | Add-on | Edge Function + ClamAV or storage scanner |
| SMS/WhatsApp | External | Use a provider |

**Rule:** demo project uses **fake data only**. Real data goes to the production environment approved by ICT/Legal.

---

## 3. High-level architecture

```text
┌──────────────────────────────────────────────────────────────┐
│  Android phone (PWA / installable)     Desktop browser       │
│  - camera capture                      - commander dashboard │
│  - offline drafts (IndexedDB)          - reports/export      │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / TLS 1.3
┌──────────────────────────────▼───────────────────────────────┐
│  Next.js app (App Router, TypeScript, Tailwind)              │
│  - UI + server actions                                       │
│  - admin user management (service role, server only)         │
│  - report generation (PDF/CSV)                               │
│  - signed upload URLs                                        │
└───────────────┬──────────────────────────────┬───────────────┘
                │                              │
┌───────────────▼──────────────┐  ┌────────────▼───────────────┐
│  Supabase                    │  │  External services         │
│  - Auth (JWT, MFA)           │  │  - Sentry (errors)         │
│  - Postgres + RLS            │  │  - Uptime/status           │
│  - Storage (private)         │  │  - email/SMS later         │
│  - Edge Functions            │  │  - backup target           │
│  - Realtime (optional)       │  └────────────────────────────┘
└───────────────┬──────────────┘
                │
┌───────────────▼──────────────┐
│  Backups / audit export      │
│  - daily encrypted backup    │
│  - restore test quarterly    │
│  - audit hash-chain export   │
└──────────────────────────────┘
```

**Demo:** Supabase Cloud (fake data) + Vercel/Netlify.
**Production:** self-hosted Supabase or approved cloud in Nigeria, or a local Postgres/MinIO/Keycloak stack. The app is portable because it uses standard Postgres + S3-compatible storage.

---

## 4. Data model (V1)

Use UUID primary keys, `created_at`, `updated_at`, `created_by`, `updated_by` on every table. Soft-delete only where legally allowed; audit everything.

### Core

- `units` — id, name, parent_id, active.
- `profiles` — id (= auth.users.id), force_number unique, full_name, rank, unit_id, role, phone, active, mfa_required.
- `offences` — id, code, name, category, law_reference, active.
- `cases` — id, case_number unique, reported_at, offence_id, location_text, lat, lng, status, priority, sensitive, sealed, narrative, assigned_officer_id, unit_id, created_by, closed_at.
- `case_notes` — id, case_id, author_id, note, created_at (case timeline).

### People

Use one `persons` table and link with roles; a person can be a suspect in one case and a witness in another.

- `persons` — id, full_name, alias, gender, dob/age, address, phone, nin, photo_path, notes.
- `case_persons` — id, case_id, person_id, role (`suspect`, `victim`, `complainant`, `witness`), vulnerability, statement_summary, created_at. Unique (case_id, person_id, role).
- `arrests` — id, case_id, person_id (suspect), arrested_at, location, arresting_officer_id, charges_text, custody_status, notes.

### Evidence

- `evidence` — id, case_id, evidence_number, type, description, file_path, file_hash_sha256, mime_type, size_bytes, collected_by, collected_at, collection_location, seal_number, created_by.
- `evidence_custody` — id, evidence_id, action (`collected`, `transferred`, `returned`, `disposed`), from_person, to_person, at, notes, hash_at_action.
- `statements` — id, case_id, person_id, type (`suspect`, `witness`, `victim`, `complainant`), taken_by, taken_at, text, file_path, file_hash_sha256.

### Court

- `courts` — id, name, location.
- `charges` — id, case_id, offence_id, description, law_reference.
- `court_cases` — id, case_id, court_id, court_case_number, status, next_hearing_at.
- `hearings` — id, court_case_id, hearing_at, purpose, outcome, next_hearing_at, notes.
- `warrants` — id, person_id, case_id, type, issued_by, issued_at, status (`active`, `executed`, `cancelled`), notes.

`wanted_persons` is a **view** over active warrants, not a manual list.

### Governance

- `audit_log` — id, actor_id, actor_force_number, action, table_name, record_id, before_json, after_json, ip, user_agent, device_id, at, prev_hash, hash. Append-only.
- `settings` — key, value, updated_by, updated_at.
- `attachments` — optional generic case documents (id, case_id, file_path, hash, uploaded_by).
- `import_batches` — for data migration (id, source, row_count, status, errors).

### Indexes

- `cases(case_number)` unique, `cases(status)`, `cases(unit_id)`, `cases(assigned_officer_id)`, `cases(reported_at)`.
- `persons(phone)`, `persons(nin)`, `persons(full_name gin_trgm_ops)`.
- `case_persons(case_id)`, `case_persons(person_id)`.
- `evidence(case_id)`, `court_cases(case_id)`, `hearings(court_case_id)`.
- Full-text search on case narrative and person notes.

---

## 5. Roles and RLS

| Role | Cases | Persons | Evidence | Audit | Admin |
|---|---|---|---|---|---|
| Officer / IPO | assigned cases only | linked to assigned cases | linked cases | no | no |
| Supervisor | unit cases | unit-linked | unit cases | no | no |
| Commander | all cases | all | all | read | no |
| Auditor | read all | read all | read metadata only | read | no |
| Admin / ICT | no case edit | no case edit | no case edit | read | users, units, settings |
| System | triggers/functions | triggers/functions | triggers/functions | insert only | service role |

Rules:
- `auth.uid()` maps to `profiles.id`.
- Access functions: `can_access_case(case_id)`, `is_commander()`, `is_auditor()`, `is_admin()` — `security definer`, stable.
- `cases` SELECT policy: assigned officer OR same unit supervisor OR commander OR auditor.
- `sealed`/`sensitive` cases: extra policy; auditor sees metadata only unless approved.
- Evidence download: signed URL only after `can_access_case`; every download logged.
- `audit_log`: no UPDATE/DELETE for any role; INSERT only via trigger/security definer.
- Admin cannot read case narratives by default (separation of duties).
- Require `aal2` (MFA) for admin/supervisor actions and evidence export.

**Test every policy** with pgTAP or SQL tests before the pilot. A single missing `USING` clause is a data breach.

---

## 6. Evidence flow

1. Officer opens case → “Add evidence”.
2. Browser computes SHA-256 of the file (Web Crypto).
3. App requests a signed upload URL (server action checks case access).
4. File uploads directly to private storage.
5. Edge Function verifies size/hash, scans for malware, writes `evidence` + `evidence_custody` row.
6. Evidence list shows hash, collector, time, custody chain.
7. Download: server checks access → logs `evidence.download` → returns a 60-second signed URL.
8. No public bucket, no permanent URLs, no client-side delete.

For court: the hash + custody chain + audit log is the integrity story. Legal must confirm the certificate/admissibility format.

---

## 7. Audit flow

- DB triggers on `cases`, `persons`, `case_persons`, `arrests`, `evidence`, `evidence_custody`, `statements`, `charges`, `court_cases`, `hearings`, `warrants`, `profiles`.
- Capture actor, action, table, record, before/after JSON, time, IP/user-agent (from API request headers where available), device id.
- Hash chain: `hash = sha256(prev_hash + canonical_json(row))`; periodic export.
- Views/downloads/exports logged by API/Edge Function, not only DB changes.
- Retention: legal schedule; no deletion by application users.
- Auditor dashboard: filter by actor, case, table, date; export CSV/PDF.

---

## 8. Offline design (demo/pilot)

- PWA installable on Android; app shell cached.
- `IndexedDB` stores **drafts only** (new case, person note, evidence metadata). Not full case history.
- Each draft has a client-generated UUID and idempotency key.
- On reconnect, queue syncs; server deduplicates by client UUID; conflicts are surfaced, never silently overwritten.
- Evidence files can be queued up to a configurable size; large files wait for Wi-Fi.
- Local storage is protected by device lock; for production with full offline records, move to **Capacitor + SQLCipher** or a sync engine (PowerSync/ElectricSQL).
- Honest limit: browser IndexedDB is not encrypted at rest by the app. Do not store full sensitive records offline in V1.

---

## 9. Security baseline

- TLS only; HSTS.
- Passwords: Argon2id/bcrypt via Supabase Auth; no reversible encryption.
- MFA/TOTP for admin, supervisor, commander; enforce `aal2` in policies for sensitive actions.
- Unique accounts; no shared logins; account disable on transfer/loss.
- Least privilege; admin cannot edit cases.
- Session timeout; device/session list; revoke sessions.
- Encryption at rest (hosting) and in transit.
- Private storage; signed URLs; download audit.
- Rate limiting; input validation; parameterized queries (Supabase client).
- File type/size allowlist; malware scan.
- Dependency scanning; SAST; pen test before pilot.
- Backups encrypted; restore tested.
- Incident response and breach notification (NDPA).
- No production data in demo; no real PII in logs.
- MDM/remote wipe for force-owned devices; device encryption; screen lock.
- Export controls: watermark/limit bulk export; approval for sensitive cases.

---

## 10. Legal / data protection

- Nigeria Data Protection Act 2023: lawful basis, DPIA, DPO, retention, data-subject rights, breach notification, cross-border transfer, processor agreement.
- Police Act/Regulations, ACJA, Evidence Act, Cybercrimes Act — Legal Unit to confirm.
- Biometrics: **do not collect in V1**; special-category data needs DPIA, legal basis, secure templates, retention.
- Victims/witnesses/juveniles: restricted access, redaction, sealed cases.
- Data sharing/inter-state: MOU + legal basis + audit before any sharing.
- Retention/disposal schedule; legal hold.
- DPA with Supabase/hosting provider; data residency decision.
- Court admissibility: hash, chain of custody, audit, certificate.

---

## 11. Deployment

### Demo
- Separate Supabase project `rrs-demo`, fake data only.
- Next.js on Vercel/Netlify or local.
- Demo accounts for IPO, Supervisor, Commander, Auditor.
- Seed script; nightly reset.
- Share URL; no real PII.

### Pilot/production
- Approved hosting: self-hosted Supabase (Docker: Postgres, GoTrue, PostgREST, Storage, Realtime, Edge Functions) or approved cloud.
- Separate staging and production.
- Backups: daily + PITR if available; offsite encrypted.
- Monitoring: Sentry, uptime, DB metrics, audit alerts.
- CI: lint, typecheck, tests, migrations.
- Migrations via Supabase CLI; no manual prod edits.
- Runbooks: restore, incident, account compromise, evidence integrity.

### Production decision needed
1. Must data stay in Nigeria? If yes → self-host/on-prem/approved local cloud.
2. If cloud is allowed → Supabase Cloud region + DPA + legal sign-off.
3. Who operates it (ICT vs vendor)? SLA and support.

---

## 12. Demo script for the Commander (10 minutes)

1. **Login as IPO** → dashboard shows “My cases”.
2. **Register a case** → auto case number, offence, location, complainant, narrative.
3. **Add suspect** → photo from phone camera, alias, phone; link to case.
4. **Record arrest** → date, location, officer, charges.
5. **Upload evidence** → photo/PDF; show SHA-256 hash + custody entry.
6. **Add witness statement** → text + scanned file.
7. **Add court hearing** → date, outcome, next date.
8. **Search** by suspect name/phone → find the case.
9. **Switch to Supervisor** → see unit cases, approve/assign.
10. **Switch to Commander** → totals, open/closed, arrests, wanted, monthly stats.
11. **Open Audit** → show who viewed/edited/exported.
12. **Offline demo** → disable network, create a draft, reconnect, sync.
13. **Role restriction** → officer cannot see another unit’s case.

Seed data: 12 cases, 8 offences, 20 persons, 6 officers, 3 units, 5 evidence items, 4 court hearings, audit entries.

---

## 13. Build phases

| Phase | Deliverable | Time |
|---|---|---|
| 0 | Real forms, case numbering, offence list, roles, hosting decision | 2–3 days |
| 1 | Schema + RLS + auth + seed; working demo (fake data) | 7–10 days |
| 2 | Evidence hash/custody, audit, search, dashboard, reports | 7–10 days |
| 3 | Pilot hardening: offline drafts, backups, staging, tests, training | 7–10 days |
| 4 | Pilot with one unit (10–20 officers, 50–100 cases) | 4 weeks |
| 5 | Fixes, pen test, DPIA, rollout | 4–8 weeks |

A demo is days; a pilot is weeks; production is months. Do not promise “perfect” in one sprint.

---

## 14. What is needed from RRS

1. Current paper forms: occurrence book/case register, statement, exhibit log, court diary, monthly return.
2. Case numbering format.
3. Offence list with legal references.
4. Rank/role/unit structure and who sees what.
5. Hosting constraint (Nigeria-only? approved cloud? on-prem?).
6. Pilot unit, officers, devices, connectivity.
7. Legal/DPO contact and data protection requirements.
8. Decision on biometrics/inter-state deferral.

---

## 15. Non-negotiables

- No real data in the demo project.
- No shared accounts.
- No public evidence links.
- No silent edits; corrections by reversal/audit.
- No biometrics in V1.
- No case data visible to admin by default.
- No production launch before RLS tests, backup restore test, and legal sign-off.
