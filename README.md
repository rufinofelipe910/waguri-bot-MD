# Yuta Okotsu Bot 🍁
<p align="center">
<img src="./database/ed.gif" width="75%" alt="Yuta Okotsu Bot">
</p>

> Bot de WhatsApp estético, funcional y modular, desarrollado con **Baileys**, usando **SQLite** y una arquitectura limpia para bots principales, subbots y plugins.

<p align="center">
<img src="https://img.shields.io/badge/Status-Activo-22c55e?style=flat" alt="Status">
<img src="https://img.shields.io/badge/Node.js-v20+-16a34a?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Database-SQLite-2563eb?style=flat" alt="SQLite">
<img src="https://img.shields.io/badge/Baileys-WhatsApp-0f172a?style=flat" alt="Baileys">
</p>

<p align="center">
<a href="https://github.com/DuarteXV/Bot-prueba">
<img src="https://img.shields.io/badge/Repositorio-Yuta%20Okotsu%20Bot-7c3aed?style=for-the-badge&logo=github&logoColor=white" alt="Repositorio">
</a>
</p>

> [!NOTE]
> **Yuta Okotsu Bot** está pensado para ofrecer una experiencia limpia, modular y fácil de usar en WhatsApp. El proyecto se mantiene en evolución constante para mejorar funciones, estabilidad y compatibilidad.

---

## 📍 Descripción

**Yuta Okotsu Bot MD** es un bot de WhatsApp basado en `baileys`, creado con una estructura modular para manejar comandos, subbots, sesiones, base de datos y funciones multimedia de forma organizada.

Su diseño está orientado a mantener el código limpio, facilitar la expansión del proyecto y permitir que otros usuarios puedan vincular sus propios números como subbots.

---

## 🪴 Requisitos

Antes de instalar el bot, asegúrate de tener instalado lo siguiente:

| Requisito | Descripción |
|---|---|
| Git | Para clonar el repositorio |
| Node.js v20+ | Para ejecutar el proyecto |
| FFmpeg | Para procesar audio, video y stickers |
| Build Essential | Para compilar dependencias nativas |

<p>
<a href="https://git-scm.com/downloads"><img src="https://img.shields.io/badge/Git-0f172a?style=flat&logo=git&logoColor=22c55e" alt="Git"></a>
<a href="https://nodejs.org/en/download"><img src="https://img.shields.io/badge/Node.js-1e3a8a?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js"></a>
<a href="https://ffmpeg.org/download.html"><img src="https://img.shields.io/badge/FFmpeg-14532d?style=flat&logo=ffmpeg&logoColor=white" alt="FFmpeg"></a>
</p>

---

## 🐢 Instalación =>

<details>
<summary><strong>🍃 Linux / Ubuntu</summary>

```bash
apt update && apt upgrade -y
```
```bash
apt install git nodejs ffmpeg build-essential -y
```
```bash
git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta
```
```bash
cd Yuta
```
```bash
npm i
```
```bash
npm start
```

</details>

<details>
<summary><strong>🌾 Termux</summary>

```bash
termux-setup-storage
```
```bash
pkg update && pkg upgrade -y
```
```bash
pkg install git nodejs ffmpeg -y
```
```bash
git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta
```
```bash
cd Yuta
```
```bash
npm i
```

```bash
npm start
```

> Si aparece una confirmación como **(Y/I/N/O/D/Z) [default=N] ?**, usa la letra **y** y presiona **ENTER**.

</details>

<details>
<summary><strong>📍 Mantener el bot activo con PM2</summary>

Ejecuta estos comandos dentro de la carpeta del bot:

```bash
npm i -g pm2
```

```bash
pm2 start index.js
```

```bash
pm2 save
```

```bash
pm2 logs
```

### Opciones disponibles

Detener el bot:

```bash
pm2 stop index
```

Iniciar nuevamente:

```bash
pm2 start index
```

Eliminar el proceso:

```bash
pm2 delete index
```

Ver logs:

```bash
pm2 logs
```

</details>

> 🌾 Al iniciar, podrás elegir entre **código de emparejamiento** o **código QR** para vincular tu dispositivo.

---

## 🌴 Comandos principales

| Comando | Descripción |
|---|---|
| `menu` | Muestra el menú con todos los comandos disponibles |
| `code` | Vincula tu número como subbot |
| `s` | Crea stickers desde imagen, video o gif |
| `setmeta` | Personaliza la marca de agua de stickers |
| `play` | Descarga videos de YouTube en MP3 |
| `scdl` | Descarga canciones desde SoundCloud |
| `bots` | Muestra los subbots conectados |

---

## 🌴 Estructura del proyecto

```txt
Yuta-Okotsu-Bot-MD/
├── plugins/
├── lib/
├── src/
├── database/
├── sessions/
└── package.json
```

---

## 🐢 Sistema de Subbots

Yuta Okotsu cuenta con soporte para **subbots**, permitiendo que otros usuarios vinculen sus propios números y usen el sistema de forma independiente.

## 📍 Aclaración legal

> Este proyecto **no está afiliado a WhatsApp ni a Meta**.  
> Es un bot independiente desarrollado con **Baileys**.

🍁 La temática visual está inspirada en **Jujutsu Kaisen** y el personaje **Yuta Okotsu**.

---

<p align="center">
<a href="https://github.com/DuarteXV">
<img src="https://img.shields.io/badge/Powered%20by-DuarteXV-7c3aed?style=for-the-badge&logo=github&logoColor=white" alt="Powered by DuarteXV">
</a>
</p>
<p align="center">
<a href="https://github.com/DuarteXV">
<img src="https://github.com/DuarteXV.png?size=130" width="130px">
</a>
</p>
