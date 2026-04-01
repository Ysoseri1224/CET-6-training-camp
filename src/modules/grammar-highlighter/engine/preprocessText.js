const DS_URL = 'https://api.deepseek.com/chat/completions'

const PREPROCESS_PROMPT = `You are a text preprocessing assistant.
Your job: take the input text and return a clean English sentence suitable for English grammar analysis.
Rules:
1. If any part is in a non-English language (e.g. Chinese, French, etc.), translate it to natural English.
2. Remove markdown symbols (*, **, _, __, #, >, \`, ~, |) that are NOT part of the sentence content.
3. Remove stray punctuation or symbols that don't belong in a sentence.
4. Preserve sentence-level punctuation (. , ; : ! ? ' " ( ) - —) as they may carry grammatical meaning.
5. Preserve the original meaning and sentence structure as closely as possible.
6. If the text is already clean English, return it unchanged.
Return ONLY a JSON object: { "clean": "the cleaned English text", "changed": true/false }
No markdown, no explanation.`

export function needsPreprocessing(text) {
  if (!text?.trim()) return false
  const hasCJK = /[\u3000-\u9fff\uac00-\ud7ff\u3040-\u30ff]/.test(text)
  const hasMarkdown = /(\*{1,2}|_{1,2}|~~|^#{1,6}\s|^>\s|`{1,3})/m.test(text)
  return hasCJK || hasMarkdown
}

export async function preprocessWithDeepSeek(text, apiKey) {
  if (!apiKey) return { clean: text, changed: false }
  let res
  try {
    res = await fetch(DS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: PREPROCESS_PROMPT }, { role: 'user', content: text }],
        temperature: 0.0,
        max_tokens: 1024,
      }),
    })
  } catch (err) { console.warn('[preprocess] network error:', err.message); return { clean: text, changed: false } }
  if (!res.ok) { console.warn('[preprocess] API error:', res.status); return { clean: text, changed: false } }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  try {
    const cleaned = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (typeof parsed.clean === 'string') return { clean: parsed.clean.trim(), changed: !!parsed.changed }
  } catch { console.warn('[preprocess] parse error') }
  return { clean: text, changed: false }
}
