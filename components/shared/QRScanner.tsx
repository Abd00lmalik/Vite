'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseHealthIdFromScan } from '@/lib/utils/qr';

interface QRScannerProps {
  onScan: (value: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const startScanner = async () => {
    if (!ready || running || !scannerRef.current) return;

    const { Html5Qrcode } = await import('html5-qrcode');
    const scanner = new Html5Qrcode('vite-qr-reader');

    setRunning(true);

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          scanner.stop().catch(() => undefined);
          setRunning(false);
          onScan(parseHealthIdFromScan(decodedText));
        },
        () => undefined
      )
      .catch(() => {
        setRunning(false);
      });
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div id="vite-qr-reader" ref={scannerRef} className="overflow-hidden rounded-lg bg-gray-50" />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          placeholder="Paste QR payload or Health ID"
          value={manualValue}
          onChange={(event) => setManualValue(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => onScan(parseHealthIdFromScan(manualValue))}
          className="w-full sm:w-auto"
        >
          <ScanLine className="mr-2 h-4 w-4" />
          Use Value
        </Button>
      </div>

      <Button type="button" variant="primary" onClick={startScanner} className="w-full" loading={running}>
        <Camera className="mr-2 h-4 w-4" />
        {running ? 'Scanning...' : 'Start Camera Scan'}
      </Button>
    </div>
  );
}


