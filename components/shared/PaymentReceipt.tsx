import { formatCurrency, formatDateTime } from '@/lib/utils/format';

interface PaymentReceiptProps {
  amount: number;
  phone: string;
  patientName: string;
  transactionId: string;
  provider: string;
  timestamp: string;
}

function maskPhone(phone: string) {
  const compact = phone.replace(/\s+/g, '');
  if (compact.length <= 4) return compact;
  return `${compact.slice(0, Math.max(0, compact.length - 4)).replace(/\d/g, 'X')}${compact.slice(-4)}`;
}

export function PaymentReceipt({
  amount,
  phone,
  patientName,
  transactionId,
  provider,
  timestamp,
}: PaymentReceiptProps) {
  const ngnEquivalent = amount * 1550;

  return (
    <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-teal-dark">Ã¢Å“â€œ VITE Health Grant Redeemed</h3>
      <div className="mt-4 space-y-2 text-sm text-gray-700">
        <p>Amount: {formatCurrency(amount, 'USD')} ({formatCurrency(ngnEquivalent, 'NGN')} equiv.)</p>
        <p>To: {maskPhone(phone)}</p>
        <p>Patient: {patientName}</p>
        <p>Provider: {provider}</p>
        <p>Ref: {transactionId}</p>
        <p>{formatDateTime(timestamp)}</p>
      </div>
      <div className="mt-4 border-t border-ui-border pt-3 text-xs font-medium text-who-blue">
        Verified on XION Testnet-2 Ã‚Â· Vite Protocol
      </div>
    </div>
  );
}



