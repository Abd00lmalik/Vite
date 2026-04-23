import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';
import type { SMSLog } from '@/types';
import { sendSMSAction } from './actions';

const SMS_TEMPLATES = {
  registration: (childName: string, programName: string, healthId: string, amount: number) =>
    `VITE Health: ${childName} has been registered for ${programName}. Health ID: ${healthId}. You will receive $${amount} after today's visit is verified. Keep this number active.`,

  'milestone-payment': (childName: string, amount: number, milestoneName: string) =>
    `VITE Health: $${amount} has been added to your account for ${childName}'s ${milestoneName} vaccination. Reply REDEEM to transfer to your OPay account.`,

  reminder: (childName: string, vaccineName: string, dueDate: string, link: string) =>
    `VITE Health: ${childName} is due for ${vaccineName} vaccination by ${dueDate}. Visit any registered clinic. Show QR: ${link}`,

  dispute: (recordId: string, reason: string) =>
    `VITE Health: A review has been flagged for record ${recordId}. Reason: ${reason}. Our team will investigate within 48 hours.`,

  redemption: (amount: number, phone: string) =>
    `VITE Health: Transfer confirmed. $${amount} sent to OPay account ${phone}. Thank you for participating in the program.`,
};

export async function sendSMS(to: string, message: string, type: SMSLog['type']): Promise<void> {
  // 1. Call real Twilio Server Action
  const result = await sendSMSAction(to, message);

  // 2. Log to local IndexedDB for patient history
  const log: SMSLog = {
    id: uuidv4(),
    to,
    type,
    message,
    status: result.success ? 'sent' : 'failed',
    timestamp: new Date().toISOString(),
  };

  await db.smsLogs.put(log);

  if (!result.success) {
    throw new Error(`SMS delivery failed: ${result.error}`);
  }
}

export const SMS = {
  registration: (to: string, childName: string, programName: string, healthId: string, amount: number) =>
    sendSMS(to, SMS_TEMPLATES.registration(childName, programName, healthId, amount), 'registration'),

  payment: (to: string, childName: string, amount: number, milestoneName: string) =>
    sendSMS(to, SMS_TEMPLATES['milestone-payment'](childName, amount, milestoneName), 'milestone-payment'),

  reminder: (to: string, childName: string, vaccineName: string, dueDate: string, link: string) =>
    sendSMS(to, SMS_TEMPLATES.reminder(childName, vaccineName, dueDate, link), 'reminder'),

  dispute: (to: string, recordId: string, reason: string) =>
    sendSMS(to, SMS_TEMPLATES.dispute(recordId, reason), 'dispute'),

  redemption: (to: string, amount: number, phone: string) =>
    sendSMS(to, SMS_TEMPLATES.redemption(amount, phone), 'milestone-payment'),
};




