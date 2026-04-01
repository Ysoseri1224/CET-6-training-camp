import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllEpisodes } from '../utils/episodeLoader'
import { BookMarked, Calendar, Tag, ArrowRight, Search } from 'lucide-react'

export default function XuanXuan() {
  const episodes = useMemo(() => getAllEpisodes(), [])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')

  const allTags = useMemo(() => {
    const tagSet = new Set()
    episodes.forEach(ep => ep.tags.forEach(t => tagSet.add(t)))
    return Array.from(tagSet)
  }, [episodes])

  const filtered = useMemo(() => {
    return episodes.filter(ep => {
      const matchSearch = !search || ep.title.includes(search) || ep.summary.includes(search) || ep.content.includes(search)
      const matchTag = !activeTag || ep.tags.includes(activeTag)
      return matchSearch && matchTag
    })
  }, [episodes, search, activeTag])

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <BookMarked size={28} className="text-rose-600" />轩轩小课堂
        </h1>
        <p className="text-gray-500 text-lg">英语学习笔记，解析词根词缀、短语辨析与语境用法。每期聚焦几个高频词。</p>
      </div>

      {/* Search + filter */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input-field pl-10"
            style={{ color: '#111827' }}
            placeholder="搜索标题或内容…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTag('')}
            className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
              !activeTag
                ? 'bg-rose-50 border-rose-400 text-rose-700'
                : 'border-gray-300 text-gray-500 hover:border-gray-500'
            }`}
          >
            全部
          </button>
          {allTags.map(t => (
            <button
              key={t}
              onClick={() => setActiveTag(t === activeTag ? '' : t)}
              className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                activeTag === t
                  ? 'bg-rose-50 border-rose-400 text-rose-700'
                  : 'border-gray-300 text-gray-500 hover:border-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Episode list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookMarked size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">没有找到匹配的内容</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(ep => (
            <Link
              key={ep.slug}
              to={`/xuanxuan/${ep.slug}`}
              className="card-hover group flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <span className="tag tag-red font-semibold text-sm flex-shrink-0">
                      第 {ep.episode} 期
                    </span>
                    <h2 className="font-semibold text-gray-900 text-xl leading-snug">{ep.title}</h2>
                  </div>
                  {ep.summary && <p className="text-base text-gray-500 leading-relaxed line-clamp-2">{ep.summary}</p>}
                </div>
                <ArrowRight size={18} className="text-gray-300 group-hover:text-rose-500 transition-colors flex-shrink-0 mt-1" />
              </div>

              <div className="flex items-center gap-4">
                {ep.date && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Calendar size={13} />{ep.date}
                  </span>
                )}
                {ep.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag size={13} className="text-gray-400" />
                    {ep.tags.map(t => (
                      <span key={t} className="text-sm text-gray-500">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
