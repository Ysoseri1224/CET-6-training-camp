import React, { useState } from 'react'
import { useGrammarStore } from '../store/grammarStore'
import { ROLE_META } from '../engine/grammarEngine'
import { SYMBOLS, SymbolModal } from './SymbolModal'
import { Eye, EyeOff, Sun, Moon, ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle, Key, Zap } from 'lucide-react'

function RoleToggle({ roleKey }) {
  const visibleRoles = useGrammarStore((s) => s.visibleRoles)
  const toggleRole = useGrammarStore((s) => s.toggleRole)
  const meta = ROLE_META[roleKey]
  if (!meta) return null
  const active = visibleRoles[roleKey]
  return (
    <button onClick={() => toggleRole(roleKey)}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? 'text-slate-700 dark:text-slate-200' : 'opacity-40 text-slate-400 dark:text-slate-600'}`}
      style={active ? { backgroundColor: meta.color + '20', border: `1px solid ${meta.color}60` } : { border: '1px solid transparent', backgroundColor: 'transparent' }}>
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: active ? meta.color : '#94a3b8' }} />
      {meta.zhLabel}
      {active ? <Eye size={11} className="ml-auto opacity-60" /> : <EyeOff size={11} className="ml-auto opacity-40" />}
    </button>
  )
}

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-100 dark:border-slate-800">
      <button className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => setOpen(!open)}>
        {title}{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

export default function ControlPanel() {
  const darkMode = useGrammarStore((s) => s.darkMode)
  const toggleDarkMode = useGrammarStore((s) => s.toggleDarkMode)
  const highlightOpacity = useGrammarStore((s) => s.highlightOpacity)
  const setHighlightOpacity = useGrammarStore((s) => s.setHighlightOpacity)
  const ltApiKey = useGrammarStore((s) => s.ltApiKey)
  const setLtApiKey = useGrammarStore((s) => s.setLtApiKey)
  const dsApiKey = useGrammarStore((s) => s.dsApiKey)
  const setDsApiKey = useGrammarStore((s) => s.setDsApiKey)
  const ltLoading = useGrammarStore((s) => s.ltLoading)
  const dsLoading = useGrammarStore((s) => s.dsLoading)
  const ltErrors = useGrammarStore((s) => s.ltErrors)
  const dsErrors = useGrammarStore((s) => s.dsErrors)
  const [ltKeyInput, setLtKeyInput] = useState(ltApiKey)
  const [dsKeyInput, setDsKeyInput] = useState(dsApiKey)
  const [ltKeySaved, setLtKeySaved] = useState(false)
  const [dsKeySaved, setDsKeySaved] = useState(false)
  const [activeSymbol, setActiveSymbol] = useState(null)

  const saveLtKey = () => { setLtApiKey(ltKeyInput.trim()); setLtKeySaved(true); setTimeout(() => setLtKeySaved(false), 2000) }
  const saveDsKey = () => { setDsApiKey(dsKeyInput.trim()); setDsKeySaved(true); setTimeout(() => setDsKeySaved(false), 2000) }
  const roles = Object.keys(ROLE_META).filter(k => !['auxiliary', 'determiner'].includes(k))

  return (
    <div className="flex flex-col h-full overflow-y-auto text-sm bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">外观</span>
        <button onClick={toggleDarkMode} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          {darkMode ? <Sun size={13} /> : <Moon size={13} />}{darkMode ? '浅色' : '深色'}
        </button>
      </div>
      <Section title="高亮强度">
        <div className="flex items-center gap-3 pt-1">
          <input type="range" min="0.1" max="0.6" step="0.02" value={highlightOpacity} onChange={(e) => setHighlightOpacity(parseFloat(e.target.value))} className="flex-1 accent-blue-500" />
          <span className="text-xs text-slate-400 w-8 text-right">{Math.round(highlightOpacity * 100)}%</span>
        </div>
      </Section>
      <Section title="成分显示">
        <div className="grid grid-cols-2 gap-1 pt-1">{roles.map((k) => <RoleToggle key={k} roleKey={k} />)}</div>
      </Section>
      <Section title="符号解释">
        <div className="flex flex-col gap-0.5 pt-1">
          {SYMBOLS.map((s) => (
            <button key={s.sym} onClick={() => setActiveSymbol(s)} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <span className="font-mono text-sm font-bold text-blue-500 dark:text-blue-400 w-7 flex-shrink-0 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{s.sym}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{s.brief}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{s.lang}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>
      <SymbolModal sym={activeSymbol} onClose={() => setActiveSymbol(null)} />
      <Section title="LanguageTool 纠错">
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {ltLoading ? <><Loader2 size={12} className="animate-spin text-blue-500" /><span>检查中...</span></> : ltErrors.length > 0 ? <><AlertCircle size={12} className="text-amber-500" /><span>发现 {ltErrors.length} 处问题</span></> : <><CheckCircle size={12} className="text-green-500" /><span>免费 API 已启用（无需 Key）</span></>}
          </div>
          <div className="relative">
            <Key size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="password" placeholder="Premium Key（可选）" value={ltKeyInput} onChange={(e) => setLtKeyInput(e.target.value)} className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={saveLtKey} className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${ltKeySaved ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`}>{ltKeySaved ? '✓ 已保存' : '保存 Key'}</button>
        </div>
      </Section>
      <Section title="DeepSeek AI 纠错">
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {dsLoading ? <><Loader2 size={12} className="animate-spin text-purple-500" /><span>AI 分析中...</span></> : dsErrors.length > 0 ? <><AlertCircle size={12} className="text-purple-500" /><span>AI 发现 {dsErrors.length} 处问题</span></> : dsApiKey ? <><CheckCircle size={12} className="text-green-500" /><span>DeepSeek Key 已配置</span></> : <><Zap size={12} className="text-slate-400" /><span>填入 Key 以启用 AI 纠错</span></>}
          </div>
          <div className="relative">
            <Key size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="password" placeholder="sk-xxxxxxxxxxxx" value={dsKeyInput} onChange={(e) => setDsKeyInput(e.target.value)} className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
          </div>
          <button onClick={saveDsKey} className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${dsKeySaved ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40'}`}>{dsKeySaved ? '✓ 已保存' : '保存 Key'}</button>
        </div>
      </Section>
    </div>
  )
}
