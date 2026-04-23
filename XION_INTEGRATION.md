# VITE — XION Integration Requirements
## What needs to happen to replace mocks with real XION testnet contracts

---

## Current Status

All XION interactions in the app are **mocked** in `lib/blockchain/contracts.ts`.
The mock functions have the correct signatures, return realistic data, and
include delays to simulate network latency.

The app is Phase 1 complete. Phase 2 requires replacing the mock bodies
with real CosmWasm contract calls.

---

## What You Need From XION / BGA Team

To connect VITE to real XION testnet contracts, you need:

### 1. Deployed Contract Addresses (testnet)
Request these from the XION team or deploy them yourself using the
CosmWasm contract code in the `/contracts` folder:

```text
IssuerRegistry:    xion1__________________________________
VaccinationRecord: xion1__________________________________
MilestoneChecker:  xion1__________________________________
GrantEscrow:       xion1__________________________________
```

### 2. XION Testnet RPC Endpoint
Current testnet RPC: `https://rpc.xion-testnet-1.burnt.com`
Verify this is still active with the XION team.

### 3. XION Testnet Tokens (for gas)
Even with gas sponsorship, initial contract deployment requires tokens.
Request testnet XION tokens from the XION faucet or team.

### 4. XION Account Abstraction API Keys
For email/phone -> XION account creation (replacing the mock),
you need access to XION's meta-account service.
Contact: `developers@burnt.com` or the GIA program team.

---

## What Needs to Change in the Code

### Step 1: Install XION SDK
```bash
npm install @cosmjs/cosmwasm-stargate @cosmjs/proto-signing @cosmjs/stargate
```
(Already installed - verify versions match XION testnet requirements)

### Step 2: Replace mock bodies in `lib/blockchain/contracts.ts`
Each mock function has a comment block showing exactly what the real
implementation looks like. Replace the mock bodies with:

```typescript
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

const RPC = 'https://rpc.xion-testnet-1.burnt.com';

async function getClient() {
  // In production: use XION's account abstraction - user signs with email
  // For testnet: use a funded wallet for gas
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
    process.env.NEXT_PUBLIC_XION_MNEMONIC!,
    { prefix: 'xion' }
  );
  return SigningCosmWasmClient.connectWithSigner(RPC, wallet);
}

// Replace IssuerRegistry.isCredentialed:
async isCredentialed(address: string): Promise<boolean> {
  const client = await getClient();
  const result = await client.queryContractSmart(
    XION_CONTRACTS.IssuerRegistry,
    { is_credentialed: { address } }
  );
  return result.credentialed;
}

// Replace VaccinationRecordContract.submitBatch:
async submitBatch(merkleRoot, recordCount, batchId, submitter) {
  const client = await getClient();
  const [{ address }] = await (await getWallet()).getAccounts();
  const result = await client.execute(
    address,
    XION_CONTRACTS.VaccinationRecord,
    { submit_batch: { merkle_root: merkleRoot, record_count: recordCount, batch_id: batchId } },
    'auto'
  );
  return { txHash: result.transactionHash, blockHeight: result.height };
}
```

### Step 3: Add environment variables to `.env.local`
```env
NEXT_PUBLIC_XION_RPC_URL=https://rpc.xion-testnet-1.burnt.com
NEXT_PUBLIC_XION_ISSUER_REGISTRY=xion1...
NEXT_PUBLIC_XION_VACCINATION_RECORD=xion1...
NEXT_PUBLIC_XION_MILESTONE_CHECKER=xion1...
NEXT_PUBLIC_XION_GRANT_ESCROW=xion1...
XION_MNEMONIC=your testnet wallet mnemonic here
```

? Never commit `XION_MNEMONIC` to GitHub. Add it to `.env.local` only.
Add `.env.local` to `.gitignore`.

### Step 4: Add Twilio for real SMS
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

In `lib/notifications/sms.ts`, the replacement comment block shows exactly
where to add the Twilio SDK call.

---

## Questions to Ask the XION / GIA Team

- Are the CosmWasm contracts in `/contracts/` in the correct format for
  XION testnet deployment? Or does XION require specific contract templates?
- Does XION's meta-account service have an API for creating accounts
  from a phone number or email without user interaction?
- Is there a XION gas sponsorship API for covering end-user transaction costs?
- What is the process for deploying CosmWasm contracts to XION testnet?
  (wasm compile -> upload -> instantiate)
- Are there example dApps on XION testnet we can reference for
  contract interaction patterns?

---

## Priority for Phase 2

| Task | Priority | Estimated Effort |
|---|---|---|
| Deploy 4 contracts to XION testnet | Critical | 1-2 days |
| Replace IssuerRegistry mock | Critical | 2 hours |
| Replace VaccinationRecord.submitBatch mock | Critical | 2 hours |
| Replace MilestoneChecker mock | High | 3 hours |
| Replace GrantEscrow mock | High | 3 hours |
| Real Twilio SMS | Medium | 1 hour |
| Real M-Pesa/OPay off-ramp | Medium | 2-3 days |
| XION meta-account for email onboarding | High | Depends on XION API |

---

This document was auto-generated as part of VITE Phase 1 completion.
Last updated: April 15, 2026



