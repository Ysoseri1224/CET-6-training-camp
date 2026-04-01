const DS_URL = 'https://api.deepseek.com/chat/completions'

const SYSTEM_PROMPT = `You are an expert English grammar checker. Analyze the given English text and return a JSON array of grammar/spelling errors. Each error object must have these fields:
- offset: number (character offset from start of text)
- length: number (length of the error span)
- message: string (brief explanation in Chinese)
- replacements: string[] (up to 3 suggested corrections)
- issueType: "grammar" | "spelling" | "style" | "punctuation"
Return ONLY a valid JSON array, no markdown, no explanation. If no errors, return [].`

export async function checkWithDeepSeek(text, apiKey) {
  if (!text || !text.trim() || !apiKey) return []
  const res = await fetch(DS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Please check the following English text for grammar errors:\n\n${text}` },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || '[]'
  let errors = []
  try {
    const cleaned = content.replace(/```json|```/g, '').trim()
    errors = JSON.parse(cleaned)
  } catch { console.warn('DeepSeek response parse error:', content); return [] }
  return errors.map((e) => ({
    offset: Number(e.offset) || 0,
    length: Number(e.length) || 1,
    message: e.message || '',
    replacements: Array.isArray(e.replacements) ? e.replacements.slice(0, 3) : [],
    issueType: e.issueType || 'grammar',
    ruleCategory: 'DeepSeek AI',
    source: 'deepseek',
  }))
}
