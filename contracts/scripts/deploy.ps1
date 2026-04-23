$ErrorActionPreference = "Stop"

$RPC = "https://rpc.xion-testnet-2.burnt.com:443"
$CHAIN_ID = "xion-testnet-2"
$GAS_PRICES = "0.001uxion"
$KEYNAME = "deployer"
$KEYRING = "--keyring-backend test"
$XIOND = "$env:USERPROFILE\go\bin\xiond.exe"

Write-Host "╔══════════════════════════════════════════════════╗"
Write-Host "║   VITE Contract Deployment — XION Testnet-2     ║"
Write-Host "╚══════════════════════════════════════════════════╝"

# Get deployer address
$DEPLOYER_JSON = & $XIOND keys show $KEYNAME --keyring-backend test --output json
$DEPLOYER = ($DEPLOYER_JSON | ConvertFrom-Json).address
Write-Host "📍 Deployer: $DEPLOYER"

# Check balance
$BAL_JSON = & $XIOND query bank balance $DEPLOYER uxion --node $RPC --output json 2>$null
if ($BAL_JSON) {
    $BALANCE = ($BAL_JSON | ConvertFrom-Json).balance.amount
}
if ([string]::IsNullOrWhiteSpace($BALANCE)) { $BALANCE = "0" }
Write-Host "💰 Balance: $BALANCE uxion"

# Compile Contracts
Write-Host "📦 Step 1: Compiling contracts locally..."
Set-Location "c:\Users\USER\Downloads\Vite\contracts"
& docker run --rm -v "c:\Users\USER\Downloads\Vite\contracts:/code" --mount type=volume,source="vite_contracts_cache",target=/target --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry cosmwasm/optimizer:0.16.1

Write-Host "📤 Step 2: Uploading wasm binaries..."
function Upload-Contract {
    param($name, $file)
    Write-Host "  → Uploading $name..."
    $RES = & $XIOND tx wasm store "artifacts/${file}.wasm" --from $KEYNAME --keyring-backend test --chain-id $CHAIN_ID --node $RPC --gas-prices $GAS_PRICES --gas auto --gas-adjustment 1.4 -y --output json
    $TXHASH = ($RES | ConvertFrom-Json).txhash
    Write-Host "    TX: $TXHASH"
    Start-Sleep -Seconds 8
    $QUERY = & $XIOND query tx $TXHASH --node $RPC --output json
    $CODE_ID = ($QUERY | ConvertFrom-Json).events | Where-Object { $_.type -eq "store_code" } | Select-Object -ExpandProperty attributes | Where-Object { $_.key -eq "code_id" } | Select-Object -ExpandProperty value | Select-Object -First 1
    Write-Host "  ✓ $name Code ID: $CODE_ID"
    return $CODE_ID
}

$ISSUER_CODE = Upload-Contract "IssuerRegistry" "issuer_registry"
$VAC_CODE = Upload-Contract "VaccinationRecord" "vaccination_record"
$CHECKER_CODE = Upload-Contract "MilestoneChecker" "milestone_checker"
$ESCROW_CODE = Upload-Contract "GrantEscrow" "grant_escrow"

Write-Host "🚀 Step 3: Instantiating contracts..."
function Instantiate-Contract {
    param($name, $code, $msg)
    Write-Host "  → Instantiating $name (code $code)..."
    $RES = & $XIOND tx wasm instantiate $code $msg --from $KEYNAME --keyring-backend test --label "VITE-$name" --chain-id $CHAIN_ID --node $RPC --gas-prices $GAS_PRICES --gas auto --gas-adjustment 1.4 --no-admin -y --output json
    $TXHASH = ($RES | ConvertFrom-Json).txhash
    Start-Sleep -Seconds 8
    $QUERY = & $XIOND query tx $TXHASH --node $RPC --output json
    $ADDR = ($QUERY | ConvertFrom-Json).events | Where-Object { $_.type -eq "instantiate" } | Select-Object -ExpandProperty attributes | Where-Object { $_.key -eq "_contract_address" } | Select-Object -ExpandProperty value | Select-Object -First 1
    Write-Host "  ✓ $name: $ADDR"
    return $ADDR
}

$ISSUER_MSG = @"
{"admin":"$DEPLOYER"}
"@
$ISSUER_ADDR = Instantiate-Contract "IssuerRegistry" $ISSUER_CODE $ISSUER_MSG

$VAC_MSG = @"
{"admin":"$DEPLOYER","issuer_registry":"$ISSUER_ADDR"}
"@
$VAC_ADDR = Instantiate-Contract "VaccinationRecord" $VAC_CODE $VAC_MSG

$ESCROW_MSG = @"
{"admin":"$DEPLOYER","milestone_checker":"$DEPLOYER"}
"@
$ESCROW_ADDR = Instantiate-Contract "GrantEscrow" $ESCROW_CODE $ESCROW_MSG

$CHECKER_MSG = @"
{"admin":"$DEPLOYER","vaccination_record":"$VAC_ADDR","grant_escrow":"$ESCROW_ADDR"}
"@
$CHECKER_ADDR = Instantiate-Contract "MilestoneChecker" $CHECKER_CODE $CHECKER_MSG

Write-Host "  → Updating GrantEscrow checker..."
$UPDATE_MSG = @"
{"update_checker":{"milestone_checker":"$CHECKER_ADDR"}}
"@
$null = & $XIOND tx wasm execute $ESCROW_ADDR $UPDATE_MSG --from $KEYNAME --keyring-backend test --chain-id $CHAIN_ID --node $RPC --gas-prices $GAS_PRICES --gas auto --gas-adjustment 1.4 -y --output json

Write-Host "🎯 Step 4: Configuring demo milestones..."
function Add-Milestone {
    param($id, $prog, $vaccine, $dose, $amount)
    $MILESTONE_MSG = @"
{"add_milestone":{"config":{"milestone_id":"$id","program_id":"$prog","vaccine_name":"$vaccine","dose_number":$dose,"grant_amount":"$amount","active":true}}}
"@
    $null = & $XIOND tx wasm execute $CHECKER_ADDR $MILESTONE_MSG --from $KEYNAME --keyring-backend test --chain-id $CHAIN_ID --node $RPC --gas-prices $GAS_PRICES --gas auto --gas-adjustment 1.4 -y --output json
    Write-Host "  ✓ $id added"
}

Add-Milestone "milestone-dtp1" "program-unicef-001" "DTP" 1 "3000000"
Add-Milestone "milestone-dtp2" "program-unicef-001" "DTP" 2 "3000000"
Add-Milestone "milestone-dtp3" "program-unicef-001" "DTP" 3 "5000000"

Write-Host "📝 Step 6: Updating .env.local..."
Set-Location "c:\Users\USER\Downloads\Vite"
$envFile = "c:\Users\USER\Downloads\Vite\.env.local"
if (Test-Path $envFile) {
    (Get-Content $envFile) | Where-Object { $_ -notmatch 'NEXT_PUBLIC_XION' } | Set-Content $envFile
}

$envSettings = @"

# ── XION Testnet-2 Auto-Generated ──
NEXT_PUBLIC_XION_RPC_URL=$RPC
NEXT_PUBLIC_XION_REST_URL=https://api.xion-testnet-2.burnt.com
NEXT_PUBLIC_XION_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_XION_ISSUER_REGISTRY=$ISSUER_ADDR
NEXT_PUBLIC_XION_VACCINATION_RECORD=$VAC_ADDR
NEXT_PUBLIC_XION_MILESTONE_CHECKER=$CHECKER_ADDR
NEXT_PUBLIC_XION_GRANT_ESCROW=$ESCROW_ADDR
NEXT_PUBLIC_XION_DEPLOYER=$DEPLOYER
NEXT_PUBLIC_USE_REAL_XION=true
NEXT_PUBLIC_XION_GAS_PRICE=$GAS_PRICES
NEXT_PUBLIC_XION_TREASURY_ADDRESS=
NEXT_PUBLIC_XION_AUTH_APP_URL=https://auth.testnet.burnt.com
"@

Add-Content -Path $envFile -Value $envSettings
Write-Host "Done!"
