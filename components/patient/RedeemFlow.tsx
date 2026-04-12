'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentReceipt } from '@/components/shared/PaymentReceipt';
import { db } from '@/lib/db/schema';
import { SMS } from '@/lib/notifications/sms';
import type { GrantRelease, Patient } from '@/types';

interface RedeemFlowProps {
  patient: Patient;
  grants: GrantRelease[];
  onComplete: () => void;
}

export function RedeemFlow({ patient, grants, onComplete }: RedeemFlowProps) {
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');
  const [phone, setPhone] = useState(patient.parentPhone);
  const [receiptId, setReceiptId] = useState('');
  const available = grants.filter((grant) => grant.status === 'released');
  const amount = available.reduce((sum, grant) => sum + grant.amount, 0);

  if (step === 'success') {
    return (
      <PaymentReceipt
        amount={amount}
        phone={phone}
        patientName={patient.name}
        provider="OPay (Simulated)"
        transactionId={receiptId}
        timestamp={new Date().toISOString()}
      />
    );
  }

  if (step === 'processing') {
    return (
      <Card>
        <CardContent className="space-y-3 p-5 text-sm text-gray-700">
          <p>Processing your transfer...</p>
          <p>Verifying your account...</p>
          <p>Initiating mobile money transfer...</p>
          <div className="h-1 w-full overflow-hidden rounded bg-gray-200">
            <div className="h-1 w-1/2 animate-pulse rounded bg-teal-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm text-gray-700">You have ${amount.toFixed(2)} available. Confirm transfer to this number.</p>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="h-12 w-full rounded-lg border border-gray-300 px-3 text-base"
        />
        <Button
          className="w-full"
          onClick={async () => {
            setStep('processing');
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const transactionId = `VH-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
            for (const grant of available) {
              await db.grantReleases.update(grant.id, {
                status: 'redeemed',
                mobileMoneyReceipt: {
                  transactionId,
                  phone,
                  amount: grant.amount,
                  currency: 'USD',
                  provider: 'OPay (Simulated)',
                  timestamp: new Date().toISOString(),
                  status: 'success',
                },
              });
            }

            await SMS.redemption(phone, amount, phone);
            setReceiptId(transactionId);
            setStep('success');
            toast.success('Transfer confirmed.');
            onComplete();
          }}
        >
          Confirm Redemption
        </Button>
      </CardContent>
    </Card>
  );
}


