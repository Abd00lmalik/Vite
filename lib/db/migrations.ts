import { db } from './schema';

export async function ensureSchemaReady(): Promise<void> {
  if (!db.isOpen()) {
    await db.open();
  }
}

export async function resetLocalDatabase(): Promise<void> {
  await db.delete();
  await db.open();
}

