'use client';

import Link from 'next/link';
import { useState } from 'react';
import { db } from '@/lib/db/schema';
import { QRScanner } from '@/components/shared/QRScanner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PatientLookupPage() {
  const [phone, setPhone] = useState('+234');
  const [resultId, setResultId] = useState<string | null>(null);

  const searchByPhone = async () => {
    const patient = await db.patients.where('parentPhone').equals(phone).first();
    setResultId(patient?.healthDropId ?? null);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Lookup Patient Record</h1>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-gray-600">Search by phone</p>
            <div className="flex gap-2">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
              <Button onClick={searchByPhone}>Find</Button>
            </div>

            <p className="text-sm text-gray-600">Or scan QR</p>
            <QRScanner onScan={(value) => setResultId(value)} />
          </CardContent>
        </Card>

        {resultId ? (
          <Link href={`/record/${resultId}`}>
            <Button className="w-full">Open Record: {resultId}</Button>
          </Link>
        ) : null}
      </div>
    </main>
  );
}


