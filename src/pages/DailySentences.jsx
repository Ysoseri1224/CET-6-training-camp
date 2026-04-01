import React, { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, BookOpen, Search, Calendar, Star } from 'lucide-react'
import sentencesData from '../data/cet6Sentences.json'
import WordLookup from './WordLookup'
import {
  getTodaySentences,
  getUpcomingSentences,
  getMasteredSentences,
  review,
  getUnlockedCount,
} from '../utils/ebbinghaus'

// ── Sentence card ─────────────────────────────────────────────────────────────

function SentenceCard({ sentence, onRate, isReviewed }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`card transition-opacity duration-300 ${isReviewed ? 'opacity-50' : ''}`}>
      {/* Top row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tag tag-blue font-semibold">#{sentence.id}</span>
          {isReviewed && <span className="tag tag-green">✓ 已复习</span>}
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
          title={expanded ? '收起详情' : '展开详情'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* English */}
      <p className="text-gray-900 font-medium text-lg leading-relaxed mb-2">
        {sentence.en}
      </p>

      {/* Chinese */}
      <p className="text-gray-500 text-base leading-relaxed">
        {sentence.zh}
      </p>

      {/* Expandable details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {sentence.grammar && (
            <div>
              <p className="section-title">语法笔记</p>
              <p className="text-base text-gray-700 leading-relaxed">{sentence.grammar}</p>
            </div>
          )}
          {sentence.coreWords && (
            <div>
              <p className="section-title">核心词表</p>
              <p className="text-base text-gray-600 leading-relaxed">{sentence.coreWords}</p>
            </div>
          )}
          {sentence.themeTitle && (
            <div>
              <p className="section-title">{sentence.themeTitle}</p>
              <p className="text-base text-gray-600 leading-relaxed">{sentence.themeWords}</p>
            </div>
          )}
        </div>
      )}

      {/* Rating buttons */}
      {!isReviewed && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => onRate(sentence.id, 0)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
          >
            ✗ 忘了
          </button>
          <button
            onClick={() => onRate(sentence.id, 2)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            △ 模糊
          </button>
          <button
            onClick={() => onRate(sentence.id, 4)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            ✓ 记住了
          </button>
        </div>
      )}
    </div>
  )
}

// ── Collapsible section ───────────────────────────────────────────────────────

function Section({ title, count, children, defaultOpen = true, icon: Icon }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full mb-4 group"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-gray-400" />}
          <h2 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {count} 条
          </span>
          {open
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />
          }
        </div>
      </button>
      {open && children}
    </div>
  )
}

// ── Daily tab ─────────────────────────────────────────────────────────────────

function DailyTab() {
  const [todaySentences, setTodaySentences]   = useState([])
  const [upcoming, setUpcoming]               = useState([])
  const [mastered, setMastered]               = useState([])
  const [reviewedIds, setReviewedIds]         = useState(() => new Set())

  const refresh = useCallback(() => {
    setTodaySentences(getTodaySentences(sentencesData))
    setUpcoming(getUpcomingSentences(sentencesData))
    setMastered(getMasteredSentences(sentencesData))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleRate = useCallback((id, quality) => {
    review(id, quality)
    setReviewedIds(prev => new Set([...prev, id]))
    setTimeout(refresh, 300)
  }, [refresh])

  const unreviewed = todaySentences.filter(s => !reviewedIds.has(s.id))
  const reviewed   = todaySentences.filter(s => reviewedIds.has(s.id))
  const allDoneToday = todaySentences.length > 0 && unreviewed.length === 0

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-10">
        <span className="tag tag-blue mb-3 inline-flex">今日 100 句复习</span>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">按艾宾浩斯节奏推进复习</h1>
        <p className="text-gray-500 text-base">
          已解锁 <span className="font-semibold text-gray-700">{getUnlockedCount()}</span> / 100 句 · 倒序推进（第 100 句开始）
        </p>
      </div>

      {/* All-done banner */}
      {allDoneToday && (
        <div className="card bg-emerald-50 border-emerald-200 mb-8 flex items-center gap-3">
          <Star size={20} className="text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-700 font-medium">今日句子全部复习完毕，明天继续！</p>
        </div>
      )}

      {/* Today's sentences */}
      <Section title="今日句子" count={todaySentences.length} icon={Calendar} defaultOpen>
        {todaySentences.length === 0 ? (
          <div className="card text-gray-400 text-base py-8 text-center leading-relaxed">
            今天没有到期句子，可以先去查词或回顾课堂文章。
          </div>
        ) : (
          <div className="space-y-4">
            {unreviewed.map(s => (
              <SentenceCard key={s.id} sentence={s} onRate={handleRate} isReviewed={false} />
            ))}
            {reviewed.map(s => (
              <SentenceCard key={s.id} sentence={s} onRate={handleRate} isReviewed />
            ))}
          </div>
        )}
      </Section>

      {/* Upcoming */}
      <Section title="待后续复习" count={upcoming.length} defaultOpen={false}>
        {upcoming.length === 0 ? (
          <div className="card text-gray-400 text-base py-8 text-center">
            当前没有排队中的后续复习句子。
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map(s => (
              <SentenceCard key={s.id} sentence={s} onRate={handleRate} isReviewed={false} />
            ))}
          </div>
        )}
      </Section>

      {/* Mastered */}
      <Section title="已掌握句子" count={mastered.length} icon={Star} defaultOpen={false}>
        {mastered.length === 0 ? (
          <div className="card text-gray-400 text-base py-8 text-center">
            当前还没有进入"已掌握"阶段的句子。
          </div>
        ) : (
          <div className="space-y-4">
            {mastered.map(s => (
              <SentenceCard key={s.id} sentence={s} onRate={handleRate} isReviewed={false} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DailySentences() {
  const [tab, setTab] = useState('daily')

  return (
    <div>
      {/* Sticky tab bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-1 py-2">
          <button
            onClick={() => setTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'daily'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={15} />100句日推
          </button>
          <button
            onClick={() => setTab('lookup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'lookup'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Search size={15} />单词速查
          </button>
        </div>
      </div>

      {tab === 'daily'  && <DailyTab />}
      {tab === 'lookup' && <WordLookup />}
    </div>
  )
}
