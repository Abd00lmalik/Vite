'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Phone, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseHealthIdFromScan } from '@/lib/utils/qr';

interface QRScannerProps {
  onScan: (value: string) => void;
  onManualPhoneLookup?: (phone: string) => void;
}

export function QRScanner({ onScan, onManualPhoneLookup }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const scannerInstanceRef = useRef<unknown>(null);

  const [manualValue, setManualValue] = useState('');
  const [manualPhone, setManualPhone] = useState('+234');
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    setReady(true);
    return () => {
      const scanner = scannerInstanceRef.current as { stop?: () => Promise<void> } | null;
      if (scanner?.stop) {
        scanner.stop().catch(() => undefined);
      }
    };
  }, []);

  const startScanner = async () => {
    if (!ready || running || !scannerRef.current) return;

    setCameraError('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('vite-qr-reader');
      scannerInstanceRef.current = scanner;
      setRunning(true);

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        async (decodedText) => {
          await scanner.stop().catch(() => undefined);
          setRunning(false);
          onScan(parseHealthIdFromScan(decodedText));
        },
        () => undefined
      );
    } catch {
      setRunning(false);
      setCameraError('Camera unavailable. Use manual phone lookup instead.');
    }
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

      {cameraError ? (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">{cameraError}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              placeholder="Enter parent phone number"
              value={manualPhone}
              onChange={(event) => setManualPhone(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onManualPhoneLookup) {
                  onManualPhoneLookup(manualPhone.trim());
                  return;
                }
                onScan(parseHealthIdFromScan(manualPhone));
              }}
              className="w-full sm:w-auto"
            >
              <Phone className="mr-2 h-4 w-4" />
              Find by Phone
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
