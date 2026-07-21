# Yuta-Okotsu-Bot-MD ⚔️

<p align="center">
  <img src="https://raw.githubusercontent.com/DuarteXV/Yuta-Okotsu-Bot-MD/main/database/ed.gif" alt="Yuta Okotsu Bot" width="500"/>
</p>

> ✦ *Bienvenido al repositorio oficial de Yuta Okkotsu Bot MD. ៸៸ Un bot de WhatsApp Multi-Device creado y desarrollado por DuarteXV.* ⚔️

---

## 📱 Instalación en Termux

Sigue estos pasos uno a uno para instalar y ejecutar **Yuta-Okotsu-Bot-MD** correctamente en tu dispositivo Android mediante Termux:

### 1. Permitir acceso al almacenamiento
```bash
termux-setup-storage
```

### 2. Actualizar paquetes del sistema e instalar dependencias
```bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts git python clang make pkg-config libvips ffmpeg libwebp
```

### 3. Configurar variables de entorno
```bash
export GYP_DEFINES="android_ndk_path=''"
echo 'export GYP_DEFINES="android_ndk_path="""' >> ~/.bashrc
```

### 4. Clonar el repositorio e instalar dependencias del proyecto
```bash
git clone https://github.com/DuarteXV/Yuta-Okotsu-Bot-MD.git Yuta
cd Yuta
npm i
```

### 5. Instalar parches necesarios para Sharp (WebP/Imágenes)
```bash
npm install --cpu=wasm32 sharp
npm install @img/sharp-wasm32
```

### 6. Iniciar el Bot
```bash
npm start
```

---

## ⚙️ Características & Notas
- **Multi-Device (MD):** Compatible con la versión más reciente de WhatsApp.
- **Optimizado para Termux:** Incluye soporte para `sharp-wasm32` previniendo errores de compilación nativa en Android.

## 👤 Creador
- **DuarteXV** - *Desarrollador principal*
- **JonathanG** - *Desarrollador secundario*
