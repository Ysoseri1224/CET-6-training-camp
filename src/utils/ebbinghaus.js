/**
 * ebbinghaus.js — SM-2 spaced repetition for CET-6 sentences
 *
 * Progress stored in localStorage under 'cet6_srs'.
 * Start date stored under 'cet6_srs_start'.
 *
 * Card record: { repetitions, interval, ef, nextReview, lastReview, firstSeen }
 * quality:  0 = 忘了 | 2 = 模糊 | 4 = 记住了
 */

const SRS_KEY   = 'cet6_srs'
const START_KEY = 'cet6_srs_start'

// ── helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(iso1, iso2) {
  return Math.floor((new Date(iso2) - new Date(iso1)) / 86_400_000)
}

// ── storage ───────────────────────────────────────────────────────────────────

export function getProgress() {
  try { return JSON.parse(localStorage.getItem(SRS_KEY) || '{}') } catch { return {} }
}

function saveProgress(data) {
  localStorage.setItem(SRS_KEY, JSON.stringify(data))
}

// ── unlock schedule ───────────────────────────────────────────────────────────

/** Return or initialise the start date. */
export function getStartDate() {
  let s = localStorage.getItem(START_KEY)
  if (!s) { s = todayStr(); localStorage.setItem(START_KEY, s) }
  return s
}

/**
 * How many sentences have been unlocked so far.
 * Day 0 → 1 sentence unlocked, Day 1 → 2, …, Day 99 → 100.
 */
export function getUnlockedCount() {
  return Math.min(100, daysBetween(getStartDate(), todayStr()) + 1)
}

/**
 * IDs of unlocked sentences (倒序: 100, 99, 98, …).
 */
export function getUnlockedIds() {
  const count = getUnlockedCount()
  return Array.from({ length: count }, (_, i) => 100 - i)
}

// ── SM-2 algorithm ────────────────────────────────────────────────────────────

function sm2(card, quality) {
  let { repetitions = 0, interval = 1, ef = 2.5 } = card

  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0)      interval = 1
    else if (repetitions === 1) interval = 6
    else                        interval = Math.round(interval * ef)
    repetitions += 1
  }

  ef = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  return { repetitions, interval, ef, nextReview: addDays(interval) }
}

// ── public API ────────────────────────────────────────────────────────────────

/** Record a review and persist. */
export function review(id, quality) {
  const progress = getProgress()
  const card = progress[id] ?? { repetitions: 0, interval: 1, ef: 2.5 }
  progress[id] = {
    ...card,
    ...sm2(card, quality),
    lastReview: todayStr(),
    firstSeen:  card.firstSeen ?? todayStr(),
  }
  saveProgress(progress)
}

/** A sentence is considered mastered when reviewed ≥ 5 times with EF ≥ 2.0. */
function isMastered(card) {
  return card && card.repetitions >= 5 && card.ef >= 2.0
}

/** Sentences due for review today (nextReview ≤ today, or never seen). */
export function getTodaySentences(sentences) {
  const progress  = getProgress()
  const unlocked  = new Set(getUnlockedIds())
  const t = todayStr()

  return sentences
    .filter(s => unlocked.has(s.id))
    .filter(s => {
      const c = progress[s.id]
      if (!c) return true               // newly unlocked — show today
      if (isMastered(c)) return false
      return c.nextReview <= t
    })
    .sort((a, b) => a.id - b.id)
}

/** Sentences unlocked but scheduled for a future date (not yet mastered). */
export function getUpcomingSentences(sentences) {
  const progress = getProgress()
  const unlocked = new Set(getUnlockedIds())
  const t = todayStr()

  return sentences
    .filter(s => unlocked.has(s.id))
    .filter(s => {
      const c = progress[s.id]
      return c && c.nextReview > t && !isMastered(c)
    })
    .sort((a, b) => (progress[a.id]?.nextReview ?? '').localeCompare(progress[b.id]?.nextReview ?? ''))
}

/** Sentences that have reached the mastered threshold. */
export function getMasteredSentences(sentences) {
  const progress = getProgress()
  const unlocked = new Set(getUnlockedIds())

  return sentences
    .filter(s => unlocked.has(s.id) && isMastered(progress[s.id]))
    .sort((a, b) => b.id - a.id)
}
