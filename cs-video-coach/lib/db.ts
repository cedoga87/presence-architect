import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'coach.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      video_url TEXT,
      video_filename TEXT,
      transcript TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),

      -- Overall score
      overall_score REAL,

      -- Dimension scores (0-10)
      pacing_score REAL,
      tone_score REAL,
      inspiration_score REAL,
      clarity_score REAL,
      credibility_score REAL,
      hook_score REAL,
      cta_score REAL,

      -- Feedback JSON blobs
      pacing_feedback TEXT,
      tone_feedback TEXT,
      inspiration_feedback TEXT,
      clarity_feedback TEXT,
      credibility_feedback TEXT,
      hook_feedback TEXT,
      cta_feedback TEXT,

      -- Summary fields
      strengths TEXT,
      improvements TEXT,
      overall_summary TEXT
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export interface Session {
  id: number;
  title: string;
  video_url: string | null;
  video_filename: string | null;
  transcript: string | null;
  created_at: string;
  overall_score: number | null;
  pacing_score: number | null;
  tone_score: number | null;
  inspiration_score: number | null;
  clarity_score: number | null;
  credibility_score: number | null;
  hook_score: number | null;
  cta_score: number | null;
  pacing_feedback: string | null;
  tone_feedback: string | null;
  inspiration_feedback: string | null;
  clarity_feedback: string | null;
  credibility_feedback: string | null;
  hook_feedback: string | null;
  cta_feedback: string | null;
  strengths: string | null;
  improvements: string | null;
  overall_summary: string | null;
}

export { DIMENSIONS, type DimensionKey } from './dimensions';
