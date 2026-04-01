import React, { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Lightbulb, X } from 'lucide-react'

export default function ErrorTooltip({ error, onClose, onApply }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: error.x || 0, y: error.y || 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const vw = window.innerWidth
    const rect = el.getBoundingClientRect()
    let x = error.x
    if (x + rect.width > vw - 8) x = vw - rect.width - 8
    if (x < 8) x = 8
    let y = error.y + 20
    if (y + rect.height > window.innerHeight - 8) y = error.y - rect.height - 8
    setPos({ x, y })
  }, [error])

  const icon = error.issueType === 'spelling'
    ? <span className="text-red-500">✕</span>
    : <AlertTriangle size={14} className="text-amber-500" />

  return (
    <div
      ref={ref}
      className="fixed z-50 max-w-sm rounded-xl shadow-2xl border text-sm pointer-events-auto
        bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 gh-grammar-tooltip"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="flex items-start gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        {icon}
        <p className="flex-1 text-slate-700 dark:text-slate-200 leading-relaxed text-xs">{error.message}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0"><X size={14} /></button>
      </div>
      {error.replacements && error.replacements.length > 0 && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-1 mb-1.5 text-xs text-slate-400"><Lightbulb size={12} /><span>建议替换</span></div>
          <div className="flex flex-wrap gap-1.5">
            {error.replacements.map((r, i) => (
              <button key={i} onClick={() => onApply(r)}
                className="px-2 py-0.5 rounded-full text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors">
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="px-3 pb-2 text-xs text-slate-400 dark:text-slate-500">
        来源：{error.source === 'deepseek' ? 'DeepSeek AI' : 'LanguageTool'} · {error.ruleCategory || error.issueType}
      </div>
    </div>
  )
}
