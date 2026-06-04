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
exports.initDatabase = initDatabase;
exports.getDb = getDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const better_sqlite3_2 = require("drizzle-orm/better-sqlite3");
const migrator_1 = require("drizzle-orm/better-sqlite3/migrator");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const schema = __importStar(require("../../drizzle/schema"));
const seed_1 = require("../../drizzle/seed");
let dbInstance = null;
function initDatabase() {
    if (dbInstance)
        return dbInstance;
    const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'locomo-assist.db');
    const sqlite = new better_sqlite3_1.default(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    dbInstance = (0, better_sqlite3_2.drizzle)(sqlite, { schema });
    const migrationsFolder = path_1.default.join(electron_1.app.getAppPath(), 'drizzle', 'migrations');
    const devMigrations = path_1.default.join(__dirname, '../../drizzle/migrations');
    const folder = fs_1.default.existsSync(migrationsFolder) ? migrationsFolder : devMigrations;
    (0, migrator_1.migrate)(dbInstance, { migrationsFolder: folder });
    (0, seed_1.seedIfEmpty)(dbInstance);
    return dbInstance;
}
function getDb() {
    if (!dbInstance)
        return initDatabase();
    return dbInstance;
}
