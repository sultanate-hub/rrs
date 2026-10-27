# Deploying the RRS demo to GitHub Pages

Target repository: `sultanate-hub/rrs`  
Target URL: `https://rrs.dreamhatcher.ink/`

## One-time GitHub setup

1. Open **Settings → Pages** in `sultanate-hub/rrs`.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Under **Custom domain**, enter `rrs.dreamhatcher.ink` and save.
4. Wait for the DNS check to pass, then tick **Enforce HTTPS**.

The DNS record is already correct:

```
rrs.dreamhatcher.ink  CNAME  sultanate-hub.github.io
```

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` runs:

```text
npm ci
npm run build:static
upload .next-static
deploy to GitHub Pages
```

The static export is written to `.next-static/` (configured in `next.config.mjs`).
It includes `CNAME` and `.nojekyll` copied from `public/`.

## Local check

```powershell
npm ci
npm run build:static
npx serve .next-static
```

## Security boundary

This is a **synthetic-data demo** on a public static host. HTTPS protects traffic, but it is **not** access control:

- GitHub Pages is public and has no server-side authorization.
- Demo login is client-side; credentials are in the JavaScript bundle.
- Do not put real suspects, NINs, fingerprints, evidence or case data on GitHub Pages.
- Production requires approved hosting, Supabase Auth + RLS, MFA, private object storage, audit, backups, NDPA/DPIA and a penetration test.
