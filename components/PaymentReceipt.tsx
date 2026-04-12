'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentReceiptProps {
  amount: number;
  phone: string;
  patientName: string;
  transactionId: string;
  provider: string;
  timestamp: string;
}

export function PaymentReceipt({
  amount,
  phone,
  patientName,
  transactionId,
  provider,
  timestamp,
}: PaymentReceiptProps) {
  // Mask phone number for privacy
  const maskedPhone = phone.replace(/(\+\d{3})\d{6}(\d{4})/, '$1******$2');

  return (
    <Card className="w-full max-w-sm mx-auto border-2 border-dashed border-green-300 bg-green-50 relative overflow-hidden">
      {/* Simulated watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <span className="text-6xl font-bold text-green-800 rotate-[-30deg]">SIMULATED</span>
      </div>

      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">VITE Health Grant Released</h3>
            <p className="text-xs text-green-600">Mobile Money Transfer</p>
          </div>
        </div>

        {/* Receipt details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-lg text-green-700">${amount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="font-medium">{maskedPhone}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Patient</span>
            <span className="font-medium">{patientName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Provider</span>
            <span className="font-medium">{provider}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono text-xs">{transactionId}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">
              {format(new Date(timestamp), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </div>

        {/* Simulated notice */}
        <div className="mt-6 pt-4 border-t border-green-200">
          <p className="text-xs text-center text-green-700 font-medium">
            SIMULATED - Demo Only
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            In production, funds transfer via M-Pesa, Airtel Money, or bank
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

