import { format } from 'date-fns';

export function formatCurrency(amount: number, currency: 'USD' | 'NGN' = 'USD'): string {
  if (currency === 'NGN') {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string): string {
  return format(new Date(value), 'dd MMM yyyy');
}

export function formatDateTime(value: string): string {
  return format(new Date(value), 'dd MMM yyyy, HH:mm');
}

export function formatPhone(value: string): string {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized.startsWith('+234') || normalized.length < 14) {
    return normalized;
  }
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 10)} ${normalized.slice(10)}`;
}

export function shortTxHash(txHash?: string): string {
  if (!txHash) return 'N/A';
  if (txHash.length <= 16) return txHash;
  return `${txHash.slice(0, 8)}...${txHash.slice(-4)}`;
}




