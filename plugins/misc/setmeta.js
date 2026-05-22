import { userMeta, defaultMeta } from './Sticker.js'

export default {
  name: ['setmeta'],
  description: 'Cambia tu marca de agua para stickers',
  category: 'misc',
  ownerOnly: false,

  async run({ senderNum, args, react, reply }) {
    await react('⚙️')
    const texto = args.join(' ')
    if (!texto) return await reply({
      text: `❌ Uso: *.setmeta Pack | Autor*\n\nEjemplo:\n*.setmeta Mi Pack | Mi Nombre*`
    })

    if (texto.includes('|')) {
      const [p, a] = texto.split('|').map(s => s.trim())
      userMeta.set(senderNum, { packname: p || defaultMeta.packname, author: a || defaultMeta.author })
    } else {
      const current = userMeta.get(senderNum) || defaultMeta
      userMeta.set(senderNum, { ...current, packname: texto })
    }

    const meta = userMeta.get(senderNum)
    await reply({ text: `✅ *Marca actualizada*\n\n📦 *Pack:* ${meta.packname}\n✍️ *Autor:* ${meta.author}` })
  }
}