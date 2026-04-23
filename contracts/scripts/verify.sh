#!/bin/bash
# VITE Contract Verification Script — XION Testnet-2
# Usage: bash contracts/scripts/verify.sh

RPC="https://rpc.xion-testnet-2.burnt.com:443"

# Load addresses from .env.local
source <(grep "NEXT_PUBLIC_XION" .env.local 2>/dev/null | sed 's/NEXT_PUBLIC_//')

echo "╔══════════════════════════════════════╗"
echo "║   VITE Contract Verification        ║"
echo "╚══════════════════════════════════════╝"
echo ""

verify_contract() {
  local name=$1
  local addr=$2
  if [ -z "$addr" ]; then
    echo "  ❌ $name — address not set in .env.local"
    return
  fi
  INFO=$(xiond query wasm contract "$addr" --node $RPC --output json 2>/dev/null)
  if echo "$INFO" | jq -e '.contract_info' > /dev/null 2>&1; then
    LABEL=$(echo $INFO | jq -r '.contract_info.label')
    CODE=$(echo $INFO | jq -r '.contract_info.code_id')
    echo "  ✓ $name"
    echo "    Address: $addr"
    echo "    Label:   $LABEL"
    echo "    Code ID: $CODE"
  else
    echo "  ❌ $name — not found on chain (addr: $addr)"
  fi
  echo ""
}

verify_contract "IssuerRegistry"    "${XION_ISSUER_REGISTRY}"
verify_contract "VaccinationRecord" "${XION_VACCINATION_RECORD}"
verify_contract "MilestoneChecker"  "${XION_MILESTONE_CHECKER}"
verify_contract "GrantEscrow"       "${XION_GRANT_ESCROW}"

echo "Explorer: https://explorer.burnt.com/xion-testnet-2"
