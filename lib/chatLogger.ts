// lib/chatLogger.ts
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'out.db');

export interface ChatLogEntry {
  question: string;
  answer: string;
  source: string;
  userId: number | null;
  role: string | null;
  timestamp: string;
}

export async function logChatInteraction(entry: ChatLogEntry) {
  // SQL.js is synchronous once initialised, but init is async.
  const SQL = await initSqlJs();
  const buffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : undefined;
  const db = buffer ? new SQL.Database(buffer) : new SQL.Database();

  // Ensure table (belt and suspenders)
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      source TEXT NOT NULL,
      user_id INTEGER,
      role TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  db.run(
    `INSERT INTO chat_interactions (question, answer, source, user_id, role, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entry.question, entry.answer, entry.source, entry.userId, entry.role, entry.timestamp]
  );

  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
}