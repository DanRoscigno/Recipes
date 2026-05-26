# Recipes

Live site: [https://danroscigno.github.io/Recipes/](https://danroscigno.github.io/Recipes/)

---

## Deploying the recipe app to Vercel

The Next.js app lives in the `app/` directory. It stores recipes as markdown files in `recipes/` and uses the GitHub API to save edits.

### 1. Get a GitHub Personal Access Token (PAT)

The app commits recipe edits back to this repo, so it needs write access.

1. Go to **github.com/settings/tokens** → **Generate new token (classic)**
2. Give it a name (e.g. `recipes-app`)
3. Check the **`repo`** scope (full control of private repositories)
4. Click **Generate token** and copy the value — you won't see it again

### 2. Get a Resend API key

Resend sends the OTP login codes. The free tier (3,000 emails/month) is more than enough.

1. Sign up at **resend.com**
2. Go to **API Keys** → **Create API key**
3. Copy the key (starts with `re_`)
4. Under **Domains**, add and verify a **subdomain** — e.g. `recipes.roscigno.com` — and add the DNS records Resend provides. Wait for Resend to confirm the domain is verified.
5. Set `RESEND_FROM` to an address on that subdomain with a real-sounding local part — e.g. `auth@recipes.roscigno.com`

**Two gotchas discovered during setup:**
- Using the root domain (`roscigno.com`) without a subdomain does not work reliably.
- The `noreply` local part does not work. Use something like `auth`, `hello`, or `recipes` instead.

### 3. Generate secrets for auth

Run this command twice to generate two independent random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

One value becomes `OTP_SECRET`, the other becomes `SESSION_SECRET`.

### 4. Connect the repo to Vercel

1. Go to **vercel.com** → **Add New Project**
2. Import the **DanRoscigno/Recipes** GitHub repository
3. Under **Root Directory**, set it to **`app`**
4. Leave the build command and output directory at their defaults (Next.js auto-detected)
5. Click **Deploy** — the first deploy will fail because env vars aren't set yet; that's fine

### 5. Set environment variables in Vercel

In the Vercel project, go to **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `GITHUB_TOKEN` | PAT from step 1 |
| `GITHUB_OWNER` | `DanRoscigno` |
| `GITHUB_REPO` | `Recipes` |
| `GITHUB_RECIPES_PATH` | `recipes` |
| `OTP_SECRET` | First random secret from step 3 |
| `SESSION_SECRET` | Second random secret from step 3 |
| `RESEND_API_KEY` | API key from step 2 |
| `RESEND_FROM` | `noreply@roscigno.com` (or your verified domain) |
| `ALLOWED_EMAIL_DOMAINS` | `roscigno.com` (comma-separate to add more) |

After adding the variables, trigger a new deploy: **Deployments → Redeploy**.

### 6. Adding more allowed email domains

Edit the `ALLOWED_EMAIL_DOMAINS` environment variable in Vercel and add domains separated by commas:

```
roscigno.com,otherdomain.com
```

Redeploy after saving.

### How editing works

When you save a recipe in the app, it commits the change directly to the `main` branch of this repo via the GitHub API. Vercel detects the push and automatically redeploys — the updated recipe appears on the live site within a few minutes.
