'use client';

import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QRDisplay } from './QRDisplay';
import { SyncBadge } from './SyncBadge';
import { createPatient } from '@/lib/db/db';
import { sendRegistrationSMS } from '@/lib/sms/twilio';
import { DEMO_CLINICS, DEMO_HEALTH_WORKERS } from '@/lib/seed/demo';
import { toast } from 'react-hot-toast';
import { ArrowLeft, UserPlus, Wifi } from 'lucide-react';
import type { Patient } from '@/types';

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  sex: z.enum(['M', 'F', 'Other'], { required_error: 'Please select sex' }),
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  parentPhone: z
    .string()
    .regex(/^\+234\d{10}$/, 'Phone must be in format +234XXXXXXXXXX'),
  clinicId: z.string().min(1, 'Please select a clinic'),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onBack?: () => void;
}

export function PatientForm({ onBack }: PatientFormProps) {
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      parentPhone: '+234',
    },
  });

  const selectedSex = watch('sex');
  const selectedClinic = watch('clinicId');

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      const patient = await createPatient({
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        sex: data.sex,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        clinicId: data.clinicId,
        registeredBy: DEMO_HEALTH_WORKERS[0].id,
        programId: 'program-demo-001',
      });

      await sendRegistrationSMS(data.parentPhone, data.name, patient.healthDropId);
      setRegisteredPatient(patient);
      toast.success('Patient registered successfully!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredPatient) {
    return (
      <div className="flex flex-col gap-6 p-4 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Registration Successful!</h2>
          <p className="text-muted-foreground mt-1">
            {registeredPatient.name} has been registered
          </p>
        </div>

        <QRDisplay
          healthDropId={registeredPatient.healthDropId}
          patientName={registeredPatient.name}
        />

        <div className="flex flex-col gap-2 text-center">
          <SyncBadge status="pending" className="mx-auto" />
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Wifi className="h-4 w-4" />
            Saved offline. Will sync when connected.
          </p>
        </div>

        <Button
          onClick={onBack}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Register Another Patient
        </Button>
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <CardTitle>Register New Patient</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Child's Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{"Child's Full Name"}</Label>
            <Input
              id="name"
              placeholder="Enter child's name"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth')}
              className={errors.dateOfBirth ? 'border-red-500' : ''}
            />
            {errors.dateOfBirth && (
              <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>
            )}
          </div>

          {/* Sex */}
          <div className="space-y-2">
            <Label>Sex</Label>
            <RadioGroup
              value={selectedSex}
              onValueChange={(value) => setValue('sex', value as 'M' | 'F' | 'Other')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="M" id="male" />
                <Label htmlFor="male" className="font-normal">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="F" id="female" />
                <Label htmlFor="female" className="font-normal">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id="other" />
                <Label htmlFor="other" className="font-normal">Other</Label>
              </div>
            </RadioGroup>
            {errors.sex && (
              <p className="text-xs text-red-500">{errors.sex.message}</p>
            )}
          </div>

          {/* Parent Name */}
          <div className="space-y-2">
            <Label htmlFor="parentName">Parent/Guardian Full Name</Label>
            <Input
              id="parentName"
              placeholder="Enter parent's name"
              {...register('parentName')}
              className={errors.parentName ? 'border-red-500' : ''}
            />
            {errors.parentName && (
              <p className="text-xs text-red-500">{errors.parentName.message}</p>
            )}
          </div>

          {/* Parent Phone */}
          <div className="space-y-2">
            <Label htmlFor="parentPhone">Parent Phone Number</Label>
            <Input
              id="parentPhone"
              type="tel"
              placeholder="+234XXXXXXXXXX"
              {...register('parentPhone')}
              className={errors.parentPhone ? 'border-red-500' : ''}
            />
            {errors.parentPhone && (
              <p className="text-xs text-red-500">{errors.parentPhone.message}</p>
            )}
          </div>

          {/* Clinic */}
          <div className="space-y-2">
            <Label>Clinic</Label>
            <Select
              value={selectedClinic}
              onValueChange={(value) => setValue('clinicId', value)}
            >
              <SelectTrigger className={errors.clinicId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a clinic" />
              </SelectTrigger>
              <SelectContent>
                {DEMO_CLINICS.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clinicId && (
              <p className="text-xs text-red-500">{errors.clinicId.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#007B83] hover:bg-[#005A61] text-white h-12"
          >
            {isSubmitting ? 'Registering...' : 'Register Patient'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

