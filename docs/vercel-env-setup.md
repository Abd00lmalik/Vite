# Vercel Environment Variables - XION Testnet-2

Go to: Vercel Dashboard -> Your Project -> Settings -> Environment Variables

## Step 1 - Delete these stale variables if they exist

- Any variable whose value is the stale invalid VaccinationRecord contract address from your failed deployment logs
- Any variable whose value starts with `REQUIRED_INPUT_` or is a placeholder

## Step 2 - Add or replace with these exact values

```env
# Copy this block into Vercel -> Project Settings -> Environment Variables
# Apply to: Production (and Preview if needed)
# After saving, redeploy with cleared cache

# REQUIRED — sync will not function without these
NEXT_PUBLIC_XION_RPC_URL=https://rpc.xion-testnet-2.burnt.com:443
NEXT_PUBLIC_XION_REST_URL=https://api.xion-testnet-2.burnt.com
NEXT_PUBLIC_XION_CHAIN_ID=xion-testnet-2

# Verified deployed contracts - confirmed on XION Testnet-2
NEXT_PUBLIC_XION_VACCINATION_RECORD=xion1nwvuazzwesxssneed5xsgjxycqnadyknc6svq4kzeluhzwqnn2sspznurv
NEXT_PUBLIC_XION_MILESTONE_CHECKER=xion10fwl9vh9esdut8wl37d8p053hxw62thjg65xk26ejm0unpc767rs0qa0ff

# OPTIONAL — app works without these but they enable additional features
NEXT_PUBLIC_XION_ISSUER_REGISTRY=xion1e7chzwjakmf67g2pytcrkefxehxm26xp2w4v4vj5paeaw9v2zdlsesjqc6
NEXT_PUBLIC_XION_GRANT_ESCROW=xion134x0ffm8xukyr2fqe8qwandw6gmv5makn53ja3yvaqrhhhhl7jdqmnhyj7
NEXT_PUBLIC_XION_GAS_PRICE=0.001uxion
NEXT_PUBLIC_XION_AUTH_APP_URL=https://auth.testnet.burnt.com
NEXT_PUBLIC_USE_REAL_XION=true
NEXT_PUBLIC_SHOW_XION_DEBUG=true

# | NEXT_PUBLIC_XION_TREASURY_ADDRESS | OPTIONAL | Leave blank unless using grant-based Abstraxion signing. Health worker sync does not require this. Donor grant release flows may require it in a future phase. |
```

## Troubleshooting: "XION configuration is incomplete" after setting all variables

If this warning appears after setting all variables and redeploying:

1. Check the XION Config Diagnostic panel — it shows which exact required variable is missing.
2. Confirm the diagnostic panel shows all five required variables as ✓.
3. If all five show ✓ but the warning still appears, clear browser site data and reload.
4. If the warning disappears after clearing site data, a service worker was serving a stale bundle.

The following variables will NOT cause this warning if missing — they are optional:
- NEXT_PUBLIC_XION_TREASURY_ADDRESS
- NEXT_PUBLIC_XION_ISSUER_REGISTRY
- NEXT_PUBLIC_XION_GRANT_ESCROW
- NEXT_PUBLIC_XION_GAS_PRICE
- NEXT_PUBLIC_XION_AUTH_APP_URL

## Step 3 - Redeploy

1. Go to Vercel -> Deployments
2. Click the three-dot menu on the latest deployment
3. Select "Redeploy" -> uncheck "Use build cache"
4. Wait for deployment to complete

## Step 4 - Verify after redeploy

1. Open `https://your-app.vercel.app/health-worker`
2. Look at the **XION Config Diagnostic** panel (appears if `NEXT_PUBLIC_SHOW_XION_DEBUG=true`)
3. Confirm **Build time** is current
4. Confirm all **Required variables** show a green checkmark (✓)
5. If any show a red X (✗), verify the name and value in Vercel settings and redeploy again

---

## Clearing Stale Client State

If sync fails with a contract address that does **not** match your current Vercel environment
variables (i.e. you can see the correct address in the XION Config Diagnostic panel but the error
shows a different address), a **service worker is serving a stale JavaScript bundle** from the
browser cache.

`NEXT_PUBLIC_*` variables are baked into JS chunks at build time. If a user loaded the app
before your Vercel redeploy, their browser's service worker may be serving the old bundle with
the old (wrong) contract address even after Vercel has the new build live.

### How to clear the stale bundle (user action)

**Option A — DevTools (recommended for debugging):**
1. Open browser DevTools → Application → Service Workers
2. Click **Unregister** next to the app's service worker
3. Open Application → Storage → click **Clear site data**
4. Hard-reload the page (`Ctrl+Shift+R` / `Cmd+Shift+R`)
5. The browser will fetch the latest bundle from Vercel

**Option B — DevTools (quick):**
1. DevTools → Application → Storage
2. Check all boxes → click **Clear site data**
3. Reload

### Why this happens

The app uses a PWA service worker (`next-pwa`) which precaches JS chunks. As of the latest updates,
JS bundles are fetched using **NetworkFirst** strategy (timeout: 3 s) instead of
StaleWhileRevalidate. This means after your next Vercel deploy, all users will automatically
receive the new bundle on their first load after the deploy.

Existing users who opened the app *before* the NetworkFirst patch was deployed may still see the old
StaleWhileRevalidate behaviour. A one-time cache clear (Option A/B above) will fix them.

### How to identify a stale bundle

On the `/health-worker` page with `NEXT_PUBLIC_SHOW_XION_DEBUG=true`:

- Check the **XION Config Diagnostic** panel — shows the contract addresses baked into this build
- If **Build time** in the diagnostic panel shows a date before your latest Vercel deployment, the
  service worker is serving a stale bundle — clear site data and reload
