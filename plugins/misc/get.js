import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'

export default {
  name: ['fetch', 'get', 'descargar'],
  description: 'Descarga y envía el contenido de una URL (Soporta imágenes, videos, audios y texto)',
  category: 'misc',
  ownerOnly: false,

  async run({ sock, from, msg, args, react, reply }) {
    try {
      // Unir los argumentos para obtener la URL completa
      const url = args.join(' ').trim()

      if (!url) {
        return reply({
          text: '❌ Por favor, proporciona una URL válida.\n\n*Ejemplo:* `.fetch https://ejemplo.com/imagen.jpg`'
        })
      }

      // Validar que sea un enlace HTTP/HTTPS
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return reply({ text: '❌ La URL debe comenzar con http:// o https://' })
      }

      await react('⏳')
      await reply({ text: '🌐 Conectando con el servidor y descargando datos...' })

      // Realizar la petición GET para obtener el archivo como Buffer
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000, // 1 minuto de límite para archivos grandes
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const buffer = Buffer.from(response.data)

      if (!buffer || buffer.length === 0) {
        throw new Error('El servidor devolvió un archivo vacío.')
      }

      // Detectar el tipo de archivo real a partir de sus bytes internos
      const detected = await fileTypeFromBuffer(buffer)
      const mime = detected?.mime || response.headers['content-type'] || 'text/plain'

      // --- ENVIAR SEGÚN EL TIPO DE CONTENIDO ---

      // 1. Si es una Imagen
      if (mime.startsWith('image/')) {
        await sock.sendMessage(from, { 
          image: buffer, 
          caption: `✅ *Imagen obtenida con éxito*` 
        }, { quoted: msg })
      } 
      // 2. Si es un Video
      else if (mime.startsWith('video/')) {
        await sock.sendMessage(from, { 
          video: buffer, 
          caption: `✅ *Video obtenido con éxito*` 
        }, { quoted: msg })
      } 
      // 3. Si es un Audio / Nota de voz
      else if (mime.startsWith('audio/')) {
        await sock.sendMessage(from, { 
          audio: buffer, 
          mimetype: mime,
          ptt: mime.includes('ogg') // Si es ogg lo envía como nota de voz
        }, { quoted: msg })
      } 
      // 4. Si es texto plano, JSON o código (Muestra las primeras líneas en el chat)
      else if (mime.startsWith('text/') || mime.includes('json') || mime.includes('javascript')) {
        const textContent = buffer.toString('utf-8')
        
        // Cortar el texto si es extremadamente largo para no trabar WhatsApp
        const truncated = textContent.length > 3000 
          ? textContent.substring(0, 3000) + '\n\n... (Contenido truncado por longitud)' 
          : textContent

        await reply({
          text: `📄 *Resultado de la petición Texto/JSON:*\n\n\`\`\`${truncated}\`\`\``
        })
      } 
      // 5. Cualquier otro tipo de archivo (PDF, ZIP, APK, etc.) lo envía como Documento
      else {
        const ext = detected?.ext || 'bin'
        await sock.sendMessage(from, { 
          document: buffer, 
          mimetype: mime, 
          fileName: `fetch_file_${Date.now()}.${ext}` 
        }, { quoted: msg })
      }

      await react('✅')

    } catch (e) {
      await react('❌')
      
      // Manejar errores comunes de conexión de Axios
      let errMsg = e.message
      if (e.response) {
        errMsg = `El servidor respondió con código de estado ${e.response.status}`
      } else if (e.code === 'ECONNABORTED') {
        errMsg = 'Tiempo de espera agotado al descargar el archivo.'
      }

      await reply({
        text: `❌ *Error al realizar el Fetch:* ${errMsg}`
      })
      console.error(e)
    }
  }
}
