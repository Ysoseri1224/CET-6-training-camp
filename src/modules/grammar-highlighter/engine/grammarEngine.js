import nlp from 'compromise'

export const ROLE_META = {
  subject: { label: 'Subject', zhLabel: '主语', color: '#4A90D9', desc: 'The subject is the person, place, thing, or idea that is doing or being described in the sentence.', zhDesc: '句子的执行者或话题，通常是动作的发出者。' },
  predicate: { label: 'Predicate / Verb', zhLabel: '谓语', color: '#E05C5C', desc: 'The predicate contains the verb and tells us what the subject does or is.', zhDesc: '句子的核心动作或状态，表达主语的行为或存在状态。' },
  object: { label: 'Object', zhLabel: '宾语', color: '#27AE60', desc: 'The object receives the action of the verb.', zhDesc: '动作的承受者，回答"什么"或"谁"。' },
  complement: { label: 'Complement', zhLabel: '补语', color: '#8E44AD', desc: 'A complement completes the meaning of a subject or object, often after linking verbs.', zhDesc: '补充说明主语或宾语状态，常跟在系动词之后。' },
  attributive: { label: 'Attributive / Modifier', zhLabel: '定语', color: '#F39C12', desc: 'An attributive modifier describes or limits a noun.', zhDesc: '修饰或限定名词的成分，可以是形容词、短语或从句。' },
  adverbial: { label: 'Adverbial', zhLabel: '状语', color: '#16A085', desc: 'An adverbial modifies a verb, adjective, or whole sentence.', zhDesc: '修饰动词或全句，表达时间、地点、方式、原因、目的等语义。' },
  parenthetical: { label: 'Parenthetical', zhLabel: '插入语', color: '#7F8C8D', desc: 'A parenthetical is a word or phrase inserted into a sentence as an aside.', zhDesc: '插入句中的补充说明，通常用逗号或破折号隔开。' },
  conjunction: { label: 'Conjunction', zhLabel: '连词', color: '#95A5A6', desc: 'Conjunctions connect words, phrases, or clauses.', zhDesc: '连接词、短语或从句的连接词。' },
  infinitive: { label: 'Infinitive Phrase', zhLabel: '不定式短语', color: '#D35400', desc: 'An infinitive phrase begins with "to" + verb.', zhDesc: '以 to + 动词原形构成的短语。' },
  participial: { label: 'Participial Phrase', zhLabel: '分词短语', color: '#1ABC9C', desc: 'A participial phrase uses a present or past participle to modify a noun or the whole sentence.', zhDesc: '由现在分词或过去分词构成的短语。' },
  auxiliary: { label: 'Auxiliary Verb', zhLabel: '助动词', color: '#c0392b', desc: 'Auxiliary verbs help the main verb form tense, mood, or voice.', zhDesc: '助动词，帮助主动词构成时态、语态或语气。' },
  determiner: { label: 'Determiner', zhLabel: '限定词', color: '#b8860b', desc: 'A determiner specifies the reference of a noun phrase.', zhDesc: '限定词，指定名词短语的范围。' },
}

function splitSentences(text) {
  const sentences = []
  const re = /[^.!?]+[.!?]*/g
  let match
  while ((match = re.exec(text)) !== null) {
    const raw = match[0]
    if (raw.trim().length > 0) sentences.push({ text: raw, offset: match.index })
  }
  if (sentences.length === 0 && text.trim().length > 0) sentences.push({ text, offset: 0 })
  return sentences
}

export function analyzeText(fullText) {
  if (!fullText || !fullText.trim()) return []
  const sentences = splitSentences(fullText)
  const allSpans = []
  sentences.forEach(({ text: sentText, offset }) => {
    const spans = analyzeSentence(sentText, offset)
    allSpans.push(...spans)
  })
  return allSpans
}

const SUBCLAUSE_TRIGGERS = /^(which|who|whom|whose|that|where|when|why|how|although|because|since|while|after|before|if|unless|until|though|whereas|whether|as)$/i

function analyzeSentence(sentText, globalOffset) {
  const doc = nlp(sentText)
  const terms = doc.terms().out('array')
  const json = doc.json()
  const tokens = buildTokensWithOffsets(sentText, terms)
  if (tokens.length === 0) return []
  const termData = json.flatMap((s) => s.terms || [])
  tokens.forEach((tok, i) => {
    tok.tags = termData[i]?.tags || []
    tok.normal = termData[i]?.normal || tok.text.toLowerCase()
  })
  const subClauseStarts = []
  tokens.forEach((tok, i) => {
    if (SUBCLAUSE_TRIGGERS.test(tok.text)) {
      const window = tokens.slice(i + 1, i + 9)
      const hasVerb = window.some((t) => t.tags.includes('Verb') || t.tags.includes('Auxiliary'))
      if (hasVerb) subClauseStarts.push(i)
    }
  })
  const firstSubClause = subClauseStarts.length > 0 ? subClauseStarts[0] : tokens.length
  tokens.forEach((tok) => {
    if (tok.tags.includes('Determiner') || /^(the|a|an|this|these|those|my|your|his|her|its|our|their|each|every|some|any|no|all|both|either|neither|what)$/i.test(tok.text)) {
      tok.role = 'determiner'
    }
  })
  const auxWords = /^(is|are|was|were|be|been|being|am|have|has|had|do|does|did|will|would|shall|should|may|might|must|can|could|ought|need|dare|used)$/i
  let mainVerbIdx = -1
  for (let i = 0; i < firstSubClause; i++) {
    const tok = tokens[i]
    if (tok.tags.includes('Verb') || tok.tags.includes('Auxiliary') || auxWords.test(tok.text)) {
      if (auxWords.test(tok.text) && i < firstSubClause - 1) { tok.role = 'auxiliary' }
      else if (!tok.role) { if (mainVerbIdx === -1) mainVerbIdx = i; tok.role = 'predicate' }
    }
  }
  if (mainVerbIdx > 0) {
    let k = mainVerbIdx - 1
    while (k >= 0 && tokens[k].role === 'auxiliary') { tokens[k].role = 'predicate'; k-- }
  }
  subClauseStarts.forEach((i) => { if (!tokens[i].role) tokens[i].role = 'conjunction' })
  for (let s = 0; s < subClauseStarts.length; s++) {
    const start = subClauseStarts[s] + 1
    const end = s + 1 < subClauseStarts.length ? subClauseStarts[s + 1] : tokens.length
    let subVerbIdx = -1
    for (let i = start; i < end; i++) {
      const tok = tokens[i]
      if (tok.role) continue
      if (tok.tags.includes('Verb') || tok.tags.includes('Auxiliary') || auxWords.test(tok.text)) {
        if (auxWords.test(tok.text) && i < end - 1) { tok.role = 'auxiliary' }
        else if (!tok.role) { if (subVerbIdx === -1) subVerbIdx = i; tok.role = 'predicate' }
      }
    }
    if (subVerbIdx > 0) {
      let k = subVerbIdx - 1
      while (k >= start && tokens[k].role === 'auxiliary') { tokens[k].role = 'predicate'; k-- }
    }
  }
  tokens.forEach((tok, i) => {
    if (tok.text.toLowerCase() === 'to' && !tok.role && i + 1 < tokens.length) {
      const next = tokens[i + 1]
      if (next.tags.includes('Verb') || next.tags.includes('Infinitive')) {
        tok.role = 'infinitive'; next.role = 'infinitive'
        let j = i + 2
        while (j < tokens.length && !isPunct(tokens[j].text) && !SUBCLAUSE_TRIGGERS.test(tokens[j].text)) {
          if (!tokens[j].role) tokens[j].role = 'infinitive'; j++
        }
      }
    }
  })
  tokens.forEach((tok, i) => {
    if (!tok.role && (/ing$/.test(tok.text) || /ed$/.test(tok.text)) && tok.tags.includes('Verb')) {
      const prevIsPunct = i === 0 || isPunct(tokens[i - 1]?.text)
      if (prevIsPunct) {
        tok.role = 'participial'
        let j = i + 1
        while (j < tokens.length && !isPunct(tokens[j].text) && !SUBCLAUSE_TRIGGERS.test(tokens[j].text) && tokens[j].role !== 'predicate') {
          if (!tokens[j].role) tokens[j].role = 'participial'; j++
        }
      }
    }
  })
  if (mainVerbIdx > 0) {
    let subjectEnd = mainVerbIdx
    while (subjectEnd > 0 && tokens[subjectEnd - 1].role === 'predicate') subjectEnd--
    for (let i = 0; i < subjectEnd; i++) { const tok = tokens[i]; if (!tok.role && !isPunct(tok.text)) tok.role = 'subject' }
  }
  if (mainVerbIdx >= 0) {
    const linkingVerbs = /^(is|are|was|were|be|been|am|seem|seems|seemed|appear|appears|appeared|become|becomes|became|feel|feels|felt|look|looks|looked|sound|sounds|sounded|smell|taste|remain|stay)$/i
    const isLinking = linkingVerbs.test(tokens[mainVerbIdx]?.text)
    let afterVerb = mainVerbIdx + 1
    while (afterVerb < firstSubClause && (tokens[afterVerb].role === 'predicate' || tokens[afterVerb].role === 'auxiliary')) afterVerb++
    let objectEnd = firstSubClause
    for (let i = afterVerb; i < firstSubClause; i++) { if (isPunct(tokens[i].text)) { objectEnd = i; break } }
    for (let i = afterVerb; i < objectEnd; i++) {
      const tok = tokens[i]
      if (!tok.role && !isPunct(tok.text)) tok.role = isLinking ? 'complement' : 'object'
      else if (tok.role === 'determiner' || tok.role === 'attributive') tok.role = isLinking ? 'complement' : 'object'
    }
    for (let i = objectEnd; i < firstSubClause; i++) { const tok = tokens[i]; if (!tok.role && !isPunct(tok.text)) tok.role = 'adverbial' }
  }
  for (let s = 0; s < subClauseStarts.length; s++) {
    const start = subClauseStarts[s] + 1
    const end = s + 1 < subClauseStarts.length ? subClauseStarts[s + 1] : tokens.length
    const subVerbI = tokens.slice(start, end).findIndex((t) => t.role === 'predicate')
    const subVerb = subVerbI === -1 ? -1 : start + subVerbI
    for (let i = start; i < (subVerb === -1 ? end : subVerb); i++) { if (!tokens[i].role && !isPunct(tokens[i].text)) tokens[i].role = 'attributive' }
    const afterSubVerb = subVerb === -1 ? start : subVerb + 1
    let passedObj = false
    for (let i = afterSubVerb; i < end; i++) {
      const tok = tokens[i]
      if (tok.role || isPunct(tok.text)) continue
      if (!passedObj && (tok.tags.includes('Noun') || tok.tags.includes('Pronoun') || tok.tags.includes('Determiner'))) { tok.role = 'object' }
      else { tok.role = 'adverbial'; passedObj = true }
    }
  }
  tokens.forEach((tok, i) => {
    if ((tok.role === 'subject' || tok.role === 'object' || tok.role === 'complement') && tok.tags.includes('Adjective')) {
      const nextNoun = tokens.slice(i + 1).find((t) => t.tags.includes('Noun'))
      if (nextNoun) tok.role = 'attributive'
    }
  })
  detectParentheticals(tokens)
  tokens.forEach((tok) => {
    if (!tok.role && !isPunct(tok.text)) {
      if (tok.tags.includes('Adverb')) tok.role = 'adverbial'
      else if (tok.tags.includes('Adjective')) tok.role = 'attributive'
      else if (tok.tags.includes('Preposition')) tok.role = 'adverbial'
    }
  })
  const spans = []
  tokens.forEach((tok) => {
    if (!isPunct(tok.text) && tok.role) {
      spans.push({ text: tok.text, start: globalOffset + tok.start, end: globalOffset + tok.end, role: tok.role, level: 1, detail: buildDetail(tok) })
    }
  })
  return spans
}

function buildTokensWithOffsets(text, terms) {
  const tokens = []
  let cursor = 0
  for (const term of terms) {
    const idx = text.indexOf(term, cursor)
    if (idx === -1) continue
    tokens.push({ text: term, start: idx, end: idx + term.length, role: null, tags: [], normal: term.toLowerCase() })
    cursor = idx + term.length
  }
  return tokens
}

function isPunct(text) { return /^[.,;:!?()\[\]{}"'`—\-–]+$/.test(text) }

function detectParentheticals(tokens) {
  let commaStack = []
  tokens.forEach((tok, i) => {
    if (tok.text === ',') {
      if (commaStack.length > 0) {
        const start = commaStack[commaStack.length - 1]
        const group = tokens.slice(start + 1, i)
        const hasVerb = group.some((t) => t.tags.includes('Verb'))
        const hasConj = group.some((t) => t.role === 'conjunction')
        if (!hasVerb && !hasConj && group.length >= 1 && group.length <= 6) { group.forEach((t) => { t.role = 'parenthetical' }) }
        commaStack.pop()
      } else { commaStack.push(i) }
    }
  })
}

function buildDetail(tok) {
  const meta = ROLE_META[tok.role]
  if (!meta) return {}
  return { role: tok.role, label: meta.zhLabel, enLabel: meta.label, desc: meta.zhDesc, enDesc: meta.desc, tags: tok.tags, word: tok.text }
}
