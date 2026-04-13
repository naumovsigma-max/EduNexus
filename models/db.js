const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'edunexus.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  avatar_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('file','video')),
  category TEXT,
  file_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  uploader_id INTEGER,
  uploader_role TEXT NOT NULL CHECK(uploader_role IN ('guest','student','teacher','admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(uploader_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  questions_json TEXT NOT NULL,
  creator_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(test_id) REFERENCES tests(id),
  FOREIGN KEY(student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(created_by) REFERENCES users(id)
);
`);

module.exports = db;
