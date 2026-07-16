# Yuta Okotsu Bot 🍁

<p align="center">
<img src="./database/ed.gif" width="75%" alt="Yuta Okotsu Bot">
</p>

> Bot de WhatsApp estético, funcional y modular, desarrollado con Baileys, usando SQLite y una arquitectura limpia para bots principales, subbots y plugins.

<p align="center">
<img src="https://img.shields.io/badge/Status-Activo-22c55e?style=flat" alt="Status">
<img src="https://img.shields.io/badge/Node.js-v20+-16a34a?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Database-SQLite-2563eb?style=flat" alt="SQLite">
<img src="https://img.shields.io/badge/Baileys-WhatsApp-0f172a?style=flat" alt="Baileys">
</p>

<p align="center">
<a href="https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD">
<img src="https://img.shields.io/badge/Repositorio-Yuta%20Okotsu%20Bot-7c3aed?style=for-the-badge&logo=github&logoColor=white" alt="Repositorio">
</a>
</p>

> [!NOTE]
> Yuta Okotsu Bot está pensado para ofrecer una experiencia limpia, modular y fácil de usar en WhatsApp. El proyecto se mantiene en evolución constante para mejorar funciones, estabilidad y compatibilidad.

---

## 📍 Descripción

Yuta Okotsu Bot MD es un bot de WhatsApp basado en Baileys, creado con una estructura modular para manejar comandos, subbots, sesiones, base de datos y funciones multimedia de forma organizada.

Su diseño está orientado a mantener el código limpio, facilitar la expansión del proyecto y permitir que otros usuarios puedan vincular sus propios números como subbots.

---

## 🪴 Requisitos

- Git
- Node.js v20+
- FFmpeg
- Build Essential

---

## 🐢 Instalación

<details>
<summary><strong>🍃 Linux / Ubuntu</strong></summary>

```bash
apt update && apt upgrade -y
apt install git nodejs ffmpeg build-essential -y
git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta
cd Yuta
npm i
npm start
```

</details>

<details>
<summary><strong>🌾 Termux</strong></summary>

```bash
termux-setup-storage

pkg update && pkg upgrade -y

pkg install -y nodejs-lts git python clang make pkg-config libvips ffmpeg libwebp

export GYP_DEFINES="android_ndk_path=''"

git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta

cd Yuta

npm i

npm install --cpu=wasm32 sharp

npm install @img/sharp-wasm32

npm start
```

> Si aparece una confirmación como **(Y/I/N/O/D/Z) [default=N]?**, usa la letra **y** y presiona **ENTER**.

</details>

<details>
<summary><strong>📍 Mantener el bot activo con PM2</strong></summary>

```bash
npm i -g pm2
pm2 start index.js
pm2 save
pm2 logs
```

</details>
