export interface AddressTrace {
  value: string;
  role: string;
  sourceFile: string;
  sourceObject: string;
  fromEnvConfig: boolean;
  fromWalletState: boolean;
  fromPatientData: boolean;
  fromVaccinationRecord: boolean;
  fromSyncQueue: boolean;
  fromDemoSeed: boolean;
  fromGenerated: boolean;
  treatedAs: 'contract' | 'wallet' | 'patient_identity' | 'unknown';
}

export function traceXionAddressesInSync(params: {
  config: Record<string, string | undefined>;
  connectedWallet: string;
  pendingRecords: any[];
  label?: string;
}): void {
  const { config, connectedWallet, pendingRecords, label = 'SyncTrace' } = params;

  console.group(`[${label}] XION Address Provenance`);

  // Trace config contract addresses
  Object.entries(config).forEach(([role, address]) => {
    if (address) {
      console.log(`[CONTRACT] ${role}: ${address} — source: xionConfig.contracts (env)`);
    }
  });

  // Trace connected wallet
  if (connectedWallet) {
    console.log(`[WALLET] connected: ${connectedWallet} — source: Abstraxion session`);
  }

  // Trace every xion1 string found in pending records
  pendingRecords.forEach((record, i) => {
    const fields = Object.entries(record).filter(
      ([, v]) => typeof v === 'string' && (v as string).startsWith('xion1')
    );
    if (fields.length > 0) {
      console.group(`[QUEUE RECORD ${i}] id=${record.id}`);
      fields.forEach(([key, val]) => {
        console.warn(`  Field "${key}": ${val} — IS THIS BEING PASSED AS A CONTRACT ADDRESS?`);
      });
      console.groupEnd();
    }
  });

  console.groupEnd();
}
