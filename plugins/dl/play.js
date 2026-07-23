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

      // FIX: este endpoint busca directamente por texto (parámetro "query"),
      // no hace falta pasarle una URL de YouTube.
      const api = `https://api.alyacore.xyz/dl/youtubeplay?query=${encodeURIComponent(text)}&key=${API_KEY}`;

      const res = await axios.get(api, {
        timeout: 90000,
      });

      const data = res.data;

      // Estructura real de este endpoint:
      // { status: true, creator: "...", result: { title, channel, duration, views, published, dl, fileName } }
      if (!data?.status || !data?.result?.dl) {
        console.error("Respuesta inesperada de la API:", data);
        return reply({
          text: "⛧ no pude obtener el audio",
        });
      }

      const info = data.result;

      // Este endpoint no devuelve thumbnail ni el link de YouTube,
      // así que usamos lo que trajo yt-search (mismo texto buscado) como aproximación.
      const title = info.title || yt.title;
      const thumbnail = yt.thumbnail;
      const youtube_url = yt.url;
      const download_url = info.dl;
      const calidad = "128kbps";
      const formato = "mp3";
      const fileName = info.fileName || `${title}.mp3`;
      const duracionSegundos = info.duration || yt.seconds;

      const vistas = formatViews(info.views ?? yt.views);

      // FIX: mandamos la miniatura y descargamos el audio EN PARALELO.
      // Así la miniatura le sigue llegando primero al usuario (se manda casi
      // al instante), pero no perdemos tiempo esperando a que termine de subir
      // para recién ahí arrancar la descarga del link, que puede expirar rápido.
      const [, audioBuffer] = await Promise.all([
        sock.sendMessage(
          from,
          {
            image: { url: thumbnail },
            caption:
              `🌈 ${title}\n\n` +
              `👀 vistas › ${vistas}\n` +
              `🕐 duración › ${formatDuration(duracionSegundos)}\n` +
              `✨ calidad › ${calidad}\n` +
              `📦 formato › ${formato}\n` +
              `🔗 link › ${youtube_url}`
          },
          { quoted: msg }
        ),
        (async () => {
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
            return Buffer.from(audioRes.data);
          } catch (dlErr) {
            console.error("Error descargando el audio:");
            console.error("  mensaje:", dlErr.message);
            console.error("  código:", dlErr.code);
            console.error("  status HTTP:", dlErr.response?.status);
            console.error("  headers respuesta:", dlErr.response?.headers);
            return null;
          }
        })(),
      ]);

      if (!audioBuffer) {
        await react("❌");
        return reply({
          text: "⛧ no pude descargar el audio (el link puede haber expirado, intenta de nuevo)",
        });
      }

      const isLongAudio = duracionSegundos > 1800; // 30 minutos

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
