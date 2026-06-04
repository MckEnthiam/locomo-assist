import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import * as schema from '../../drizzle/schema';
import { seedIfEmpty } from '../../drizzle/seed';

let dbInstance: BetterSQLite3Database<typeof schema> | null = null;

export function initDatabase(): BetterSQLite3Database<typeof schema> {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(app.getPath('userData'), 'locomo-assist.db');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  dbInstance = drizzle(sqlite, { schema });

  const migrationsFolder = path.join(app.getAppPath(), 'drizzle', 'migrations');
  const devMigrations = path.join(__dirname, '../../drizzle/migrations');
  const folder = fs.existsSync(migrationsFolder) ? migrationsFolder : devMigrations;

  migrate(dbInstance, { migrationsFolder: folder });
  seedIfEmpty(dbInstance);

  return dbInstance;
}

export function getDb() {
  if (!dbInstance) return initDatabase();
  return dbInstance;
}
