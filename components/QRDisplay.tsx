'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Printer, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface QRDisplayProps {
  healthDropId: string;
  patientName: string;
  size?: number;
}

export function QRDisplay({ healthDropId, patientName, size = 256 }: QRDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  
  const getQRUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/record/${healthDropId}`;
    }
    return `/record/${healthDropId}`;
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `vite-${healthDropId}.png`;
      link.href = pngData;
      link.click();
      toast.success('QR code downloaded');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=400,height=500');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups.');
      return;
    }

    const svg = qrRef.current?.querySelector('svg')?.outerHTML || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VITE Health Card - ${healthDropId}</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 40px; }
            h1 { font-size: 24px; margin-bottom: 8px; color: #007B83; }
            h2 { font-size: 16px; margin-bottom: 24px; font-weight: normal; color: #666; }
            .id { font-size: 20px; font-weight: bold; margin-top: 16px; }
            .note { font-size: 12px; color: #999; margin-top: 24px; }
          </style>
        </head>
        <body>
          <h1>VITE Health</h1>
          <h2>${patientName}</h2>
          ${svg}
          <p class="id">${healthDropId}</p>
          <p class="note">Scan to view vaccination records</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShare = async () => {
    const url = getQRUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VITE Health Record - ${patientName}`,
          text: `View vaccination records for ${patientName} (${healthDropId})`,
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="flex flex-col items-center gap-4 p-6">
        <div ref={qrRef} className="bg-white p-4 rounded-lg">
          <QRCodeSVG
            value={getQRUrl()}
            size={size}
            level="H"
            includeMargin
            bgColor="#FFFFFF"
            fgColor="#007B83"
          />
        </div>
        
        <div className="text-center">
          <p className="font-semibold text-lg text-foreground">{patientName}</p>
          <p className="text-sm text-muted-foreground font-mono">{healthDropId}</p>
        </div>

        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

