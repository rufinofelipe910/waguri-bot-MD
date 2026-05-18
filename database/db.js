import Database from "better-sqlite3";
import { mkdirSync } from "fs";

mkdirSync("./database", { recursive: true });

const sqlite = new Database("./database/yuta.db");

// ─── PRAGMA PARA RENDIMIENTO ──────────────────────────────
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");

// ─── TABLAS ───────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    role TEXT DEFAULT 'user',
    banned INTEGER DEFAULT 0,
    registered_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS groups (
    jid TEXT PRIMARY KEY,
    name TEXT,
    welcome INTEGER DEFAULT 0,
    antilink INTEGER DEFAULT 0
  );
`);

// ─── HELPERS ──────────────────────────────────────────────
const stmts = {
  getUser:    sqlite.prepare("SELECT * FROM users WHERE jid = ?"),
  upsertUser: sqlite.prepare(`
    INSERT INTO users (jid) VALUES (?)
    ON CONFLICT(jid) DO NOTHING
  `),
  setRole:    sqlite.prepare("UPDATE users SET role = ? WHERE jid = ?"),
  hasRole:    sqlite.prepare("SELECT role FROM users WHERE jid = ?"),
  isBanned:   sqlite.prepare("SELECT banned FROM users WHERE jid = ?"),
  ban:        sqlite.prepare("UPDATE users SET banned = 1 WHERE jid = ?"),
  unban:      sqlite.prepare("UPDATE users SET banned = 0 WHERE jid = ?"),
};

export const db = {
  getUser(jid) {
    stmts.upsertUser.run(jid);
    return stmts.getUser.get(jid);
  },
  hasRole(jid, role) {
    const row = stmts.hasRole.get(jid);
    if (!row) return false;
    const hierarchy = ["user", "premium", "mod", "coowner", "owner"];
    return hierarchy.indexOf(row.role) >= hierarchy.indexOf(role);
  },
  setRole(jid, role) {
    stmts.upsertUser.run(jid);
    stmts.setRole.run(role, jid);
  },
  isBanned(jid) {
    const row = stmts.isBanned.get(jid);
    return row?.banned === 1;
  },
  ban(jid)   { stmts.upsertUser.run(jid); stmts.ban.run(jid); },
  unban(jid) { stmts.upsertUser.run(jid); stmts.unban.run(jid); },
};