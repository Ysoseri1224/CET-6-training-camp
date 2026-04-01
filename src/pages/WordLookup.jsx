import React, { useState, useCallback } from 'react'
import { callDeepSeek } from '../utils/aiClient'
import { useWordLookupStore } from '../store/moduleStores'
import { Search, BookOpen, Volume2, Loader2, Star, StarOff } from 'lucide-react'
import { isCET6Word } from '../data/cet6Words'

const FREE_DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

const ZH_PROMPT = `You are a Chinese-English dictionary assistant.
Given an English word, provide a concise Chinese translation suitable for CET-6 study.
Respond with ONLY a JSON object (no markdown):
{
  "zhMeanings": [
    { "pos": "词性（中文，如：名词/动词）", "zh": "中文释义", "example": "例句（英文）" }
  ],
  "memory": "记忆技巧或词根词缀分析（1-2句中文）",
  "relatedWords": ["相关词1", "相关词2", "相关词3"],
  "cet6Tip": "在六级考试中的常见用法或考点（1句）"
}

relatedWords can include synonyms, antonyms, collocations, or thematically related words — not limited to synonyms.`

export default function WordLookup() {
  const { query, setQuery, result, setResult, zhData, setZhData, error, setError } = useWordLookupStore()
  const [loading, setLoading] = useState(false)
  const [zhLoading, setZhLoading] = useState(false)
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cet6_favorites') || '[]') } catch { return [] }
  })

  const saveFavorites = (list) => {
    setFavorites(list)
    localStorage.setItem('cet6_favorites', JSON.stringify(list))
  }

  const toggleFav = (word) => {
    if (favorites.includes(word)) saveFavorites(favorites.filter(w => w !== word))
    else saveFavorites([...favorites, word])
  }

  const lookup = useCallback(async (word) => {
    const w = word.trim().toLowerCase()
    if (!w) return
    setLoading(true)
    setZhLoading(true)
    setError('')
    setResult(null)
    setZhData(null)

    // Free Dictionary API (English)
    fetch(FREE_DICT_URL + encodeURIComponent(w))
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => { setResult(data[0]); setLoading(false) })
      .catch(() => { setError('未找到该单词的英文释义'); setLoading(false) })

    // DeepSeek Chinese translation
    callDeepSeek(
      [{ role: 'system', content: ZH_PROMPT }, { role: 'user', content: w }],
      { temperature: 0.2, max_tokens: 512 }
    )
      .then(content => {
        const parsed = JSON.parse(content.replace(/```json|```/g, '').trim())
        setZhData(parsed)
        setZhLoading(false)
      })
      .catch(() => setZhLoading(false))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    lookup(query)
  }

  const playPhonetic = (audio) => { if (audio) new Audio(audio).play() }

  const phonetics = result?.phonetics?.filter(p => p.text) || []
  const audioUrl = result?.phonetics?.find(p => p.audio)?.audio || ''

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Search size={28} className="text-amber-600" />六级单词速查
        </h1>
        <p className="text-gray-500 text-lg">查询英文释义、AI 中文翻译与词根记忆技巧，标注 CET-6 核心词汇。</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input
          className="input-field"
          placeholder="输入英文单词…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={!query.trim() || loading}
          className="btn-primary flex-shrink-0 disabled:opacity-40">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          查询
        </button>
      </form>

      {/* Favorites */}
      {favorites.length > 0 && !result && (
        <div className="card mb-6">
          <p className="section-title">收藏的单词</p>
          <div className="flex flex-wrap gap-2">
            {favorites.map(w => (
              <button key={w} onClick={() => { setQuery(w); lookup(w) }}
                className="text-base px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors">
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-base mb-4 font-medium">{error}</p>}

      {/* Result */}
      {(result || zhData) && (
        <div className="space-y-4">
          {/* Word header */}
          <div className="card flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-3xl font-bold text-gray-900">{result?.word || query}</h2>
                {isCET6Word(result?.word || query) && (
                  <span className="tag tag-amber font-semibold">CET-6</span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {phonetics.slice(0, 2).map((p, i) => (
                  <span key={i} className="text-gray-500 text-lg font-mono">{p.text}</span>
                ))}
                {audioUrl && (
                  <button onClick={() => playPhonetic(audioUrl)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <Volume2 size={15} /> 发音
                  </button>
                )}
              </div>
            </div>
            <button onClick={() => toggleFav(result?.word || query)} className="text-gray-400 hover:text-amber-500 transition-colors p-1 flex-shrink-0">
              {favorites.includes(result?.word || query) ? <Star size={22} className="text-amber-400 fill-amber-400" /> : <StarOff size={22} />}
            </button>
          </div>

          {/* English meanings */}
          {loading ? (
            <div className="card flex items-center gap-2 text-gray-500"><Loader2 size={16} className="animate-spin" /> 加载英文释义…</div>
          ) : result?.meanings && (
            <div className="card space-y-5">
              <p className="section-title">英文释义</p>
              {result.meanings.slice(0, 3).map((meaning, mi) => (
                <div key={mi}>
                  <span className="text-base font-bold text-indigo-600 italic">{meaning.partOfSpeech}</span>
                  <ul className="mt-2 space-y-3">
                    {meaning.definitions.slice(0, 3).map((def, di) => (
                      <li key={di} className="pl-4 border-l-2 border-gray-200">
                        <p className="text-base text-gray-800 leading-relaxed">{def.definition}</p>
                        {def.example && <p className="text-sm text-gray-400 mt-1 italic">"{def.example}"</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Chinese data from DeepSeek */}
          {zhLoading ? (
            <div className="card flex items-center gap-2 text-gray-500"><Loader2 size={16} className="animate-spin" /> AI 翻译中…</div>
          ) : zhData && (
            <>
              <div className="card space-y-4">
                <p className="section-title">中文释义</p>
                {zhData.zhMeanings?.map((m, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-sm text-violet-600 font-semibold flex-shrink-0 mt-1 w-14">{m.pos}</span>
                    <div>
                      <p className="text-lg text-gray-900 font-semibold">{m.zh}</p>
                      {m.example && <p className="text-sm text-gray-400 mt-1 italic">"{m.example}"</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zhData.memory && (
                  <div className="card border-emerald-200 bg-emerald-50">
                    <p className="section-title text-emerald-700">记忆技巧</p>
                    <p className="text-base text-emerald-900 leading-relaxed">{zhData.memory}</p>
                  </div>
                )}
                {zhData.cet6Tip && (
                  <div className="card border-amber-200 bg-amber-50">
                    <p className="section-title text-amber-700">六级考点</p>
                    <p className="text-base text-amber-900 leading-relaxed">{zhData.cet6Tip}</p>
                  </div>
                )}
              </div>

              {(zhData.relatedWords || zhData.synonyms)?.length > 0 && (
                <div className="card">
                  <p className="section-title">相关词</p>
                  <div className="flex flex-wrap gap-2">
                    {(zhData.relatedWords || zhData.synonyms).map(s => (
                      <button key={s} onClick={() => { setQuery(s); lookup(s) }}
                        className="text-base px-4 py-1.5 rounded-full bg-gray-100 border border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
