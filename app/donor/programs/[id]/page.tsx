'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { db } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { sendSMS } from '@/lib/notifications/sms';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export default function ProgramDetailPage() {
  useAuth('donor');
  const mounted = useMounted();
  const params = useParams();
  const id = params.id as string;
  const [open, setOpen] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicLocation, setClinicLocation] = useState('');

  const program = useLiveQuery(() => db.programs.get(id), [id]);
  const patients = useLiveQuery(() => db.patients.where('programId').equals(id).toArray(), [id]);
  const grants = useLiveQuery(async () => {
    const enrolledIds = (patients ?? []).map((patient) => patient.id);
    if (!enrolledIds.length) return [];
    return db.grantReleases.where('patientId').anyOf(enrolledIds).toArray();
  }, [patients]);
  const clinics = useLiveQuery(() => db.clinics.toArray(), []);

  if (!mounted || !program) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 md:px-8">
        <Card>
          <CardContent className="p-4">
            <h1 className="text-2xl font-semibold text-gray-900">{program.name}</h1>
            <p className="text-sm text-gray-600">Status: {program.status} • Created {new Date(program.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Vaccine</th>
                    <th className="px-3 py-2">Dose</th>
                    <th className="px-3 py-2">Grant</th>
                    <th className="px-3 py-2">Completed</th>
                    <th className="px-3 py-2">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {program.milestones.map((milestone) => (
                    <tr key={milestone.id} className="border-t border-gray-200">
                      <td className="px-3 py-2">{milestone.name}</td>
                      <td className="px-3 py-2">{milestone.vaccineName}</td>
                      <td className="px-3 py-2">{milestone.doseNumber}</td>
                      <td className="px-3 py-2">${milestone.grantAmount}</td>
                      <td className="px-3 py-2">{milestone.completedCount}</td>
                      <td className="px-3 py-2">{milestone.pendingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrolled Patients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(patients ?? []).map((patient) => (
              <div key={patient.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <p className="font-semibold text-gray-900">{patient.name}</p>
                <p className="font-mono text-xs text-gray-600">{patient.healthDropId}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(grants ?? []).map((grant) => (
              <div key={grant.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <p className="font-semibold text-gray-900">{grant.patientName}</p>
                <p className="text-xs text-gray-600">{grant.milestoneName} • ${grant.amount}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credentialed Clinics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(clinics ?? []).map((clinic) => (
              <div key={clinic.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <p className="font-semibold text-gray-900">{clinic.name}</p>
                <p className="text-xs text-gray-600">{clinic.location}</p>
              </div>
            ))}
            <Button className="w-full" onClick={() => setOpen(true)}>
              Credential New Clinic
            </Button>
          </CardContent>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Credential New Clinic">
        <div className="space-y-3">
          <Input placeholder="Clinic name" value={clinicName} onChange={(event) => setClinicName(event.target.value)} />
          <Input placeholder="Clinic email" value={clinicEmail} onChange={(event) => setClinicEmail(event.target.value)} />
          <Input placeholder="Location" value={clinicLocation} onChange={(event) => setClinicLocation(event.target.value)} />
          <Button
            className="w-full"
            onClick={async () => {
              await db.clinics.put({
                id: uuidv4(),
                name: clinicName,
                email: clinicEmail,
                location: clinicLocation,
                createdAt: new Date().toISOString(),
              });
              await sendSMS('+2348000000000', `Credentialing complete for ${clinicName}`, 'system');
              toast.success('Clinic credentialed and notification sent.');
              setOpen(false);
              setClinicName('');
              setClinicEmail('');
              setClinicLocation('');
            }}
          >
            Save Clinic Credential
          </Button>
        </div>
      </Modal>
    </main>
  );
}


