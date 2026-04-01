import React, { useState, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Zap, PenTool, Search, BookOpen, AlignLeft, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/word-translation', icon: AlignLeft, label: '逐词翻译' },
  { to: '/grammar-highlighter', icon: Zap, label: '语法高亮器' },
  { to: '/writing-studio', icon: PenTool, label: '写作训练' },
  { to: '/daily-sentences', icon: Search, label: '100句日推' },
  { to: '/xuanxuan', icon: BookOpen, label: '轩轩小课堂' },
]

function SidebarContent({ onNavClick }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">六</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base leading-tight">CET-6 训练营</p>
            <p className="text-xs text-gray-400 leading-tight mt-0.5">英语提升计划</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">v1.0 · 六级备考助手</p>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Desktop sidebar (lg+) ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ──────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={closeDrawer}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={closeDrawer}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <X size={20} />
        </button>
        <SidebarContent onNavClick={closeDrawer} />
      </aside>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-60">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">六</span>
            </div>
            <span className="font-semibold text-gray-900 text-base">CET-6 训练营</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
