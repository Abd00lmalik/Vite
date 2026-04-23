'use client';
import { useXion } from '@/hooks/useXion';
import { useXionBalance } from '@/hooks/useXion';
import { XION } from '@/lib/xion/config';
import { useState } from 'react';

export function XionConnectButton({ compact = false }: { compact?: boolean }) {
  const { address, login, disconnect, isLoading, isConnected, explorerUrl } =
    useXion();
  const { balance } = useXionBalance(address);
  const [showMenu, setShowMenu] = useState(false);

  if (isConnected && address) {
    const uxionBalance = balance
      ? (parseInt(balance) / 1_000_000).toFixed(4)
      : '...';

    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 bg-who-blue-light border border-who-blue
                     text-who-blue px-3 py-2 rounded text-sm font-medium
                     hover:bg-who-blue/10 transition-colors"
        >
          <span className="h-2 w-2 bg-who-green rounded-full" />
          <span className="hidden sm:inline">
            {address.slice(0, 8)}...{address.slice(-6)}
          </span>
          <span className="sm:hidden">Connected</span>
          {!compact && (
            <span className="text-xs text-who-blue/70 border-l border-who-blue/30 pl-2">
              {uxionBalance} XION
            </span>
          )}
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border
                          border-ui-border rounded-lg shadow-modal z-50 p-4">
            <div className="mb-3">
              <p className="text-xs text-ui-text-muted mb-1">Connected Address</p>
              <p className="text-sm font-mono text-ui-text break-all">{address}</p>
            </div>
            <div className="mb-3 p-3 bg-ui-bg rounded border border-ui-border">
              <p className="text-xs text-ui-text-muted mb-1">Balance</p>
              <p className="text-lg font-bold text-who-blue">{uxionBalance} XION</p>
              <p className="text-xs text-ui-text-muted">({balance ?? '0'} uxion)</p>
            </div>
            <div className="flex gap-2">
              <a
                href={explorerUrl ?? '#'}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 text-center text-xs text-who-blue border
                           border-who-blue py-2 rounded hover:bg-who-blue-light
                           transition-colors"
              >
                View on Explorer
              </a>
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="flex-1 text-center text-xs text-who-red border
                           border-who-red py-2 rounded hover:bg-who-red-light
                           transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => login()}
      disabled={isLoading}
      className="btn-primary text-sm flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting...
        </>
      ) : (
        'Connect XION Account'
      )}
    </button>
  );
}



