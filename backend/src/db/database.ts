import initSqlJs, { type Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/spur_chat.db';
const resolvedDbPath = path.resolve(DB_PATH);
const dbDir = path.dirname(resolvedDbPath);

// Ensure the data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// sql.js Database instance (loaded once at startup)
let _db: Database | null = null;

/**
 * Initialize the sql.js database from disk (or create fresh).
 * Must be called once before any DB operations.
 */
export async function initializeDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  // Load existing DB file if it exists, otherwise start fresh
  if (fs.existsSync(resolvedDbPath)) {
    const fileBuffer = fs.readFileSync(resolvedDbPath);
    _db = new SQL.Database(fileBuffer);
    console.log('[DB] Loaded existing database from', resolvedDbPath);
  } else {
    _db = new SQL.Database();
    console.log('[DB] Created new database at', resolvedDbPath);
  }

  // Create schema
  _db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id         TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      metadata   TEXT
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender          TEXT NOT NULL,
      text            TEXT NOT NULL,
      timestamp       INTEGER NOT NULL
    )
  `);

  _db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
      ON messages(conversation_id)
  `);

  _db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp
      ON messages(timestamp)
  `);

  // Persist initial schema to disk
  persistDb();
  console.log('[DB] Schema initialized successfully');
}

/**
 * Get the DB instance (throws if not initialized)
 */
export function getDb(): Database {
  if (!_db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return _db;
}

/**
 * Persist the in-memory sql.js database to disk.
 * Called after every write operation.
 */
export function persistDb(): void {
  if (!_db) return;
  const data = _db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(resolvedDbPath, buffer);
}
