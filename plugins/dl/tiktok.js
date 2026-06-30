import axios from 'axios';
import { Readable, Writable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';

// 1. Validador de URLs de TikTok
function validateTikTokUrl(url) {
  if (!url) return null;
  const regex = /^(https?:\/\/)?(www\.|vm\.|vt\.)?tiktok\.com\/[\w\d@?=&/.-]+/i;
  const match = url.match(regex);
  return match ? match[0] : null;
}

// 2. Proveedor principal (TikWM)
async function tiktokTikWM(url) {
  try {
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;

    const { data } = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.tikwm.com/',
        'Origin': 'https://www.tikwm.com'
      },
      timeout: 15000
    });

    if (data.code === 0 && data.data && (data.data.hdplay || data.data.play)) {
      const d = data.data;

      return {
        videoUrl: d.hdplay || d.play,
        videoSize: d.hd_size || d.size,
        title: d.title,
        authorNick: d.author?.nickname || 'Desconocido',
        likes: d.digg_count,
        shares: d.share_count,
        downloads: d.download_count,
        comments: d.comment_count
      };
    }
    throw new Error('No video data found');
  } catch (error) {
    throw new Error(`TikWM API error: ${error.message}`);
  }
}

// 3. Sistema fallback
async function downloadFromMultipleAPIs(url) {
  try {
    return await tiktokTikWM(url);
  } catch (error) {
    console.warn('TikWM falló, intentando fallback...', error.message);
    try {
      const fallbackUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(fallbackUrl);
      if (data.code === 0 && data.data) {
        const d = data.data;
        return {
          videoUrl: d.play,
          title: d.title,
          authorNick: d.author?.nickname || 'Desconocido',
          likes: d.digg_count,
          shares: d.share_count,
          downloads: d.download_count,
          comments: d.comment_count
        };
      }
    } catch (fallbackError) {
      throw new Error('Todas las APIs de descarga fallaron.');
    }
  }
}

// 4. Descargador de Buffer
async function descargarBuffer(url) {
  const { data } = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  return Buffer.from(data);
}

// 5. Optimizador de Video usando FFmpeg en memoria
function optimizarVideoConFFmpeg(inputBuffer) {
  return new Promise((resolve, reject) => {
    const inputStream = new Readable();
    inputStream.push(inputBuffer);
    inputStream.push(null); // Fin del stream

    const buffers = [];
    const outputStream = new Writable({
      write(chunk, encoding, callback) {
        buffers.push(chunk);
        callback();
      }
    });

    ffmpeg(inputStream)
      .outputOptions([
        '-c:v libx264',       // Forzar codec H.264 compatible con móviles
        '-pix_fmt yuv420p',   // Formato de pixel estándar universal para WhatsApp
        '-c:a aac',           // Audio AAC universal
        '-movflags frag_keyframe+empty_moov' // Requerido para procesar streams MP4 en memoria
      ])
      .format('mp4')
      .on('end', () => {
        resolve(Buffer.concat(buffers));
      })
      .on('error', (err) => {
        reject(err);
      })
      .pipe(outputStream);
  });
}

// 6. Estructura del comando/plugin
export default {
  name: ['tiktok', 'tt'],
  description: 'Descarga videos de TikTok',
  category: 'dl',
  groupOnly: false,

  async run({ sock, from, msg, args, usedPrefix, cmdName, reply, react }) {
    if (!args[0]) {
      return await reply({
        text: `🎵 Por favor, ingresa un enlace de TikTok.\n\n📝 *Ejemplo:* ${usedPrefix}${cmdName} https://www.tiktok.com/@usuario/video/1234567890`
      });
    }

    const tiktokUrl = validateTikTokUrl(args[0]);
    if (!tiktokUrl) {
      return await reply({
        text: `❌ URL de TikTok inválida. Por favor verifica el enlace.\n\n✅ *URLs válidas:*\n• https://www.tiktok.com/@usuario/video/...\n• https://vm.tiktok.com/...\n• https://vt.tiktok.com/...`
      });
    }

    await react('🔄');
    await reply({ text: `> ✎...Descargando video.` });

    try {
      const result = await downloadFromMultipleAPIs(tiktokUrl);

      if (!result || !result.videoUrl) {
        await react('❌');
        return await reply({ text: `❌ No se pudo descargar el video. El enlace podría ser privado o no válido.` });
      }

      // Descargamos el video original de la API
      let buffer = await descargarBuffer(result.videoUrl);

      // Lo pasamos por FFmpeg para reparar contenedores o codecs incompatibles
      try {
        buffer = await optimizarVideoConFFmpeg(buffer);
      } catch (ffmpegErr) {
        console.error('FFmpeg falló, enviando buffer original como respaldo:', ffmpegErr.message);
        // Si falla FFmpeg, dejamos el buffer original para no romper el comando por completo
      }

      const titulo = result.title?.trim() || 'Sin título';

      let caption = `☑ *Video de TikTok descargado*\n`;
      caption += `─╮\n`;
      caption += `   ╰━━━━━━(☆)━━━━━━─╮\n`;
      caption += `*👤 ᴀᴜᴛᴏʀ:* ${result.authorNick || 'Desconocido'}\n`;
      caption += `*♡ ʟɪᴋᴇs:* ${result.likes ?? 'N/A'}\n`;
      caption += `*⌲ sʜᴀʀᴇ:* ${result.shares ?? 'N/A'}\n`;
      caption += `*⎙ sᴀᴠᴇ:* ${result.downloads ?? 'N/A'}\n`;
      caption += `*○ ᴄᴏᴍᴍᴇɴᴛ:* ${result.comments ?? 'N/A'}\n`;
      caption += `*📹 ᴛɪᴛᴜʟᴏ:* ${titulo}`;

      await sock.sendMessage(from, {
        video: buffer,
        mimetype: 'video/mp4',
        fileName: 'tiktok.mp4',
        caption
      }, { quoted: msg });

      await react('✅');

    } catch (error) {
      console.error('Error en TikTok download:', error);
      await react('❌');
      await reply({
        text: `❌ Error al procesar la descarga: ${error.message}\n\n💡 *Consejos:*\n• Verifica que el video sea público\n• Intenta con un enlace diferente\n• El video podría estar restringido por región`
      });
    }
  }
};
