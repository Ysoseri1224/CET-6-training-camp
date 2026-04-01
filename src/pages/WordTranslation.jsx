import React, { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { callGPT } from '../utils/aiClient'
import { useWordTranslationStore } from '../store/moduleStores'
import { AlignLeft, Play, RotateCcw, CheckCircle, ChevronRight, Loader2, Lightbulb, Eye, EyeOff, BookOpen } from 'lucide-react'

const SYSTEM_PROMPT = `You are an English translation tutor specializing in the word-by-word translation method (逐词翻译法).

Given a Chinese sentence, respond with a JSON object:
{
  "segments": [
    {
      "zh": "中文词组",
      "role": "subject",
      "grammar_hints": ["过去式", "接 to do"],
      "reference": "参考英译（1-4词）"
    }
  ],
  "reference_sentence": "完整参考译文",
  "tips": ["翻译要点（中文）"]
}

Rules:
- Segment into 4-8 meaningful chunks
- role: one of subject / predicate / object / adverbial / complement / attributive / conjunction
- grammar_hints: array of 0-2 concise Chinese hints about tense, voice, or collocation patterns.
  Valid hint types:
    • Tense/voice: "一般过去时", "现在完成时", "将来时", "被动语态", "过去完成时"
    • Collocation: "接 to do", "接 doing", "接 that 从句", "介词 in/on/of/for/with", "固定短语"
    • Structure: "倒装", "强调句", "省略", "独立主格"
  Only include hints that are actually relevant. Empty array [] if no special pattern.
- reference: 1-4 natural English words for that segment
- reference_sentence: fluent, natural full translation
- tips: 2-3 key observations in Chinese
- Return ONLY valid JSON, no markdown`

const EVAL_PROMPT = `You are an English translation evaluator.
Given a Chinese sentence, the user's English translation attempt (assembled from word-by-word inputs), and a reference translation, evaluate the user's work.

Respond with JSON:
{
  "score": 85,
  "comment": "简短总体评价（中文，1-2句）",
  "highlights": ["做得好的地方（中文）"],
  "improvements": ["需要改进的地方（中文）"],
  "corrected": "修正后的译文（如无需修正则与用户译文相同）"
}

Be encouraging but honest. Score 0-100.
Return ONLY valid JSON, no markdown.`

const ROLE_LABELS = {
  subject: { label: '主语', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  predicate: { label: '谓语', color: 'bg-red-100 text-red-700 border-red-200' },
  object: { label: '宾语', color: 'bg-green-100 text-green-700 border-green-200' },
  adverbial: { label: '状语', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  complement: { label: '补语', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  attributive: { label: '定语', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  conjunction: { label: '连接', color: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export default function WordTranslation() {
  const {
    inputZh, setInputZh,
    segments, setSegments,
    referenceSentence, setReferenceSentence,
    tips, setTips,
    userAnswers, setUserAnswers,
    evaluation, setEvaluation,
    showReference, setShowReference,
    step, setStep,
    reset,
  } = useWordTranslationStore()
  const [loading, setLoading] = useState(false)
  const [evalLoading, setEvalLoading] = useState(false)

  const handleAnalyze = useCallback(async () => {
    if (!inputZh.trim()) return
    setLoading(true)
    setEvaluation(null)
    setShowReference(false)
    setUserAnswers({})
    try {
      const content = await callGPT(
        [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: inputZh.trim() }],
        { temperature: 0.3, max_tokens: 1200 }
      )
      const parsed = JSON.parse(content.replace(/```json|```/g, '').trim())
      setSegments(parsed.segments || [])
      setReferenceSentence(parsed.reference_sentence || '')
      setTips(parsed.tips || [])
      setStep('translate')
    } catch (e) {
      alert('AI 解析失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }, [inputZh])

  const handleEvaluate = useCallback(async () => {
    const userSentence = segments.map((s, i) => userAnswers[i] || '___').join(' ')
    setEvalLoading(true)
    try {
      const prompt = `Chinese: ${inputZh}\nUser translation: ${userSentence}\nReference: ${referenceSentence}`
      const content = await callGPT(
        [{ role: 'system', content: EVAL_PROMPT }, { role: 'user', content: prompt }],
        { temperature: 0.3, max_tokens: 600 }
      )
      const parsed = JSON.parse(content.replace(/```json|```/g, '').trim())
      setEvaluation(parsed)
      setStep('result')
    } catch (e) {
      alert('评估失败：' + e.message)
    } finally {
      setEvalLoading(false)
    }
  }, [inputZh, segments, userAnswers, referenceSentence])

  // reset is provided by store

  const scoreColor = (s) => s >= 85 ? 'text-emerald-600' : s >= 65 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = (s) => s >= 85 ? 'bg-emerald-50 border-emerald-200' : s >= 65 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="page-container">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <AlignLeft size={28} className="text-blue-600" />逐词翻译法训练
          </h1>
          <Link to="/xuanxuan/episode-5" target="_blank"
            className="flex-shrink-0 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors font-medium">
            <BookOpen size={14} />参考文献
          </Link>
        </div>
        <p className="text-gray-500 text-lg">输入中文句子，AI 切分词组并给出语法模式提示，逐词翻译后综合评分。</p>
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="card space-y-5">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">输入中文句子</label>
            <textarea
              className="textarea-field h-28 font-medium"
              placeholder="例：政府应该优先改善医疗保障体系，以提升民众的生活质量。"
              value={inputZh}
              onChange={(e) => setInputZh(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze() }}
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleAnalyze} disabled={!inputZh.trim() || loading}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              {loading ? '解析中…' : '开始训练'}
            </button>
            <span className="text-sm text-gray-400">Ctrl+Enter 快速开始</span>
          </div>
        </div>
      )}

      {/* Step 2: Translate word by word */}
      {step === 'translate' && (
        <div className="space-y-5">
          {/* Original sentence */}
          <div className="card bg-gray-50">
            <p className="section-title">原文</p>
            <p className="text-gray-900 font-semibold text-xl leading-relaxed">{inputZh}</p>
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-50 border border-blue-200">
              <Lightbulb size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <ul className="space-y-1">
                {tips.map((t, i) => <li key={i} className="text-base text-blue-800">{t}</li>)}
              </ul>
            </div>
          )}

          {/* Segments */}
          <div className="space-y-3">
            {segments.map((seg, i) => {
              const roleMeta = ROLE_LABELS[seg.role] || ROLE_LABELS.conjunction
              return (
                <div key={i} className="card flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Chinese + role + hints */}
                  <div className="sm:w-52 flex-shrink-0 space-y-2">
                    <p className="text-gray-900 font-semibold text-lg">{seg.zh}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`tag border text-xs ${roleMeta.color}`}>{roleMeta.label}</span>
                      {(seg.grammar_hints || []).map((hint, hi) => (
                        <span key={hi} className="tag border text-xs bg-orange-50 text-orange-700 border-orange-200">
                          {hint}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0 hidden sm:block" />

                  {/* Input */}
                  <input
                    className="input-field flex-1 min-w-0"
                    placeholder="英文翻译…"
                    value={userAnswers[i] || ''}
                    onChange={(e) => setUserAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                  />

                  {/* Reference answer */}
                  {showReference && (
                    <span className="text-base text-emerald-700 font-mono font-medium flex-shrink-0 sm:w-28 text-right">
                      {seg.reference}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3 flex-wrap pt-1">
            <button onClick={handleEvaluate} disabled={evalLoading} className="btn-primary disabled:opacity-40">
              {evalLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {evalLoading ? '评估中…' : '提交评估'}
            </button>
            <button onClick={() => setShowReference(!showReference)} className="btn-secondary">
              {showReference ? <><EyeOff size={16} />隐藏参考</> : <><Eye size={16} />显示参考答案</>}
            </button>
            <button onClick={reset} className="btn-ghost">
              <RotateCcw size={16} /> 重新输入
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && evaluation && (
        <div className="space-y-5">
          {/* Original + user translation */}
          <div className="card space-y-4">
            <div>
              <p className="section-title">中文原文</p>
              <p className="text-gray-900 font-semibold text-xl leading-relaxed">{inputZh}</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="section-title">你的翻译</p>
              <p className="text-gray-800 text-xl leading-relaxed font-mono">
                {segments.map((_, i) => userAnswers[i] || <span key={i} className="text-red-400">___</span>)}
              </p>
            </div>
          </div>

          {/* Score */}
          <div className={`card text-center py-8 border-2 ${scoreBg(evaluation.score)}`}>
            <p className={`text-6xl font-bold mb-2 ${scoreColor(evaluation.score)}`}>{evaluation.score}</p>
            <p className="text-gray-500 text-base mb-3">综合评分</p>
            <p className="text-gray-700 text-lg leading-relaxed max-w-md mx-auto">{evaluation.comment}</p>
          </div>

          {/* Highlights & improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluation.highlights?.length > 0 && (
              <div className="card border-emerald-200 bg-emerald-50">
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3">✓ 做得好</p>
                <ul className="space-y-2">{evaluation.highlights.map((h, i) => (
                  <li key={i} className="text-base text-emerald-800 flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>{h}
                  </li>
                ))}</ul>
              </div>
            )}
            {evaluation.improvements?.length > 0 && (
              <div className="card border-amber-200 bg-amber-50">
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-3">→ 改进建议</p>
                <ul className="space-y-2">{evaluation.improvements.map((h, i) => (
                  <li key={i} className="text-base text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>{h}
                  </li>
                ))}</ul>
              </div>
            )}
          </div>

          {/* Reference */}
          <div className="card space-y-4">
            <div>
              <p className="section-title">参考译文</p>
              <p className="text-gray-900 text-xl font-medium leading-relaxed">{referenceSentence}</p>
            </div>
            {evaluation.corrected && evaluation.corrected !== segments.map((_, i) => userAnswers[i] || '').join(' ') && (
              <div className="pt-4 border-t border-gray-200">
                <p className="section-title">修正后的你的译文</p>
                <p className="text-indigo-700 text-xl font-medium leading-relaxed">{evaluation.corrected}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="btn-primary">
              <RotateCcw size={18} /> 再练一句
            </button>
            <button onClick={() => { setStep('translate'); setEvaluation(null) }} className="btn-secondary">
              返回修改
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
