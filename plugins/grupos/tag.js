export default {
  name: ["tag", "tagall"],
  description: "Repite textos, stickers o multimedia con mención invisible y sin cartel de reenviado",
  groupOnly: true,
  adminOnly: true,

  async run({ sock, from, msg, groupMeta, text, reply, react }) {
    await react('📢');

    // 1. Obtener miembros para la mención fantasma
    const members = groupMeta?.participants || [];
    const mentions = members.map(m => m.id);

    // Configuración obligatoria para activar las notificaciones silenciosas
    const contextInfo = { 
      mentions,
      mentionedJid: mentions 
    };

    // 2. Detectar si estás respondiendo a un mensaje (quoted)
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                      msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    try {
      if (quotedMsg) {
        // --- CASO A: Respondiendo a un mensaje (Texto, Sticker, Foto, etc.) ---
        const messageType = Object.keys(quotedMsg)[0];
        
        let messageToSend = {};

        if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
          // Si es texto plano
          const textoOriginal = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
          messageToSend = { 
            text: text || textoOriginal || "📢", 
            contextInfo 
          };
        } else {
          // Si es un Sticker, Imagen, Video, Audio, Documento, etc.
          // Pasamos el objeto del tipo de mensaje tal cual viene de WhatsApp para no romper sus buffers
          messageToSend = {
            [messageType]: quotedMsg[messageType],
            contextInfo
          };

          // Si el usuario escribió un texto junto al comando (.tag hola) y el formato admite subtítulo
          if (text && messageToSend[messageType] && 'caption' in messageToSend[messageType]) {
            messageToSend[messageType].caption = text;
          }
        }

        // Enviamos el mensaje clonado de forma limpia (sin usar forward)
        await sock.sendMessage(from, messageToSend);

      } else {
        // --- CASO B: Mensaje directo en el chat (.tag Hola a todos) ---
        const textoEnviar = text || "📢 ¡Atención a todos!";
        
        await sock.sendMessage(from, {  
          text: textoEnviar,  
          contextInfo
        });
      }

      await react('✅');
    } catch (error) {
      console.error("Error en el comando tag:", error);
      await react('❌');
    }
  }
};
