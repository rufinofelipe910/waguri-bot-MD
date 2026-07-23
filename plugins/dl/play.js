import axios from "axios";
import yts from "yt-search";

const API_KEY = "api-uMZCY";

const ALIAS_AUDIO = ["play", "yta", "ytmp3", "playaudio"];
const ALIAS_VIDEO = ["play2", "ytv", "ytmp4", "mp4"];

function formatViews(views) {
  if (!views) return "No disponible";
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`;
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`;
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}k`;
  return views.toString();
}

function formatDuration(duration) {
  if (!duration) return "No disponible";
  if (typeof duration === "string") {
    if (duration.includes(":")) return duration;
    duration = Number(duration);
  }
  if (isNaN(duration)) return "No disponible";

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Descarga un archivo a Buffer con headers de navegador (evita que Baileys
// falle al hacer el fetch interno de links con token de un solo uso).
async function descargarBuffer(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 120000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "*/*",
    },
  });
  return Buffer.from(res.data);
}

export default {
  name: [...ALIAS_AUDIO, ...ALIAS_VIDEO],
  description: "Descarga audio o video de YouTube",
  category: "dl",
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react, cmdName }) {
    try {
      if (!text?.trim()) {
        return reply({ text: "🌈 escribe el nombre o link del video" });
      }

      await react("🎧");

      const search = await yts(text);
      const yt = search.videos?.[0] || search.all?.[0];

      if (!yt) {
        return reply({ text: "🥀 no encontré resultados" });
      }

      const esAudio = ALIAS_AUDIO.includes(cmdName);
      const vistas = formatViews(yt.views);

      const infoCaption =
        `🌈 ${yt.title}\n\n` +
        `👀 vistas › ${vistas}\n` +
        `🕐 duración › ${formatDuration(yt.seconds)}\n` +
        `📺 canal › ${yt.author?.name || "Desconocido"}\n` +
        `🔗 link › ${yt.url}`;

      if (esAudio) {
        // ── AUDIO ── endpoint confirmado: /dl/youtubeplay?query=...&key=...
        const api = `https://api.alyacore.xyz/dl/youtubeplay?query=${encodeURIComponent(text)}&key=${API_KEY}`;
        const res = await axios.get(api, { timeout: 90000 });
        const data = res.data;

        if (!data?.status || !data?.result?.dl) {
          console.error("Respuesta inesperada de youtubeplay:", data);
          return reply({ text: "⛧ no pude obtener el audio" });
        }

        const info = data.result;
        const fileName = info.fileName || `${info.title || yt.title}.mp3`;
        const duracionSegundos = info.duration || yt.seconds;

        const [, audioBuffer] = await Promise.all([
          sock.sendMessage(from, { image: { url: yt.thumbnail }, caption: infoCaption }, { quoted: msg }),
          descargarBuffer(info.dl).catch((e) => {
            console.error("Error descargando audio:", e.message, "| status:", e.response?.status);
            return null;
          }),
        ]);

        if (!audioBuffer) {
          await react("❌");
          return reply({ text: "⛧ no pude descargar el audio (el link puede haber expirado, intenta de nuevo)" });
        }

        if (duracionSegundos > 1800) {
          await sock.sendMessage(
            from,
            { document: audioBuffer, mimetype: "audio/mpeg", fileName, caption: "⛧ audio enviado como documento por duración/tamaño" },
            { quoted: msg }
          );
        } else {
          await sock.sendMessage(from, { audio: audioBuffer, mimetype: "audio/mpeg", ptt: false }, { quoted: msg });
        }

      } else {
        // ── VIDEO ── endpoint: /dl/ytmp4?url=...&quality=360&key=...
        // No pude verificar en vivo la estructura real de este endpoint,
        // así que dejo logging detallado por si la API devuelve otra cosa.
        const api = `https://api.alyacore.xyz/dl/ytmp4?url=${encodeURIComponent(yt.url)}&quality=360&key=${API_KEY}`;
        const res = await axios.get(api, { timeout: 90000 });
        const data = res.data;

        if (!data?.status || !data?.data?.dl) {
          console.error("Respuesta inesperada de ytmp4:", JSON.stringify(data));
          return reply({ text: `⛧ no pude obtener el video${data?.message ? ` (${data.message})` : ""}` });
        }

        const info = data.data;
        const fileName = `${info.title || yt.title}_${info.quality || "360"}p.mp4`;

        const [, videoBuffer] = await Promise.all([
          sock.sendMessage(from, { image: { url: yt.thumbnail }, caption: infoCaption }, { quoted: msg }),
          descargarBuffer(info.dl).catch((e) => {
            console.error("Error descargando video:", e.message, "| status:", e.response?.status);
            return null;
          }),
        ]);

        if (!videoBuffer) {
          await react("❌");
          return reply({ text: "⛧ no pude descargar el video (el link puede haber expirado, intenta de nuevo)" });
        }

        await sock.sendMessage(
          from,
          { document: videoBuffer, mimetype: "video/mp4", fileName, caption: "⛧ video descargado" },
          { quoted: msg }
        );
      }

      await react("✅");

    } catch (e) {
      console.error(e);
      await react("❌");
      await reply({ text: `⛧ Error: ${e.message}` });
    }
  },
};
