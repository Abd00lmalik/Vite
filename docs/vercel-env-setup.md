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

NEXT_PUBLIC_XION_RPC_URL=https://rpc.xion-testnet-2.burnt.com:443
NEXT_PUBLIC_XION_REST_URL=https://api.xion-testnet-2.burnt.com
NEXT_PUBLIC_XION_CHAIN_ID=xion-testnet-2
NEXT_PUBLIC_XION_GAS_PRICE=0.001uxion
NEXT_PUBLIC_XION_AUTH_APP_URL=https://auth.testnet.burnt.com
NEXT_PUBLIC_USE_REAL_XION=true

# Verified deployed contracts - confirmed on XION Testnet-2
NEXT_PUBLIC_XION_VACCINATION_RECORD=xion1nwvuazzwesxssneed5xsgjxycqnadyknc6svq4kzeluhzwqnn2sspznurv
NEXT_PUBLIC_XION_MILESTONE_CHECKER=xion10fwl9vh9esdut8wl37d8p053hxw62thjg65xk26ejm0unpc767rs0qa0ff
NEXT_PUBLIC_XION_ISSUER_REGISTRY=xion1e7chzwjakmf67g2pytcrkefxehxm26xp2w4v4vj5paeaw9v2zdlsesjqc6
NEXT_PUBLIC_XION_GRANT_ESCROW=xion134x0ffm8xukyr2fqe8qwandw6gmv5makn53ja3yvaqrhhhhl7jdqmnhyj7

# Optional - set only if using treasury-based Abstraxion signing
NEXT_PUBLIC_XION_TREASURY_ADDRESS=
```

## Step 3 - Redeploy

1. Go to Vercel -> Deployments
2. Click the three-dot menu on the latest deployment
3. Select "Redeploy" -> check "Use latest commit" -> uncheck "Use build cache"
4. Wait for deployment to complete

## Step 4 - Verify after redeploy

1. Open `https://your-app.vercel.app/health-worker`
2. Connect your funded XION wallet
3. The sync panel must show no "contract not found" or "configuration incomplete" warnings
4. Click "Sync to XION"
5. The sync flow must now pass the contract validation preflight
6. If sync still fails, the error must now be a downstream contract execution issue
   (authorization, message format, etc.) - not a missing contract address
