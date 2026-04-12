'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, X, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface QRScannerProps {
  onScan: (healthDropId: string) => void;
  onClose?: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-scanner-container';

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setCameraError(false);
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Extract healthDropId from URL or direct ID
          let healthDropId = decodedText;
          if (decodedText.includes('/record/')) {
            healthDropId = decodedText.split('/record/').pop() || '';
          }
          if (healthDropId.startsWith('HD-') || healthDropId.startsWith('hd-')) {
            html5QrCode.stop().then(() => {
              setIsScanning(false);
              onScan(healthDropId.toUpperCase());
            });
          }
        },
        () => {
          // Ignore scan failures
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(true);
      toast.error('Camera access denied. Use manual entry.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualInput.trim();
    if (query) {
      onScan(query);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-4">
        {!isScanning && !cameraError ? (
          <div className="flex flex-col gap-4">
            <Button
              onClick={startScanning}
              className="w-full bg-[#007B83] hover:bg-[#005A61] text-white"
            >
              <Camera className="h-5 w-5 mr-2" />
              Scan QR Code
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Phone or Health ID (HD-...)"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {isScanning && (
              <>
                <div
                  id={containerId}
                  className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100"
                />
                <Button variant="outline" onClick={stopScanning} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Stop Scanning
                </Button>
              </>
            )}

            {cameraError && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Camera unavailable. Enter Health ID or phone number:
                </p>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Phone or Health ID (HD-...)"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full mt-4 text-muted-foreground"
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

