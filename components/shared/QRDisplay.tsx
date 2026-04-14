'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { buildRecordUrl } from '@/lib/utils/qr';

interface QRDisplayProps {
  healthDropId: string;
  patientName?: string;
  size?: number;
}

export function QRDisplay({ healthDropId, patientName, size = 200 }: QRDisplayProps) {
  const relativeUrl = buildRecordUrl(healthDropId);
  const value =
    typeof window !== 'undefined'
      ? new URL(relativeUrl, window.location.origin).toString()
      : relativeUrl;
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const downloadQr = () => {
    const svg = wrapperRef.current?.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const markup = serializer.serializeToString(svg);
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${healthDropId}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
      <div ref={wrapperRef} className="inline-flex">
        <QRCodeSVG value={value} size={size} includeMargin />
      </div>
      <p className="mt-3 text-sm font-medium text-gray-900">{patientName ?? 'Patient QR'}</p>
      <p className="font-mono text-xs text-gray-500">{healthDropId}</p>
      <button
        type="button"
        onClick={downloadQr}
        className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-teal-primary px-3 text-xs font-semibold text-teal-primary hover:bg-teal-50"
      >
        Download QR
      </button>
    </div>
  );
}
