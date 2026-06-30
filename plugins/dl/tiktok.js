import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

// 4. Optimizador de Video usando Archivos Temporales en Disco
function optimizarVideoConFFmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',       // Codec h264 compatible con cualquier cel
        '-pix_fmt yuv420p',   // Muestreo de color compatible con WhatsApp
        '-c:a aac',           // Audio universal
        '-movflags +faststart' // Mueve el moov atom al principio para que cargue rápido
      ])
      .format('mp4')
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

// 5. Estructura del comando/plugin
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

    // Definimos rutas temporales únicas
    const tempDir = os.tmpdir();
    const inputTempFile = path.join(tempDir, `tt_in_${Date.now()}.mp4`);
    const outputTempFile = path.join(tempDir, `tt_out_${Date.now()}.mp4`);

    try {
      const result = await downloadFromMultipleAPIs(tiktokUrl);

      if (!result || !result.videoUrl) {
        await react('❌');
        return await reply({ text: `❌ No se pudo obtener el video de la API.` });
      }

      // Descargamos el archivo directamente al disco en modo Stream
      const response = await axios({
        method: 'get',
        url: result.videoUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const writer = fs.createWriteStream(inputTempFile);
      response.data.pipe(writer);

      // Esperamos a que se termine de escribir el archivo descargado
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Procesamos con FFmpeg de archivo a archivo (No se traba)
      let finalBuffer;
      try {
        await optimizarVideoConFFmpeg(inputTempFile, outputTempFile);
        finalBuffer = fs.readFileSync(outputTempFile);
      } catch (ffmpegErr) {
        console.error('FFmpeg falló, intentando enviar el original:', ffmpegErr.message);
        finalBuffer = fs.readFileSync(inputTempFile); // Respaldo por si FFmpeg da error de codecs
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

      // Enviamos el video procesado
      await sock.sendMessage(from, {
        video: finalBuffer,
        mimetype: 'video/mp4',
        fileName: 'tiktok.mp4',
        caption
      }, { quoted: msg });

      await react('✅');

    } catch (error) {
      console.error('Error en TikTok download:', error);
      await react('❌');
      await reply({
        text: `❌ Error al procesar la descarga: ${error.message}`
      });
    } finally {
      // Borramos los archivos temporales pase lo que pase para no llenar la memoria del VPS
      if (fs.existsSync(inputTempFile)) fs.unlinkSync(inputTempFile);
      if (fs.existsSync(outputTempFile)) fs.unlinkSync(outputTempFile);
    }
  }
};
