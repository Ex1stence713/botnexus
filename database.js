import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'tickets.db');

// Upewnij się, że folder data istnieje
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Włącz WAL dla lepszej wydajności
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Inicjalizacja tabel
db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        priority INTEGER DEFAULT 2,
        status TEXT DEFAULT 'open',
        claimed_by TEXT DEFAULT NULL,
        claim_time INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL,
        closed_at INTEGER DEFAULT NULL,
        closed_by TEXT DEFAULT NULL,
        close_reason TEXT DEFAULT NULL,
        rating INTEGER DEFAULT NULL,
        rating_comment TEXT DEFAULT NULL,
        last_activity INTEGER NOT NULL,
        auto_close_delay INTEGER DEFAULT 86400
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        content TEXT,
        attachments TEXT DEFAULT '[]',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ticket_notes (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_claimed ON tickets(claimed_by);
    CREATE INDEX IF NOT EXISTS idx_messages_ticket ON ticket_messages(ticket_id);
`);

export default db;
