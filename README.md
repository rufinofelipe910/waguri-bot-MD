<h1 align="center">Yuta-Okotsu-Bot-MD</h1>

<p align="center">
  <img src="https://raw.githubusercontent.com/DuarteXV/Yuta-Okotsu-Bot-MD/main/database/ed.gif" alt="Yuta Okotsu">
</p>

## ⚙️ Instalación en Termux

Sigue estos pasos cuidadosamente para instalar y configurar el bot en Termux. Las siguientes instrucciones incluyen la configuración necesaria para que los módulos de procesamiento de imágenes y la base del bot funcionen correctamente sin errores de compilación.

```bash
# 1. Dar permisos de almacenamiento a Termux
termux-setup-storage

# 2. Actualizar paquetes del sistema
pkg update && pkg upgrade -y

# 3. Instalar Node.js, dependencias base y herramientas de compilación
pkg install -y nodejs-lts git python clang make pkg-config libvips ffmpeg libwebp

# 4. Configurar variables de entorno (Evita errores al compilar módulos)
export GYP_DEFINES="android_ndk_path=''"
echo 'export GYP_DEFINES="android_ndk_path="""' >> ~/.bashrc

# 5. Clonar el repositorio y entrar a la carpeta
git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta
cd Yuta

# 6. Instalar los módulos principales de Node.js
npm i

# 7. Instalar dependencias específicas de Sharp para la arquitectura de Termux
npm install --cpu=wasm32 sharp
npm install @img/sharp-wasm32

# 8. Iniciar el bot
npm start
```

## 🔗 APIs Utilizadas

El funcionamiento de este bot se apoya en los siguientes servicios y APIs:
- [Api.alyacore.xyz](http://Api.alyacore.xyz)
- [api.lempi.lat](https://api.lempi.lat)

## 👨‍💻 Desarrolladores

| Rol | Desarrollador | Enlaces |
| :--- | :--- | :--- |
| **Desarrollador Principal** | **Duarte** | [GitHub](https://github.com/DuarteXV) <br> [Canal de WhatsApp](https://whatsapp.com/channel/0029Vb73g1r1NCrTbefbFQ2T) |
| **Desarrollador Secundario** | **JonathanG** | [GitHub](https://github.com/jonathanggg) |

## 🤝 Asociados y Comunidad

- **Página de vinculación de Mancos y Asociados:** [Mancos-code.ultraplus.click](http://Mancos-code.ultraplus.click)
- **Canal de Mancos y Asociados:** [Únete en WhatsApp](https://whatsapp.com/channel/0029VawknnCKQuJKpYEYq500)