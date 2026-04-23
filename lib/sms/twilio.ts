import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';
import type { SMSLog } from '@/types';

// In Phase 2: replace with actual Twilio SDK calls

export async function sendSMS(
  to: string,
  message: string,
  type: SMSLog['type']
): Promise<SMSLog> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 200));

  const log: SMSLog = {
    id: uuidv4(),
    to,
    type,
    message,
    status: 'sent',
    timestamp: new Date().toISOString(),
  };

  // Log to IndexedDB for demo visibility
  await db.smsLogs.add(log);

  console.log(`[SMS Notification] To: ${to} | Type: ${type} | Message: ${message}`);
  return log;
}

export async function sendRegistrationSMS(
  phone: string,
  patientName: string,
  healthDropId: string
): Promise<void> {
  await sendSMS(
    phone,
    `VITE Health: ${patientName} has been registered. Health ID: ${healthDropId}. View records at: vite.health/record/${healthDropId}`,
    'registration'
  );
}

export async function sendReminderSMS(
  phone: string,
  patientName: string,
  vaccineName: string,
  dueDate: string
): Promise<void> {
  await sendSMS(
    phone,
    `VITE Health: ${patientName} is due for ${vaccineName} vaccination by ${dueDate}. Visit any registered clinic. Show Health ID at reception.`,
    'reminder'
  );
}




