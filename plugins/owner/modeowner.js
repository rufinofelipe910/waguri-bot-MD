import config from '../../config.js'

// Inicializamos la variable global en caso de que no exista
global.modoPrivadoOwner = global.modoPrivadoOwner ?? false

export default {
  name: ['modeowner'],
  description: 'Prende o apaga el modo privado de forma explícita usando "on" u "off".',
  category: 'owner',

  async run({ ctx, args, react, reply, isOwner }) {
    // 1. Validar que quien use el comando sea un owner real de config.js
    if (!isOwner) {
      await react('❌')
      return await reply({ text: '⚠️ Este comando es de uso exclusivo para los owners del bot.' })
    }

    const accion = args[0]?.toLowerCase()

    // 2. Ejecutar según el argumento (on / off)
    if (accion === 'on') {
      global.modoPrivadoOwner = true
      await react('🔒')
      return await reply({ 
        text: `🔒 *Modo Privado ACTIVADO.*\n\nA partir de ahora, *${config.botName}* ignorará los mensajes de usuarios comunes y grupos. Solo atenderá a los owners.` 
      })
    } 
    
    if (accion === 'off') {
      global.modoPrivadoOwner = false
      await react('🔓')
      return await reply({ 
        text: `🔓 *Modo Privado DESACTIVADO.*\n\nEl bot ha vuelto a la normalidad y responderá a todo el público.` 
      })
    }

    // Si no ponen ni "on" ni "off", les avisa cómo usarlo
    await react('❓')
    await reply({ text: `💡 *Uso correcto del comando:*\n• _.modeowner on_ (Para encender)\n• _.modeowner off_ (Para apagar)` })
  }
}
