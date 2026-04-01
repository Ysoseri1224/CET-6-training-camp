import React, { useEffect, useRef, useState } from 'react'
import { useGrammarStore } from '../store/grammarStore'
import { ROLE_META } from '../engine/grammarEngine'

export default function GrammarTooltip() {
  const tooltip = useGrammarStore((s) => s.tooltip)
  const setTooltip = useGrammarStore((s) => s.setTooltip)
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!tooltip) return
    const el = ref.current
    if (!el) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const rect = el.getBoundingClientRect()
    let x = tooltip.x
    let y = tooltip.y - rect.height - 10
    if (x + rect.width > vw - 8) x = vw - rect.width - 8
    if (x < 8) x = 8
    if (y < 8) y = tooltip.y + 24
    setPos({ x, y })
  }, [tooltip])

  if (!tooltip) return null
  const { data } = tooltip
  const meta = ROLE_META[data?.role]
  if (!meta) return null

  return (
    <div
      ref={ref}
      className="grammar-tooltip fixed z-50 max-w-xs rounded-xl shadow-2xl border text-sm pointer-events-auto
        bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      style={{ left: pos.x, top: pos.y }}
      onMouseEnter={() => {}}
      onMouseLeave={() => setTooltip(null)}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl" style={{ backgroundColor: meta.color + '22', borderBottom: `2px solid ${meta.color}` }}>
        <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
        <span className="font-bold text-slate-800 dark:text-slate-100">{meta.zhLabel}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">{meta.label}</span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{meta.zhDesc}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed italic">{meta.enDesc}</p>
        {data.word && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-400">当前词：</span>
            <span className="ml-1 font-mono font-semibold text-sm px-1.5 py-0.5 rounded" style={{ backgroundColor: meta.color + '22', color: meta.color }}>{data.word}</span>
          </div>
        )}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {data.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
