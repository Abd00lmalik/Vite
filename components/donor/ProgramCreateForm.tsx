'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useAbstraxionAccount, useAbstraxionSigningClient } from '@burnt-labs/abstraxion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { txFundProgram } from '@/lib/xion/contracts';
import { toastErrorOnce } from '@/lib/utils/toastOnce';
import type { Milestone, Program } from '@/types';

interface DraftMilestone {
  id: string;
  name: string;
  vaccineName: string;
  doseNumber: number;
  grantAmount: number;
}

const defaultMilestones: DraftMilestone[] = [
  { id: uuidv4(), name: 'Early Completion', vaccineName: 'DTP', doseNumber: 1, grantAmount: 5 },
  { id: uuidv4(), name: 'Follow-up Success', vaccineName: 'OPV', doseNumber: 2, grantAmount: 5 },
  { id: uuidv4(), name: 'Protection Milestone', vaccineName: 'Measles', doseNumber: 1, grantAmount: 10 },
];

export function ProgramCreateForm() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { client } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  
  const [step, setStep] = useState(1);
  const [funding, setFunding] = useState(false);
  const [escrowTx, setEscrowTx] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState<'vaccination completion' | 'antenatal visits' | 'child growth'>('vaccination completion');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('State');
  const [enrollmentType, setEnrollmentType] = useState<'partner clinics only' | 'open enrollment'>('partner clinics only');
  const [estimatedEnrollment, setEstimatedEnrollment] = useState(500);
  const [milestones, setMilestones] = useState<DraftMilestone[]>(defaultMilestones);

  const totalPerChild = useMemo(() => milestones.reduce((sum, item) => sum + item.grantAmount, 0), [milestones]);
  const requiredEscrowXION = useMemo(() => totalPerChild * estimatedEnrollment, [estimatedEnrollment, totalPerChild]);
  const requiredEscrowUxion = useMemo(() => (requiredEscrowXION * 1_000_000).toString(), [requiredEscrowXION]);

  const fundEscrow = async () => {
    if (!client || !account.bech32Address) {
      toastErrorOnce('Please connect your XION account first', (message) => toast.error(message));
      return;
    }
    
    setFunding(true);
    try {
      const tempProgramId = `tmp-${Date.now()}`; // For escrow setup
      const result = await txFundProgram(client, account.bech32Address, tempProgramId, requiredEscrowUxion);
      setEscrowTx(result.txHash);
      toast.success('Escrow funded successfully on-chain');
    } catch (error) {
      // Error is handled by UI toast
      toastErrorOnce('Funding failed. Verify your balance.', (message) => toast.error(message));
    } finally {
      setFunding(false);
    }
  };

  const createProgram = async () => {
    if (!session) return;
    if (!escrowTx) {
      toast.error('You must fund the escrow before creating the program');
      return;
    }

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
      escrowBalance: requiredEscrowXION,
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
      action: `Program created. XION Tx: ${escrowTx}`,
      performedBy: session.userId,
      timestamp: new Date().toISOString(),
    });

    toast.success('WHO-compliant program initialized.');
    router.push(`/donor/programs/${programId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs font-bold text-who-blue uppercase tracking-widest mb-1.5">Setup Progress: Step {step} of 3</p>
          <ProgressBar value={(step / 3) * 100} />
        </div>
      </div>

      <Card>
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-ui-text border-b border-ui-border pb-3">Program Foundations</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ui-text">Program Identifier</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Northern Region Polio Response" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ui-text">Strategic Goal</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} className="input">
                  <option value="vaccination completion">Vaccination Completion</option>
                  <option value="antenatal visits">Antenatal Visits</option>
                  <option value="child growth">Nutrition & Growth</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ui-text">Humanitarian Mission Statement</label>
              <textarea
                className="input min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the clinical impact and target population..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ui-text">Geographic Scope</label>
                <select value={scope} onChange={(e) => setScope(e.target.value)} className="input">
                  <option value="LGA">Local Government Area (LGA)</option>
                  <option value="State">Provincial / State Level</option>
                  <option value="National">National Coverage</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ui-text">Enrollment Policy</label>
                <select value={enrollmentType} onChange={(e) => setEnrollmentType(e.target.value as any)} className="input">
                  <option value="partner clinics only">Partner Clinics Only (Controlled)</option>
                  <option value="open enrollment">Open Enrollment (Public)</option>
                </select>
              </div>
            </div>
            <Button variant="primary" className="w-full h-12" onClick={() => setStep(2)}>
              Configure Grant Milestones
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-ui-text border-b border-ui-border pb-3">Grant Milestone Engineering</h3>
            <p className="text-sm text-ui-text-muted">Define conditional transfers to be triggered by verified clinical records.</p>
            
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-ui-bg p-3 rounded-lg border border-ui-border">
                  <input
                    value={milestone.name}
                    onChange={(e) => {
                      const next = [...milestones];
                      next[index].name = e.target.value;
                      setMilestones(next);
                    }}
                    className="input h-9 text-sm"
                    placeholder="Label"
                  />
                  <select
                    value={milestone.vaccineName}
                    onChange={(e) => {
                      const next = [...milestones];
                      next[index].vaccineName = e.target.value;
                      setMilestones(next);
                    }}
                    className="input h-9 text-sm"
                  >
                    <option value="DTP">DTP</option>
                    <option value="OPV">OPV</option>
                    <option value="Measles">Measles</option>
                    <option value="BCG">BCG</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ui-text-muted">Dose</span>
                    <input
                      type="number"
                      value={milestone.doseNumber}
                      onChange={(e) => {
                        const next = [...milestones];
                        next[index].doseNumber = Number(e.target.value);
                        setMilestones(next);
                      }}
                      className="input h-9 text-sm w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ui-text-muted">$</span>
                    <input
                      type="number"
                      value={milestone.grantAmount}
                      onChange={(e) => {
                        const next = [...milestones];
                        next[index].grantAmount = Number(e.target.value);
                        setMilestones(next);
                      }}
                      className="input h-9 text-sm w-full font-bold text-who-blue"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={() =>
                setMilestones((prev) => [
                  ...prev,
                  { id: uuidv4(), name: `Addition`, vaccineName: 'DTP', doseNumber: 1, grantAmount: 5 },
                ])
              }
            >
              + Add Strategic Milestone
            </Button>

            <div className="bg-who-blue-light p-4 rounded-lg flex justify-between items-center text-who-blue border border-who-blue/20">
              <span className="text-sm font-semibold">Allocated Grant per Beneficiary</span>
              <span className="text-2xl font-black">${totalPerChild.toFixed(2)}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" onClick={() => setStep(3)}>Continue to Funding</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-ui-text border-b border-ui-border pb-3">Trustless Escrow Allocation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ui-text">Target Beneficiary Population</label>
                <input
                  type="number"
                  value={estimatedEnrollment}
                  onChange={(e) => setEstimatedEnrollment(Number(e.target.value))}
                  className="input text-lg font-bold text-who-blue"
                />
                <p className="mt-1.5 text-xs text-ui-text-muted">Funding must be fully allocated to ensure guaranteed transfers upon fulfillment.</p>
              </div>

              <div className="bg-who-blue text-white rounded-xl p-6 shadow-panel">
                <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Total XION Allocation Required</p>
                <p className="text-4xl font-black tracking-tighter">${requiredEscrowXION.toLocaleString()}</p>
                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold opacity-60 uppercase">Per Beneficiary</p>
                    <p className="text-lg font-bold">${totalPerChild}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold opacity-60 uppercase">Target Reach</p>
                    <p className="text-lg font-bold">{estimatedEnrollment.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {!escrowTx ? (
                <Button 
                  variant="primary" 
                  className="w-full h-14 text-lg shadow-lg" 
                  onClick={fundEscrow} 
                  loading={funding}
                >
                  Authorize XION Escrow Funding
                </Button>
              ) : (
                <div className="bg-who-green-light border border-who-green/30 p-4 rounded-lg">
                  <p className="text-who-green font-bold text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-who-green animate-pulse" />
                    Escrow Verified on XION Chain
                  </p>
                  <p className="text-[10px] font-mono mt-1 text-who-green/70 truncate">{escrowTx}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>Adjust Configuration</Button>
                <Button variant="primary" onClick={createProgram} disabled={!escrowTx}>Finalize & Launch Program</Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}



