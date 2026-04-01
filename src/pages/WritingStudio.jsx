import React, { useState, useCallback, useRef } from 'react'
import { callGPT } from '../utils/aiClient'
import { useWritingStudioStore } from '../store/moduleStores'
import { PenTool, Wand2, Copy, ChevronDown, ChevronUp, Loader2, Check, RefreshCw, BookmarkPlus, BookOpen, X, Trash2 } from 'lucide-react'
import SentenceTransform from '../modules/sentence-transform/SentenceTransform'

const TOPICS = [
  '科技与社会', '教育', '环境保护', '城镇化', '经济发展',
  '文化交流', '健康生活', '网络与媒体', '就业与创业', '社会公平',
]

const TEMPLATES = [
  {
    category: '引言段',
    items: [
      { label: '现象引入', text: 'In recent years, there has been a growing concern about {topic}. It is universally acknowledged that {viewpoint}.' },
      { label: '数据引入', text: 'According to a recent survey, {statistic}. This alarming figure has prompted people to reconsider {topic}.' },
      { label: '对比引入', text: 'While some people argue that {view_a}, others contend that {view_b}. This controversy has sparked widespread debate.' },
    ],
  },
  {
    category: '论点展开',
    items: [
      { label: '原因分析', text: 'There are several reasons why {claim}. To begin with, {reason_1}. Furthermore, {reason_2}. Last but not least, {reason_3}.' },
      { label: '举例说明', text: 'A case in point is {example}. This demonstrates that {conclusion}.' },
      { label: '让步转折', text: 'Admittedly, {concession}. However, this does not mean that {counter_argument}.' },
    ],
  },
  {
    category: '结尾段',
    items: [
      { label: '总结建议', text: 'In conclusion, {summary}. It is high time that {recommendation}.' },
      { label: '展望未来', text: 'Only by {action} can we {goal}. It is our collective responsibility to {call_to_action}.' },
    ],
  },
]

const COMPLETION_PROMPT = `You are an IELTS/CET-6 writing assistant. The user is writing an English essay and has paused mid-sentence or mid-paragraph.

Continue the text naturally in the same style and register. Provide 1-2 sentences of high-quality academic English continuation. Keep it concise (max 40 words). Do NOT repeat what was already written. Do NOT add any explanation or prefix — output only the continuation text.`

const EXPAND_PROMPT = `You are a CET-6 writing coach. Given a topic, expand it into a well-structured paragraph (120-160 words) using:
- A topic sentence
- 2-3 supporting sentences with evidence or examples
- A concluding/transition sentence

Output only the paragraph, no preamble.`

const REPHRASE_PROMPT = `You are a CET-6 writing coach. The user has a sentence template with placeholders. Generate a NEW VARIATION of this template type — same rhetorical function but different sentence structure and vocabulary. Keep placeholders like {topic}, {viewpoint}, {reason_1} etc.

Output ONLY the new template sentence, no explanation.`

function loadNotes() {
  try { return JSON.parse(localStorage.getItem('writing_notes') || '[]') } catch { return [] }
}
function saveNotes(notes) {
  localStorage.setItem('writing_notes', JSON.stringify(notes))
}

export default function WritingStudio() {
  const {
    text, setText,
    selectedTopic, setSelectedTopic,
    suggestion, setSuggestion,
    expandResult, setExpandResult,
    openCategory, setOpenCategory,
  } = useWritingStudioStore()
  const [activeTab, setActiveTab] = useState('materials')
  const [completing, setCompleting] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [rephrasingIdx, setRephrasingIdx] = useState(null)
  const [rephrased, setRephrased] = useState({}) // key: `${cat}-${i}` → new text
  const [notes, setNotes] = useState(loadNotes)
  const [showNotes, setShowNotes] = useState(false)
  const textareaRef = useRef(null)

  const insertTemplate = (tpl) => {
    setText(prev => prev ? prev + '\n\n' + tpl : tpl)
    textareaRef.current?.focus()
  }

  const handleRephrase = useCallback(async (originalText, key) => {
    setRephrasingIdx(key)
    try {
      const result = await callGPT(
        [{ role: 'system', content: REPHRASE_PROMPT }, { role: 'user', content: originalText }],
        { temperature: 0.8, max_tokens: 120 }
      )
      setRephrased(prev => ({ ...prev, [key]: result.trim() }))
    } catch (e) { alert('换一个失败：' + e.message) }
    finally { setRephrasingIdx(null) }
  }, [])

  const saveNote = (label, noteText) => {
    const updated = [{ id: Date.now(), label, text: noteText, savedAt: new Date().toLocaleString('zh-CN') }, ...notes]
    setNotes(updated)
    saveNotes(updated)
  }

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    saveNotes(updated)
  }

  const copyText = (t, idx) => {
    navigator.clipboard.writeText(t)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const handleComplete = useCallback(async () => {
    const textStr = typeof text === 'string' ? text : ''
    if (!textStr.trim()) return
    setCompleting(true)
    setSuggestion('')
    try {
      const result = await callGPT([{ role: 'system', content: COMPLETION_PROMPT }, { role: 'user', content: textStr }], { temperature: 0.6, max_tokens: 80 })
      setSuggestion(result.trim())
    } catch (e) { alert('AI 补全失败：' + e.message) }
    finally { setCompleting(false) }
  }, [text])

  const acceptSuggestion = () => {
    setText(prev => (typeof prev === 'string' ? prev : '').trimEnd() + ' ' + suggestion)
    setSuggestion('')
  }

  const handleExpand = useCallback(async () => {
    if (!selectedTopic.trim()) return
    setExpanding(true)
    setExpandResult('')
    try {
      const prompt = `Topic: ${selectedTopic}`
      const result = await callGPT([{ role: 'system', content: EXPAND_PROMPT }, { role: 'user', content: prompt }], { temperature: 0.7, max_tokens: 300 })
      setExpandResult(result.trim())
    } catch (e) { alert('段落生成失败：' + e.message) }
    finally { setExpanding(false) }
  }, [selectedTopic])

  const safeText = typeof text === 'string' ? text : ''
  const wordCount = safeText.trim() ? safeText.trim().split(/\s+/).length : 0

  return (
    <div>
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 py-2">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'materials' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <PenTool size={15} />写作素材库
          </button>
          <button
            onClick={() => setActiveTab('transform')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'transform' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Wand2 size={15} />句式转换
          </button>
        </div>
      </div>

      {activeTab === 'materials' && (
      <div className="page-container-wide">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <PenTool size={28} className="text-emerald-600" />写作素材库
        </h1>
        <p className="text-gray-500 text-lg">使用模板快速构建段落，AI 续写句子，一键生成话题段落。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template library */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title mb-0">句型模板库</h2>
            <button onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                showNotes ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-300 text-gray-500 hover:border-gray-500'
              }`}>
              <BookOpen size={14} />我的笔记 {notes.length > 0 && `(${notes.length})`}
            </button>
          </div>

          {/* Notes panel */}
          {showNotes && (
            <div className="card space-y-3 max-h-80 overflow-y-auto">
              {notes.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">暂无笔记，点击模板卡片的 ✦ 保存</p>
                : notes.map(n => (
                  <div key={n.id} className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-indigo-600">{n.label}</span>
                      <div className="flex gap-1">
                        <button onClick={() => insertTemplate(n.text)} className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-0.5 border border-indigo-200 rounded-lg hover:bg-indigo-50">插入</button>
                        <button onClick={() => deleteNote(n.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-mono leading-relaxed line-clamp-3">{n.text}</p>
                    <p className="text-xs text-gray-300 mt-1">{n.savedAt}</p>
                  </div>
                ))
              }
            </div>
          )}

          {TEMPLATES.map((cat) => (
            <div key={cat.category} className="card p-0 overflow-hidden">
              <button
                onClick={() => setOpenCategory(openCategory === cat.category ? null : cat.category)}
                className="w-full flex items-center justify-between px-4 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                {cat.category}
                {openCategory === cat.category ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {openCategory === cat.category && (
                <div className="px-3 pb-3 space-y-2">
                  {cat.items.map((item, i) => {
                    const key = `${cat.category}-${i}`
                    const currentText = rephrased[key] || item.text
                    return (
                      <div key={i} className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-indigo-600 font-semibold">{item.label}</span>
                          <div className="flex gap-1 items-center">
                            <button onClick={() => handleRephrase(currentText, key)}
                              disabled={rephrasingIdx === key}
                              className="text-gray-400 hover:text-purple-600 transition-colors p-1" title="换一个">
                              {rephrasingIdx === key ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                            </button>
                            <button onClick={() => saveNote(item.label, currentText)}
                              className="text-gray-400 hover:text-amber-500 transition-colors p-1" title="保存到笔记">
                              <BookmarkPlus size={13} />
                            </button>
                            <button onClick={() => copyText(currentText, key)}
                              className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                              {copiedIdx === key ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                            <button onClick={() => insertTemplate(currentText)}
                              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-0.5 rounded-lg border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50">
                              插入
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed font-mono">{currentText}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Topic expander */}
          <div className="card space-y-3">
            <h3 className="text-base font-semibold text-gray-800">话题段落生成</h3>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map(t => (
                <button key={t} onClick={() => setSelectedTopic(t)}
                  className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                    selectedTopic === t
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : 'border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <input className="input-field" placeholder="或输入自定义话题…" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} />
            <button onClick={handleExpand} disabled={!selectedTopic.trim() || expanding}
              className="btn-primary w-full justify-center disabled:opacity-40">
              {expanding ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {expanding ? '生成中…' : 'AI 生成段落'}
            </button>
            {expandResult && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-base text-gray-800 leading-relaxed">{expandResult}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => insertTemplate(expandResult)}
                    className="text-sm text-emerald-700 hover:text-emerald-900 font-medium transition-colors">
                    插入编辑器 →
                  </button>
                  <button onClick={() => saveNote(`AI段落·${selectedTopic}`, expandResult)}
                    className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800 transition-colors">
                    <BookmarkPlus size={13} />保存到笔记
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title mb-0">写作编辑器</h2>
            <span className="text-sm text-gray-400">{wordCount} 词</span>
          </div>
          <textarea
            ref={textareaRef}
            className="textarea-field font-mono leading-relaxed h-80"
            placeholder="在此写作，或从左侧插入模板…

写到句子末尾后，点击「AI 续写」获取补全建议。"
            value={safeText}
            onChange={e => { setText(e.target.value); setSuggestion('') }}
          />

          {/* AI suggestion banner */}
          {suggestion && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
              <p className="text-sm text-indigo-600 mb-2 font-semibold">AI 续写建议：</p>
              <p className="text-base text-gray-800 leading-relaxed">{suggestion}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={acceptSuggestion} className="btn-primary py-1.5 px-4 text-sm">采用</button>
                <button onClick={() => setSuggestion('')} className="btn-secondary py-1.5 px-4 text-sm">忽略</button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleComplete} disabled={!safeText.trim() || completing}
              className="btn-primary disabled:opacity-40">
              {completing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
              {completing ? '生成中…' : 'AI 续写'}
            </button>
            <button onClick={() => copyText(safeText, 'main')} className="btn-secondary">
              {copiedIdx === 'main' ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
              复制全文
            </button>
          </div>
        </div>
      </div>
      </div>
      )}
      {activeTab === 'transform' && <SentenceTransform />}
    </div>
  )
}
