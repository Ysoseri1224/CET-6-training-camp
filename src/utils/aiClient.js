const DS_URL = 'https://api.deepseek.com/chat/completions'
const GPT_URL = import.meta.env.VITE_GPT_BASE_URL
  ? `${import.meta.env.VITE_GPT_BASE_URL}/chat/completions`
  : 'https://api.openai.com/v1/chat/completions'

const DS_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
const GPT_KEY = import.meta.env.VITE_GPT_API_KEY || ''
const GPT_MODEL = import.meta.env.VITE_GPT_MODEL || 'gpt-4o-mini'

const TIMEOUT_MS = 30000

async function fetchWithTimeout(url, options) {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('请求超时，请检查网络后重试')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Call DeepSeek chat API
 * @param {Array} messages - [{role, content}, ...]
 * @param {object} opts - { temperature, max_tokens, model }
 */
export async function callDeepSeek(messages, opts = {}) {
  if (!DS_KEY) throw new Error('DeepSeek API key not configured')
  const res = await fetchWithTimeout(DS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DS_KEY}` },
    body: JSON.stringify({
      model: opts.model || 'deepseek-chat',
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 2048,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Call GPT (OpenAI-compatible) chat API
 * @param {Array} messages - [{role, content}, ...]
 * @param {object} opts - { temperature, max_tokens, model }
 */
export async function callGPT(messages, opts = {}) {
  if (!GPT_KEY) throw new Error('GPT API key not configured')
  const res = await fetchWithTimeout(GPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GPT_KEY}` },
    body: JSON.stringify({
      model: opts.model || GPT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 2048,
    }),
  })
  if (!res.ok) throw new Error(`GPT API error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Call AI with automatic fallback: DeepSeek first, then GPT if key missing
 */
export async function callAI(messages, opts = {}) {
  if (DS_KEY) return callDeepSeek(messages, opts)
  if (GPT_KEY) return callGPT(messages, opts)
  throw new Error('No AI API key configured')
}

export const hasDeepSeek = () => !!DS_KEY
export const hasGPT = () => !!GPT_KEY
