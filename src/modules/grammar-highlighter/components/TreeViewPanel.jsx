import React, { useRef, useState, useCallback } from 'react'
import { useGrammarStore } from '../store/grammarStore'

const ROLE_COLOR = {
  predicate: '#E05C5C', subject: '#4A90D9', object: '#27AE60', complement: '#8E44AD',
  attributive: '#F39C12', adverbial: '#16A085', infinitive: '#D35400', participial: '#1ABC9C',
  parenthetical: '#7F8C8D', conjunction: '#95A5A6', auxiliary: '#c0392b', determiner: '#b8860b',
}

function DisplayLine({ display, role, hasChildren, isLast }) {
  const color = ROLE_COLOR[role] || '#94a3b8'
  const dim = '#94a3b8'
  const d = display || ''
  const Dim = ({ children }) => <span style={{ color: dim }}>{children}</span>
  const Main = ({ children }) => <span style={{ color }} className="font-medium">{children}</span>

  if (d.startsWith('#')) return (<><span style={{ color: dim }} className="italic select-none">#</span><span style={{ color: '#a78bfa' }} className="italic">{d.slice(1)}</span>{hasChildren && <span style={{ color: dim }} className="ml-2">{'{'}</span>}{!hasChildren && !isLast && <Dim>,</Dim>}</>)
  if (d.startsWith('@')) return (<><span style={{ color: dim }} className="select-none">@</span><span style={{ color: '#f59e0b' }} className="font-medium">{d.slice(1)}</span>{!isLast && <Dim>,</Dim>}</>)
  if (/^<[^>]+>$/.test(d)) return (<><span style={{ color: '#f59e0b' }}>{d}</span>{!isLast && <Dim>,</Dim>}</>)
  if (d.startsWith('{') && d.endsWith('}')) return (<><Dim>{'{ '}</Dim><span style={{ color }} className="font-medium">{d.slice(1, -1).trim()}</span><Dim>{' }'}</Dim>{!isLast && <Dim>,</Dim>}</>)

  const decorMatch = d.match(/^\[([^\]]+)\](.+)$/)
  if (decorMatch) {
    const paramMatch = decorMatch[2].match(/^([^(]+)\(([^)]*)\)$/)
    return (<><Dim>[</Dim><span style={{ color: '#c0392b' }}>{decorMatch[1]}</span><Dim>]</Dim>{paramMatch ? <><Main>{paramMatch[1].trim()}</Main><Dim>(</Dim><span style={{ color: dim }}>{paramMatch[2]}</span><Dim>)</Dim></> : <Main>{decorMatch[2]}</Main>}{hasChildren && <Dim> (</Dim>}{!isLast && !hasChildren && <Dim>,</Dim>}</>)
  }

  if (d.startsWith(',')) return (<><Dim>,</Dim><span style={{ color: '#16A085' }} className="font-medium">{d.slice(1)}</span>{hasChildren && <Dim> (</Dim>}{!isLast && !hasChildren && <Dim>,</Dim>}</>)
  if (d.includes(' | ')) {
    const parts = d.split(' | ')
    return (<>{parts.map((part, i) => (<React.Fragment key={i}><Main>{part}</Main>{i < parts.length - 1 && <Dim> | </Dim>}</React.Fragment>))}{hasChildren && <Dim> (</Dim>}{!isLast && !hasChildren && <Dim>,</Dim>}</>)
  }
  if (d.includes(' → ')) { const [left, right] = d.split(' → '); return (<><Main>{left}</Main><Dim> → </Dim><span style={{ color: '#27AE60' }}>{right}</span>{!isLast && <Dim>,</Dim>}</>) }

  const ptrMatch = d.match(/^(.+?)\s*=\s*(.+?)\s*\($/)
  if (ptrMatch) return (<><Main>{ptrMatch[1]}</Main><Dim> = </Dim><span style={{ color: '#4A90D9' }} className="font-medium">{ptrMatch[2]}</span><Dim> (</Dim></>)

  const aliasMatch = d.match(/^(.+?)\s*\(=\s*(.+?)\)(.*)$/)
  if (aliasMatch) return (<><Main>{aliasMatch[1].trim()}</Main><Dim> (= </Dim><span style={{ color: dim }}>{aliasMatch[2]}</span><Dim>)</Dim>{aliasMatch[3]}{hasChildren && <Dim> (</Dim>}{!isLast && !hasChildren && <Dim>,</Dim>}</>)

  const containerMatch = d.match(/^(.+?)\s*\(([^)]*)\)\s*$/)
  if (containerMatch) return (<><Main>{containerMatch[1].trim()}</Main><Dim> (</Dim>{containerMatch[2].trim() && <span style={{ color: dim }}>{containerMatch[2].trim()}</span>}<Dim>)</Dim>{!isLast && !hasChildren && <Dim>,</Dim>}</>)

  if (d.endsWith('(')) return (<><Main>{d.slice(0, -1).trim()}</Main><Dim> (</Dim></>)
  if (d.startsWith('= ')) return (<><Dim>= </Dim><span style={{ color: '#4A90D9' }} className="font-medium">{d.slice(2)}</span>{!isLast && <Dim>,</Dim>}</>)

  return (<><Main>{d}</Main>{hasChildren && <Dim> (</Dim>}{!isLast && !hasChildren && <Dim>,</Dim>}</>)
}

function DSNode({ node, isLast = true, depth = 0 }) {
  if (!node) return null
  const display = (node.display || node.phrase || '').trim()
  const comment = node.comment || ''
  const children = Array.isArray(node.children) ? node.children.filter(Boolean) : []
  const hasChildren = children.length > 0
  if (!display && !hasChildren) return null
  const isFronted = display.startsWith('#')
  const isClosedContainer = hasChildren && /\([^)]*\)\s*$/.test(display) && !display.endsWith('(')
  const isOpenContainer = display.endsWith('(')
  const isImplicit = hasChildren && !isClosedContainer && !isOpenContainer && !isFronted
  const opensContainer = hasChildren && !isFronted && (isOpenContainer || isImplicit || display.startsWith(',') || node.role === 'conjunction')
  const dim = '#94a3b8'
  return (
    <div className="leading-7">
      <div className="flex items-baseline flex-wrap gap-0">
        <DisplayLine display={display} role={node.role} hasChildren={hasChildren && !isClosedContainer} isLast={isLast} />
        {comment && <span className="text-slate-400 dark:text-slate-500 ml-3 text-xs select-none font-normal not-italic">{'// '}{comment}</span>}
      </div>
      {hasChildren && <div style={{ paddingLeft: '1.75rem' }}>{children.map((child, i) => <DSNode key={i} node={child} isLast={i === children.length - 1} depth={depth + 1} />)}</div>}
      {isFronted && hasChildren && <div><span style={{ color: dim }}>{'}'}</span>{!isLast && <span style={{ color: dim }}>,</span>}</div>}
      {opensContainer && <div><span style={{ color: dim }}>)</span>{!isLast && <span style={{ color: dim }}>,</span>}</div>}
    </div>
  )
}

const MIN_H_DEFAULT = 160
const MIN_H_LIMIT = 60

export default function TreeViewPanel() {
  const treeViewOpen = useGrammarStore((s) => s.treeViewOpen)
  const dsTree = useGrammarStore((s) => s.dsTree)
  const dsAnalyzing = useGrammarStore((s) => s.dsAnalyzing)
  const rawText = useGrammarStore((s) => s.rawText)
  const [minH, setMinH] = useState(MIN_H_DEFAULT)
  const dragState = useRef(null)

  const onDragStart = useCallback((e) => {
    e.preventDefault()
    dragState.current = { startY: e.clientY, startMinH: minH }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ns-resize'
    const onMove = (ev) => { const delta = dragState.current.startY - ev.clientY; setMinH(Math.max(MIN_H_LIMIT, dragState.current.startMinH + delta)) }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); document.body.style.userSelect = ''; document.body.style.cursor = ''; dragState.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [minH])

  if (!treeViewOpen) return null
  const hasText = rawText.trim().length > 0

  return (
    <div className="flex-1 min-h-0 border-t border-slate-200 dark:border-slate-700 flex flex-col">
      <div onMouseDown={onDragStart} className="h-1.5 flex items-center justify-center cursor-ns-resize bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group flex-shrink-0" title="拖动调整最小高度">
        <div className="w-8 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-colors" />
      </div>
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">语法结构 · Syntax Tree</span>
        {dsAnalyzing && <span className="flex items-center gap-1 text-xs text-purple-500 dark:text-purple-400 select-none"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse inline-block" />AI 分析中</span>}
      </div>
      <div style={{ minHeight: minH }} className="flex-1 overflow-y-auto px-6 py-4 font-mono text-sm bg-[#f8f9fa] dark:bg-[#0d1117] text-slate-800 dark:text-slate-200">
        {dsTree
          ? Array.isArray(dsTree)
            ? dsTree.map((node, i) => <DSNode key={i} node={node} isLast={i === dsTree.length - 1} depth={0} />)
            : <DSNode node={dsTree} isLast={true} depth={0} />
          : <p className={`text-slate-400 dark:text-slate-600 text-center py-6 font-sans text-xs ${dsAnalyzing ? 'animate-pulse' : ''}`}>{!hasText ? '输入句子后显示语法结构' : dsAnalyzing ? 'AI 正在分析语法结构…' : '等待分析结果…'}</p>
        }
      </div>
    </div>
  )
}
