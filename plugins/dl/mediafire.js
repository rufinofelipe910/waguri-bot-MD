import axios from 'axios'

export default {
  name: ['mediafire', 'mf'],
  description: 'Descarga archivos desde un link de Mediafire',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text || !text.includes('mediafire.com')) {
        return reply({ text: '📁 pega un link válido de Mediafire, ej: .mediafire https://www.mediafire.com/file/...' })
      }

      await react('📁')

      const { data: html } = await axios.get(text, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })

      // 🔍 DEBUG TEMPORAL — busca la parte relevante del HTML
      const idx = html.indexOf('downloadButton')
      console.log('[MEDIAFIRE DEBUG] contexto alrededor de downloadButton:')
      console.log(html.substring(Math.max(0, idx - 100), idx + 400))

      const linkMatch =
        html.match(/id="downloadButton"[^>]*href="([^"]+)"/i) ||
        html.match(/href="([^"]+)"[^>]*id="downloadButton"/i) ||
        html.match(/downloadButton[^>]*href=["']([^"']+)["']/i)

      if (!linkMatch) {
        await react('❌')
        return reply({ text: '❌ no pude sacar el link de descarga (revisa consola para debug)' })
      }

      const downloadUrl = linkMatch[1].replace(/&amp;/g, '&')

      const titleMatch = html.match(/<title>(.*?)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : 'archivo'

      const sizeMatch = html.match(/Download \(([\d.]+\s?[A-Za-z]+)\)/i)
      const size = sizeMatch ? sizeMatch[1] : 'Desconocido'

      const fileName = decodeURIComponent(downloadUrl.split('/').pop())

      const caption =
        `📁 ${title}\n\n` +
        `📄 archivo › ${fileName}\n` +
        `💾 tamaño › ${size}`

      await sock.sendMessage(
        from,
        { document: { url: downloadUrl }, fileName, caption },
        { quoted: msg }
      )

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `❌ Error: ${error.message}` })
      console.error('Error en mediafire:', error)
    }
  }
}