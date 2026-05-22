import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '../../')

export default {
  name: ['check', 'checkbot', 'verificar'],
  description: 'Verifica el estado del bot, librerías y plugins',
  category: 'owner',
  ownerOnly: true,

  async run({ react, reply, args }) {
    await react('🔍')

    const hora  = new Date().toLocaleTimeString('es-CO', { hour12: false })
    const fecha = new Date().toLocaleDateString('es-CO')

    // ─── 1. VERIFICAR LIBRERÍAS DEL PACKAGE.JSON ────────
    let libsOk = []
    let libsFail = []

    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))
      const deps = Object.keys(pkg.dependencies || {})

      for (const dep of deps) {
        try {
          await import(dep)
          libsOk.push(dep)
        } catch {
          libsFail.push(dep)
        }
      }
    } catch (e) {
      libsFail.push(`package.json: ${e.message}`)
    }

    // ─── 2. VERIFICAR PLUGINS ────────────────────────────
    let pluginsOk   = []
    let pluginsFail = []

    const pluginsDir = path.join(root, 'plugins')
    if (fs.existsSync(pluginsDir)) {
      const walkDir = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) walkDir(full)
          else if (entry.name.endsWith('.js')) {
            try {
              const code = fs.readFileSync(full, 'utf-8')
              // Verificar sintaxis básica con node --check
              require('child_process').execSync(`node --input-type=module --check`, {
                input: code,
                stdio: ['pipe', 'pipe', 'pipe']
              })
              pluginsOk.push(entry.name)
            } catch (e) {
              pluginsFail.push({ name: entry.name, error: e.stderr?.toString()?.split('\n')[0] || e.message })
            }
          }
        }
      }
      try { walkDir(pluginsDir) } catch {}
    }

    // ─── 3. VERIFICAR HERRAMIENTAS DEL SISTEMA ──────────
    const tools = ['ffmpeg', 'ffprobe', 'node']
    const toolsStatus = {}

    for (const tool of tools) {
      try {
        const { stdout } = await execAsync(`${tool} -version 2>&1 || ${tool} --version`)
        const version = stdout.split('\n')[0].slice(0, 40)
        toolsStatus[tool] = { ok: true, version }
      } catch {
        toolsStatus[tool] = { ok: false }
      }
    }

    // ─── 4. VERIFICAR NODE_MODULES ───────────────────────
    const nodeModulesExiste = fs.existsSync(path.join(root, 'node_modules'))

    // ─── ARMAR RESPUESTA ─────────────────────────────────
    let text = `✨ ═══ 🫧 *YUTA OKOTSU* 🫧 ═══ ✨\n`
    text += `🔍 _Verificación del Sistema_\n\n`

    // Herramientas
    text += `🔧 ─── ❖ *HERRAMIENTAS* ❖ ─── 🔧\n`
    for (const [tool, status] of Object.entries(toolsStatus)) {
      text += `  ${status.ok ? '✅' : '❌'} *${tool}*${status.ok ? `: ${status.version}` : ': No encontrado'}\n`
    }
    text += `  ${nodeModulesExiste ? '✅' : '❌'} *node_modules*${nodeModulesExiste ? ': Instalado' : ': No instalado — ejecuta npm install'}\n\n`

    // Librerías
    text += `📦 ─── ❖ *LIBRERÍAS* ❖ ─── 📦\n`
    text += `  ✅ OK: ${libsOk.length}\n`
    if (libsFail.length > 0) {
      text += `  ❌ Faltan:\n`
      for (const lib of libsFail) text += `    ✦ ${lib}\n`
    } else {
      text += `  ✅ Todas instaladas correctamente\n`
    }
    text += '\n'

    // Plugins
    text += `🧩 ─── ❖ *PLUGINS* ❖ ─── 🧩\n`
    text += `  ✅ OK: ${pluginsOk.length}\n`
    if (pluginsFail.length > 0) {
      text += `  ❌ Con errores:\n`
      for (const p of pluginsFail) text += `    ✦ *${p.name}*: ${p.error?.slice(0, 60) || 'Error desconocido'}\n`
    } else {
      text += `  ✅ Todos sin errores de sintaxis\n`
    }
    text += '\n'

    text += `_${hora} • ${fecha}_\n`
    text += `⚔️ _Yuta Okotsu MD | DuarteXV_`

    await reply({ text })
  }
}