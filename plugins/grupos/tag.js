export default {
  name: ["tag", "tagall"],
  description: "Menciona a todos en el grupo de forma limpia (oculta), soportando textos y contenido citado",
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, text, reply, react }) {
    await react('📢');

    // 1. Obtener todos los miembros para la mención fantasma
    const members = groupMeta?.participants || [];
    const mentions = members.map(m => m.id);

    // 2. Detectar si el usuario está respondiendo a un mensaje (quoted)
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                      msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    try {
      if (quotedMsg) {
        // --- CASO A: El usuario respondió a un mensaje (Texto, Foto, Sticker, etc.) ---
        
        // Creamos una copia del mensaje citado para reenviarlo con la mención oculta
        const messageContent = JSON.parse(JSON.stringify(quotedMsg));
        const messageType = Object.keys(messageContent)[0];

        // Si el mensaje citado tiene un texto/caption original, se lo dejamos. Si el usuario escribió algo junto al .tag, se lo ponemos de texto principal.
        if (text) {
          if (messageType === 'conversation') {
            messageContent.conversation = text;
          } else if (messageType === 'extendedTextMessage') {
            messageContent.extendedTextMessage.text = text;
          } else if (messageContent[messageType]?.caption !== undefined) {
            messageContent[messageType].caption = text;
          }
        }

        // Enviamos el contenido citado clonado con las menciones ocultas
        await sock.sendMessage(from, {
          forward: {
            key: msg.key, // Mantiene el contexto si es necesario
            message: messageContent
          },
          contextInfo: { mentions }
        }, { quoted: msg });

      } else {
        // --- CASO B: Uso simple (.tag [mensaje]) ---
        // Si no escribe nada después de .tag, usamos el aviso por defecto
        const textoEnviar = text || "📢 ¡Atención a todos!";

        await sock.sendMessage(from, {  
          text: textoEnviar,  
          contextInfo: { mentions } // Las menciones van aquí dentro para que sean "invisibles" en el texto
        }, { quoted: msg });
      }

      await react('✅');
    } catch (error) {
      console.error("Error en el comando tag:", error);
      await reply("❌ Hubo un error al intentar hacer el tag.");
      await react('❌');
    }
  }
};
