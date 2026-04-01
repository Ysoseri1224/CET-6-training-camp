import React from 'react'
import { Link } from 'react-router-dom'
import { AlignLeft, Zap, PenTool, Search, BookOpen, ArrowRight } from 'lucide-react'

const MODULES = [
  {
    to: '/word-translation',
    icon: AlignLeft,
    title: '逐词翻译法训练',
    desc: '输入中文句子，AI 切分词组并给出语法模式提示，逐词翻译后综合评分。',
    accent: 'bg-blue-50 border-blue-200 text-blue-700',
    dot: 'bg-blue-500',
    badge: 'GPT',
  },
  {
    to: '/grammar-highlighter',
    icon: Zap,
    title: '英语语法高亮器',
    desc: '粘贴英文段落，自动高亮主谓宾定状补，DeepSeek AI 生成可视化语法结构树。',
    accent: 'bg-violet-50 border-violet-200 text-violet-700',
    dot: 'bg-violet-500',
    badge: 'DeepSeek',
  },
  {
    to: '/writing-studio',
    icon: PenTool,
    title: '写作素材库',
    desc: '收录高分句型模板，AI 辅助扩写，按话题分类，一键生成段落框架。',
    accent: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    dot: 'bg-emerald-500',
    badge: 'GPT',
  },
  {
    to: '/word-lookup',
    icon: Search,
    title: '六级单词速查',
    desc: '查询 CET-6 核心词汇，英文释义 + AI 中文翻译，标注词根词缀辅助记忆。',
    accent: 'bg-amber-50 border-amber-200 text-amber-700',
    dot: 'bg-amber-500',
    badge: 'DeepSeek',
  },
  {
    to: '/xuanxuan',
    icon: BookOpen,
    title: '轩轩小课堂',
    desc: '博客风格英语学习笔记，解析词根词缀、短语辨析与语境用法，持续更新。',
    accent: 'bg-rose-50 border-rose-200 text-rose-700',
    dot: 'bg-rose-500',
    badge: '博客',
  },
]

export default function Home() {
  return (
    <div className="page-container-wide">
      {/* Hero */}
      <div className="mb-10 pt-2">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">CET-6 训练营</h1>
        <p className="text-gray-500 text-xl leading-relaxed max-w-2xl">
          五大模块，系统提升六级英语读写能力。AI 驱动，随时学习。
        </p>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {MODULES.map(({ to, icon: Icon, title, desc, accent, dot, badge }) => (
          <Link
            key={to}
            to={to}
            className="group card-hover flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${accent}`}>
                <Icon size={20} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs font-medium text-gray-400">{badge}</span>
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg mb-1">{title}</h2>
              <p className="text-base text-gray-500 leading-relaxed">{desc}</p>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm font-medium group-hover:text-gray-900 group-hover:gap-2 transition-all mt-auto pt-2">
              进入模块 <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>

      {/* Note */}
      <div className="mt-10 p-5 rounded-2xl bg-gray-100 border border-gray-200">
        <p className="text-sm text-gray-500 leading-relaxed">
          💡 API Keys 已在 <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs">.env</code> 中配置，无需手动输入。部署到 Netlify 时，在 Site Settings → Environment Variables 中填入相同变量即可。
        </p>
      </div>
    </div>
  )
}
