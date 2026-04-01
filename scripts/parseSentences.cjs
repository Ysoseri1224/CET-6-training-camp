/**
 * parseSentences.js
 * 将 cet6-100sentences.txt 解析为结构化 JSON
 * 运行：node scripts/parseSentences.js
 */

const fs = require('fs')
const path = require('path')

const INPUT = path.resolve(__dirname, '../../CET-6/extracted/cet6-100sentences.txt')
const OUTPUT = path.resolve(__dirname, '../src/data/cet6Sentences.json')

const raw = fs.readFileSync(INPUT, 'utf-8')

// 将文本按 "Sentence XX" 分块
const sentenceBlocks = raw.split(/(?=Sentence \d+\n)/)

const sentences = []

for (const block of sentenceBlocks) {
  const headerMatch = block.match(/^Sentence (\d+)\n/)
  if (!headerMatch) continue

  const id = parseInt(headerMatch[1], 10)
  const rest = block.slice(headerMatch[0].length)

  // 拆分各段落（按已知标题拆分）
  const grammarIdx   = rest.indexOf('语法笔记')
  const coreIdx      = rest.indexOf('核心词表')
  const themeIdx     = rest.indexOf('主题归纳')

  // 句子部分（在语法笔记之前）
  const sentencePart = grammarIdx !== -1 ? rest.slice(0, grammarIdx) : rest

  // 提取英文 + 中文：英文在前，中文紧跟（中文以汉字开头的连续部分）
  // 先把句子部分 normalise 成一行
  const sentenceClean = sentencePart.replace(/\n+/g, ' ').trim()

  // 匹配模式：英文句（到第一个汉字为止）| 中文部分
  const splitMatch = sentenceClean.match(/^([\s\S]*?)([\u4e00-\u9fff][\s\S]*)$/)
  let en = sentenceClean
  let zh = ''
  if (splitMatch) {
    en = splitMatch[1].trim()
    zh = splitMatch[2].trim()
  }

  // 清理英文中可能存在的换行空格
  en = en.replace(/\s+/g, ' ').trim()
  zh = zh.replace(/\s+/g, ' ').trim()

  // 语法笔记
  let grammar = ''
  if (grammarIdx !== -1) {
    const grammarEnd = coreIdx !== -1 ? coreIdx : (themeIdx !== -1 ? themeIdx : rest.length)
    grammar = rest.slice(grammarIdx + '语法笔记'.length, grammarEnd)
      .replace(/\n+/g, ' ').trim()
  }

  // 核心词表
  let coreWords = ''
  if (coreIdx !== -1) {
    const coreEnd = themeIdx !== -1 ? themeIdx : rest.length
    coreWords = rest.slice(coreIdx + '核心词表'.length, coreEnd)
      .replace(/\n+/g, ' ').trim()
  }

  // 主题归纳
  let themeTitle = ''
  let themeWords = ''
  if (themeIdx !== -1) {
    const themeContent = rest.slice(themeIdx + '主题归纳'.length).trim()
    // 主题标题通常是第一行（"与"XXX"有关的词"）
    const themeLines = themeContent.split('\n')
    const titleLine = themeLines.find(l => l.trim().startsWith('与') || l.trim().startsWith('"'))
    if (titleLine) {
      themeTitle = titleLine.trim()
      themeWords = themeContent.slice(themeContent.indexOf(titleLine) + titleLine.length)
        .replace(/\n+/g, ' ').trim()
    } else {
      themeWords = themeContent.replace(/\n+/g, ' ').trim()
    }
  }

  sentences.push({ id, en, zh, grammar, coreWords, themeTitle, themeWords })
}

// 按 id 排序
sentences.sort((a, b) => a.id - b.id)

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, JSON.stringify(sentences, null, 2), 'utf-8')

console.log(`✓ 解析完成：共 ${sentences.length} 条，已写入 ${OUTPUT}`)
sentences.slice(0, 2).forEach(s => {
  console.log(`\n--- Sentence ${s.id} ---`)
  console.log('EN:', s.en.slice(0, 80))
  console.log('ZH:', s.zh.slice(0, 60))
  console.log('Grammar:', s.grammar.slice(0, 60))
})
