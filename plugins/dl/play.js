import axios from "axios";
import yts from "yt-search";

const API_KEY = "free_key";

export default {
  name: ["play", "music"],
  description: "Descarga música de YouTube",
  category: "downloader",
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({
          text: "✧ Ingresa un nombre o link de YouTube",
        });
      }

      await react("🔍");

      let videoUrl = text;

      // ─── BUSCAR VIDEO SI NO ES LINK ───────────────────
      if (
        !text.includes("youtube.com") &&
        !text.includes("youtu.be")
      ) {
        const search = await yts(text);

        if (!search?.videos?.length) {
          return reply({
            text: "❌ No encontré resultados",
          });
        }

        videoUrl = search.videos[0].url;
      }

      // ─── API ──────────────────────────────────────────
      const api = `https://yosoyyo-api-ofc.onrender.com/api/youtube?q=${encodeURIComponent(
        videoUrl
      )}&apiKey=${API_KEY}`;

      const { data } = await axios.get(api, {
        timeout: 30000,
      });

      // ─── VALIDAR RESPUESTA ────────────────────────────
      const result =
        data?.result?.[0] ||
        data?.result ||
        data;

      if (!result) {
        return reply({
          text: "❌ La API no devolvió resultados",
        });
      }

      const title =
        result.title ||
        "audio";

      const mp3 =
        result.download?.mp3 ||
        result.downloads?.mp3?.url ||
        result.mp3;

      if (!mp3) {
        return reply({
          text: "❌ No se encontró el audio",
        });
      }

      // ─── INFO ─────────────────────────────────────────
      await reply({
        text: `🎵 *${title}*\n⏳ Enviando audio...`,
      });

      // ─── ENVIAR AUDIO ─────────────────────────────────
      await sock.sendMessage(
        from,
        {
          audio: { url: mp3 },
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${title}.mp3`,
        },
        { quoted: msg }
      );

      await react("✅");

    } catch (e) {
      console.error("PLAY ERROR:", e);

      await react("❌");

      return reply({
        text: `❌ Error:\n${e.message}`,
      });
    }
  },
};