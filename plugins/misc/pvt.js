exports.command = {
  name: 'pvt',
  alias: [],
  category: 'misc',
  desc: 'Convierte un video respondido en nota de video (pvt)',
  owner: false,
  group: true,
  private: true,
  run: async (conn, m, { }) => {
    const quoted = m.quoted
    
    if (!quoted || !['videoMessage'].includes(quoted.mtype)) {
      return conn.sendMessage(m.chat, { 
        text: '❌ Responde a un video para convertirlo en nota de video.' 
      }, { quoted: m })
    }

    let videoBuffer
    try {
      videoBuffer = await quoted.download()
    } catch (e) {
      return conn.sendMessage(m.chat, { 
        text: '❌ No se pudo descargar el video.' 
      }, { quoted: m })
    }

    await conn.sendMessage(m.chat, {
      video: videoBuffer,
      mimetype: 'video/mp4',
      ptv: true, // <-- esto lo hace nota de video (pvt)
      contextInfo: {
        mentionedJid: [m.sender],
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363420979328566@newsletter',
          newsletterName: '⏤͟͞ू⃪𝐁𝕃𝐔𝔼 𝐋𝕆𝐂𝕂 𝐂𝕃𝐔𝔹 𑁯🩵ᰍ',
          serverMessageId: -1
        }
      }
    }, { quoted: m })
  }
}