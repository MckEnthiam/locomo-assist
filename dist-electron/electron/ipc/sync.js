"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSyncHandlers = registerSyncHandlers;
const electron_1 = require("electron");
const db_1 = require("../services/db");
const supabase_sync_1 = require("../services/supabase-sync");
function registerSyncHandlers() {
    electron_1.ipcMain.handle('sync:push', async () => {
        try {
            return await (0, supabase_sync_1.pushToSupabase)((0, db_1.getDb)());
        }
        catch (e) {
            return {
                success: 0,
                failed: 0,
                errors: [e instanceof Error ? e.message : 'Erreur sync'],
                lastSyncAt: null,
            };
        }
    });
    electron_1.ipcMain.handle('sync:getStatus', async () => {
        try {
            return await (0, supabase_sync_1.getSyncStatus)((0, db_1.getDb)());
        }
        catch (e) {
            return { lastSyncAt: null, pendingCount: 0 };
        }
    });
}
