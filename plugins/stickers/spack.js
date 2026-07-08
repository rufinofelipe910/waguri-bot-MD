import axios from 'axios'
import sharp from 'sharp'
import { db } from '../../database/db.js'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const toBuffer = async (url) =>
  Buffer.from((await axios.get(url, { responseType: 'arraybuffer' })).data)

const toWebp = async (buffer, isAnimated = false) => {
  const base = sharp(buffer, isAnimated ? { animated: true } : {})
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80, ...(isAnimated ? { loop: 0 } : {}) })
  return base.toBuffer()
}

const withRetry = async (fn, attempt = 1) => {
  try {
    return await fn()
  } catch (e) {
    if (e.response?.status === 429 && attempt <= 3) {
      await delay((e.response.headers['retry-after'] || 5) * 1000)
      return withRetry(fn, attempt + 1)
    }
    throw e
  }
}

const searchStickerly = (query) =>
  withRetry(async () => {
    const { data } = await axios.get('https://api.alyacore.xyz/stickerly/search', {
      params: { query, key: 'Duarte-zz12' }
    })
    return data
  })

const getPackDetail = (url) =>
  withRetry(async () => {
    const { data } = await axios.get('https://api.alyacore.xyz/stickerly/detail', {
      params: { url, key: 'Duarte-zz12' }
    })
    return data
  })

export default {
  name: ['stickersearch', 'buscars', 'spack'],
  description: 'Busca packs de stickers en Sticker.ly',
  category: 'stickers',
  ownerOnly: false,

  async run({ sock, from, msg, args, text, usedPrefix, senderNum, reply, react }) {
    try {
      if (!text) {
        return await reply({
          text: `❌ Debes escribir el término a buscar.\n\n💡 *Uso:* ${usedPrefix || '.'}spack gatos`
        })
      }

      await react('⏳')

      const search = await searchStickerly(text)
      const resultados = search.resultados || search.result || []
      const freePacks = resultados.filter(p => !p.isPaid)

      if (!freePacks.length) {
        await react('❌')
        return await reply({ text: `❌ No se encontraron packs para *${text}*.` })
      }

      // 🌟 LÓGICA DE TU BASE DE DATOS SQLITE (.setmeta)
      const user = db.getUser(senderNum) || {}
      
      const packName = user.text1 || global.packname || 'Yuta Pack'
      const authorName = user.text2 || global.author || `@${senderNum}`

      const bestPack = freePacks[0]
      const detail = await getPackDetail(bestPack.url)

      if (!detail.status || !detail.detalles?.stickers?.length) {
        await react('❌')
        return await reply({ text: `❌ No se pudo obtener el contenido del paquete.` })
      }

      const { detalles } = detail
      const stickers = detalles.stickers.slice(0, 30)

      await reply({
        text: `📦 *Pack:* ${detalles.name}\n🖼️ *Stickers:* ${stickers.length}\n⏳ _Procesando paquete..._`
      })

      const stickerList = (
        await Promise.allSettled(
          stickers.map(async (s) => {
            const buf = await toBuffer(s.imageUrl)
            const webp = await toWebp(buf, s.isAnimated)
            return {
              sticker: webp,
              isAnimated: s.isAnimated || false,
              isLottie: false,
              emojis: ['🎭']
            }
          })
        )
      )
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)

      if (!stickerList.length) {
        await react('❌')
        return await reply({ text: `❌ No se pudo procesar ningún sticker.` })
      }

      const cover = await sharp(await toBuffer(detalles.thumbnailUrl))
        .resize(96, 96, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer()

      await sock.sendMessage(
        from,
        {
          stickerPack: {
            name: packName,
            publisher: authorName,
            description: `${detalles.name} • ${global.botname || 'Yuta Bot'}`,
            cover,
            stickers: stickerList
          }
        },
        { quoted: msg }
      )

      await react('✅')

    } catch (error) {
      console.error(error)
      await react('❌')
      await reply({ text: `❌ *Error:* ${error.message}` })
    }
  }
}
