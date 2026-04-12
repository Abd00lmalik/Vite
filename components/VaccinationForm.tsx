'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QRScanner } from './QRScanner';
import { SyncBadge } from './SyncBadge';
import { usePatient } from '@/hooks/usePatient';
import { createVaccination, getVaccinationsByPatient } from '@/lib/db/db';
import { captureGPS } from '@/lib/utils/gps';
import { DEMO_VACCINE_LOTS, DEMO_HEALTH_WORKERS } from '@/lib/seed/demo';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Syringe,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { VaccinationRecord } from '@/types';

const VACCINE_NAMES = ['DTP', 'OPV', 'Measles', 'BCG', 'Yellow Fever'] as const;

const vaccinationSchema = z.object({
  vaccineName: z.enum(VACCINE_NAMES, { required_error: 'Select a vaccine' }),
  lotNumber: z.string().min(1, 'Select a lot number'),
  doseNumber: z.coerce.number().min(1).max(5, 'Dose must be between 1-5'),
  dateAdministered: z.string().min(1, 'Date is required'),
});

type VaccinationFormData = z.infer<typeof vaccinationSchema>;

interface VaccinationFormProps {
  onBack?: () => void;
}

export function VaccinationForm({ onBack }: VaccinationFormProps) {
  const { patient, vaccinations, loading, error, lookup, reset } = usePatient();
  const [showScanner, setShowScanner] = useState(true);
  const [gps, setGps] = useState({ lat: 0, lng: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [patientVaccinations, setPatientVaccinations] = useState<VaccinationRecord[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset: resetForm,
  } = useForm<VaccinationFormData>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      dateAdministered: format(new Date(), 'yyyy-MM-dd'),
      doseNumber: 1,
    },
  });

  const selectedVaccine = watch('vaccineName');

  // Get available lots for selected vaccine
  const availableLots = DEMO_VACCINE_LOTS.filter(
    (lot) => lot.vaccineName === selectedVaccine
  );

  useEffect(() => {
    captureGPS().then(setGps);
  }, []);

  useEffect(() => {
    if (patient) {
      getVaccinationsByPatient(patient.id).then(setPatientVaccinations);
    }
  }, [patient]);

  const handleScan = async (query: string) => {
    setShowScanner(false);
    await lookup(query);
  };

  const handleReset = () => {
    reset();
    resetForm();
    setShowScanner(true);
    setSubmitted(false);
    setPatientVaccinations([]);
  };

  const onSubmit = async (data: VaccinationFormData) => {
    if (!patient) return;

    setIsSubmitting(true);
    try {
      await createVaccination({
        patientId: patient.id,
        healthDropId: patient.healthDropId,
        vaccineName: data.vaccineName,
        lotNumber: data.lotNumber,
        doseNumber: data.doseNumber,
        dateAdministered: data.dateAdministered,
        administeredBy: DEMO_HEALTH_WORKERS[0].id,
        clinicId: patient.clinicId,
        gpsLat: gps.lat,
        gpsLng: gps.lng,
      });

      setSubmitted(true);
      toast.success('Vaccination recorded!');
    } catch (err) {
      console.error('Vaccination error:', err);
      toast.error('Failed to record vaccination');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-6 p-4 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Record Saved!</h2>
          <p className="text-muted-foreground mt-1">
            Vaccination for {patient?.name} has been recorded
          </p>
        </div>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <SyncBadge status="pending" className="mb-2" />
            <p className="text-sm text-amber-700">
              Record saved offline. Will sync automatically when connected.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleReset}
            className="w-full bg-[#007B83] hover:bg-[#005A61] text-white"
          >
            <Syringe className="h-4 w-4 mr-2" />
            Record Another Vaccination
          </Button>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (showScanner) {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h2 className="text-xl font-bold">Record Vaccination</h2>
        </div>

        <p className="text-muted-foreground text-sm">
          Scan patient QR code or enter phone number to look up patient
        </p>

        <QRScanner onScan={handleScan} />

        {loading && (
          <p className="text-center text-muted-foreground">Looking up patient...</p>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-700">Patient not found</p>
            <Button onClick={handleReset} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleReset}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Record Vaccination</h2>
      </div>

      {/* Patient Info Card */}
      <Card className="bg-[#E0F4F5] border-[#007B83]/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#007B83] rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{patient.name}</p>
              <p className="text-sm text-muted-foreground font-mono">
                {patient.healthDropId}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                DOB: {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}
              </p>
            </div>
            <SyncBadge status={patient.syncStatus as 'synced' | 'pending'} />
          </div>
        </CardContent>
      </Card>

      {/* Previous Vaccinations */}
      {patientVaccinations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Previous Vaccinations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {patientVaccinations.map((vac) => (
                <div
                  key={vac.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                >
                  <span className="font-medium">
                    {vac.vaccineName} (Dose {vac.doseNumber})
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(vac.dateAdministered), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vaccination Form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">New Vaccination</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Vaccine Name */}
            <div className="space-y-2">
              <Label>Vaccine</Label>
              <Select
                value={selectedVaccine}
                onValueChange={(value) =>
                  setValue('vaccineName', value as (typeof VACCINE_NAMES)[number])
                }
              >
                <SelectTrigger className={errors.vaccineName ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {VACCINE_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vaccineName && (
                <p className="text-xs text-red-500">{errors.vaccineName.message}</p>
              )}
            </div>

            {/* Lot Number */}
            <div className="space-y-2">
              <Label>Lot Number</Label>
              <Select
                onValueChange={(value) => setValue('lotNumber', value)}
                disabled={!selectedVaccine}
              >
                <SelectTrigger className={errors.lotNumber ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select lot" />
                </SelectTrigger>
                <SelectContent>
                  {availableLots.map((lot) => (
                    <SelectItem key={lot.lotNumber} value={lot.lotNumber}>
                      {lot.lotNumber} (Exp: {lot.expiryDate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.lotNumber && (
                <p className="text-xs text-red-500">{errors.lotNumber.message}</p>
              )}
            </div>

            {/* Dose Number */}
            <div className="space-y-2">
              <Label htmlFor="doseNumber">Dose Number</Label>
              <Input
                id="doseNumber"
                type="number"
                min={1}
                max={5}
                {...register('doseNumber')}
                className={errors.doseNumber ? 'border-red-500' : ''}
              />
              {errors.doseNumber && (
                <p className="text-xs text-red-500">{errors.doseNumber.message}</p>
              )}
            </div>

            {/* Date Administered */}
            <div className="space-y-2">
              <Label htmlFor="dateAdministered">Date Administered</Label>
              <Input
                id="dateAdministered"
                type="date"
                {...register('dateAdministered')}
                className={errors.dateAdministered ? 'border-red-500' : ''}
              />
              {errors.dateAdministered && (
                <p className="text-xs text-red-500">{errors.dateAdministered.message}</p>
              )}
            </div>

            {/* GPS Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
              <MapPin className="h-4 w-4" />
              <span>
                GPS: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#007B83] hover:bg-[#005A61] text-white h-12"
            >
              <Syringe className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Recording...' : 'Record Vaccination'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

