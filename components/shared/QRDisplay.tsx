'use client';

import { QRCodeSVG } from 'qrcode.react';
import { buildRecordUrl } from '@/lib/utils/qr';

interface QRDisplayProps {
  healthDropId: string;
  patientName?: string;
  size?: number;
}

export function QRDisplay({ healthDropId, patientName, size = 200 }: QRDisplayProps) {
  const value = buildRecordUrl(healthDropId);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
      <QRCodeSVG value={value} size={size} includeMargin />
      <p className="mt-3 text-sm font-medium text-gray-900">{patientName ?? 'Patient QR'}</p>
      <p className="font-mono text-xs text-gray-500">{healthDropId}</p>
    </div>
  );
}

