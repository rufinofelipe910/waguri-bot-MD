Yuta Okotsu Bot 🍁
<p align="center">
<img src="./database/ed.gif" width="75%" alt="Yuta Okotsu Bot">
</p>
Bot de WhatsApp estético, funcional y modular, desarrollado con Baileys, usando SQLite y una arquitectura limpia para bots principales, subbots y plugins.
<p align="center">
<img src="[https://img.shields.io/badge/Status-Activo-22c55e?style=flat](https://img.shields.io/badge/Status-Activo-22c55e?style=flat)" alt="Status">
<img src="[https://img.shields.io/badge/Node.js-v20+-16a34a?style=flat&logo=nodedotjs&logoColor=white](https://img.shields.io/badge/Node.js-v20+-16a34a?style=flat&logo=nodedotjs&logoColor=white)" alt="Node.js">
<img src="[https://img.shields.io/badge/Database-SQLite-2563eb?style=flat](https://img.shields.io/badge/Database-SQLite-2563eb?style=flat)" alt="SQLite">
<img src="[https://img.shields.io/badge/Baileys-WhatsApp-0f172a?style=flat](https://img.shields.io/badge/Baileys-WhatsApp-0f172a?style=flat)" alt="Baileys">
</p>
<p align="center">
<a href="[https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD](https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD)">
<img src="[https://img.shields.io/badge/Repositorio-Yuta%20Okotsu%20Bot-7c3aed?style=for-the-badge&logo=github&logoColor=white](https://img.shields.io/badge/Repositorio-Yuta%20Okotsu%20Bot-7c3aed?style=for-the-badge&logo=github&logoColor=white)" alt="Repositorio">
</a>
</p>
[!NOTE]
Yuta Okotsu Bot está pensado para ofrecer una experiencia limpia, modular y fácil de usar en WhatsApp. El proyecto se mantiene en evolución constante para mejorar funciones, estabilidad y compatibilidad.
📍 Descripción
Yuta Okotsu Bot MD es un bot de WhatsApp basado en baileys, creado con una estructura modular para manejar comandos, subbots, sesiones, base de datos y funciones multimedia de forma organizada.
Su diseño está orientado a mantener el código limpio, facilitar la expansión del proyecto y permitir que otros usuarios puedan vincular sus propios números como subbots.
🪴 Requisitos
Antes de instalar el bot, asegúrate de tener instalado lo siguiente:
Requisito: Git
Descripción: Para clonar el repositorio
Requisito: Node.js v20+
Descripción: Para ejecutar el proyecto
Requisito: FFmpeg
Descripción: Para procesar audio, video y stickers
Requisito: Build Essential
Descripción: Para compilar dependencias nativas
<p>
<a href="[https://git-scm.com/downloads](https://git-scm.com/downloads)"><img src="[https://img.shields.io/badge/Git-0f172a?style=flat&logo=git&logoColor=22c55e](https://img.shields.io/badge/Git-0f172a?style=flat&logo=git&logoColor=22c55e)" alt="Git"></a>
<a href="[https://nodejs.org/en/download](https://nodejs.org/en/download)"><img src="[https://img.shields.io/badge/Node.js-1e3a8a?style=flat&logo=nodedotjs&logoColor=white](https://img.shields.io/badge/Node.js-1e3a8a?style=flat&logo=nodedotjs&logoColor=white)" alt="Node.js"></a>
<a href="[https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)"><img src="[https://img.shields.io/badge/FFmpeg-14532d?style=flat&logo=ffmpeg&logoColor=white](https://img.shields.io/badge/FFmpeg-14532d?style=flat&logo=ffmpeg&logoColor=white)" alt="FFmpeg"></a>
</p>
🐢 Instalación =>
Linux / Ubuntu:
apt update && apt upgrade -y
apt install git nodejs ffmpeg build-essential -y
git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta
cd Yuta
npm i
npm start
Termux:
termux-setup-storage
pkg update && pkg upgrade -y
pkg install -y nodejs-lts git python clang make pkg-config libvips ffmpeg libwebp
export GYP_DEFINES="android_ndk_path=''"
echo 'export GYP_DEFINES="android_ndk_path="""' >> ~/.bashrc
git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta
cd Yuta
npm i
npm install --cpu=wasm32 sharp
npm install @img/sharp-wasm32
npm start
Si aparece una confirmación como (Y/I/N/O/D/Z) [default=N] ?, usa la letra y y presiona ENTER.
Mantener el bot activo con PM2 (Ejecuta estos comandos dentro de la carpeta del bot):
npm i -g pm2
pm2 start index.js
pm2 save
pm2 logs
Opciones disponibles:
Detener el bot: pm2 stop index
Iniciar nuevamente: pm2 start index
Eliminar el proceso: pm2 delete index
Ver logs: pm2 logs
🌾 Al iniciar, podrás elegir entre código de emparejamiento o código QR para vincular tu dispositivo.
🌴 Comandos principales
Comando: menu
Descripción: Muestra el menú con todos los comandos disponibles
Comando: code
Descripción: Vincula tu número como subbot
Comando: s
Descripción: Crea stickers desde imagen, video o gif
Comando: setmeta
Descripción: Personaliza la marca de agua de stickers
Comando: play
Descripción: Descarga videos de YouTube en MP3
Comando: scdl
Descripción: Descarga canciones desde SoundCloud
Comando: bots
Descripción: Muestra los subbots conectados
🌴 Estructura del proyecto
Yuta-Okotsu-Bot-MD/
├── plugins/
├── lib/
├── src/
├── database/
├── sessions/
└── package.json
🐢 Sistema de Subbots
Yuta Okotsu cuenta con soporte para subbots, permitiendo que otros usuarios vinculen sus propios números y usen el sistema de forma independiente.
📍 Aclaración legal
Este proyecto no está afiliado a WhatsApp ni a Meta. Es un bot independiente desarrollado con Baileys.
🍁 La temática visual está inspirada en Jujutsu Kaisen y el personaje Yuta Okotsu.
<p align="center">
<a href="[https://github.com/DuarteXV](https://github.com/DuarteXV)">
<img src="[https://img.shields.io/badge/Powered%20by-DuarteXV-7c3aed?style=for-the-badge&logo=github&logoColor=white](https://img.shields.io/badge/Powered%20by-DuarteXV-7c3aed?style=for-the-badge&logo=github&logoColor=white)" alt="Powered by DuarteXV">
</a>
</p>
<p align="center">
<a href="[https://github.com/DuarteXV](https://github.com/DuarteXV)">
<img src="[https://github.com/DuarteXV.png?size=130](https://github.com/DuarteXV.png?size=130)" width="130px">
</a>
</p>