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

      const {
        title,
        thumbnail,
        timestamp,
        views,
        ago
      } = yt;

      const vistas = formatViews(views);

      await sock.sendMessage(
        from,
        {
          image: { url: thumbnail },
          caption:
            `*❐ _Nombre_*: ${title}\n` +
            `*❐ _Vistas_*: ${vistas}\n` +
            `*❐ _Duración_*: ${timestamp}\n` +
            `*❐ _Fecha_*: ${ago}\n\n` +
            `₊ ⊹ obteniendo audio`
        },
        { quoted: msg }
      );

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

      const audioUrl = data.download_url;

      await sock.sendMessage(
        from,
        {
          audio: { url: audioUrl },
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