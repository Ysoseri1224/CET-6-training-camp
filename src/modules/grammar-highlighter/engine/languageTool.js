const LT_PUBLIC_URL = 'https://api.languagetool.org/v2/check'
const LT_PREMIUM_URL = 'https://api.languagetoolplus.com/v2/check'

export async function checkWithLanguageTool(text, apiKey = '') {
  if (!text || !text.trim()) return []
  const url = apiKey ? LT_PREMIUM_URL : LT_PUBLIC_URL
  const params = new URLSearchParams({ text, language: 'en-US', enabledOnly: 'false' })
  if (apiKey) params.append('apiKey', apiKey)
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
  if (!res.ok) throw new Error(`LanguageTool API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return (data.matches || []).map((m) => ({
    offset: m.offset,
    length: m.length,
    message: m.message,
    shortMessage: m.shortMessage || '',
    replacements: (m.replacements || []).slice(0, 5).map((r) => r.value),
    ruleId: m.rule?.id || '',
    ruleCategory: m.rule?.category?.name || '',
    issueType: m.rule?.issueType || 'grammar',
    context: m.context?.text || '',
    contextOffset: m.context?.offset || 0,
    source: 'languagetool',
  }))
}
