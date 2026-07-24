import { search, download } from 'aptoide-scraper'
import axios from 'axios'

const LIMITE_MB = 999

// Convierte un string de peso tipo "1.2 GB" o "850 MB" a un número en MB.
function parseSizeToMB(sizeStr) {
  if (!sizeStr) return 0
  const match = sizeStr.match(/([\d.]+)\s*(GB|MB|KB)/i)
  if (!match) return 0

  const valor = parseFloat(match[1])
  const unidad = match[2].toUpperCase()

  if (unidad === 'GB') return valor * 1024
  if (unidad === 'KB') return valor / 1024
  return valor
}

async function descargarBuffer(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 180000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  })
  return Buffer.from(res.data)
}

export default {
  name: ['apk', 'modapk', 'aptoide'],
  description: 'Busca y descarga una app desde Aptoide',
  category: 'dl',
  ownerOnly: false,

  async run({ text, reply, react, sock, from, msg, usedPrefix }) {
    if (!text?.trim()) {
      return await reply({ text: `❀ Por favor, ingrese el nombre de la apk para descargarlo.` })
    }

    try {
      await react('🕒')

      const resultados = await search(text)

      if (!resultados?.length) {
        await react('❌')
        return await reply({ text: `❀ No se encontraron resultados para "${text}".` })
      }

      const data5 = await download(resultados[0].id)

      const txt =
        `🌸┃ 𝗪𝗔𝗚𝗨𝗥𝗜 𝗕𝗢𝗧  ┃🌸\n` +
        `╰───────────────────\n\n` +
        `✧ APTOIDE - DESCARGAS ✧\n\n` +
        `≡ 📱 𝙉𝙤𝙢𝙗𝙧𝙚: ${data5.name}\n` +
        `≡ 📦 𝙋𝙖𝙘𝙠𝙖𝙜𝙚: ${data5.package}\n` +
        `≡ 🔄 𝙐𝙡𝙩𝙞𝙢𝙖 𝙑𝙚𝙧𝙨𝙞ó𝙣: ${data5.lastup}\n` +
        `≡ 📊 𝙋𝙚𝙨𝙤: ${data5.size}\n` +
        `╰───────────────────`

      // Miniatura con la info de la app
      await sock.sendMessage(
        from,
        { image: { url: data5.icon }, caption: txt },
        { quoted: msg }
      )

      // Chequeo de peso corregido: convertimos el string a MB de verdad
      const pesoMB = parseSizeToMB(data5.size)

      if (pesoMB > LIMITE_MB) {
        await react('⚠️')
        return await reply({
          text:
            `🌸┃ 𝗪𝗔𝗚𝗨𝗥𝗜 𝗕𝗢𝗧  ┃🌸\n` +
            `╰───────────────────\n\n` +
            `⚠️ 𝗔𝗥𝗖𝗛𝗜𝗩𝗢 𝗗𝗘𝗠𝗔𝗦𝗜𝗔𝗗𝗢 𝗣𝗘𝗦𝗔𝗗𝗢\n` +
            `❖ El archivo es demasiado grande para enviar por WhatsApp.\n` +
            `❖ Peso: ${data5.size}\n` +
            `❖ Intenta buscar una versión más ligera.`
        })
      }

      // Descargamos el APK como buffer en vez de pasarle la URL directa a
      // Baileys, para evitar los fallos de fetch interno (403/expirado) que
      // ya vimos con otros links de descarga.
      let apkBuffer
      try {
        apkBuffer = await descargarBuffer(data5.dllink)
      } catch (dlErr) {
        console.error('Error descargando el APK:', dlErr.message, '| status:', dlErr.response?.status)
        await react('❌')
        return await reply({
          text: `❀ No pude descargar el archivo (el link puede haber expirado). Intenta de nuevo.`
        })
      }

      const apkFileName = `${data5.name}_by_WaguriBot.apk`

      await sock.sendMessage(
        from,
        {
          document: apkBuffer,
          mimetype: 'application/vnd.android.package-archive',
          fileName: apkFileName,
          caption: `🌸 𝗪𝗔𝗚𝗨𝗥𝗜 𝗕𝗢𝗧 - ${data5.name}  🌸`
        },
        { quoted: msg }
      )

      await reply({
        text:
          `🌸┃ 𝗪𝗔𝗚𝗨𝗥𝗜 𝗕𝗢𝗧  ┃🌸\n` +
          `╰───────────────────\n\n` +
          `✅ 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗔\n` +
          `❖ Aplicación: ${data5.name}\n` +
          `❖ Versión: ${data5.lastup}\n` +
          `❖ Peso: ${data5.size}\n` +
          `❖ Archivo enviado con éxito.`
      })

      await react('✅')

    } catch (error) {
      console.error('Error en comando apk:', error)
      await react('❌')
      return await reply({
        text:
          `🌸┃ 𝗪𝗔𝗚𝗨𝗥𝗜 𝗕𝗢𝗧  ┃🌸\n` +
          `╰───────────────────\n\n` +
          `⚠️ 𝗘𝗥𝗥𝗢𝗥 𝗘𝗡 𝗟𝗔 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔\n` +
          `❖ Se ha producido un problema.\n` +
          `❖ Usa *${usedPrefix}report* para informarlo.\n` +
          `❖ Error: ${error.message}`
      })
    }
  }
}
