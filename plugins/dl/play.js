import axios from "axios";
import yts from "yt-search";

const API_KEY = "NEX-832E11D2E71E43248B668FF2";

export default {
  name: ["play", "yta", "ytmp3", "playaudio"],
  description: "Descarga música de YouTube",
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text.trim()) {
        return reply({
          text: "⛧ escribe el nombre o link del video",
        });
      }

      await react("🎧");

      const search = await yts(text);

      const yt =
        search.videos?.[0] ||
        search.all?.[0];

      if (!yt) {
        return reply({
          text: "⛧ no encontré resultados",
        });
      }

      const api =
        `https://nexevo.boxmine.xyz/download/audio?url=${encodeURIComponent(yt.url)}&apikey=${API_KEY}`;

      const res = await axios.get(api, {
        timeout: 90000,
      });

      const body = res.data;
      const result = body?.result;

      if (!body?.status || !result?.url) {
        return reply({
          text: "⛧ no pude obtener el audio",
        });
      }

      const title = result.info?.title || yt.title;
      const thumbnail = result.info?.thumbnail || yt.thumbnail;
      const channel = result.info?.channel || yt.author?.name;
      const download_url = result.url;
      const calidad = result.quality || "128kbps";
      const formato = result.format || "mp3";
      const fileName = `${title}.mp3`;

      const vistas = formatViews(yt.views);
      const duracion = result.info?.duration || yt.seconds;

      await sock.sendMessage(
        from,
        {
          image: { url: thumbnail },
          caption:
            `⛧ ${title}\n\n` +
            `⛧ canal › ${channel || 'Desconocido'}\n` +
            `⛧ vistas › ${vistas}\n` +
            `⛧ duración › ${formatDuration(duracion)}\n` +
            `⛧ calidad › ${calidad}\n` +
            `⛧ formato › ${formato}\n` +
            `⛧ link › ${yt.url}`
        },
        { quoted: msg }
      );

      const isLongAudio = yt.seconds > 1800; // 30 minutos

      if (isLongAudio) {
        await sock.sendMessage(
          from,
          {
            document: { url: download_url },
            mimetype: "audio/mpeg",
            fileName,
            caption: "⛧ audio enviado como documento por duración/tamaño",
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          from,
          {
            audio: { url: download_url },
            mimetype: "audio/mpeg",
            ptt: false,
          },
          { quoted: msg }
        );
      }

      await react("✅");

    } catch (e) {
      console.error(e);

      await react("❌");

      await reply({
        text: `⛧ ${e.message}`,
      });
    }
  },
};

function formatViews(views) {
  if (!views) return "No disponible";

  if (views >= 1e9) {
    return `${(views / 1e9).toFixed(1)}B`;
  }

  if (views >= 1e6) {
    return `${(views / 1e6).toFixed(1)}M`;
  }

  if (views >= 1e3) {
    return `${(views / 1e3).toFixed(1)}k`;
  }

  return views.toString();
}

function formatDuration(duration) {
  if (!duration) return "No disponible";

  if (typeof duration === "string") {
    if (duration.includes(":")) {
      return duration;
    }
    duration = Number(duration);
  }

  if (isNaN(duration)) {
    return "No disponible";
  }

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}