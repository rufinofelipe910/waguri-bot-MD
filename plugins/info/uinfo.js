export default {
  name: ['uinfo', 'userinfo', 'info'],
  description: 'Muestra información detallada usando USyncQuery real',
  category: 'info',
  ownerOnly: false,

  async run({ sock, from, msg, senderNum, react, reply }) {
    await react('🔍')

    const quoted    = msg.message?.extendedTextMessage?.contextInfo
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    let target = quoted?.participant || mentioned[0] || `${senderNum}@s.whatsapp.net`
    const targetNum = target.split(':')[0].split('@')[0]
    target = `${targetNum}@s.whatsapp.net`

    try {
      const query = new USyncQuery()
        .withContext('interactive')
        .withMode('query')
        .withUser({ jid: target })
        .withStatusProtocol()
        .withDeviceProtocol()
        .withUsernameProtocol()
        .withLIDProtocol()

      const uSyncNode = {
        tag: 'iq',
        attrs: {
          to: '@s.whatsapp.net',
          type: 'get',
          xmlns: 'usync'
        },
        content: [
          {
            tag: 'usync',
            attrs: {
              context: query.context,
              mode: query.mode,
              sid: sock.generateMessageID(),
              index: '0',
              last: 'true'
            },
            content: [
              {
                tag: 'user',
                content: [
                  {
                    tag: 'jid',
                    content: target
                  }
                ]
              },
              {
                tag: 'list',
                content: query.protocols.map(p => ({ tag: p.name }))
              }
            ]
          }
        ]
      }

      const [stanzaResult, foto, biz] = await Promise.allSettled([
        sock.query(uSyncNode),
        sock.profilePictureUrl(target, 'image'),
        sock.getBusinessProfile(target)
      ])

      let statusText = 'Sin estado'
      let dispositivosTxt = 'No disponible'
      let usernameText = 'No tiene'

      if (stanzaResult.status === 'fulfilled' && stanzaResult.value) {
        const parsedData = query.parseUSyncQueryResult(stanzaResult.value)
        const userResult = parsedData?.list?.[0]

        if (userResult) {
          if (userResult.status) statusText = userResult.status
          if (userResult.username) usernameText = `@${userResult.username}`
          if (userResult.devices && Array.isArray(userResult.devices)) {
            dispositivosTxt = `${userResult.devices.length} dispositivo(s) vinculado(s)`
          }
        }
      }

      const tieneFoto  = foto.status === 'fulfilled' && foto.value
      const bizData    = biz.status === 'fulfilled' && biz.value
      const esBusiness = bizData && Object.keys(bizData).length > 0

      let text = `✨ ═══ 🫧 *YUTA OKOTSU* 🫧 ═══ ✨\n`
      text += `🔍 _Información de Usuario Extraída Vía USync_\n\n`

      text += `👤 ─── ❖ *PERFIL* ❖ ─── 👤\n`
      text += `  ✦ *Número:* +${targetNum}\n`
      text += `  ✦ *Username:* ${usernameText}\n`
      text += `  ✦ *JID:* ${target}\n`
      text += `  ✦ *Tipo:* ${esBusiness ? '🏢 Business' : '👤 Normal'}\n`
      text += `  ✦ *Foto:* ${tieneFoto ? '✅ Tiene' : '❌ No tiene'}\n`
      text += `  ✦ *Estado:* ${statusText}\n`
      text += `  ✦ *Dispositivos:* ${dispositivosTxt}\n\n`

      if (esBusiness) {
        text += `🏢 ─── ❖ *BUSINESS* ❖ ─── 🏢\n`
        if (bizData.description) text += `  ✦ *Descripción:* ${bizData.description}\n`
        if (bizData.email)       text += `  ✦ *Email:* ${bizData.email}\n`
        if (bizData.category)    text += `  ✦ *Categoría:* ${bizData.category}\n`
        if (bizData.website?.length) text += `  ✦ *Web:* ${bizData.website[0]}\n`
        if (bizData.address)     text += `  ✦ *Dirección:* ${bizData.address}\n`
        text += '\n'
      }

      text += `⚔️ _Yuta Okotsu MD | DuarteXV_`

      if (tieneFoto) {
        await sock.sendMessage(from, {
          image: { url: foto.value },
          caption: text,
          mentions: [target]
        }, { quoted: msg })
      } else {
        await reply({ text, mentions: [target] })
      }

      await react('✅')

    } catch (e) {
      await react('❌')
      await reply({ text: `❌ Error: ${e.message}` })
    }
  }
}
