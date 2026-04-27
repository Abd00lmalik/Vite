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

## Why Variables Set in Vercel Are Not Appearing in the App

NEXT_PUBLIC_* variables in Next.js are statically replaced in the JavaScript bundle
at build time — they are NOT read at runtime. This means:

- Adding a variable in Vercel does NOT update the running app automatically.
- The variable only takes effect in the next build that runs AFTER it was added.
- If Vercel serves a cached build, the new variable will not appear even after adding it.

## Exact Redeploy Procedure (follow every step)

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Confirm each required variable is set and the value is not blank:
   - NEXT_PUBLIC_XION_RPC_URL
   - NEXT_PUBLIC_XION_REST_URL
   - NEXT_PUBLIC_XION_CHAIN_ID
   - NEXT_PUBLIC_XION_VACCINATION_RECORD
   - NEXT_PUBLIC_XION_MILESTONE_CHECKER
3. Confirm the scope is set to "Production" (and "Preview" if you test on preview URLs)
4. Go to Vercel → Your Project → Deployments
5. Click the three-dot menu on the latest deployment
6. Select "Redeploy"
7. In the redeploy dialog: UNCHECK "Use build cache" — this is mandatory
8. Click "Redeploy" and wait for the build to complete
9. In the Vercel build log, find the "XION Environment Verification" section
   - It will show ✓ or ✗ MISSING for each required variable
   - If any show ✗ MISSING, the variable was not available to the build
   - This means the variable scope is wrong or the value is blank in Vercel
10. After deployment completes, open: https://your-app.vercel.app/xion-build-diagnostic.json
    - Confirm all required vars show "SET"
    - If any show "MISSING", repeat from step 2
11. Open the app → /health-worker
    - The XION Config Diagnostic panel must show all required vars as ✓
    - The build time must be AFTER you added the variables in Vercel

## If Variables Show ✗ MISSING in the Build Log

The variable existed in Vercel settings but the build did not receive it. Check:
- Is the variable scoped to Production? Preview? Both?
- Is the value blank or whitespace-only in Vercel?
- Is there a .env.production file in the repo that overrides the value with blank?
- Is the app deployed from the correct Vercel project (not a fork or duplicate)?

## After Deployment — Clear Browser Cache

If the app still shows old config after a successful redeploy:
1. Open browser DevTools → Application → Service Workers → Unregister all
2. Open DevTools → Application → Storage → Clear site data
3. Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
