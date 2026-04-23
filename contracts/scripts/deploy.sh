#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════
# VITE Contract Deployment Script — XION Testnet-2
# Prerequisites:
#   1. xiond installed: https://docs.burnt.com/xion/developers
#      go install github.com/burnt-labs/xion/cmd/xiond@latest
#   2. Wallet key: xiond keys add deployer --keyring-backend test
#   3. Funded: https://faucet.xion.burnt.com  (enter your xion address)
#   4. Docker running (for CosmWasm optimizer)
#   5. Run from project root: bash contracts/scripts/deploy.sh
# ═══════════════════════════════════════════════════════════════════

RPC="https://rpc.xion-testnet-2.burnt.com:443"
CHAIN_ID="xion-testnet-2"
GAS_PRICES="0.001uxion"
KEYNAME="deployer"
KEYRING="--keyring-backend test"
XIOND="/c/Users/USER/go/bin/xiond.exe"
# ── Get deployer address ─────────────────────────────────────────
DEPLOYER=$($XIOND keys show $KEYNAME $KEYRING --output json | jq -r '.address')
echo "📍 Deployer: $DEPLOYER"

# ── Check balance ─────────────────────────────────────────────────
BALANCE=$($XIOND query bank balance $DEPLOYER uxion \
  --node $RPC --output json 2>/dev/null | jq -r '.balance.amount // "0"')
echo "💰 Balance: $BALANCE uxion"
if [ "$BALANCE" = "0" ] || [ "$BALANCE" = "null" ]; then
  echo ""
  echo "⚠️  Insufficient balance. Get test tokens:"
  echo "   https://faucet.xion.burnt.com"
  echo "   Address: $DEPLOYER"
  read -p "   Press Enter after funding to continue..."
fi

# ── Step 1: Compile contracts ─────────────────────────────────────
echo ""
echo "📦 Step 1: Compiling contracts with CosmWasm optimizer..."
echo "   (This uses Docker and takes ~5-10 min on first run)"
cd "$(dirname "$0")/../.."

docker run --rm \
  -v "$(pwd)/contracts":/code \
  --mount type=volume,source="vite_contracts_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.1

echo "✓ Wasm files written to contracts/artifacts/"
cd contracts

# ── Step 2: Upload contracts ──────────────────────────────────────
echo ""
echo "📤 Step 2: Uploading wasm binaries to XION testnet-2..."

upload_contract() {
  local name=$1
  local file=$2
  echo "  → Uploading $name..."
  RES=$($XIOND tx wasm store "artifacts/${file}.wasm" \
    --from $KEYNAME $KEYRING \
    --chain-id $CHAIN_ID \
    --node $RPC \
    --gas-prices $GAS_PRICES \
    --gas auto \
    --gas-adjustment 1.4 \
    -y --output json 2>/dev/null)
  TXHASH=$(echo $RES | jq -r '.txhash')
  echo "    TX: $TXHASH"
  sleep 8
  CODE_ID=$($XIOND query tx $TXHASH \
    --node $RPC --output json 2>/dev/null | \
    jq -r '[ .events[] | .attributes[] | select(.key=="code_id") ] | first | .value')
  echo "  ✓ $name Code ID: $CODE_ID"
  echo "$CODE_ID"
}

ISSUER_CODE=$(upload_contract  "IssuerRegistry"    "issuer_registry")
VAC_CODE=$(upload_contract     "VaccinationRecord" "vaccination_record")
CHECKER_CODE=$(upload_contract "MilestoneChecker"  "milestone_checker")
ESCROW_CODE=$(upload_contract  "GrantEscrow"       "grant_escrow")

# ── Step 3: Instantiate contracts ────────────────────────────────
echo ""
echo "🚀 Step 3: Instantiating contracts..."

instantiate_contract() {
  local name=$1
  local code=$2
  local msg=$3
  echo "  → Instantiating $name (code $code)..."
  RES=$($XIOND tx wasm instantiate "$code" "$msg" \
    --from $KEYNAME $KEYRING \
    --label "VITE-$name" \
    --chain-id $CHAIN_ID \
    --node $RPC \
    --gas-prices $GAS_PRICES \
    --gas auto \
    --gas-adjustment 1.4 \
    --no-admin \
    -y --output json 2>/dev/null)
  TXHASH=$(echo $RES | jq -r '.txhash')
  sleep 8
  ADDR=$($XIOND query tx $TXHASH \
    --node $RPC --output json 2>/dev/null | \
    jq -r '[ .events[] | select(.type=="instantiate") | .attributes[] | select(.key=="_contract_address") ] | first | .value')
  echo "  ✓ $name: $ADDR"
  echo "$ADDR"
}

ISSUER_ADDR=$(instantiate_contract "IssuerRegistry" $ISSUER_CODE \
  "{\"admin\":\"$DEPLOYER\"}")

VAC_ADDR=$(instantiate_contract "VaccinationRecord" $VAC_CODE \
  "{\"admin\":\"$DEPLOYER\",\"issuer_registry\":\"$ISSUER_ADDR\"}")

# Instantiate GrantEscrow first with placeholder checker
ESCROW_ADDR=$(instantiate_contract "GrantEscrow" $ESCROW_CODE \
  "{\"admin\":\"$DEPLOYER\",\"milestone_checker\":\"$DEPLOYER\"}")

# Instantiate MilestoneChecker with real escrow address
CHECKER_ADDR=$(instantiate_contract "MilestoneChecker" $CHECKER_CODE \
  "{\"admin\":\"$DEPLOYER\",\"vaccination_record\":\"$VAC_ADDR\",\"grant_escrow\":\"$ESCROW_ADDR\"}")

# Update GrantEscrow with real checker address
echo ""
echo "  → Updating GrantEscrow with real MilestoneChecker address..."
$XIOND tx wasm execute "$ESCROW_ADDR" \
  "{\"update_checker\":{\"milestone_checker\":\"$CHECKER_ADDR\"}}" \
  --from $KEYNAME $KEYRING \
  --chain-id $CHAIN_ID --node $RPC \
  --gas-prices $GAS_PRICES --gas auto --gas-adjustment 1.4 -y \
  --output json > /dev/null 2>&1
echo "  ✓ GrantEscrow checker updated"

# ── Step 4: Add demo milestones ───────────────────────────────────
echo ""
echo "🎯 Step 4: Configuring demo milestones..."

add_milestone() {
  local id=$1 prog=$2 vaccine=$3 dose=$4 amount=$5
  $XIOND tx wasm execute "$CHECKER_ADDR" \
    "{\"add_milestone\":{\"config\":{\"milestone_id\":\"$id\",\"program_id\":\"$prog\",\"vaccine_name\":\"$vaccine\",\"dose_number\":$dose,\"grant_amount\":$amount,\"active\":true}}}" \
    --from $KEYNAME $KEYRING \
    --chain-id $CHAIN_ID --node $RPC \
    --gas-prices $GAS_PRICES --gas auto --gas-adjustment 1.4 -y \
    --output json > /dev/null 2>&1
  echo "  ✓ $id ($vaccine dose $dose = $amount uxion)"
}

add_milestone "milestone-dtp1"    "program-unicef-001" "DTP"     1 3000000
add_milestone "milestone-dtp2"    "program-unicef-001" "DTP"     2 3000000
add_milestone "milestone-dtp3"    "program-unicef-001" "DTP"     3 5000000
add_milestone "milestone-measles" "program-unicef-001" "Measles" 1 5000000
add_milestone "milestone-bcg"     "program-unicef-001" "BCG"     1 2000000

# ── Step 5: Credential demo worker ───────────────────────────────
echo ""
echo "👩‍⚕️ Step 5: Credentialing deployer as demo health worker..."
$XIOND tx wasm execute "$ISSUER_ADDR" \
  "{\"credential_worker\":{\"worker_addr\":\"$DEPLOYER\",\"clinic_id\":\"clinic-001\",\"clinic_name\":\"Kano Primary Health Post\"}}" \
  --from $KEYNAME $KEYRING \
  --chain-id $CHAIN_ID --node $RPC \
  --gas-prices $GAS_PRICES --gas auto --gas-adjustment 1.4 -y \
  --output json > /dev/null 2>&1
echo "  ✓ Demo worker credentialed (address: $DEPLOYER)"

# ── Step 6: Write env vars ────────────────────────────────────────
echo ""
echo "📝 Step 6: Writing contract addresses to ../.env.local..."
cd ..

# Remove old contract address block if it exists
grep -v "NEXT_PUBLIC_XION_ISSUER_REGISTRY\|NEXT_PUBLIC_XION_VACCINATION\|NEXT_PUBLIC_XION_MILESTONE\|NEXT_PUBLIC_XION_GRANT\|NEXT_PUBLIC_XION_DEPLOYER\|NEXT_PUBLIC_USE_REAL_XION\|NEXT_PUBLIC_XION_RPC\|NEXT_PUBLIC_XION_REST\|NEXT_PUBLIC_XION_CHAIN" .env.local > .env.local.tmp 2>/dev/null && mv .env.local.tmp .env.local || true

cat >> .env.local << EOF

# ── XION Testnet-2 (auto-generated by deploy.sh $(date -u +%Y-%m-%dT%H:%M:%SZ)) ──
NEXT_PUBLIC_XION_RPC_URL=https://rpc.xion-testnet-2.burnt.com:443
NEXT_PUBLIC_XION_REST_URL=https://api.xion-testnet-2.burnt.com
NEXT_PUBLIC_XION_CHAIN_ID=xion-testnet-2
NEXT_PUBLIC_XION_ISSUER_REGISTRY=$ISSUER_ADDR
NEXT_PUBLIC_XION_VACCINATION_RECORD=$VAC_ADDR
NEXT_PUBLIC_XION_MILESTONE_CHECKER=$CHECKER_ADDR
NEXT_PUBLIC_XION_GRANT_ESCROW=$ESCROW_ADDR
NEXT_PUBLIC_XION_DEPLOYER=$DEPLOYER
NEXT_PUBLIC_USE_REAL_XION=true
NEXT_PUBLIC_XION_GAS_PRICE=0.001uxion
# Treasury: create at https://dev.testnet2.burnt.com then paste here:
NEXT_PUBLIC_XION_TREASURY_ADDRESS=
NEXT_PUBLIC_XION_AUTH_APP_URL=https://auth.testnet.burnt.com
EOF

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║              ✅ DEPLOYMENT COMPLETE              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Contract Addresses:"
printf "  %-24s %s\n" "IssuerRegistry:"    "$ISSUER_ADDR"
printf "  %-24s %s\n" "VaccinationRecord:" "$VAC_ADDR"
printf "  %-24s %s\n" "MilestoneChecker:"  "$CHECKER_ADDR"
printf "  %-24s %s\n" "GrantEscrow:"       "$ESCROW_ADDR"
echo ""
echo "Explorer: https://explorer.burnt.com/xion-testnet-2"
echo ""
echo "⚠️  REQUIRED NEXT STEPS:"
echo "  1. Create Treasury at: https://dev.testnet2.burnt.com"
echo "     - Allowance: BasicAllowance, 10000000 uxion"
echo "     - Grant: MsgExecuteContract for all 4 contract addresses"
echo "  2. Add treasury address to .env.local:"
echo "     NEXT_PUBLIC_XION_TREASURY_ADDRESS=xion1..."
echo "  3. Fund GrantEscrow for demo program:"
echo "     xiond tx wasm execute $ESCROW_ADDR \\"
echo "       '{\"fund_program\":{\"program_id\":\"program-unicef-001\"}}' \\"
echo "       --from deployer --keyring-backend test \\"
echo "       --chain-id xion-testnet-2 --node $RPC \\"
echo "       --gas-prices 0.001uxion --gas auto --gas-adjustment 1.4 \\"
echo "       --amount 50000000uxion -y"
echo "  4. npm run dev"
echo "  5. cd mobile && npx expo run:android"
echo ""
