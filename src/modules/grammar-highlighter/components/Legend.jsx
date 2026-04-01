import React, { useState } from 'react'
import { ROLE_META } from '../engine/grammarEngine'
import { useGrammarStore } from '../store/grammarStore'
import { SYMBOLS, SymbolModal } from './SymbolModal'

const DISPLAY_ROLES = [
  'subject', 'predicate', 'object', 'complement',
  'attributive', 'adverbial', 'parenthetical', 'conjunction',
  'infinitive', 'participial', 'auxiliary', 'determiner',
]

export default function Legend() {
  const visibleRoles = useGrammarStore((s) => s.visibleRoles)
  const highlightOpacity = useGrammarStore((s) => s.highlightOpacity)
  const [activeSymbol, setActiveSymbol] = useState(null)

  return (
    <>
      <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {DISPLAY_ROLES.filter((k) => visibleRoles[k] !== false).map((k) => {
            const meta = ROLE_META[k]
            if (!meta) return null
            return (
              <div key={k} className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: meta.color, opacity: Math.min(1, highlightOpacity + 0.5) }} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{meta.zhLabel}</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5 border-t border-slate-200/60 dark:border-slate-700/60">
          {SYMBOLS.map((s) => (
            <button key={s.sym} onClick={() => setActiveSymbol(s)} className="flex items-center gap-1 group" title={s.brief}>
              <span className="font-mono text-xs font-bold text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{s.sym}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{s.brief}</span>
            </button>
          ))}
        </div>
      </div>
      <SymbolModal sym={activeSymbol} onClose={() => setActiveSymbol(null)} />
    </>
  )
}
