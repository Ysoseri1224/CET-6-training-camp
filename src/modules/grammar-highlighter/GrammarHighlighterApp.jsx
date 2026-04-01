import React, { useRef, useCallback } from 'react'
import { useGrammarStore } from './store/grammarStore'
import { analyzeText } from './engine/grammarEngine'
import { checkWithLanguageTool } from './engine/languageTool'
import { checkWithDeepSeek } from './engine/deepseek'
import { analyzeWithDeepSeek } from './engine/deepseekAnalyze'
import { needsPreprocessing, preprocessWithDeepSeek } from './engine/preprocessText'
import EditorPanel from './components/EditorPanel'
import ControlPanel from './components/ControlPanel'
import TreeViewPanel from './components/TreeViewPanel'
import Legend from './components/Legend'
import PreprocessModal from './components/PreprocessModal'
import GrammarTooltip from './components/GrammarTooltip'
import { Link } from 'react-router-dom'
import { Layers, Play, Pencil, BookOpen } from 'lucide-react'
import './grammar.css'

export default function GrammarHighlighterApp() {
  const darkMode        = useGrammarStore((s) => s.darkMode)
  const rawText         = useGrammarStore((s) => s.rawText)
  const setAnalysisResult = useGrammarStore((s) => s.setAnalysisResult)
  const setLtErrors     = useGrammarStore((s) => s.setLtErrors)
  const setDsErrors     = useGrammarStore((s) => s.setDsErrors)
  const setLtLoading    = useGrammarStore((s) => s.setLtLoading)
  const setDsLoading    = useGrammarStore((s) => s.setDsLoading)
  const ltApiKey        = useGrammarStore((s) => s.ltApiKey)
  const dsApiKey        = useGrammarStore((s) => s.dsApiKey)
  const setDsAnalysis   = useGrammarStore((s) => s.setDsAnalysis)
  const setDsTree       = useGrammarStore((s) => s.setDsTree)
  const setDsAnalyzing  = useGrammarStore((s) => s.setDsAnalyzing)
  const dsAnalyzing     = useGrammarStore((s) => s.dsAnalyzing)
  const treeViewOpen    = useGrammarStore((s) => s.treeViewOpen)
  const toggleTreeView  = useGrammarStore((s) => s.toggleTreeView)
  const preprocessPending  = useGrammarStore((s) => s.preprocessPending)
  const setPreprocessPending = useGrammarStore((s) => s.setPreprocessPending)
  const setRawText      = useGrammarStore((s) => s.setRawText)
  const editorMode      = useGrammarStore((s) => s.editorMode)
  const setEditorMode   = useGrammarStore((s) => s.setEditorMode)

  const analyzingRef = useRef(false)

  const runAnalysis = useCallback(async () => {
    if (!rawText.trim() || analyzingRef.current) return
    analyzingRef.current = true

    if (dsApiKey && needsPreprocessing(rawText)) {
      try {
        const { clean, changed } = await preprocessWithDeepSeek(rawText, dsApiKey)
        if (changed && clean && clean !== rawText.trim()) {
          setPreprocessPending({ original: rawText, cleaned: clean })
          analyzingRef.current = false
          return
        }
      } catch (e) { console.warn('[preprocess]', e.message) }
    }

    const result = analyzeText(rawText)
    setAnalysisResult(result)
    setEditorMode('analyzed')

    setLtLoading(true)
    checkWithLanguageTool(rawText, ltApiKey)
      .then((errors) => setLtErrors(errors))
      .catch((e) => { console.warn('LT:', e.message); setLtErrors([]) })
      .finally(() => setLtLoading(false))

    if (dsApiKey) {
      setDsAnalyzing(true)
      try {
        const { spans, tree } = await analyzeWithDeepSeek(rawText, result, dsApiKey)
        setDsAnalysis(spans)
        setDsTree(tree)
      } catch (e) { console.warn('[DS analyze]', e.message); setDsAnalysis([]); setDsTree(null) }
      finally { setDsAnalyzing(false) }

      setDsLoading(true)
      checkWithDeepSeek(rawText, dsApiKey)
        .then((errors) => setDsErrors(errors))
        .catch((e) => { console.warn('DS:', e.message); setDsErrors([]) })
        .finally(() => setDsLoading(false))
    }

    analyzingRef.current = false
  }, [rawText, dsApiKey, ltApiKey, setAnalysisResult, setLtErrors, setDsErrors,
      setLtLoading, setDsLoading, setDsAnalysis, setDsTree, setDsAnalyzing,
      setEditorMode, setPreprocessPending])

  const enterEditMode = useCallback(() => {
    setEditorMode('editing')
    setAnalysisResult([])
    setDsAnalysis([])
    setDsTree(null)
    setLtErrors([])
    setDsErrors([])
  }, [setEditorMode, setAnalysisResult, setDsAnalysis, setDsTree, setLtErrors, setDsErrors])

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
        {/* Header */}
        <header className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">En</span>
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-tight">English Grammar Highlighter</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">英语语法结构化高亮器</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {editorMode === 'editing' ? (
              <button onClick={runAnalysis} disabled={!rawText.trim() || dsAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm">
                <Play size={12} />{dsAnalyzing ? '解析中…' : '开始解析'}
              </button>
            ) : (
              <button onClick={enterEditMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-700">
                <Pencil size={12} />编辑
              </button>
            )}
            <button onClick={toggleTreeView}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${treeViewOpen ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              <Layers size={13} />语法结构
            </button>
            <Link to="/xuanxuan/episode-6" target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200">
              <BookOpen size={13} />参考文献
            </Link>
          </div>
        </header>

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            <div className="p-4 flex-shrink-0"><EditorPanel /></div>
            <TreeViewPanel />
            <div className="flex-shrink-0"><Legend /></div>
          </main>
          <aside className="w-64 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
            <ControlPanel />
          </aside>
        </div>

        <GrammarTooltip />

        {preprocessPending && (
          <PreprocessModal
            original={preprocessPending.original}
            cleaned={preprocessPending.cleaned}
            onConfirm={(text) => { setPreprocessPending(null); setRawText(text) }}
            onDismiss={() => setPreprocessPending(null)}
          />
        )}
      </div>
    </div>
  )
}
