'use server';

import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

/**
 * Server Action to send real SMS via Twilio.
 * This is protected and only runs on the Vercel/Node.js runtime.
 */
export async function sendSMSAction(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio credentials missing');
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Twilio Error]', error);
    return { success: false, error: error.message };
  }
}
