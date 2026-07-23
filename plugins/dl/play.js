import axios from "axios";
import yts from "yt-search";

const API_KEY = "api-uMZCY";

export default {
  name: ["play", "yta", "ytmp3", "playaudio"],
  description: "Descarga música de YouTube",
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text.trim()) {
        return reply({
          text: "🌈 escribe el nombre o link del video",
        });
      }

      await react("🎧");

      const search = await yts(text);

      const yt =
        search.videos?.[0] ||
        search.all?.[0];

      if (!yt) {
        return reply({
          text: "🥀 no encontré resultados",
        });
      }

      // FIX: endpoint correcto es /dl/ytmp3, y el parámetro de la key es "key", no "apikey".
      const api = `https://api.alyacore.xyz/dl/ytmp3?url=${encodeURIComponent(yt.url)}&key=${API_KEY}`;

      const res = await axios.get(api, {
        timeout: 90000,
      });

      const data = res.data;

      // FIX: la API devuelve los datos anidados en "data.data", no en "data.descarga".
      // Estructura real:
      // { status: true, creator: "...", data: { title, author, duration, thumbnail, quality, dl } }
      if (!data?.status || !data?.data?.dl) {
        console.error("Respuesta inesperada de la API:", data);
        return reply({
          text: "⛧ no pude obtener el audio",
        });
      }

      const info = data.data;

      const title = info.title || yt.title;
      const thumbnail = info.thumbnail || yt.thumbnail;
      const youtube_url = yt.url;
      const download_url = info.dl;
      const calidad = info.quality || "128kbps";
      const formato = "mp3";
      const fileName = `${title}.mp3`;

      const vistas = formatViews(yt.views);

      await sock.sendMessage(
        from,
        {
          image: { url: thumbnail },
          caption:
            `🌈 ${title}\n\n` +
            `👀 vistas › ${vistas}\n` +
            `🕐 duración › ${formatDuration(yt.seconds)}\n` +
            `✨ calidad › ${calidad}\n` +
            `📦 formato › ${formato}\n` +
            `🔗 link › ${youtube_url}`
        },
        { quoted: msg }
      );

      // FIX: Baileys a veces falla al descargar la URL internamente
      // (el servidor exige headers tipo User-Agent, o la URL expira rápido).
      // Descargamos el audio nosotros mismos con axios y lo mandamos como buffer.
      let audioBuffer;
      try {
        const audioRes = await axios.get(download_url, {
          responseType: "arraybuffer",
          timeout: 90000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "*/*",
          },
        });
        audioBuffer = Buffer.from(audioRes.data);
      } catch (dlErr) {
        console.error("Error descargando el audio:", dlErr.message);
        await react("❌");
        return reply({
          text: "⛧ no pude descargar el audio (el link puede haber expirado, intenta de nuevo)",
        });
      }

      const isLongAudio = yt.seconds > 1800; // 30 minutos

      if (isLongAudio) {
        await sock.sendMessage(
          from,
          {
            document: audioBuffer,
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
            audio: audioBuffer,
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
