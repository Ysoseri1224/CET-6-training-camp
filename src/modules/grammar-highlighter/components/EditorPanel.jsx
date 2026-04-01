import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useGrammarStore } from '../store/grammarStore'
import { ROLE_META } from '../engine/grammarEngine'
import ErrorTooltip from './ErrorTooltip'

function buildHighlightHTML(text, spans, errors, visibleRoles, opacity) {
  if (!text) return ''
  const sortedErrors = [...errors].sort((a, b) => a.offset - b.offset)
  const roleMap = new Array(text.length).fill(null)
  const errorMap = new Array(text.length).fill(null)
  spans.forEach((span) => {
    if (!visibleRoles[span.role]) return
    for (let i = span.start; i < span.end && i < text.length; i++) roleMap[i] = span.role
  })
  sortedErrors.forEach((err, idx) => {
    for (let i = err.offset; i < err.offset + err.length && i < text.length; i++) errorMap[i] = idx
  })
  let html = ''
  let i = 0
  while (i < text.length) {
    const role = roleMap[i]
    const errIdx = errorMap[i]
    let j = i + 1
    while (j < text.length && roleMap[j] === role && errorMap[j] === errIdx) j++
    const chunk = escapeHtml(text.slice(i, j))
    const meta = role ? ROLE_META[role] : null
    let spanStyle = '', spanClass = '', dataAttrs = ''
    if (meta) { spanStyle += `background-color:${hexToRgba(meta.color, opacity)};`; dataAttrs += ` data-role="${role}"` }
    if (errIdx !== null && errIdx !== undefined) {
      const err = sortedErrors[errIdx]
      spanClass += err.issueType === 'spelling' ? ' grammar-error' : ' style-error'
      dataAttrs += ` data-err="${errIdx}" data-err-msg="${escapeAttr(err.message)}" data-err-reps="${escapeAttr(JSON.stringify(err.replacements || []))}" data-err-type="${err.issueType || 'grammar'}" data-err-cat="${escapeAttr(err.ruleCategory || '')}" data-err-src="${err.source || 'languagetool'}" data-err-offset="${err.offset}" data-err-len="${err.length}"`
    }
    if (meta || errIdx != null) html += `<span style="${spanStyle}" class="${spanClass.trim()}"${dataAttrs}>${chunk}</span>`
    else html += chunk
    i = j
  }
  return html
}

function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/ /g, '&nbsp;') }
function escapeAttr(str) { return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function hexToRgba(hex, alpha) { const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${g},${b},${alpha})` }

export default function EditorPanel() {
  const rawText = useGrammarStore((s) => s.rawText)
  const setRawText = useGrammarStore((s) => s.setRawText)
  const analysisResult = useGrammarStore((s) => s.analysisResult)
  const setAnalysisResult = useGrammarStore((s) => s.setAnalysisResult)
  const dsAnalysis = useGrammarStore((s) => s.dsAnalysis)
  const setDsAnalysis = useGrammarStore((s) => s.setDsAnalysis)
  const setDsTree = useGrammarStore((s) => s.setDsTree)
  const dsAnalyzing = useGrammarStore((s) => s.dsAnalyzing)
  const visibleRoles = useGrammarStore((s) => s.visibleRoles)
  const highlightOpacity = useGrammarStore((s) => s.highlightOpacity)
  const ltErrors = useGrammarStore((s) => s.ltErrors)
  const dsErrors = useGrammarStore((s) => s.dsErrors)
  const setTooltip = useGrammarStore((s) => s.setTooltip)
  const editorMode = useGrammarStore((s) => s.editorMode)
  const setEditorMode = useGrammarStore((s) => s.setEditorMode)

  const isAnalyzed = editorMode === 'analyzed'
  const activeSpans = dsAnalysis.length > 0 ? dsAnalysis : analysisResult
  const inputRef = useRef(null)
  const highlightRef = useRef(null)
  const wrapperRef = useRef(null)
  const tooltipTimerRef = useRef(null)
  const lastHoveredRole = useRef(null)
  const [errorTooltip, setErrorTooltip] = useState(null)

  useEffect(() => {
    if (!highlightRef.current) return
    const allErrors = [...ltErrors, ...dsErrors]
    const html = buildHighlightHTML(rawText, activeSpans, allErrors, visibleRoles, highlightOpacity)
    highlightRef.current.innerHTML = html
  }, [rawText, activeSpans, ltErrors, dsErrors, visibleRoles, highlightOpacity])

  const handleWrapperMouseMove = useCallback((e) => {
    const hl = highlightRef.current
    if (!hl) return
    hl.style.pointerEvents = 'auto'
    const el = document.elementFromPoint(e.clientX, e.clientY)
    hl.style.pointerEvents = 'none'
    const span = el?.closest?.('span[data-role]')
    const errSpan = el?.closest?.('span[data-err]')
    const role = span?.dataset?.role || null
    if (role !== lastHoveredRole.current) {
      lastHoveredRole.current = role
      clearTimeout(tooltipTimerRef.current)
      if (role) {
        tooltipTimerRef.current = setTimeout(() => {
          const rect = span.getBoundingClientRect()
          setTooltip({ x: rect.left, y: rect.top, data: { role, word: span.textContent.replace(/\u00A0/g, ' '), tags: [] } })
        }, 180)
      } else { setTooltip(null) }
    }
    if (errSpan && !errorTooltip) {
      const errEl = errSpan
      const errData = { offset: Number(errEl.dataset.errOffset || 0), length: Number(errEl.dataset.errLen || 1), message: errEl.dataset.errMsg || '', replacements: JSON.parse(errEl.dataset.errReps || '[]'), issueType: errEl.dataset.errType || 'grammar', ruleCategory: errEl.dataset.errCat || '', source: errEl.dataset.errSrc || 'languagetool' }
      if (errData.message) setErrorTooltip({ error: errData, x: e.clientX, y: e.clientY + 16 })
    }
  }, [setTooltip, errorTooltip])

  const handleWrapperMouseLeave = useCallback(() => { clearTimeout(tooltipTimerRef.current); lastHoveredRole.current = null; setTooltip(null) }, [setTooltip])

  const handleInput = useCallback((e) => {
    if (editorMode === 'analyzed') { setEditorMode('editing'); setAnalysisResult([]); setDsAnalysis([]); setDsTree(null) }
    setRawText(e.target.value)
  }, [editorMode, setRawText, setEditorMode, setAnalysisResult, setDsAnalysis, setDsTree])

  const applyReplacement = useCallback((replacement) => {
    if (!errorTooltip) return
    const err = errorTooltip.error
    setRawText(rawText.slice(0, err.offset) + replacement + rawText.slice(err.offset + err.length))
    setErrorTooltip(null)
  }, [errorTooltip, rawText, setRawText])

  return (
    <div className="relative">
      {dsAnalyzing && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-xs text-purple-600 dark:text-purple-400 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />AI 修正中…
        </div>
      )}
      <div ref={wrapperRef} className="editor-wrapper rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        onMouseMove={isAnalyzed ? handleWrapperMouseMove : undefined}
        onMouseLeave={isAnalyzed ? handleWrapperMouseLeave : undefined}>
        <div ref={highlightRef} className="editor-highlight" aria-hidden="true" style={{ visibility: isAnalyzed ? 'visible' : 'hidden' }} />
        <textarea ref={inputRef} className="editor-input" style={{ color: isAnalyzed ? 'transparent' : undefined, caretColor: isAnalyzed ? '#6366f1' : undefined }}
          value={rawText} onChange={handleInput} placeholder="Type or paste English text here..." spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      {errorTooltip && <ErrorTooltip error={{ ...errorTooltip.error, x: errorTooltip.x, y: errorTooltip.y }} onClose={() => setErrorTooltip(null)} onApply={applyReplacement} />}
    </div>
  )
}
