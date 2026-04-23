# VITE — Vite MVP Deployment Guide

## Prerequisites

| Tool      | Version  | Install |
|-----------|----------|---------|
| Node.js   | 18+      | [nodejs.org](https://nodejs.org) |
| Docker    | Latest   | [docker.com](https://docker.com) (for contract compilation) |
| Go        | 1.21+    | [go.dev](https://go.dev) (for xiond) |
| xiond     | Latest   | `go install github.com/burnt-labs/xion/cmd/xiond@latest` |
| Expo CLI  | Latest   | `npm install -g expo-cli` (mobile only) |

---

## Step 1 — Deploy Smart Contracts

### 1a. Add a deployer wallet
```bash
xiond keys add deployer --keyring-backend test
# Save the mnemonic shown — you will need it
xiond keys show deployer --keyring-backend test
# Copy the xion1... address
```

### 1b. Fund the wallet
Visit [https://faucet.xion.burnt.com](https://faucet.xion.burnt.com) and paste your `xion1...` address.
You need at least **10 XION** (10,000,000 uxion) to cover uploads + instantiations.

### 1c. Run the deploy script
```bash
# From the repository root
bash contracts/scripts/deploy.sh
```

The script will:
- Compile all 4 contracts via `cosmwasm/optimizer` Docker image
- Upload the `.wasm` files to XION testnet-2
- Instantiate each contract (IssuerRegistry → VaccinationRecord → GrantEscrow → MilestoneChecker)
- Link MilestoneChecker to GrantEscrow
- Add 5 demo milestones (DTP x3, Measles, BCG)
- Credential the deployer address as a demo health worker
- **Auto-write all addresses to `.env.local`**

### 1d. Fund the demo escrow
```bash
# Replace with your GRANT_ESCROW address from .env.local
xiond tx wasm execute <GRANT_ESCROW_ADDR> \
  '{"fund_program":{"program_id":"program-unicef-001"}}' \
  --from deployer --keyring-backend test \
  --chain-id xion-testnet-2 \
  --node https://rpc.xion-testnet-2.burnt.com:443 \
  --gas-prices 0.001uxion --gas auto --gas-adjustment 1.4 \
  --amount 50000000uxion -y
```

### 1e. Verify deployment
```bash
bash contracts/scripts/verify.sh
```

---

## Step 2 — Create Treasury (Gasless Transactions)

The Treasury allows end-users (patients, health workers) to interact with contracts
without holding any XION tokens.

1. Visit [https://dev.testnet2.burnt.com](https://dev.testnet2.burnt.com)
2. Connect with the deployer key (import mnemonic)
3. Create a new Treasury with:
   - **Type**: `BasicAllowance`
   - **Spend Limit**: `10000000 uxion` (10 XION for testing)
   - **Expiry**: None (or set a future date)
4. Add **Granted Messages** for each contract:
   - `MsgExecuteContract` → `<ISSUER_REGISTRY_ADDR>`
   - `MsgExecuteContract` → `<VACCINATION_RECORD_ADDR>`
   - `MsgExecuteContract` → `<MILESTONE_CHECKER_ADDR>`
   - `MsgExecuteContract` → `<GRANT_ESCROW_ADDR>`
5. Copy the Treasury address (`xion1treasury...`)
6. Add to `.env.local`:
   ```
   NEXT_PUBLIC_XION_TREASURY_ADDRESS=xion1treasury...
   ```

---

## Step 3 — Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
# → http://localhost:3000

# Sign in with demo credentials:
# Health Worker: amara@clinic-kano.ng / Demo1234!
# Donor/NGO:    donor@unicef-ng.org / Demo1234!
```

### Toggle XION mode
```bash
# Mock mode (no blockchain, instant responses)
NEXT_PUBLIC_USE_REAL_XION=false  # (default)

# Real mode (requires deployed contracts + treasury)
NEXT_PUBLIC_USE_REAL_XION=true
```

---

## Step 4 — Deploy to Vercel

### 4a. Import project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)

### 4b. Add Environment Variables
In Vercel dashboard → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_XION_RPC_URL` | `https://rpc.xion-testnet-2.burnt.com:443` |
| `NEXT_PUBLIC_XION_REST_URL` | `https://api.xion-testnet-2.burnt.com` |
| `NEXT_PUBLIC_XION_CHAIN_ID` | `xion-testnet-2` |
| `NEXT_PUBLIC_XION_TREASURY_ADDRESS` | `xion1treasury...` |
| `NEXT_PUBLIC_XION_ISSUER_REGISTRY` | `xion1...` (from deploy.sh) |
| `NEXT_PUBLIC_XION_VACCINATION_RECORD` | `xion1...` |
| `NEXT_PUBLIC_XION_MILESTONE_CHECKER` | `xion1...` |
| `NEXT_PUBLIC_XION_GRANT_ESCROW` | `xion1...` |
| `NEXT_PUBLIC_USE_REAL_XION` | `true` |
| `NEXT_PUBLIC_XION_AUTH_APP_URL` | `https://auth.testnet.burnt.com` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |

### 4c. Deploy
```bash
vercel --prod
# or push to main branch → auto-deploy
```

---

## Step 5 — Mobile Worker App

The mobile app is a standalone Expo project in `mobile/`.

```bash
cd mobile

# Install dependencies
npm install

# Copy and fill environment file
cp .env .env.local
# → Fill in contract addresses from deploy.sh output

# Run on Android emulator / device
npx expo run:android

# Run on iOS simulator (macOS only)
npx expo run:ios

# Start Expo Go development server
npx expo start
```

### Mobile app features
- 🔐 Meta Account login (no wallet needed)
- 📴 Fully offline — SQLite local storage
- 📷 QR code display for patient HD-ID
- ⬡ Merkle tree batch sync to XION
- ✓ Automatic milestone + grant detection

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Next.js Dashboard (Vercel)                             │
│  Donor | Health Worker | Patient views                  │
│  AbstraxionProvider → XION Meta Accounts                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  XION Testnet-2 Smart Contracts                         │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │ IssuerRegistry   │  │ VaccinationRecord        │    │
│  │ (worker creds)   │  │ (Merkle batch anchor)    │    │
│  └──────────────────┘  └──────────────────────────┘    │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │ MilestoneChecker │→ │ GrantEscrow              │    │
│  │ (auto trigger)   │  │ (BankMsg to patient)     │    │
│  └──────────────────┘  └──────────────────────────┘    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Expo Mobile App (Android/iOS)                          │
│  SQLite offline → Merkle sync → XION                   │
│  GPS capture · QR display · Batch submit                │
└─────────────────────────────────────────────────────────┘
```

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore` — never commit keys
- [ ] `mobile/.env` is in `.gitignore`
- [ ] Deployer mnemonic stored in password manager, NOT in repo
- [ ] Treasury spend limit set explicitly (not unlimited)
- [ ] GrantEscrow `WithdrawAdmin` tested before funding with real funds
- [ ] Milestone checker verified against duplicate-release via test transactions
- [ ] Vercel env vars marked as "Sensitive" (encrypted at rest)

---

## Useful Commands

```bash
# Query contract state
xiond query wasm contract-state smart <ADDR> \
  '{"all_batches":{}}' \
  --node https://rpc.xion-testnet-2.burnt.com:443 --output json | jq

# Check program balance
xiond query wasm contract-state smart <GRANT_ESCROW> \
  '{"program_balance":{"program_id":"program-unicef-001"}}' \
  --node https://rpc.xion-testnet-2.burnt.com:443 --output json | jq

# View grant history
xiond query wasm contract-state smart <GRANT_ESCROW> \
  '{"grant_history":{"program_id":"program-unicef-001","limit":50}}' \
  --node https://rpc.xion-testnet-2.burnt.com:443 --output json | jq

# Explorer
# https://explorer.burnt.com/xion-testnet-2
```


