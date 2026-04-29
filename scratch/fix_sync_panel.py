import re

with open('components/shared/SyncPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update success logic inside handleSync
# Wait, if response.success is true, we just check if it's successful.
# The user wants:
# Case A - success: Sync complete, Vaccination records stored on-chain
# Case B - success + skipped payout: Sync complete, Vaccination records stored on-chain, Payout skipped (no valid patient payout account)
# Case C - real failure: Sync failed (reason)

content = content.replace(
    '''      if (response.success) {
        const txSuffix = response.txHash ? ` Tx: ${shortTxHash(response.txHash)}` : '';
        toast.success(`${response.recordCount} records synced.${txSuffix}`);
      } else {
        const firstError = response.errors[0] ?? 'Sync failed.';
        const toastId = toastErrorOnce(firstError, (message) => toast.error(message));
        if (isAccountNotInitializedMessage(firstError)) {
          accountInitToastIdRef.current = toastId;
        }
      }''',
    '''      if (response.success) {
        const txSuffix = response.txHash ? ` Tx: ${shortTxHash(response.txHash)}` : '';
        if (response.phaseB?.skipped) {
          toast.success(`${response.recordCount} records synced.${txSuffix} (Payouts skipped)`);
        } else {
          toast.success(`${response.recordCount} records synced.${txSuffix}`);
        }
      } else {
        const firstError = response.errors?.[0] ?? 'Sync failed.';
        const toastId = toastErrorOnce(firstError, (message) => toast.error(message));
        if (isAccountNotInitializedMessage(firstError)) {
          accountInitToastIdRef.current = toastId;
        }
      }'''
)

# Update UI block
ui_block_old = '''            {result.success ? (
              <>
                <p className="font-semibold text-who-green">
                  {result.recordCount} records synced {result.mode === 'onchain' ? 'on-chain' : '(demo mode)'}
                </p>
                <p className="text-ui-text-muted">
                  Root: {result.merkleRoot.slice(0, 12)}...{result.merkleRoot.slice(-8)}
                </p>
                {result.txHash ? (
                  <p className="font-mono text-ui-text-muted">
                    Tx: {shortTxHash(result.txHash)}{result.blockHeight ? ` @ ${result.blockHeight}` : ''}
                  </p>
                ) : null}
                {result.grantsReleased > 0 ? (
                  <p className="font-medium text-who-blue">${result.grantsReleased} in grants released</p>
                ) : null}
                {result.flaggedCount > 0 ? (
                  <p className="text-who-orange">{result.flaggedCount} records flagged for review</p>
                ) : null}
                {result.mode === 'onchain' && result.explorerUrl ? (
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-who-blue hover:underline"
                  >
                    View on XION Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="inline-flex items-center gap-1 text-ui-text-muted">
                    <Link2 className="h-3 w-3" />
                    Demo mode sync completed locally.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="inline-flex items-center gap-1 font-semibold text-who-red">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Sync failed
                </p>
                {(result.errors ?? []).slice(0, 3).map((error: string) => (
                  <p key={error} className="text-who-red">
                    - {error}
                  </p>
                ))}
              </>
            )}'''

ui_block_new = '''            {result.success ? (
              <>
                <p className="font-semibold text-who-green">
                  Sync complete
                </p>
                <p className="text-ui-text-muted mt-1">
                  Vaccination records stored {result.mode === 'onchain' ? 'on-chain' : '(demo mode)'}
                </p>
                {result.phaseB?.skipped && (
                  <p className="text-who-orange mt-1">
                    Payout skipped (no valid patient payout account)
                  </p>
                )}
                <div className="mt-2 text-ui-text-muted">
                  <p>Root: {result.merkleRoot.slice(0, 12)}...{result.merkleRoot.slice(-8)}</p>
                  {result.txHash ? (
                    <p className="font-mono">
                      Tx: {shortTxHash(result.txHash)}{result.blockHeight ? ` @ ${result.blockHeight}` : ''}
                    </p>
                  ) : null}
                </div>
                {result.grantsReleased > 0 ? (
                  <p className="font-medium text-who-blue mt-1">${result.grantsReleased} in grants released</p>
                ) : null}
                {result.flaggedCount > 0 ? (
                  <p className="text-who-orange mt-1">{result.flaggedCount} records flagged for review</p>
                ) : null}
                <div className="mt-2">
                {result.mode === 'onchain' && result.explorerUrl ? (
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-who-blue hover:underline"
                  >
                    View on XION Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="inline-flex items-center gap-1 text-ui-text-muted">
                    <Link2 className="h-3 w-3" />
                    Demo mode sync completed locally.
                  </p>
                )}
                </div>
              </>
            ) : (
              <>
                <p className="inline-flex items-center gap-1 font-semibold text-who-red">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Sync failed
                </p>
                {(result.errors ?? []).slice(0, 3).map((error: string) => (
                  <p key={error} className="text-who-red">
                    - {error}
                  </p>
                ))}
              </>
            )}'''

content = content.replace(ui_block_old, ui_block_new)

# Update STEP_LABELS rendering if Phase B is skipped.
# Actually, the user said:
# This line: "Verifying milestones and grants"
# Should become: greyed out OR "Skipped (no payout account)" NOT part of failure path.
# Where is this step rendered?
#                     <span
#                       className={
#                         done
#                           ? 'text-who-green'
#                           : current
#                           ? 'text-ui-text'
#                           : 'text-gray-400'
#                       }
#                     >
#                       {STEP_LABELS[stepKey]}
#                     </span>
# We can change it!

step_render_old = '''                    <span
                      className={
                        done
                          ? 'text-who-green'
                          : current
                          ? 'text-ui-text'
                          : 'text-gray-400'
                      }
                    >
                      {STEP_LABELS[stepKey]}
                    </span>'''

step_render_new = '''                    <span
                      className={
                        done
                          ? 'text-who-green'
                          : current
                          ? 'text-ui-text'
                          : 'text-gray-400'
                      }
                    >
                      {stepKey === 5 && result?.phaseB?.skipped && done ? 'Skipped (no payout account)' : STEP_LABELS[stepKey]}
                    </span>'''

content = content.replace(step_render_old, step_render_new)

with open('components/shared/SyncPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
