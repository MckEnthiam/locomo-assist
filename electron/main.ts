import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { config } from 'dotenv';
import { initDatabase } from './services/db';
import { registerDatabaseHandlers } from './ipc/database';
import { registerPdfHandlers } from './ipc/pdf';
import { registerSyncHandlers } from './ipc/sync';
import { pushToSupabase } from './services/supabase-sync';
import { getDb } from './services/db';
import { eq } from 'drizzle-orm';
import * as schema from '../drizzle/schema';

config({ path: path.join(app.getAppPath(), '.env') });
config({ path: path.join(process.cwd(), '.env') });

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    title: 'locomo assist',
    frame: true,
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

ipcMain.handle('system:getResourcePath', async (_, filename: string) => {
  const inResources = path.join(process.resourcesPath, filename);
  if (require('fs').existsSync(inResources)) return inResources;
  const inDev = path.join(app.getAppPath(), 'resources', filename);
  if (require('fs').existsSync(inDev)) return inDev;
  return path.join(process.cwd(), 'resources', filename);
});

app.whenReady().then(async () => {
  initDatabase();
  registerDatabaseHandlers();
  registerPdfHandlers();
  registerSyncHandlers();
  createWindow();

  try {
    const [param] = await getDb()
      .select()
      .from(schema.parametres)
      .where(eq(schema.parametres.id, 'singleton'));
    if (param?.autoSync) {
      void pushToSupabase(getDb());
    }
  } catch {
    /* sync optionnelle au démarrage */
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
