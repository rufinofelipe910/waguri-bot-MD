// Desarrollado por Ander

import { gotScraping } from 'got-scraping'

const CREEN_BASE = 'https://www.creen.ai'
const CREEN_TOKEN = process.env.CREEN_TOKEN || "eyJhbGciOiJIUzM4NCJ9.eyJqdGkiOiIyNzE4NjM2Iiwic3ViIjoiMDdkZWM5NWQtNzc0YS00ODAzLWFkZTYtYTE1OGVjZTg0M2VkIiwiYXV0aCI6IiIsImV4cCI6MTc4NjQyNjU2Nn0.4RmwsCN37Za0AFhdpEryYjZJEbmX9FfX7cH80avveeEjC6FKlPt2j9St2NpoF3eH"
const CREEN_FINGER = process.env.CREEN_FINGER || "58ddaa3b80b204b6bbbbcf048f6a7403"
const IMG_MODEL_ID = Number(process.env.CREEN_IMG_MODEL || 14)
const POLL_INTERVAL = 3000
const POLL_MAX = 60

const http = gotScraping.extend({
  prefixUrl: CREEN_BASE,
  timeout: { request: 30000 },
  retry: { limit: 1, methods: ['GET', 'POST'] },
  headerGeneratorOptions: {
    browsers: [{ name: 'edge', minVersion: 130 }],
    devices: ['desktop'],
    operatingSystems: ['windows'],
    locales: ['es-419', 'es', 'en-US']
  }
})

function authHeaders() {
  return {
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json',
    origin: CREEN_BASE,
    referer: `${CREEN_BASE}/es`,
    'x-auth-token': CREEN_TOKEN,
    'x-finger': CREEN_FINGER,
    'x-language': 'es',
    'x-platform': 'web',
    'x-version': '999.0.0'
  }
}

async function generateImage(prompt, options = {}) {
  if (!prompt || !prompt.trim()) throw new Error('Prompt vacío')
  if (!CREEN_TOKEN || !CREEN_FINGER) throw new Error('Falta configurar CREEN_TOKEN y CREEN_FINGER')

  const createRes = await http.post('api/aiImage/create/v2', {
    responseType: 'json',
    throwHttpErrors: false,
    headers: authHeaders(),
    body: JSON.stringify({
      modelId: options.modelId || IMG_MODEL_ID,
      baseImage: '',
      imageUrls: [],
      prompt: prompt.trim(),
      resolution: options.resolution || '1K',
      quality: options.quality || 'low',
      aspectRatio: options.aspectRatio || '16:9',
      number: 1,
      permission: 1
    })
  })

  // 🔍 DEBUG TEMPORAL
  console.log('[CREEN DEBUG] statusCode:', createRes.statusCode)
  console.log('[CREEN DEBUG] body completo:', JSON.stringify(createRes.body, null, 2))

  if (createRes.statusCode === 401 || createRes.statusCode === 403) {
    throw new Error('Token de Creen expirado o inválido. Captura uno nuevo y actualiza CREEN_TOKEN.')
  }
  if (createRes.statusCode !== 200) {
    throw new Error(`Creen rechazó la generación (HTTP ${createRes.statusCode})`)
  }

  const data = createRes.body?.data
  const resultId = data?.result?.dataList?.[0]?.id || data?.result?.dataList?.[0]?.resultId
  if (!resultId) {
    const errMsg = createRes.body?.msg || JSON.stringify(createRes.body).slice(0, 150)
    if (/integral|credit|余额|不足/i.test(errMsg)) throw new Error('Créditos de invitado agotados. Necesitas un token nuevo.')
    throw new Error(`Creen no devolvió ID de tarea: ${errMsg}`)
  }

  for (let i = 0; i < POLL_MAX; i++) {
    await sleep(POLL_INTERVAL)
    const statusRes = await http.post('api/aiImage/getListTaskStatus', {
      responseType: 'json',
      throwHttpErrors: false,
      headers: authHeaders(),
      body: JSON.stringify({ resultIds: [resultId] })
    })
    const item = statusRes.body?.data?.[0]
    if (!item) continue
    if (item.errorMessage) throw new Error(`Creen: ${item.errorMessage}`)
    if (item.resultUrl) return item.resultUrl
    if (item.status === 3 || item.status === -1) throw new Error('La generación falló en Creen')
  }
  throw new Error('La generación tardó demasiado, intenta de nuevo')
}

async function downloadImage(url) {
  const res = await http.get(url, { responseType: 'buffer', throwHttpErrors: false, prefixUrl: '' })
  if (res.statusCode !== 200) throw new Error(`No se pudo descargar la imagen (HTTP ${res.statusCode})`)
  return Buffer.from(res.rawBody)
}

async function textToImage(prompt, options = {}) {
  const url = await generateImage(prompt, options)
  const buffer = await downloadImage(url)
  return { url, buffer, prompt: prompt.trim() }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export { generateImage, downloadImage, textToImage }