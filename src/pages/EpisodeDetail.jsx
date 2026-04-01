import React, { useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getEpisodeBySlug } from '../utils/episodeLoader'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Calendar, Tag, BookMarked } from 'lucide-react'

export default function EpisodeDetail() {
  const { id } = useParams()
  const episode = useMemo(() => getEpisodeBySlug(id), [id])

  if (!episode) return <Navigate to="/xuanxuan" replace />

  return (
    <div className="page-container">
      {/* Back link */}
      <Link to="/xuanxuan" className="inline-flex items-center gap-2 text-base text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium">
        <ArrowLeft size={16} /> 返回轩轩小课堂
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="tag tag-red font-semibold">
            第 {episode.episode} 期
          </span>
          {episode.date && (
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <Calendar size={13} />{episode.date}
            </span>
          )}
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-snug">
          {episode.title}
        </h1>
        {episode.summary && (
          <p className="text-gray-500 text-xl leading-relaxed border-l-4 border-rose-400 pl-5 bg-rose-50 py-3 rounded-r-xl">
            {episode.summary}
          </p>
        )}
        {episode.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <Tag size={15} className="text-gray-400" />
            {episode.tags.map(t => (
              <span key={t} className="tag tag-gray">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Markdown content */}
      <article className="prose-article">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mt-10 mb-5 leading-tight">{children}</h1>,
            h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{children}</h3>,
            p: ({ children }) => {
              const hasBlock = React.Children.toArray(children).some(
                c => React.isValidElement(c) && (c.type === 'pre' || c.type === 'div')
              )
              return hasBlock
                ? <div className="mb-5 text-gray-700 leading-relaxed">{children}</div>
                : <p className="mb-5 text-gray-700 leading-relaxed text-lg">{children}</p>
            },
            strong: ({ children }) => <strong className="text-gray-900 font-semibold">{children}</strong>,
            em: ({ children }) => <em className="text-indigo-700 not-italic font-medium">{children}</em>,
            pre: ({ children }) => <pre className="bg-gray-900 text-gray-100 rounded-xl p-5 my-5 overflow-x-auto text-sm">{children}</pre>,
            code: ({ children, className }) => className
              ? <code className="text-sm font-mono text-gray-100">{children}</code>
              : <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-base font-mono">{children}</code>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-rose-400 pl-5 my-5 text-gray-600 italic bg-rose-50 py-3 rounded-r-lg">{children}</blockquote>,
            ul: ({ children }) => <ul className="list-disc list-outside mb-5 space-y-2 pl-6 text-gray-700">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-outside mb-5 space-y-2 pl-6 text-gray-700">{children}</ol>,
            li: ({ children }) => <li className="text-gray-700 leading-relaxed text-lg">{children}</li>,
            hr: () => <hr className="border-gray-200 my-10" />,
            a: ({ href, children }) => <a href={href} className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>,
            table: ({ children }) => <div className="overflow-x-auto my-5"><table className="w-full border-collapse text-base">{children}</table></div>,
            th: ({ children }) => <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left text-gray-700 font-semibold">{children}</th>,
            td: ({ children }) => <td className="border border-gray-200 px-4 py-2 text-gray-700">{children}</td>,
          }}
        >
          {episode.content}
        </ReactMarkdown>
      </article>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <Link to="/xuanxuan" className="inline-flex items-center gap-2 text-base text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <BookMarked size={16} /> 查看更多期
        </Link>
      </div>
    </div>
  )
}
