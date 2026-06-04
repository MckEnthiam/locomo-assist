"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
const db_1 = require("./services/db");
const database_1 = require("./ipc/database");
const pdf_1 = require("./ipc/pdf");
const sync_1 = require("./ipc/sync");
const supabase_sync_1 = require("./services/supabase-sync");
const db_2 = require("./services/db");
const drizzle_orm_1 = require("drizzle-orm");
const schema = __importStar(require("../drizzle/schema"));
(0, dotenv_1.config)({ path: path_1.default.join(electron_1.app.getAppPath(), '.env') });
(0, dotenv_1.config)({ path: path_1.default.join(process.cwd(), '.env') });
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 700,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
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
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
}
electron_1.ipcMain.handle('system:getResourcePath', async (_, filename) => {
    const inResources = path_1.default.join(process.resourcesPath, filename);
    if (require('fs').existsSync(inResources))
        return inResources;
    const inDev = path_1.default.join(electron_1.app.getAppPath(), 'resources', filename);
    if (require('fs').existsSync(inDev))
        return inDev;
    return path_1.default.join(process.cwd(), 'resources', filename);
});
electron_1.app.whenReady().then(async () => {
    (0, db_1.initDatabase)();
    (0, database_1.registerDatabaseHandlers)();
    (0, pdf_1.registerPdfHandlers)();
    (0, sync_1.registerSyncHandlers)();
    createWindow();
    try {
        const [param] = await (0, db_2.getDb)()
            .select()
            .from(schema.parametres)
            .where((0, drizzle_orm_1.eq)(schema.parametres.id, 'singleton'));
        if (param?.autoSync) {
            void (0, supabase_sync_1.pushToSupabase)((0, db_2.getDb)());
        }
    }
    catch {
        /* sync optionnelle au démarrage */
    }
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
