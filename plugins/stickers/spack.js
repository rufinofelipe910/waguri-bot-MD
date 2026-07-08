import axios from 'axios'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'

export default {
  name: ['stickersearch', 'buscars', 'spack'],
  description: 'Busca packs de stickers por nombre',
  category: 'stickers',
  ownerOnly: false,

  async run({ sock, from, msg, args, text, reply, react }) {
    if (!text) {
      return await reply({
        text: `🎭 Escribe el término a buscar.\n\n📝 *Ejemplo:* .spack gatos`
      })
    }

    await react('🔍')

    try {
      const { data } = await axios.get('https://fare.ink/search/s', {
        params: { q: text },
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      })

      if (!data?.resultado?.success || !data.resultado.packs?.length) {
        await react('❌')
        return await reply({ text: `❌ No se encontraron packs para *"${text}"*` })
      }

      const packs = data.resultado.packs
      const total = data.resultado.total_results

      let lista = `🎭 *Packs encontrados para "${text}"*\n`
      lista += `╰━━━━━━(☆)━━━━━━─╮\n\n`
      lista += `📦 *Total:* ${total} packs\n\n`

      packs.forEach((pack, i) => {
        lista += `*${i + 1}.* ${pack.title}\n`
        lista += `   👤 ${pack.author}\n`
        lista += `   🖼️ ${pack.stickers.length} stickers\n\n`
      })

      lista += `> Mandando stickers del primer pack...`

      await reply({ text: lista })

      const primerPack = packs[0]

      await reply({
        text: `📦 *${primerPack.title}*\n👤 ${primerPack.author}\n🖼️ ${primerPack.stickers.length} stickers`
      })

      for (const stickerUrl of primerPack.stickers) {
        try {
          const { data: buffer } = await axios.get(stickerUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
          })

          const ext = stickerUrl.split('.').pop().toLowerCase()

          let stickerBuffer

          if (ext === 'webp') {
            // Ya es WebP, lo mandamos directo
            stickerBuffer = Buffer.from(buffer)
          } else {
            // PNG, JPG, GIF — convertimos a WebP con wa-sticker-formatter
            const sticker = new Sticker(Buffer.from(buffer), {
              type: ext === 'gif' ? StickerTypes.ANIMATED : StickerTypes.DEFAULT,
              quality: 50,
            })
            stickerBuffer = await sticker.toBuffer()
          }

          await sock.sendMessage(from, {
            sticker: stickerBuffer
          }, { quoted: msg })

          await new Promise(r => setTimeout(r, 400))

        } catch {
          continue
        }
      }

      await react('✅')

    } catch (error) {
      console.error('Error en stickersearch:', error)
      await react('❌')
      await reply({ text: `❌ Error al buscar stickers: ${error.message}` })
    }
  }
}