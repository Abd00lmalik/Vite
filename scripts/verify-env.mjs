// scripts/verify-env.mjs
// Runs during build to verify required NEXT_PUBLIC_XION_* vars are present.
// This script is safe to commit — it does not log secret values.

import pkg from '@next/env';
const { loadEnvConfig } = pkg;
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const REQUIRED = [
  'NEXT_PUBLIC_XION_RPC_URL',
  'NEXT_PUBLIC_XION_REST_URL',
  'NEXT_PUBLIC_XION_CHAIN_ID',
  'NEXT_PUBLIC_XION_VACCINATION_RECORD',
  'NEXT_PUBLIC_XION_MILESTONE_CHECKER',
];

const OPTIONAL = [
  'NEXT_PUBLIC_XION_ISSUER_REGISTRY',
  'NEXT_PUBLIC_XION_GRANT_ESCROW',
  'NEXT_PUBLIC_XION_GAS_PRICE',
  'NEXT_PUBLIC_XION_AUTH_APP_URL',
  'NEXT_PUBLIC_XION_TREASURY_ADDRESS',
  'NEXT_PUBLIC_SHOW_XION_DEBUG',
];

function maskValue(val) {
  if (!val || val.trim() === '') return '[MISSING]';
  if (val.startsWith('https://')) return val; // URLs are not secret
  if (val.length > 12) return `${val.slice(0, 8)}...[${val.length} chars]`;
  return '[SET]';
}

console.log('\n=== XION Environment Verification (build time) ===');
console.log(`Build time: ${new Date().toISOString()}\n`);

let allRequired = true;

for (const key of REQUIRED) {
  const val = process.env[key];
  const present = val && val.trim() !== '' && !val.startsWith('REQUIRED_INPUT_');
  console.log(`${present ? '✓' : '✗ MISSING'} ${key}: ${maskValue(val)}`);
  if (!present) allRequired = false;
}

console.log('\nOptional:');
for (const key of OPTIONAL) {
  const val = process.env[key];
  const present = val && val.trim() !== '';
  console.log(`${present ? '✓' : '– not set'} ${key}: ${maskValue(val)}`);
}

if (!allRequired) {
  console.error('\n⚠ WARNING: One or more required XION vars are missing from this build.');
  console.error('The deployed app will show "XION sync is not configured."');
  console.error('Add missing vars in Vercel → Project Settings → Environment Variables');
  console.error('then redeploy with build cache disabled.\n');
  // Do not exit with code 1 — allow build to complete so diagnostic panel is visible
} else {
  console.log('\n✓ All required XION vars present at build time.\n');
}
