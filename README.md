Yuta Okotsu Bot 🍁

<p align="center">
<img src="./database/ed.gif" width="75%" alt="Yuta Okotsu Bot">
</p>«Bot de WhatsApp estético, funcional y modular, desarrollado con Baileys, utilizando SQLite y una arquitectura limpia para bots principales, subbots y plugins.»

<p align="center">
<img src="https://img.shields.io/badge/Status-Activo-22c55e?style=flat" alt="Status">
<img src="https://img.shields.io/badge/Node.js-v20+-16a34a?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Database-SQLite-2563eb?style=flat" alt="SQLite">
<img src="https://img.shields.io/badge/Baileys-WhatsApp-0f172a?style=flat" alt="Baileys">
</p><p align="center">
<a href="https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD">
<img src="https://img.shields.io/badge/Repositorio-Yuta%20Okotsu%20Bot-7c3aed?style=for-the-badge&logo=github&logoColor=white" alt="Repositorio">
</a>
</p>«[!NOTE]
Yuta Okotsu Bot está diseñado para ofrecer una experiencia moderna, modular y estable en WhatsApp. El proyecto se encuentra en constante desarrollo para mejorar su rendimiento, compatibilidad y nuevas funciones.»

---

📍 Descripción

Yuta Okotsu Bot MD es un bot de WhatsApp desarrollado con Baileys y una estructura modular que facilita el mantenimiento del código y la incorporación de nuevas funciones.

Incluye soporte para:

- 🪴 Plugins independientes
- 🤖 Sistema de Subbots
- 💾 Base de datos SQLite
- 🎵 Descargas multimedia
- 🖼️ Stickers personalizados
- ⚡ Arquitectura limpia y escalable

---

🪴 Requisitos

Antes de instalar el bot asegúrate de tener:

Requisito| Descripción
Git| Clonar el repositorio
Node.js v20+| Ejecutar el proyecto
FFmpeg| Audio, video y stickers
Build Essential| Dependencias nativas

<p>
<a href="https://git-scm.com/downloads"><img src="https://img.shields.io/badge/Git-0f172a?style=flat&logo=git&logoColor=22c55e"></a>
<a href="https://nodejs.org/en/download"><img src="https://img.shields.io/badge/Node.js-1e3a8a?style=flat&logo=nodedotjs&logoColor=white"></a>
<a href="https://ffmpeg.org/download.html"><img src="https://img.shields.io/badge/FFmpeg-14532d?style=flat&logo=ffmpeg&logoColor=white"></a>
</p>---

🐢 Instalación

<details>
<summary><strong>🍃 Linux / Ubuntu</strong></summary>sudo apt update && sudo apt upgrade -y

sudo apt install git nodejs ffmpeg build-essential -y

git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta

cd Yuta

npm install

npm start

</details>---

<details>
<summary><strong>🌾 Termux (Recomendado)</strong></summary>termux-setup-storage

pkg update && pkg upgrade -y

pkg install -y nodejs-lts git python clang make pkg-config libvips ffmpeg libwebp

export GYP_DEFINES="android_ndk_path=''"
echo 'export GYP_DEFINES="android_ndk_path="""' >> ~/.bashrc

git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta

cd Yuta

npm install

npm install --cpu=wasm32 sharp

npm install @img/sharp-wasm32

npm start

«Si aparece una confirmación como (Y/I/N/O/D/Z) [default=N]?, escribe y y presiona ENTER.»

«Sharp WASM mejora la compatibilidad con Android y evita errores de compilación en Termux.»

</details>---

<details>
<summary><strong>📍 Mantener el bot activo con PM2</strong></summary>npm install -g pm2

pm2 start index.js

pm2 save

pm2 logs

Opciones

Detener

pm2 stop index

Iniciar

pm2 start index

Eliminar

pm2 delete index

Logs

pm2 logs

</details>«🌾 Al iniciar el bot podrás elegir entre Código QR o Código de Emparejamiento.»

---

🌴 Comandos principales

Comando| Función
".menu"| Muestra todos los comandos
".code"| Vincular un subbot
".s"| Crear stickers
".setmeta"| Cambiar la marca del sticker
".play"| Descargar música desde YouTube
".scdl"| Descargar desde SoundCloud
".bots"| Ver subbots conectados

---

🌴 Estructura

Yuta-Okotsu-Bot-MD/
│
├── plugins/
├── lib/
├── src/
├── database/
├── sessions/
├── package.json
└── index.js

---

🤖 Sistema de Subbots

El bot permite que otros usuarios puedan vincular su propio número mediante Código QR o Código de Emparejamiento, funcionando de forma independiente del bot principal.

---

📍 Aclaración Legal

«Este proyecto no está afiliado con WhatsApp LLC ni con Meta Platforms.

Es un proyecto independiente desarrollado utilizando la librería Baileys.»

---

🍁 Créditos

La temática visual está inspirada en Jujutsu Kaisen y el personaje Yuta Okotsu.

<p align="center">
<a href="https://github.com/DuarteXV">
<img src="https://img.shields.io/badge/Powered%20by-DuarteXV-7c3aed?style=for-the-badge&logo=github&logoColor=white">
</a>
</p><p align="center">
<a href="https://github.com/DuarteXV">
<img src="https://github.com/DuarteXV.png?size=130" width="130">
</a>
</p>