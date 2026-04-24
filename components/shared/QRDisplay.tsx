'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { buildRecordUrl } from '@/lib/utils/qr';

interface QRDisplayProps {
  healthDropId: string;
  patientName?: string;
  size?: number;
  beneficiary?: string;
}

function maskLink(value: string) {
  return value.length > 48 ? `${value.slice(0, 44)}...` : value;
}

export function QRDisplay({ healthDropId, patientName, size = 240, beneficiary }: QRDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const value = useMemo(() => {
    return JSON.stringify({
      type: 'record',
      id: healthDropId,
      beneficiary: beneficiary || null,
      timestamp: new Date().toISOString(),
    });
  }, [healthDropId, beneficiary]);

  const recordUrl = useMemo(() => {
    const relativeUrl = buildRecordUrl(healthDropId);
    if (!mounted || typeof window === 'undefined') return relativeUrl;
    return new URL(relativeUrl, window.location.origin).toString();
  }, [healthDropId, mounted]);

  const svgId = `qr-code-svg-${healthDropId}`;

  const downloadQR = () => {
    const svg = document.querySelector(`#${svgId}`) as SVGSVGElement | null;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) return;

    const image = new Image();
    const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const objectUrl = URL.createObjectURL(svgBlob);

    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const anchor = document.createElement('a');
      anchor.download = `VITE-${healthDropId}.png`;
      anchor.href = canvas.toDataURL('image/png');
      anchor.click();

      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  };

  const shareQR = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'VITE Health Record',
          text: `Health ID: ${healthDropId}`,
          url: recordUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(recordUrl);
      toast.success('Record link copied to clipboard');
    } catch {
      toast.error('Unable to share this QR link');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: 'easeOut' }}
      className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm"
    >
      <div className="inline-flex rounded-lg bg-white p-2">
        <QRCodeSVG id={svgId} value={value} size={Math.max(size, 240)} includeMargin />
      </div>
      <p className="mt-3 text-sm font-medium text-gray-900">{patientName ?? 'Patient QR'}</p>
      <p className="font-mono text-xs text-gray-500">{healthDropId}</p>
      <p className="mt-1 text-xs text-gray-500">{maskLink(recordUrl)}</p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={downloadQR}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-teal-primary px-3 text-xs font-semibold text-teal-primary hover:bg-teal-50"
        >
          Download QR (PNG)
        </button>
        <button
          type="button"
          onClick={shareQR}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-primary px-3 text-xs font-semibold text-white hover:bg-teal-dark"
        >
          Share QR Link
        </button>
      </div>
    </motion.div>
  );
}



