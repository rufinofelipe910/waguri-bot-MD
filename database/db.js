import { JSONFilePreset } from "lowdb/node";
import { mkdirSync } from "fs";

mkdirSync("./database", { recursive: true });

const defaultData = { users: {}, groups: {} };
const db_instance = await JSONFilePreset("./database/yuta.json", defaultData);

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    await db_instance.write();
  }, 5000);
}

const userCache  = new Map();
const groupCache = new Map();

function getUser(jid) {
  if (userCache.has(jid)) return userCache.get(jid);
  if (!db_instance.data.users[jid]) {
    db_instance.data.users[jid] = {
      role: "user",
      banned: false,
      registeredAt: new Date().toISOString(),
    };
    scheduleSave();
  }
  userCache.set(jid, db_instance.data.users[jid]);
  return db_instance.data.users[jid];
}

const hierarchy = ["user", "premium", "mod", "coowner", "owner"];

export const db = {
  getUser,

  hasRole(jid, role) {
    const user = getUser(jid);
    return hierarchy.indexOf(user.role) >= hierarchy.indexOf(role);
  },

  setRole(jid, role) {
    getUser(jid);
    db_instance.data.users[jid].role = role;
    userCache.set(jid, db_instance.data.users[jid]);
    scheduleSave();
  },

  isBanned(jid) { return getUser(jid).banned === true; },

  ban(jid) {
    getUser(jid);
    db_instance.data.users[jid].banned = true;
    userCache.set(jid, db_instance.data.users[jid]);
    scheduleSave();
  },

  unban(jid) {
    getUser(jid);
    db_instance.data.users[jid].banned = false;
    userCache.set(jid, db_instance.data.users[jid]);
    scheduleSave();
  },

  getGroup(jid) {
    if (groupCache.has(jid)) return groupCache.get(jid);
    if (!db_instance.data.groups[jid]) {
      db_instance.data.groups[jid] = { welcome: false, antilink: false };
      scheduleSave();
    }
    groupCache.set(jid, db_instance.data.groups[jid]);
    return db_instance.data.groups[jid];
  },

  setGroup(jid, key, value) {
    db_instance.data.groups[jid] = db_instance.data.groups[jid] || {};
    db_instance.data.groups[jid][key] = value;
    groupCache.set(jid, db_instance.data.groups[jid]);
    scheduleSave();
  },

  // ─── PRIMARY BOT ─────────────────────────────────────
  setPrimary(groupJid, botId) {
    if (!db_instance.data.groups[groupJid]) {
      db_instance.data.groups[groupJid] = { welcome: false, antilink: false };
    }
    db_instance.data.groups[groupJid].primaryBot = botId;
    groupCache.set(groupJid, db_instance.data.groups[groupJid]);
    scheduleSave();
  },

  getPrimary(groupJid) {
    return db_instance.data.groups[groupJid]?.primaryBot || null;
  },

  delPrimary(groupJid) {
    if (db_instance.data.groups[groupJid]) {
      delete db_instance.data.groups[groupJid].primaryBot;
      groupCache.set(groupJid, db_instance.data.groups[groupJid]);
      scheduleSave();
    }
  },
};