import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import WordTranslation from './pages/WordTranslation'
import GrammarHighlighter from './pages/GrammarHighlighter'
import WritingStudio from './pages/WritingStudio'
import WordLookup from './pages/WordLookup'
import DailySentences from './pages/DailySentences'
import XuanXuan from './pages/XuanXuan'
import EpisodeDetail from './pages/EpisodeDetail'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/word-translation" element={<WordTranslation />} />
        <Route path="/grammar-highlighter" element={<GrammarHighlighter />} />
        <Route path="/writing-studio" element={<WritingStudio />} />
        <Route path="/daily-sentences" element={<DailySentences />} />
        <Route path="/word-lookup" element={<WordLookup />} />
        <Route path="/xuanxuan" element={<XuanXuan />} />
        <Route path="/xuanxuan/:id" element={<EpisodeDetail />} />
      </Routes>
    </Layout>
  )
}
