import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

async function convertirSticker(inputPath, outputPath, esVideo = false) {
  if (esVideo) {
    await execAsync(
      `ffmpeg -i "${inputPath}" -t 15 -vf "fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -c:v libwebp -lossless 0 -q:v 70 -loop 0 -an -vsync 0 "${outputPath}" -y`
    );
  } else {
    await execAsync(
      `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -c:v libwebp "${outputPath}" -y`
    );
  }
}

export default {
  name: ["s", "sticker"],
  description: "Convierte imagen/video a sticker o roba stickers con tu marca",
  category: "misc",
  ownerOnly: false,

  async run({ sock, from, msg, usedPrefix, react, reply }) {
    try {
      await react("⏳");

      const hora  = new Date().toLocaleTimeString("es-CO", { hour12: false });
      const fecha = new Date().toLocaleDateString("es-CO");

      const tmpDir = "./tmp";
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      // ─── DETECTAR TIPO DE MEDIA ──────────────────────
      const msgType     = Object.keys(msg.message || {})[0];
      const quoted      = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedType  = quoted ? Object.keys(quoted)[0] : null;

      const mediaMsg    = (msgType === "imageMessage" || msgType === "videoMessage" || msgType === "stickerMessage")
        ? msg
        : null;

      const quotedMsg   = quoted && (quotedType === "imageMessage" || quotedType === "videoMessage" || quotedType === "stickerMessage")
        ? {
            key: {
              remoteJid: from,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant: msg.message.extendedTextElement?.contextInfo?.participant,
            },
            message: quoted,
          }
        : null;

      const targetMsg  = mediaMsg || quotedMsg;
      const targetType = mediaMsg ? msgType : quotedType;

      if (!targetMsg) {
        return await reply({
          text: `❌ Envía o responde una imagen, video (máx 15s) o sticker.\n\n💡 *Uso:*\n  ✦ ${usedPrefix}s ➔ con imagen o video\n  ✦ ${usedPrefix}s ➔ respondiendo un sticker para robarlo\n\n_${hora} • ${fecha}_\n⚔️ _Yuta Okotsu MD | DuarteXV_`
        });
      }

      const buffer = await downloadMediaMessage(targetMsg, "buffer", {}, { sock });

      // ─── ROBAR STICKER (responder sticker → re-empaquetar con metadata tuya) ──
      if (targetType === "stickerMessage") {
        const inputP  = path.join(tmpDir, `stk_in_${Date.now()}.webp`);
        const outputP = path.join(tmpDir, `stk_out_${Date.now()}.webp`);
        fs.writeFileSync(inputP, buffer);

        // Re-empaquetar con ffmpeg para limpiar metadata anterior
        await execAsync(`ffmpeg -i "${inputP}" -c:v libwebp "${outputP}" -y`);

        const stickerBuffer = fs.readFileSync(outputP);

        await sock.sendMessage(from, {
          sticker: stickerBuffer,
          stickerMetadata: {
            packname: "⚔️ Yuta Okotsu MD",
            author: "DuarteXV",
          }
        }, { quoted: msg });

        await react("✅");
        try { fs.unlinkSync(inputP); fs.unlinkSync(outputP); } catch {}
        return;
      }

      // ─── IMAGEN O VIDEO ──────────────────────────────
      const esVideo = targetType === "videoMessage";
      const ext     = esVideo ? "mp4" : "jpg";
      const inputP  = path.join(tmpDir, `stk_in_${Date.now()}.${ext}`);
      const outputP = path.join(tmpDir, `stk_out_${Date.now()}.webp`);

      fs.writeFileSync(inputP, buffer);

      if (esVideo) {
        try {
          const { stdout } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputP}"`
          );
          const dur = parseFloat(stdout.trim());
          if (dur > 15) {
            fs.unlinkSync(inputP);
            return await reply({
              text: `❌ El video dura *${dur.toFixed(1)}s*, máximo *15 segundos*.\n\n_${hora} • ${fecha}_\n⚔️ _Yuta Okotsu MD | DuarteXV_`
            });
          }
        } catch {}
      }

      await convertirSticker(inputP, outputP, esVideo);

      const stickerBuffer = fs.readFileSync(outputP);

      await sock.sendMessage(from, {
        sticker: stickerBuffer,
        stickerMetadata: {
          packname: "⚔️ Yuta Okotsu MD",
          author: "DuarteXV",
        }
      }, { quoted: msg });

      await react("✅");
      try { fs.unlinkSync(inputP); fs.unlinkSync(outputP); } catch {}

    } catch (error) {
      await react("❌");
      await reply({ text: `❌ Error al crear el sticker:\n\`${error.message}\`` });
      console.error("Error en sticker:", error);
    }
  }
};