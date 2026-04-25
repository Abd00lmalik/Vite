'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db/schema';
import type { Patient } from '@/types';

interface PatientSearchProps {
  onFound: (patient: Patient | null) => void;
  clinicId?: string;
  ownerUserId?: string;
  allowCrossClinic?: boolean;
}

export function PatientSearch({
  onFound,
  clinicId,
  ownerUserId,
  allowCrossClinic = false,
}: PatientSearchProps) {
  const [phone, setPhone] = useState('+234');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const matches = await db.patients.where('parentPhone').equals(phone).toArray();
    const patient = matches.find((entry) => {
      if (!ownerUserId) return true;
      return (entry.ownerUserId ?? entry.registeredBy) === ownerUserId;
    });

    if (patient && !allowCrossClinic && clinicId && patient.clinicId !== clinicId) {
      onFound(null);
      setLoading(false);
      return;
    }
    onFound(patient ?? null);
    setLoading(false);
  };

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
      <label className="text-sm font-medium text-gray-700">Parent phone number</label>
      <div className="flex gap-2">
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+2348012345678" />
        <Button type="button" variant="outline" onClick={handleSearch} loading={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}





