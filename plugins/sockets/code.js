import { requestSubbotCode, activeBots } from '../../core/subbotManager.js'

const cooldowns = new Map()

const onlyDigits = (v = '') => String(v).replace(/\D/g, '')

// Un LID suele tener 14-15 dígitos; un teléfono real, 8-13
const looksLikePhone = (n) => n.length >= 8 && n.length <= 13

const phoneFromJid = (jid = '') => {
  if (!jid || !jid.endsWith('@s.whatsapp.net')) return ''
  return onlyDigits(jid.split('@')[0].split(':')[0])
}

export default {
  name: ['code'],
  description: 'Vincula tu número como subbot',
  category: 'sockets',
  ownerOnly: false,

  async run({ sock, from, senderNum, text, react, reply, msg }) {
    await react('🔑')

    // 1) Número escrito como argumento
    let phone = onlyDigits(text)

    // 2) Número real que trae el mensaje (cuando el remitente viene como LID)
    if (!phone) {
      phone =
        phoneFromJid(msg?.key?.participantAlt) ||
        phoneFromJid(msg?.key?.remoteJidAlt) ||
        ''
    }

    // 3) senderNum, solo si parece un teléfono real
    if (!phone && looksLikePhone(onlyDigits(senderNum))) {
      phone = onlyDigits(senderNum)
    }

    if (!looksLikePhone(phone)) {
      await react('❌')
      return await reply({
        text:
          `⚠️ No pude detectar tu número real.\n\n` +
          `Escríbelo junto al comando, con código de país, sin + ni espacios:\n` +
          `*.code 240XXXXXXXXX*`
      })
    }

    const id = `sub_${phone}`

    if (activeBots.has(id) && activeBots.get(id).status === 'online') {
      return await reply({
        text: `⚠️ Ese número ya está vinculado como subbot.\nUsa *.delbot* para desvincularlo.`
      })
    }

    if (cooldowns.has(phone)) {
      const diff = Date.now() - cooldowns.get(phone)
      const restante = Math.ceil((60000 - diff) / 1000)
      if (diff < 60000) {
        return await reply({
          text: `🌾 Ya pediste un código recientemente.\nEspera *${restante} segundos* antes de pedir otro.`
        })
      }
    }

    cooldowns.set(phone, Date.now())

    await reply({
      text: `⚔️ *VINCULACIÓN DE SUBBOT*\n\n` +
        `📱 Número: *+${phone}*\n\n` +
        `📋 *Instrucciones:*\n` +
        `  ✦ Abre WhatsApp en el teléfono de ese número\n` +
        `  ✦ Ve a *Dispositivos vinculados*\n` +
        `  ✦ Toca *Vincular dispositivo*\n` +
        `  ✦ Toca *Vincular con número de teléfono*\n` +
        `  ✦ Ingresa el código que recibirás ahora\n\n` +
        `⏳ _Generando código..._`
    })

    try {
      const code = await requestSubbotCode(id, phone, sock, from)

      await sock.sendMessage(from, {
        text: `${code}`
      }, { quoted: msg })

      await react('✅')

    } catch (e) {
      cooldowns.delete(phone)
      await react('❌')
      await reply({ text: `❌ Error generando código:\n${e.message}` })
    }
  }
}