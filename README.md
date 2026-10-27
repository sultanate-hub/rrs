# RRS Anti-Social Vices Management System — Demo

A working, clickable **web/PWA demo** of the RRS case, suspect, evidence and court system. Built to show the Commander how the system works before we connect real data.

> **Demo only.** All names, cases, phone numbers and evidence are synthetic. Do not enter real police data into this build.

## Run it

```powershell
cd C:\Users\ASUGIR\Desktop\Bumsa\rrs-asv
npm install
npm run dev
```

Open **http://localhost:3000**.

Production build check:

```powershell
npm run build
npm start
```

The production build registers the service worker for installable PWA use. `npm run dev` does not register it, to avoid stale caches during development.

## Demo credentials

The login screen does **not** show officer names. Sign in with a force number and password:

| Force No. | Password | Role | Officer |
|---|---|---|---|
| `51234` | `RRS-51234` | Investigating Officer | PC Abdullahi Mohammed |
| `44120` | `RRS-44120` | Investigating Officer | Insp. Musa Bello |
| `39871` | `RRS-39871` | Unit Supervisor | Sgt. Ngozi Okafor |
| `21007` | `RRS-21007` | Commander | CSP Adewale Johnson |
| `30218` | `RRS-30218` | Auditor | DSP Halima Sani |
| `90001` | `RRS-90001` | ICT Administrator | Insp. ICT Administrator |

These are **demo-only** credentials. Production uses Supabase Auth, individual accounts, hashed passwords and MFA — no shared accounts.

## What is working

- Force-number + password login; no officer names before authentication.
- Role-based case visibility.
- Command dashboard with counts, offence mix, priority queue.
- Case register with search and filters.
- New case registration with auto case number.
- Person linking (suspect, victim, complainant, witness).
- **Suspect photograph** (camera or file, compressed), **NIN**, **fingerprint record** (status, scanner reference, captured by/at, device).
- **Gender inclusive** options; **nationality country dropdown**; **state of origin + LGA** for Nigerians; **state/province + city** for foreign nationals; **tribe/ethnic group**, **occupation** (free text), **religion** (optional), **preferred language + interpreter needed**.
- Arrest records with custody status and arresting officer.
- Evidence upload with **SHA-256 fingerprint** and custody chain.
- Arrest/charge/court hearing views.
- Global search across cases and persons.
- Case audit trail and global audit trail.
- CSV export.
- Simulated offline mode: new case saved as a pending draft, then synced.
- Responsive PWA layout for desktop, tablet and phone.
- Append-only-style audit entries for views, edits, evidence and exports.

## What is mocked (and must change for production)

- **Auth:** demo force-number/password; no MFA. Production uses Supabase Auth.
- **Storage:** file metadata + SHA-256 only; the file bytes are not uploaded. Production uses private object storage with signed URLs.
- **Fingerprint:** record/reference only; no live scanner or matching. Production needs a compatible scanner + biometric SDK + DPIA.
- **Database:** browser `localStorage`; no Supabase/Postgres yet.
- **Audit:** local entries; production uses an append-only table with a hash chain.
- **Offline:** simulated with a toggle; production uses a real sync queue.
- **PDF reports:** CSV only for now.
- **Biometrics, inter-state sharing, crime mapping:** deliberately out of V1.

## Demo script for the Commander (10 minutes)

1. Sign in with force number **`51234`** and password **`RRS-51234`** (Investigating Officer).
2. Show the dashboard: only his 6 cases; active/closed/arrests/evidence.
3. Open a case → show narrative, persons, evidence hash, court tab, audit tab.
4. **New case** → register a case; show automatic case number.
5. **Link person** → add a suspect with **photo, NIN, state/LGA, nationality, occupation, fingerprint record**.
6. **Upload evidence** → choose/capture a file; show SHA-256 and custody chain.
7. **Add hearing** → court, date, outcome; case status becomes Court.
8. **Search** by name/phone/case number.
9. Sign out → sign in with **`21007`** / **`RRS-21007`** (Commander) → all cases, command dashboard, audit trail.
10. Sign in with **`30218`** / **`RRS-30218`** (Auditor) → read-only; no New case button.
11. Toggle **Simulate offline** → create a draft → **Sync now**.
12. Show the phone layout (responsive) if needed.

## Install on a phone (PWA)

PWA installation requires **HTTPS**. `http://localhost:3000` is secure only on the PC itself; a phone on the LAN using `http://<PC-IP>:3000` can browse but will **not** install.

Options:

1. **HTTPS tunnel (quick):** run the production build, then expose it with a trusted HTTPS tunnel (Cloudflare Tunnel, ngrok, or a deployment link). Open that HTTPS URL on the phone.
2. **GitHub Pages (demo):** push to `sultanate-hub/rrs`; the workflow deploys the static build to **https://rrs.dreamhatcher.ink/**. See `DEPLOYMENT.md`.
3. **Production:** deploy to approved hosting (not GitHub Pages) and open the HTTPS URL.

Then:

- **Android Chrome:** menu → **Install app** / **Add to Home screen**.
- **iPhone Safari:** Share → **Add to Home Screen**.

The production build registers the service worker; `npm run dev` does not. Do not install the demo on a phone that will hold real police data — only the synthetic demo.

## Supabase next step

Supabase can carry the pilot. We need to:

1. Create a Supabase project (demo project = fake data only).
2. Apply the schema (next deliverable: `supabase/migrations/0001_init.sql`).
3. Turn on RLS and test every role policy.
4. Create Auth users for the demo roles; add MFA for supervisors/commander/admin.
5. Create a private storage bucket for evidence; signed upload/download.
6. Replace the local store with Supabase queries (keeping the same UI).
7. Add audit triggers and evidence hash verification.
8. Deploy the PWA (Vercel/Netlify or approved hosting).
9. For real data: decide Nigeria-only hosting vs approved cloud; DPIA/DPO sign-off; backups; pen test.

**Supabase Cloud is fine for the demo. Real police data needs a data-residency/legal decision before we use it.**

## Project structure

```
app/                 Next.js app router, layout, manifest, CSS
components/          Login, shell, dashboard, cases, persons, audit, admin
lib/types.ts         Domain types
lib/seed.ts          Synthetic demo cases/persons/evidence
lib/store.tsx        Demo state, audit, offline simulation
lib/demo-auth.ts     Demo force-number credentials
lib/nigeria-lgas.json  37 states/FCT + 774 LGAs
lib/countries.json   ISO country list
ARCHITECTURE.md      System architecture, data model, security, production path
scripts/             Playwright smoke/flow tests
screenshots/         Demo screenshots
```

## Tests already run

```powershell
node scripts/smoke.mjs       # login, dashboard, case, evidence modal, audit
node scripts/flow.mjs        # create case, person, evidence hash, hearing, offline sync, search, role isolation
node scripts/arrests.mjs     # arrest tab and record arrest
node scripts/person-fields.mjs  # state/LGA and foreign-national fields
node scripts/mobile.mjs      # mobile login/dashboard/nav
node scripts/mobile-cases.mjs
```

No console errors or page errors in the last run.

## Security / legal notes

- Do not put real data in the demo.
- Production must enforce MFA, least privilege, audit, encrypted storage and backups.
- Evidence integrity needs server-verified SHA-256 + custody + audit; legal must confirm court admissibility.
- Biometrics are **not** in V1.
- NDPA 2023 / DPIA / DPO / retention / breach response are required before real data.
