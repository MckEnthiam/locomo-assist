import { ipcMain } from 'electron';
import { getDb } from '../services/db';
import { getSyncStatus, pushToSupabase } from '../services/supabase-sync';

export function registerSyncHandlers(): void {
  ipcMain.handle('sync:push', async () => {
    try {
      return await pushToSupabase(getDb());
    } catch (e) {
      return {
        success: 0,
        failed: 0,
        errors: [e instanceof Error ? e.message : 'Erreur sync'],
        lastSyncAt: null,
      };
    }
  });

  ipcMain.handle('sync:getStatus', async () => {
    try {
      return await getSyncStatus(getDb());
    } catch (e) {
      return { lastSyncAt: null, pendingCount: 0 };
    }
  });
}
