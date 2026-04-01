import React, { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Wand2, Copy, Check, Loader2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { callDeepSeek } from '../../utils/aiClient'

const TRANSFORM_PROMPT = `You are a CET-6 writing coach specializing in sentence transformation (主位推进 / Thematic Progression).

Given an English sentence, identify its grammatical components and generate transformed versions using different elements as the new subject.

Respond with ONLY a valid JSON object (no markdown, no code fences):
{
  "components": {
    "subject": "the main agent/subject (or null)",
    "verb": "the main verb phrase",
    "object": "the main object (or null)",
    "time": "time expression (or null)",
    "method": "method/means/instrument (or null)",
    "quantity": "any numerical/quantitative element (or null)",
    "result": "implied result or impact (or null)"
  },
  "transforms": [
    {
      "type": "被动式",
      "label": "Object as Subject",
      "sentence": "...",
      "note": "宾语提升为主语，强调事物本身的变化"
    },
    {
      "type": "时间主语式",
      "label": "Time as Subject",
      "sentence": "...",
      "note": "时间表达作主语，配合 see / witness / mark"
    },
    {
      "type": "数量主语式",
      "label": "Quantity as Subject",
      "sentence": "...",
      "note": "数据或程度作主语，直接让数字开口说话"
    },
    {
      "type": "名词化式",
      "label": "Nominalization",
      "sentence": "...",
      "note": "动作名词化作主语，提升正式程度"
    },
    {
      "type": "工具／途径主语式",
      "label": "Method as Subject",
      "sentence": "...",
      "note": "方式或手段作主语，逻辑因果清晰"
    },
    {
      "type": "结果主语式",
      "label": "Result as Subject",
      "sentence": "...",
      "note": "结果或影响作主语，适合段落收尾"
    }
  ]
}

IMPORTANT:
- Only include transforms that are grammatically natural for this specific sentence
- If a component (time/quantity/method/result) does not exist in the sentence, you may infer a reasonable one OR skip that transform type
- Keep sentences academic and CET-6 appropriate
- The "note" field should be 1 short Chinese sentence explaining the rhetorical effect`

const COMPONENT_COLORS = {
  subject:  { label: '主体', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  verb:     { label: '谓语', bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200' },
  object:   { label: '宾语', bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200' },
  time:     { label: '时间', bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
  method:   { label: '方式', bg: 'bg-rose-50',    text: 'text-rose-700',   border: 'border-rose-200' },
  quantity: { label: '数量', bg: 'bg-cyan-50',    text: 'text-cyan-700',   border: 'border-cyan-200' },
  result:   { label: '结果', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
}

const EXAMPLES = [
  'China increased renewable energy output by 30% in 2023.',
  'The government introduced a new environmental policy last year, which reduced carbon emissions by 15%.',
  'Online education expanded significantly during the pandemic, providing access to learning for millions of students.',
  'Scientists discovered a new treatment for diabetes using gene-editing technology in recent trials.',
]

function ComponentTag({ name, value }) {
  if (!value) return null
  const c = COMPONENT_COLORS[name]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border ${c.bg} ${c.text} ${c.border}`}>
      <span className="font-semibold text-xs opacity-70">{c.label}</span>
      {value}
    </span>
  )
}

function TransformCard({ transform, index }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const copy = () => {
    navigator.clipboard.writeText(transform.sentence)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const colors = [
    'border-l-blue-400', 'border-l-violet-400', 'border-l-emerald-400',
    'border-l-amber-400', 'border-l-rose-400',  'border-l-orange-400',
  ]

  return (
    <div className={`card border-l-4 ${colors[index % colors.length]} py-4 px-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-base">{transform.type}</span>
            <span className="text-xs text-gray-400 font-mono">{transform.label}</span>
          </div>
          {expanded && (
            <>
              <p className="text-gray-800 text-base leading-relaxed mb-2 font-medium">
                {transform.sentence}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">{transform.note}</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={copy}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="复制"
          >
            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SentenceTransform() {
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')

  const analyze = useCallback(async () => {
    const sentence = input.trim()
    if (!sentence) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const raw = await callDeepSeek(
        [
          { role: 'system', content: TRANSFORM_PROMPT },
          { role: 'user', content: sentence },
        ],
        { temperature: 0.4, max_tokens: 1200 }
      )
      // Strip possible markdown code fences
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(cleaned)
      setResult(parsed)
    } catch (e) {
      setError('解析失败：' + e.message + '。请检查 AI Key 或重试。')
    } finally {
      setLoading(false)
    }
  }, [input])

  const useExample = (ex) => {
    setInput(ex)
    setResult(null)
    setError('')
  }

  return (
    <div className="page-container max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">句式转换</h2>
          <p className="text-gray-500 text-base">输入一个英文句子，AI 提取语法成分并生成六种主位变换，系统性训练句式多样性。</p>
        </div>
        <Link
          to="/xuanxuan/episode-7"
          target="_blank"
          className="btn-ghost flex-shrink-0 text-sm gap-1.5"
        >
          <BookOpen size={15} />参考文献
        </Link>
      </div>

      {/* Input area */}
      <div className="card mb-6">
        <label className="section-title block mb-3">输入句子</label>
        <textarea
          className="textarea-field font-mono text-base leading-relaxed mb-4"
          rows={3}
          placeholder="输入一个英文句子，例如：China increased renewable energy output by 30% in 2023."
          value={input}
          onChange={e => { setInput(e.target.value); setResult(null); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyze() }}
        />

        {/* Example sentences */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2 font-medium">示例句子（点击使用）：</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => useExample(ex)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors text-left leading-relaxed max-w-xs truncate"
                title={ex}
              >
                {ex.length > 50 ? ex.slice(0, 50) + '…' : ex}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={analyze}
          disabled={!input.trim() || loading}
          className="btn-primary w-full justify-center disabled:opacity-40"
        >
          {loading
            ? <><Loader2 size={17} className="animate-spin" />分析中…</>
            : <><Wand2 size={17} />开始分析</>
          }
        </button>
        {!loading && <p className="text-xs text-gray-400 text-center mt-2">⌘/Ctrl + Enter 快速分析</p>}
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-200 bg-red-50 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Components */}
          <div className="card">
            <p className="section-title mb-3">句子成分解析</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.components).map(([key, val]) =>
                val ? <ComponentTag key={key} name={key} value={val} /> : null
              )}
            </div>
          </div>

          {/* Transforms */}
          <div>
            <p className="section-title mb-3">六种主位变换</p>
            <div className="space-y-3">
              {result.transforms.map((t, i) => (
                <TransformCard key={i} transform={t} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
