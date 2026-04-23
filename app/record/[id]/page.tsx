'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRDisplay } from '@/components/shared/QRDisplay';
import { shortTxHash } from '@/lib/utils/format';
import type { Patient, VaccinationRecord } from '@/types';

export default function PublicRecordPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = typeof params.id === 'string' ? params.id : '';
  const id = idParam.toUpperCase();

  const [mounted, setMounted] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [manualId, setManualId] = useState('');
  const [verification, setVerification] = useState<{ merkleRoot: string; txHash: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const load = async () => {
      const found = await db.patients.where('healthDropId').equals(id).first();
      if (!found) {
        setPatient(null);
        setRecords([]);
        setVerification(null);
        return;
      }
      setPatient(found);
      const history = await db.vaccinations.where('patientId').equals(found.id).sortBy('dateAdministered');
      setRecords(history);

      const firstSyncedRecord = history.find((item) => item.syncStatus === 'synced');
      if (!firstSyncedRecord) {
        setVerification(null);
        return;
      }

      const batches = await db.syncBatches.toArray();
      const sourceBatch = batches.find((batch) =>
        batch.records.some((record) => record.id === firstSyncedRecord.id)
      );

      setVerification({
        merkleRoot: sourceBatch?.merkleRoot ?? 'N/A',
        txHash: firstSyncedRecord.xionTxHash ?? sourceBatch?.xionTxHash ?? 'N/A',
      });
    };

    load().catch(() => undefined);
  }, [id, mounted]);

  const anySynced = useMemo(() => records.some((record) => record.syncStatus === 'synced'), [records]);
  const firstSynced = useMemo(() => records.find((record) => record.syncStatus === 'synced'), [records]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="border-b border-gray-200 bg-white px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Image src="/logo.png" alt="VITE logo" width={36} height={36} className="rounded-md" />
          <div>
            <p className="text-lg font-semibold text-teal-dark">VITE Health</p>
            <p className="text-sm text-gray-600">Verified health record</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-4 px-4 py-4 md:px-8">
        {!patient ? (
          <div className="flex min-h-[65vh] items-center justify-center p-6">
            <div className="w-full max-w-sm text-center">
              <div className="mb-4 text-5xl">?</div>
              <h2 className="mb-2 text-xl font-bold text-gray-800">Record Not Found</h2>
              <p className="mb-6 text-sm text-gray-500">No vaccination record found for ID: {id || 'Unknown'}</p>
              <Input
                placeholder="Enter Health ID (e.g. VITE-ADE001)"
                value={manualId}
                onChange={(event) => setManualId(event.target.value.toUpperCase())}
                className="mb-3 text-center font-mono"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const value = (event.target as HTMLInputElement).value.trim().toUpperCase();
                    if (value) {
                      router.push(`/record/${value}`);
                    }
                  }
                }}
              />
              <Button
                className="w-full"
                onClick={() => {
                  const value = manualId.trim().toUpperCase();
                  if (value) router.push(`/record/${value}`);
                }}
              >
                Search
              </Button>
              <p className="mt-2 text-xs text-gray-400">Press Enter to search</p>
            </div>
          </div>
        ) : (
          <>
            <Card className="border-teal-100 bg-teal-50">
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div>
                  <h1 className="text-2xl font-bold text-teal-dark">{patient.name}</h1>
                  <p className="font-mono text-sm text-teal-dark">{patient.healthDropId}</p>
                  <p className="text-sm text-teal-dark/80">DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" /> Verified health record
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vaccination History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">
                        {record.vaccineName} Dose {record.doseNumber}
                      </p>
                      <Badge variant={record.syncStatus === 'synced' ? 'synced' : 'pending'}>
                        {record.syncStatus === 'synced' ? 'Verified on XION' : 'Pending Sync'}
                      </Badge>
                    </div>
                    <p className="text-gray-600">Date: {new Date(record.dateAdministered).toLocaleDateString()}</p>
                    <p className="text-gray-600">Clinic: {record.clinicName ?? record.clinicId}</p>
                    <p className="text-gray-600">Administered by: {record.administeredBy}</p>
                    <p className="text-gray-600">Lot: {record.lotNumber}</p>
                    {record.xionTxHash ? (
                      <p className="font-mono text-xs text-teal-dark">
                        Tx: <Link href={`https://explorer.burnt.com/tx/${record.xionTxHash}`} target="_blank">{shortTxHash(record.xionTxHash)}</Link>
                      </p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            {anySynced ? (
              <Card className="border-teal-100 bg-white">
                <CardContent className="space-y-1 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-teal-dark">Blockchain verification</p>
                  <p>This record is anchored on the XION blockchain.</p>
                  <p>
                    Merkle root:{' '}
                    {verification?.merkleRoot && verification.merkleRoot !== 'N/A'
                      ? `${verification.merkleRoot.slice(0, 14)}...${verification.merkleRoot.slice(-8)}`
                      : 'N/A'}
                  </p>
                  <p>Tx: {verification?.txHash ?? firstSynced?.xionTxHash ?? 'N/A'}. Independently verifiable.</p>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Share record</CardTitle>
              </CardHeader>
              <CardContent>
                <QRDisplay healthDropId={patient.healthDropId} patientName={patient.name} />
              </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-500">Powered by VITE Health</p>
          </>
        )}
      </section>
    </main>
  );
}


