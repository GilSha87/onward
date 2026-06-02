# Onward — Deployment Runbook

This runbook covers the **four features** added in this sprint and the exact
steps **you** need to run to make them live. The code is already written, builds
clean, and degrades gracefully in demo mode — but the database-backed features
(MRR storage, file uploads, plan approval) only become fully functional once you
run the steps below in your own Supabase project and on Vercel.

> **What "demo mode" means:** if `VITE_SUPABASE_URL` is not set, the app runs on
> sample data and write actions (saving a plan, uploading a file) are disabled
> with a friendly notice. Nothing crashes. Once you set the env vars and run the
> migrations, the same UI starts talking to your real database.

## What shipped

| # | Feature | DB needed? | Storage bucket? |
|---|---------|-----------|-----------------|
| 1 | i18n (EN / HE / NL / ES + language switcher) | No (localStorage) | No |
| 2 | MRR / ARR per client (ARR = MRR × 12) | Migration `001` | No |
| 3 | Per-account file uploads | Migration `002` | **Yes** (`account-files`) |
| 4 | AM plan editing + client approval via `/plan/:token` | Migration `003` | No |

Migration `004` (persist AM language to a `team` table) is **optional** and safe
to skip — language already persists in the browser.

---

## Step 1 — Set Vercel environment variables

In the Vercel dashboard → your **onward** project → **Settings → Environment
Variables**, add (for Production, Preview, and Development):

```
VITE_SUPABASE_URL       = https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY  = <your project anon/public key>
```

Both values come from Supabase → **Project Settings → API**. Use the **anon
public** key, never the `service_role` key (the anon key is the only one safe to
expose in a browser bundle).

For local development, create a `.env` file in the project root with the same two
lines (see `.env.example`). `.env` is git-ignored.

---

## Step 2 — Run the database migrations

Open Supabase → **SQL Editor** and run these files **in order**, one at a time.
Each is idempotent (safe to re-run) thanks to `IF NOT EXISTS` / duplicate-object
guards.

1. `supabase/migrations/001_add_mrr_to_clients.sql`
   Adds `mrr_amount` + `mrr_currency` to `clients`. (Feature 2)

2. `supabase/migrations/002_create_account_files.sql`
   Creates the `account_files` table + uploader-scoped RLS. (Feature 3)
   *Note: this only creates the metadata table — the Storage bucket is Step 3.*

3. `supabase/migrations/003_create_plan_share_tokens.sql`
   Adds `plan_status` / approval fields to `clients`, and creates the
   `plan_milestones` and `plan_share_tokens` tables with RLS, including the
   **anonymous** read/approve policies the public `/plan/:token` page relies on.
   (Feature 4)

4. *(Optional)* `supabase/migrations/004_add_i18n_language_to_team.sql`
   Adds `preferred_language` to a `team` table **if one exists**; otherwise it
   prints a notice and does nothing. Skip unless you want server-side language.

**Verify** each ran: each file ends with commented `SELECT … LIMIT 5;` lines you
can run to confirm the new columns/tables exist.

---

## Step 3 — Create the Storage bucket (Feature 3 only)

File uploads need a private bucket. In Supabase → **Storage → New bucket**:

- **Name:** `account-files`
- **Public:** **OFF** (files are served via short-lived signed URLs)
- **File size limit:** `26214400` (25 MB)
- **Allowed MIME types:**
  ```
  application/pdf,
  application/vnd.openxmlformats-officedocument.wordprocessingml.document,
  application/vnd.openxmlformats-officedocument.presentationml.presentation,
  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
  image/png,
  image/jpeg
  ```

Then add the **Storage RLS policies** (uploader-scoped by folder prefix). The SQL
is in the comment block at the bottom of `002_create_account_files.sql` — copy
the three `CREATE POLICY … ON storage.objects` statements into the SQL Editor and
run them:

```sql
CREATE POLICY "account_files_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'account-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "account_files_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'account-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "account_files_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'account-files' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## Step 4 — Translations (Feature 1)

The four locale files live in `src/locales/{en,he,nl,es}/translation.json`.
English is complete. The other three currently contain `[TRANSLATE: …]`
placeholders so the app never shows a missing key.

Check completeness any time with:

```bash
npm run check:i18n
```

This reports any keys missing from a locale and counts remaining placeholders.
To finish localization, replace each `[TRANSLATE: …]` value in `he`, `nl`, and
`es` with the real translation, then re-run the check until it reports 0
placeholders. The app is fully usable in English meanwhile.

> Hebrew (`he`) is right-to-left. The language switcher sets `dir="rtl"` on the
> document when Hebrew is selected.

---

## Step 5 — Verify the public approval route on Vercel

Feature 4 serves a login-free page at `/plan/:token`. Two pieces make this work
on Vercel and both are already committed in `vercel.json`:

- **SPA rewrite** — `"/((?!api/).*)" → "/index.html"` so deep links like
  `/plan/abc123` load the app instead of 404ing.
- **`X-Robots-Tag: noindex`** on `/plan/(.*)` so share links stay out of search
  engines.

No action needed beyond keeping `vercel.json` as-is; just confirm a deployed
`/plan/<token>` URL loads after you create a token from the **Share with client**
button.

---

## Step 6 — Deploy

This project auto-deploys to Vercel from the `main` branch. Once Steps 1–3 are
done:

1. Commit and push the new code to `main` (or merge your PR).
2. Vercel builds with `npm run build` and publishes `dist/`.
3. Smoke-test in production:
   - Set an MRR on a client → ARR shows as MRR × 12 in the Tracker header and the
     Dashboard portfolio card. *(Feature 2)*
   - Open a client → **Files** tab → upload a PDF → it appears and opens via a
     signed link. *(Feature 3)*
   - Open a client plan → **Edit milestones**, save → **Share with client** →
     open the link in a private window → approve → status flips to *Approved* back
     in the AM view. *(Feature 4)*
   - Switch languages from the top bar; reload — the choice persists. *(Feature 1)*

Local sanity check before pushing:

```bash
npm run build        # must succeed
npm run check:i18n   # locale coverage report
```

---

## Rollback / safety notes

- All migrations are additive (new columns/tables) and idempotent. They do not
  drop or rewrite existing `clients`/`steps` data.
- RLS keeps every AM scoped to their own rows. The only anonymous access granted
  is: read a **live, non-revoked, non-expired** share token + its one referenced
  client, and approve it **once**. Revoking a token (in the Share modal) or
  letting it pass its 30-day expiry immediately cuts off public access.
- If you ever need to take the public route offline, remove the `/plan/(.*)`
  handling — but the cleanest kill-switch is to revoke share tokens.

---

## ACTION REQUIRED — rotate your GitHub token

In an earlier session a **GitHub Personal Access Token** was pasted into the
chat. Treat it as compromised: go to **GitHub → Settings → Developer settings →
Personal access tokens** and **revoke/delete that token now**, then generate a
fresh one if you still need it. Do this regardless of anything else in this
runbook.
