import axios from "axios";
import yts from "yt-search";

const API_KEY = "Irokz444";

export default {
  name: ["play", "yta", "ytmp3", "playaudio"],
  description: "Descarga música de YouTube",
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text.trim()) {
        return reply({
          text: "˖ ࣪ 𐙚 escribe el nombre o link del video",
        });
      }

      await react("🎧");

      const search = await yts(text);

      const yt =
        search.videos?.[0] ||
        search.all?.[0];

      if (!yt) {
        return reply({
          text: "˖ ࣪ 𐙚 no encontré resultados",
        });
      }

      const api =
        `https://systemzone.store/v2/player?apikey=${API_KEY}&text=${encodeURIComponent(text)}`;

      const res = await axios.get(api, {
        timeout: 90000,
      });

      const data = res.data;

      if (!data?.status || !data?.download_url) {
        return reply({
          text: "˖ ࣪ 𐙚 no pude obtener el audio",
        });
      }

      const {
        title,
        thumbnail,
        duration,
        youtube_url,
        download_url
      } = data;

      const vistas = formatViews(yt.views);

      await sock.sendMessage(
        from,
        {
          image: { url: thumbnail || yt.thumbnail },
          caption:
            `「✦」Descargando *<${title}>*\n\n` +
            `> ✐ Vistas » *${vistas}*\n` +
            `> ⴵ Duracion » *${formatDuration(duration)}*\n` +
            `> ✰ Calidad » *128 kbps*\n` +
            `> ❒ Formato » *mp3*\n` +
            `> 🜸 Link » ${youtube_url}`
        },
        { quoted: msg }
      );

      await sock.sendMessage(
        from,
        {
          audio: { url: download_url },
          mimetype: "audio/mpeg",
          ptt: false,
        },
        { quoted: msg }
      );

      await react("✅");

    } catch (e) {
      console.error(e);

      await react("❌");

      await reply({
        text: `˖ ࣪ 𐙚 ${e.message}`,
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

function formatDuration(seconds) {
  seconds = Number(seconds);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes <= 0) {
    return `${secs} segundos`;
  }

  return `${minutes} minuto${minutes > 1 ? "s" : ""} ${secs} segundos`;
}