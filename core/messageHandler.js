import config from "../config.js";
import { log } from "./logger.js";
import { getPlugins } from "./pluginLoader.js";
import { db } from "../database/db.js";

// ─── EXTRAER JID LIMPIO ───────────────────────────────────
function cleanJid(jid = "") {
  return jid?.split(":")[0] + (jid?.includes("@") ? "@" + jid.split("@")[1] : "");
}

export async function handleMessage(sock, rawMsg) {
  try {
    const msg = rawMsg;
    const from = msg.key?.remoteJid;
    if (!from) return;

    const isGroup = from.endsWith("@g.us");
    const senderJid = isGroup
      ? (msg.key?.participant || msg.participant || "")
      : from;

    const sender = cleanJid(senderJid);
    const botJid = cleanJid(sock.user?.id);

    // Ignorar mensajes propios
    if (msg.key?.fromMe) return;
    // Ignorar mensajes de estado
    if (from === "status@broadcast") return;

    // ─── CUERPO DEL MENSAJE ──────────────────────────────
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      "";

    // ─── GRUPO INFO ──────────────────────────────────────
    let groupName = "";
    let groupMeta = null;
    if (isGroup) {
      try {
        groupMeta = await sock.groupMetadata(from);
        groupName = groupMeta?.subject || from;
      } catch {
        groupName = from;
      }
    }

    // ─── DETECTAR COMANDO ────────────────────────────────
    const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix];
    const usedPrefix = prefixes.find((p) => body.startsWith(p)) || null;
    const isCmd = !!usedPrefix;
    const cmdName = isCmd ? body.slice(usedPrefix.length).trim().split(/\s+/)[0].toLowerCase() : null;
    const args = isCmd ? body.slice(usedPrefix.length + (cmdName?.length || 0)).trim().split(/\s+/) : [];
    const text = args.join(" ");

    // ─── LOG DE MENSAJE ──────────────────────────────────
    log.message({ from, sender, isGroup, groupName, body, isCmd, cmdName });

    // ─── PERMISOS ────────────────────────────────────────
    const senderNum = sender.split("@")[0];
    const isOwner = config.ownerNumber.includes(senderNum);
    const isCoOwner = config.coOwners.includes(senderNum);
    const isMod = isOwner || isCoOwner || db.hasRole(senderNum, "mod");
    const isPremium = isMod || db.hasRole(senderNum, "premium");

    const ctx = {
      sock,
      msg,
      from,
      sender,
      senderNum,
      botJid,
      isGroup,
      groupName,
      groupMeta,
      body,
      isCmd,
      cmdName,
      args,
      text,
      usedPrefix,
      isOwner,
      isCoOwner,
      isMod,
      isPremium,
      reply: (content) => sock.sendMessage(from, content, { quoted: msg }),
      react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
    };

    if (!isCmd) return;

    // ─── EJECUTAR COMANDO ────────────────────────────────
    const plugins = getPlugins();
    const plugin = plugins.get(cmdName);

    if (!plugin) return;

    // Chequeo de permisos del plugin
    if (plugin.ownerOnly && !isOwner) {
      return ctx.reply({ text: "❌ Solo el owner puede usar este comando." });
    }
    if (plugin.modOnly && !isMod) {
      return ctx.reply({ text: "❌ Solo moderadores pueden usar este comando." });
    }
    if (plugin.premiumOnly && !isPremium) {
      return ctx.reply({ text: "⭐ Este comando es exclusivo para premium." });
    }
    if (plugin.groupOnly && !isGroup) {
      return ctx.reply({ text: "👥 Este comando solo funciona en grupos." });
    }
    if (plugin.privateOnly && isGroup) {
      return ctx.reply({ text: "📩 Este comando solo funciona en privado." });
    }

    const start = Date.now();
    try {
      await ctx.react("⏳");
      await plugin.run(ctx);
      const ms = Date.now() - start;
      log.cmdExec({ cmdName, sender: senderNum, success: true, ms });
      await ctx.react("✅");
    } catch (e) {
      const ms = Date.now() - start;
      log.cmdExec({ cmdName, sender: senderNum, success: false, ms });
      log.error(`Comando ${cmdName}: ${e.message}`);
      await ctx.react("❌");
      await ctx.reply({ text: `❌ Error ejecutando \`${cmdName}\`:\n${e.message}` });
    }
  } catch (e) {
    log.error(`handleMessage: ${e.message}`);
  }
}