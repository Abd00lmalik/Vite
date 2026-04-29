import re

with open('lib/blockchain/sync.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Update failureResult signature
content = re.sub(
    r'function failureResult\(\{[\s\S]*?mode: \'onchain\' \| \'simulated\';[\s\S]*?errors: string\[\];[\s\S]*?blockHeight\?: number;[\s\S]*?\}\): SyncResult \{[\s\S]*?return \{[\s\S]*?success: false,[\s\S]*?batchId,[\s\S]*?recordCount,[\s\S]*?txHash,[\s\S]*?blockHeight,[\s\S]*?merkleRoot,[\s\S]*?grantsReleased: grantsReleased \?\? 0,[\s\S]*?errors,[\s\S]*?flaggedCount,[\s\S]*?mode,[\s\S]*?\};[\s\S]*?\}',
    '''function failureResult({
  batchId,
  recordCount,
  merkleRoot,
  txHash,
  grantsReleased,
  flaggedCount,
  mode,
  errors,
  warnings,
  blockHeight,
}: {
  batchId: string;
  recordCount: number;
  merkleRoot: string;
  txHash?: string;
  grantsReleased?: number;
  flaggedCount?: number;
  mode: 'onchain' | 'simulated';
  errors: string[];
  warnings?: string[];
  blockHeight?: number;
}): SyncResult {
  return {
    success: false,
    batchId,
    recordCount,
    txHash,
    blockHeight,
    merkleRoot,
    grantsReleased: grantsReleased ?? 0,
    errors,
    warnings: warnings ?? [],
    flaggedCount,
    mode,
  };
}''',
    content
)

# Update Phase B catches to use warnings instead of errors
# find the catch block for preflight:
content = re.sub(
    r'\} catch \(preflightError: any\) \{\s*errors\.push\(\s*`Milestone processing skipped for \$\{record\.id\}: unable to verify payout address \$\{patientPayoutAddress\} on-chain\. \$\{normalizeErrorMessage\(preflightError\)\}`\s*\);\s*continue;\s*\}',
    '''} catch (preflightError: any) {
          warnings.push(
            `Milestone processing skipped for ${record.id}: unable to verify payout address ${patientPayoutAddress} on-chain. ${normalizeErrorMessage(preflightError)}`
          );
          continue;
        }''',
    content
)

# Replace other Phase B error pushes
content = content.replace(
    '''errors.push(
            `Milestone processing skipped for ${record.id}: patient ${patient.healthDropId} has no eligible payout wallet. Source: ${payoutResolution.source}.`
          );''',
    '''warnings.push(
            `Milestone processing skipped for ${record.id}: patient ${patient.healthDropId} has no eligible payout wallet. Source: ${payoutResolution.source}.`
          );'''
)

content = content.replace(
    '''errors.push(
            `Milestone processing skipped for ${record.id}: payout address ${patientPayoutAddress} from ${payoutResolution.source} is classified as ${payoutClassification.role} and treated as identity metadata.`
          );''',
    '''warnings.push(
            `Milestone processing skipped for ${record.id}: payout address ${patientPayoutAddress} from ${payoutResolution.source} is classified as ${payoutClassification.role} and treated as identity metadata.`
          );'''
)

content = content.replace(
    '''errors.push(
              `Milestone processing skipped for ${record.id}: payout address ${patientPayoutAddress} is not initialized on XION Testnet-2 (source: ${payoutResolution.source}). The stale address has been cleared.`
            );''',
    '''warnings.push(
              `Milestone processing skipped for ${record.id}: payout address ${patientPayoutAddress} is not initialized on XION Testnet-2 (source: ${payoutResolution.source}). The stale address has been cleared.`
            );'''
)

content = content.replace(
    '''errors.push(
            `Milestone processing skipped for ${record.id}: ${mapSyncError(error, {
              senderAddress,
              stage: 'milestone',
              contractName: 'MilestoneChecker',
              address: patientPayoutAddress,
              classifyContext: addressContext,
            })} Source: ${payoutResolution.source}.`
          );''',
    '''warnings.push(
            `Milestone processing skipped for ${record.id}: ${mapSyncError(error, {
              senderAddress,
              stage: 'milestone',
              contractName: 'MilestoneChecker',
              address: patientPayoutAddress,
              classifyContext: addressContext,
            })} Source: ${payoutResolution.source}.`
          );'''
)

# In the return statement at the end of runSync:
content = re.sub(
    r'return \{\s*success: true,\s*batchId,\s*recordCount: validVaccinations\.length,\s*txHash,\s*blockHeight,\s*merkleRoot: root,\s*grantsReleased,\s*errors,\s*flaggedCount,\s*mode: onChain \? \'onchain\' : \'simulated\',\s*\};',
    '''console.log("[SYNC SUCCESS] Vaccination batch committed on-chain");

  return {
    success: true,
    batchId,
    recordCount: validVaccinations.length,
    txHash,
    blockHeight,
    merkleRoot: root,
    grantsReleased,
    errors,
    warnings,
    phaseA: { success: true },
    phaseB: { 
      success: warnings.length === 0,
      skipped: warnings.length > 0,
      warnings
    },
    flaggedCount,
    mode: onChain ? 'onchain' : 'simulated',
  };''',
    content
)

# And in early successes:
content = content.replace(
    '''return {
      success: true,
      batchId: 'no-op',
      recordCount: 0,
      merkleRoot: '0x0',
      grantsReleased: 0,
      errors,
      flaggedCount: 0,
      mode: onChain ? 'onchain' : 'simulated',
    };''',
    '''return {
      success: true,
      batchId: 'no-op',
      recordCount: 0,
      merkleRoot: '0x0',
      grantsReleased: 0,
      errors,
      warnings,
      phaseA: { success: true },
      phaseB: { success: true, skipped: false, warnings: [] },
      flaggedCount: 0,
      mode: onChain ? 'onchain' : 'simulated',
    };'''
)

with open('lib/blockchain/sync.ts', 'w', encoding='utf-8') as f:
    f.write(content)
