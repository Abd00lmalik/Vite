'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { GrantEscrow } from '@/lib/blockchain/contracts';
import { sendSMS } from '@/lib/notifications/sms';
import type { Milestone, Program } from '@/types';

interface DraftMilestone {
  id: string;
  name: string;
  vaccineName: string;
  doseNumber: number;
  grantAmount: number;
}

const defaultMilestones: DraftMilestone[] = [
  { id: uuidv4(), name: 'Milestone 1', vaccineName: 'DTP', doseNumber: 1, grantAmount: 3 },
  { id: uuidv4(), name: 'Milestone 2', vaccineName: 'DTP', doseNumber: 2, grantAmount: 3 },
  { id: uuidv4(), name: 'Milestone 3', vaccineName: 'Measles', doseNumber: 1, grantAmount: 5 },
];

export function ProgramCreateForm() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [step, setStep] = useState(1);
  const [funding, setFunding] = useState(false);
  const [escrowTx, setEscrowTx] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState<'vaccination completion' | 'antenatal visits' | 'child growth'>('vaccination completion');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('State');
  const [enrollmentType, setEnrollmentType] = useState<'partner clinics only' | 'open enrollment'>('partner clinics only');
  const [estimatedEnrollment, setEstimatedEnrollment] = useState(400);
  const [milestones, setMilestones] = useState<DraftMilestone[]>(defaultMilestones);

  const totalPerChild = useMemo(() => milestones.reduce((sum, item) => sum + item.grantAmount, 0), [milestones]);
  const requiredEscrow = useMemo(() => totalPerChild * estimatedEnrollment, [estimatedEnrollment, totalPerChild]);

  const fundEscrow = async () => {
    setFunding(true);
    const result = await GrantEscrow.fundEscrow('draft-program', requiredEscrow, session?.userId ?? 'donor-001');
    setEscrowTx(result.txHash);
    setFunding(false);
    toast.success(`Escrow funded. Tx: ${result.txHash.slice(0, 12)}... [SIMULATED]`);
  };

  const createProgram = async () => {
    if (!session) return;

    const programId = uuidv4();
    const fullMilestones: Milestone[] = milestones.map((item) => ({
      id: item.id,
      programId,
      name: item.name,
      description: `${item.vaccineName} dose ${item.doseNumber}`,
      vaccineName: item.vaccineName,
      doseNumber: item.doseNumber,
      grantAmount: item.grantAmount,
      completedCount: 0,
      pendingCount: 0,
    }));

    const program: Program = {
      id: programId,
      name,
      donorId: session.userId,
      donorName: session.organizationName ?? session.name,
      type,
      description,
      geographicScope: [scope],
      enrollmentType,
      escrowBalance: requiredEscrow,
      totalReleased: 0,
      milestones: fullMilestones,
      enrolledPatients: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await db.programs.put(program);
    await db.milestones.bulkPut(fullMilestones);
    await db.auditLogs.put({
      id: uuidv4(),
      entityId: program.id,
      entityType: 'program',
      action: `Program created with ${fullMilestones.length} milestones`,
      performedBy: session.userId,
      timestamp: new Date().toISOString(),
    });

    const clinics = await db.clinics.toArray();
    for (const clinic of clinics) {
      await sendSMS('+2348000000000', `New program available: ${program.name}`, 'system');
      await db.notifications.put({
        id: uuidv4(),
        userId: clinic.id,
        type: 'system',
        message: `New program available for clinic onboarding: ${program.name}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    toast.success('Program created successfully.');
    router.push(`/donor/programs/${program.id}`);
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Step {step} of 3</p>
          <ProgressBar value={(step / 3) * 100} className="mt-2" />
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Program name</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Program type</label>
              <Select
                value={type}
                onChange={(event) => setType(event.target.value as typeof type)}
                options={[
                  { value: 'vaccination completion', label: 'vaccination completion' },
                  { value: 'antenatal visits', label: 'antenatal visits' },
                  { value: 'child growth', label: 'child growth' },
                ]}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="min-h-[96px] w-full rounded-lg border border-gray-300 p-3 text-base"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Geographic scope</label>
              <Select
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                options={[
                  { value: 'LGA', label: 'LGA' },
                  { value: 'State', label: 'State' },
                  { value: 'National', label: 'National' },
                ]}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Enrollment type</label>
              <Select
                value={enrollmentType}
                onChange={(event) => setEnrollmentType(event.target.value as typeof enrollmentType)}
                options={[
                  { value: 'partner clinics only', label: 'partner clinics only' },
                  { value: 'open enrollment', label: 'open enrollment' },
                ]}
              />
            </div>
            <Button type="button" className="w-full" onClick={() => setStep(2)}>
              Next: Milestones
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-4">
                <Input
                  value={milestone.name}
                  onChange={(event) => {
                    const next = [...milestones];
                    next[index] = { ...next[index], name: event.target.value };
                    setMilestones(next);
                  }}
                  placeholder="Milestone name"
                />
                <Select
                  value={milestone.vaccineName}
                  onChange={(event) => {
                    const next = [...milestones];
                    next[index] = { ...next[index], vaccineName: event.target.value };
                    setMilestones(next);
                  }}
                  options={[
                    { value: 'DTP', label: 'DTP' },
                    { value: 'OPV', label: 'OPV' },
                    { value: 'Measles', label: 'Measles' },
                    { value: 'BCG', label: 'BCG' },
                    { value: 'Yellow Fever', label: 'Yellow Fever' },
                  ]}
                />
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={milestone.doseNumber}
                  onChange={(event) => {
                    const next = [...milestones];
                    next[index] = { ...next[index], doseNumber: Number(event.target.value) || 1 };
                    setMilestones(next);
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  value={milestone.grantAmount}
                  onChange={(event) => {
                    const next = [...milestones];
                    next[index] = { ...next[index], grantAmount: Number(event.target.value) || 0 };
                    setMilestones(next);
                  }}
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                setMilestones((prev) => [
                  ...prev,
                  { id: uuidv4(), name: `Milestone ${prev.length + 1}`, vaccineName: 'DTP', doseNumber: 1, grantAmount: 3 },
                ])
              }
            >
              Add Milestone
            </Button>

            <p className="text-sm text-gray-700">Total per child: ${totalPerChild.toFixed(2)} if all milestones are completed.</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" className="w-full" onClick={() => setStep(3)}>
                Next: Fund Escrow
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estimated enrollment (children)</label>
              <Input
                type="number"
                value={estimatedEnrollment}
                onChange={(event) => setEstimatedEnrollment(Number(event.target.value) || 0)}
              />
            </div>
            <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-dark">
              Required escrow: ${requiredEscrow.toFixed(2)} (enrollment x ${totalPerChild.toFixed(2)})
            </div>

            <Button type="button" className="w-full" onClick={fundEscrow} loading={funding}>
              Fund Escrow via XION
            </Button>
            {escrowTx ? <p className="text-xs font-mono text-gray-600">Escrow funded. Tx: {escrowTx} [SIMULATED]</p> : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button" className="w-full" onClick={createProgram}>
                Create Program
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}


