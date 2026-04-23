const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("╔══════════════════════════════════════════════════╗");
console.log("║   VITE Contract Deployment — XION Testnet-2     ║");
console.log("╚══════════════════════════════════════════════════╝");

const RPC = "https://rpc.xion-testnet-2.burnt.com:443";
const CHAIN_ID = "xion-testnet-2";
const GAS_PRICES = "0.001uxion";
const KEYNAME = "deployer";
const KEYRING = "test";

// Windows paths
const XIOND_PATH = path.join(process.env.USERPROFILE, "go", "bin", "xiond.exe");
const REPO_PATH = "c:\\Users\\USER\\Downloads\\Vite\\contracts";

const sleep = () => {
    console.log("  ⌛ Waiting 45s for chain synchronization...");
    // Using simple synchronous wait in Node
    const start = Date.now();
    while (Date.now() - start < 45000) { /* wait */ }
};

const wait10 = () => {
    const start = Date.now();
    while (Date.now() - start < 10000) { /* wait */ }
};

function run(args, exitOnError = true) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = spawnSync(XIOND_PATH, args, { encoding: 'utf-8' });
            if (res.status !== 0) {
                const error = res.stderr || res.stdout || "Unknown error";
                
                // Retry specifically on sequence mismatch
                if (error.includes("account sequence mismatch") && attempt < 3) {
                    console.log(`  ⌛ Account sequence mismatch. Retrying (${attempt}/3)...`);
                    wait10();
                    continue;
                }

                if (!exitOnError) return "";
                console.error("\n❌ Execution error:");
                console.error(`Command: xiond ${args.join(" ")}`);
                console.error(`Error: ${error}`);
                process.exit(1);
            }
            return res.stdout.trim();
        } catch (e) {
            if (!exitOnError) return "";
            console.error("Process execution failed:", e.message);
            process.exit(1);
        }
    }
}

// ── Check xiond
if (!fs.existsSync(XIOND_PATH)) {
    console.error(`❌ xiond.exe not found at ${XIOND_PATH}`);
    process.exit(1);
}

// ── Deployer
const deployerOutput = run(["keys", "show", KEYNAME, "--keyring-backend", KEYRING, "--output", "json"]);
const DEPLOYER = JSON.parse(deployerOutput).address;
console.log(`📍 Deployer: ${DEPLOYER}`);

// ── Balance
let BALANCE = "0";
try {
    const balData = run(["query", "bank", "balances", DEPLOYER, "--node", RPC, "--output", "json"], false);
    if (balData) {
        const parsed = JSON.parse(balData);
        if (parsed.balances && parsed.balances.length > 0) {
            BALANCE = parsed.balances[0].amount;
        }
    }
} catch(e) {}
console.log(`💰 Balance: ${BALANCE} uxion`);

// ── Upload
console.log("📤 Step 2: Uploading wasm binaries...");
function uploadContract(name, file) {
    console.log(`  → Uploading ${name}...`);
    const wasmPath = path.join(REPO_PATH, "artifacts", `${file}.wasm`);
    
    const resOutput = run([
        "tx", "wasm", "store", wasmPath,
        "--from", KEYNAME,
        "--keyring-backend", KEYRING,
        "--chain-id", CHAIN_ID,
        "--node", RPC,
        "--gas-prices", GAS_PRICES,
        "--gas", "auto",
        "--gas-adjustment", "1.4",
        "-y", "--output", "json"
    ]);
    
    const txhash = JSON.parse(resOutput).txhash;
    console.log(`    TX: ${txhash}`);
    
    sleep();
    
    let queryOutput = "";
    for (let i = 0; i < 5; i++) {
        try {
            queryOutput = run(["query", "tx", txhash, "--node", RPC, "--output", "json"], false);
            if (queryOutput) break;
        } catch (e) {}
        console.log(`  ⌛ Query retry ${i+1}/5...`);
        wait10();
    }
    
    if (!queryOutput) {
        console.error(`❌ Failed to query TX ${txhash} after retries.`);
        process.exit(1);
    }

    const parsedQuery = JSON.parse(queryOutput);
    const event = parsedQuery.events.find(e => e.type === "store_code");
    const codeId = event.attributes.find(a => a.key === "code_id").value;
    console.log(`  ✓ ${name} Code ID: ${codeId}`);
    return codeId;
}

const ISSUER_CODE = uploadContract("IssuerRegistry", "issuer_registry");
const VAC_CODE = uploadContract("VaccinationRecord", "vaccination_record");
const CHECKER_CODE = uploadContract("MilestoneChecker", "milestone_checker");
const ESCROW_CODE = uploadContract("GrantEscrow", "grant_escrow");

// ── Instantiate
console.log("🚀 Step 3: Instantiating contracts...");
function initContract(name, code, msgObj) {
    console.log(`  → Instantiating ${name}...`);
    const msg = JSON.stringify(msgObj);
    
    const resOutput = run([
        "tx", "wasm", "instantiate", code, msg,
        "--from", KEYNAME,
        "--keyring-backend", KEYRING,
        "--label", `VITE-${name}`,
        "--chain-id", CHAIN_ID,
        "--node", RPC,
        "--gas-prices", GAS_PRICES,
        "--gas", "auto",
        "--gas-adjustment", "1.4",
        "--no-admin", "-y", "--output", "json"
    ]);
    
    const txhash = JSON.parse(resOutput).txhash;
    console.log(`    TX: ${txhash}`);
    
    wait10();
    
    const queryOutput = run(["query", "tx", txhash, "--node", RPC, "--output", "json"]);
    const parsedQuery = JSON.parse(queryOutput);
    const event = parsedQuery.events.find(e => e.type === "instantiate");
    const addr = event.attributes.find(a => a.key === "_contract_address").value;
    console.log(`  ✓ ${name}: ${addr}`);
    return addr;
}

const ISSUER_ADDR = initContract("IssuerRegistry", ISSUER_CODE, { admin: DEPLOYER });
const VAC_ADDR = initContract("VaccinationRecord", VAC_CODE, { admin: DEPLOYER, issuer_registry: ISSUER_ADDR });
const ESCROW_ADDR = initContract("GrantEscrow", ESCROW_CODE, { admin: DEPLOYER, milestone_checker: DEPLOYER });
const CHECKER_ADDR = initContract("MilestoneChecker", CHECKER_CODE, { admin: DEPLOYER, vaccination_record: VAC_ADDR, grant_escrow: ESCROW_ADDR });

// ── Update Checker
console.log("  → Updating GrantEscrow checker...");
const updateMsg = JSON.stringify({ update_checker: { milestone_checker: CHECKER_ADDR } });
run([
    "tx", "wasm", "execute", ESCROW_ADDR, updateMsg,
    "--from", KEYNAME,
    "--keyring-backend", KEYRING,
    "--chain-id", CHAIN_ID,
    "--node", RPC,
    "--gas-prices", GAS_PRICES,
    "--gas", "auto",
    "--gas-adjustment", "1.4",
    "-y", "--output", "json"
]);
sleep();

// ── Milestones
console.log("🎯 Step 4: Configuring demo milestones...");
function addMilestone(id, prog, vaccine, dose, amount) {
    const msgObj = { add_milestone: { config: { milestone_id: id, program_id: prog, vaccine_name: vaccine, dose_number: dose, grant_amount: amount, active: true } } };
    const msg = JSON.stringify(msgObj);
    run([
        "tx", "wasm", "execute", CHECKER_ADDR, msg,
        "--from", KEYNAME,
        "--keyring-backend", KEYRING,
        "--chain-id", CHAIN_ID,
        "--node", RPC,
        "--gas-prices", GAS_PRICES,
        "--gas", "auto",
        "--gas-adjustment", "1.4",
        "-y", "--output", "json"
    ]);
    console.log(`  ✓ ${id} added`);
    sleep();
}

addMilestone("milestone-dtp1", "program-unicef-001", "DTP", 1, 3000000);
addMilestone("milestone-dtp2", "program-unicef-001", "DTP", 2, 5000000);
addMilestone("milestone-dtp3", "program-unicef-001", "DTP", 3, 5000000);

// ── Credential Demo Worker
console.log("👩‍⚕️ Step 5: Credentialing deployer as demo health worker...");
const credMsg = JSON.stringify({ credential_worker: { worker_addr: DEPLOYER, clinic_id: "clinic-001", clinic_name: "Kano Primary Health Post" } });
run([
    "tx", "wasm", "execute", ISSUER_ADDR, credMsg,
    "--from", KEYNAME,
    "--keyring-backend", KEYRING,
    "--chain-id", CHAIN_ID,
    "--node", RPC,
    "--gas-prices", GAS_PRICES,
    "--gas", "auto",
    "--gas-adjustment", "1.4",
    "-y", "--output", "json"
]);
sleep();

// ── .env
console.log("📝 Step 6: Updating .env.local...");
const envPath = `${process.env.USERPROFILE}\\Downloads\\Vite\\.env.local`;
let envData = "";
if (fs.existsSync(envPath)) {
    envData = fs.readFileSync(envPath, 'utf8').split('\n').filter(l => !l.includes('NEXT_PUBLIC_XION')).join('\n');
}

const newEnv = `
# ── XION Testnet-2 Auto-Generated ──
NEXT_PUBLIC_XION_RPC_URL=${RPC}
NEXT_PUBLIC_XION_REST_URL=https://api.xion-testnet-2.burnt.com
NEXT_PUBLIC_XION_CHAIN_ID=${CHAIN_ID}
NEXT_PUBLIC_XION_ISSUER_REGISTRY=${ISSUER_ADDR}
NEXT_PUBLIC_XION_VACCINATION_RECORD=${VAC_ADDR}
NEXT_PUBLIC_XION_MILESTONE_CHECKER=${CHECKER_ADDR}
NEXT_PUBLIC_XION_GRANT_ESCROW=${ESCROW_ADDR}
NEXT_PUBLIC_XION_DEPLOYER=${DEPLOYER}
NEXT_PUBLIC_USE_REAL_XION=true
NEXT_PUBLIC_XION_GAS_PRICE=${GAS_PRICES}
NEXT_PUBLIC_XION_TREASURY_ADDRESS=
NEXT_PUBLIC_XION_AUTH_APP_URL=https://auth.testnet.burnt.com
`;

fs.writeFileSync(envPath, envData + "\n" + newEnv);
console.log("Done!");
