import React, { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'

export default function PreprocessModal({ original, cleaned, onConfirm, onDismiss }) {
  const [editedText, setEditedText] = useState(cleaned)
  useEffect(() => { setEditedText(cleaned) }, [cleaned])
  if (!original) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">检测到非英文或特殊符号</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">AI 已将内容处理为英文，你可以编辑后确认，或保留原始输入</p>
          </div>
          <button onClick={onDismiss} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-5 pt-4">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">原始输入</p>
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 font-mono leading-relaxed max-h-24 overflow-y-auto select-all">{original}</div>
        </div>
        <div className="px-5 pt-3 pb-4">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">处理后（可编辑）</p>
          <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} rows={4}
            className="w-full text-sm font-mono text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 leading-relaxed"
            spellCheck={false} />
        </div>
        <div className="flex items-center justify-end gap-2 px-5 pb-4">
          <button onClick={onDismiss} className="px-3 py-1.5 text-xs rounded-lg font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">保留原始输入</button>
          <button onClick={() => onConfirm(editedText.trim())} disabled={!editedText.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Check size={13} />使用处理后的文本
          </button>
        </div>
      </div>
    </div>
  )
}
