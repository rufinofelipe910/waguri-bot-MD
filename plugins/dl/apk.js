import axios from 'axios'

export default {
  name: ['apk', 'aptoide'],
  description: 'Descarga APKs desde Aptoide',
  category: 'dl',
  ownerOnly: false,

  async run({ sock, from, msg, text, reply, react }) {
    try {
      if (!text) {
        return reply({ text: '⛧ escribe el nombre de la app que quieres descargar' })
      }

      await react('🔍')

      const { data } = await axios.get('https://ws75.aptoide.com/api/7/apps/search', {
        params: { query: text, limit: 1 },
        timeout: 20000
      })

      const app = data?.datalist?.list?.[0]

      if (!app) {
        await react('❌')
        return reply({ text: `⛧ no encontré ningún APK con el nombre *${text}*` })
      }

      const apkUrl = app.file.path
      const sizeMB = (app.file.filesize / 1024 / 1024).toFixed(2)

      const caption =
        `🌈 ${app.name}\n\n` +
        `📦 paquete › ${app.package}\n` +
        `💽 versión › ${app.file.vername}\n` +
        `📥 descargas › ${app.stats.downloads.toLocaleString()}\n` +
        `⭐ rating › ${app.stats.rating.avg}\n` +
        `🌀 tamaño › ${sizeMB} MB\n` +
        `🛡️ seguridad › ${app.file.malware?.rank || 'N/A'}`

      await sock.sendMessage(
        from,
        {
          image: { url: app.icon },
          caption
        },
        { quoted: msg }
      )

      await sock.sendMessage(
        from,
        {
          document: { url: apkUrl },
          mimetype: 'application/vnd.android.package-archive',
          fileName: `${app.package}.apk`
        },
        { quoted: msg }
      )

      await react('✅')

    } catch (error) {
      await react('❌')
      await reply({ text: `⛧ Error: ${error.message}` })
      console.error('Error en apk:', error)
    }
  }
}