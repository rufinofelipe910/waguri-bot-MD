import { jidNormalizedUser } from "@whiskeysockets/baileys";

export default {
  name: ["del", "delete", "eliminar"],
  description: "Elimina un mensaje respondiendo a él",
  category: "grupos",
  groupOnly: true,
  botAdmin: true,

  async run({ sock, from, msg, reply, sender, isAdmin, isMod, isBotAdmin, groupMeta }) {

    // 🔍 DEBUG TEMPORAL — borrar después de diagnosticar
    const senderJidClean = sender.split(':')[0] + '@s.whatsapp.net';
    const senderParticipant = groupMeta?.participants?.find(
      p => p.id.split(':')[0] + '@s.whatsapp.net' === senderJidClean
    );

    await reply({
      text:
        `🔍 *DEBUG*\n` +
        `sender: ${sender}\n` +
        `senderJidClean: ${senderJidClean}\n` +
        `encontrado en participants: ${!!senderParticipant}\n` +
        `admin field: ${senderParticipant?.admin ?? "N/A"}\n` +
        `isAdmin calculado: ${isAdmin}\n` +
        `isMod calculado: ${isMod}\n` +
        `isBotAdmin calculado: ${isBotAdmin}\n` +
        `total participants: ${groupMeta?.participants?.length ?? 0}`
    });
    // 🔍 FIN DEBUG

    if (!isAdmin && !isMod) {
      return await reply({ text: "❌ Solo los administradores pueden usar este comando." });
    }

    const quoted = msg.message?.extendedTextMessage?.contextInfo;

    if (!quoted?.stanzaId) {
      return await reply({
        text: "❌ Responde al mensaje que quieres eliminar."
      });
    }

    try {
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          id: quoted.stanzaId,
          participant: jidNormalizedUser(quoted.participant),
          fromMe: false
        }
      });
    } catch (e) {
      await reply({
        text: `❌ No se pudo eliminar:\n${e.message}`
      });
    }
  }
}