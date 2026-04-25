# Vercel Environment Variable Setup

## Required for XION Sync

Add the following in Vercel -> Project Settings -> Environment Variables.
Set them for the Production environment (and Preview if needed).

| Variable | Value | Notes |
|---|---|---|
| NEXT_PUBLIC_XION_RPC_URL | https://rpc.xion-testnet-2.burnt.com:443 | XION Testnet-2 RPC |
| NEXT_PUBLIC_XION_REST_URL | https://api.xion-testnet-2.burnt.com | XION Testnet-2 REST |
| NEXT_PUBLIC_XION_CHAIN_ID | xion-testnet-2 | Chain identifier |
| NEXT_PUBLIC_XION_ISSUER_REGISTRY | [your contract address] | Deploy contracts first |
| NEXT_PUBLIC_XION_VACCINATION_RECORD | [your contract address] | Deploy contracts first |
| NEXT_PUBLIC_XION_MILESTONE_CHECKER | [your contract address] | Deploy contracts first |
| NEXT_PUBLIC_XION_GRANT_ESCROW | [your contract address] | Deploy contracts first |

## Important Notes

- After adding or changing any environment variable in Vercel, you must trigger a redeployment.
  Variables are baked into the build - changing them in the dashboard does not hot-reload.
- Variables are NOT automatically inherited from `.env.local`. They must be set explicitly in Vercel.
- The app works offline (patient registration, vaccination recording) without these variables.
  Only XION sync is disabled when they are absent.

## After Setting Variables

1. Go to Vercel -> Deployments -> Redeploy (do not use cached build if vars changed).
2. Open the health worker dashboard.
3. The "XION sync is not configured" warning must no longer appear.
4. The sync button must be enabled.
5. Connect your XION wallet and test a sync against Testnet-2.
