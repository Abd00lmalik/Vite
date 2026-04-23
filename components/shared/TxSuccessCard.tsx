import { CheckCircle, ExternalLink } from 'lucide-react';
import { explorerTxUrl } from '@/lib/xion/config';

interface TxSuccessCardProps {
  txHash:  string;
  title:   string;
  details?: { label: string; value: string }[];
}

export function TxSuccessCard({ txHash, title, details = [] }: TxSuccessCardProps) {
  return (
    <div className="border border-who-green bg-who-green-light rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="h-6 w-6 text-who-green flex-shrink-0" />
        <p className="font-semibold text-ui-text">{title}</p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-ui-text-muted">Transaction Hash</span>
          <span className="font-mono text-xs text-ui-text">
            {txHash.slice(0, 12)}...{txHash.slice(-10)}
          </span>
        </div>
        {details.map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-ui-text-muted">{label}</span>
            <span className="font-medium text-ui-text">{value}</span>
          </div>
        ))}
      </div>

      <a
        href={explorerTxUrl(txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-who-blue
                   font-medium hover:underline"
      >
        View on XION Explorer
        <ExternalLink className="h-3.5 w-3.5" />
      </a>

      <p className="text-xs text-ui-text-muted mt-3">
        Transaction confirmed on XION testnet-2 · Powered by Abstraxion
      </p>
    </div>
  );
}



