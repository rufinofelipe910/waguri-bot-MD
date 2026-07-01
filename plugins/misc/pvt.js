exports.command = {
  name: 'pvt',
  category: 'misc',
  desc: 'Convierte un video respondido en nota de video (pvt)',
  owner: false,
  group: true,
  private: true,
  run: async (conn, m, { }) => {
    const quoted = m.quoted
    
    if (!quoted || quoted.mtype !== 'videoMessage') {
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
      ptv: true,
      contextInfo: {
        mentionedJid: [m.sender],
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363420979328566@newsletter',
          newsletterName: '⏤͟͞ू⃪𝐁𝕃𝐔𝐄 𝐋𝕆𝐂𝕂 𝐂𝕃𝐔𝐁 𑁯🩵ᰍ',
          serverMessageId: -1
        }
      }
    }, { quoted: m })
  }
}