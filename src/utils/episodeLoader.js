/**
 * Episode loader using Vite's import.meta.glob
 *
 * To add a new episode:
 *   1. Create a .md file in src/data/episodes/
 *   2. Add YAML frontmatter at the top (see existing episodes for format)
 *   3. Done — it will be auto-detected on next build/HMR
 *
 * Frontmatter fields:
 *   title: string
 *   date: string (YYYY-MM-DD)
 *   episode: number
 *   tags: string[]
 *   summary: string
 */

const episodeFiles = import.meta.glob('../data/episodes/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function parseFrontmatter(raw) {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return { meta: {}, content: raw }

  const fmStr = fmMatch[1]
  const content = raw.slice(fmMatch[0].length).trim()
  const meta = {}

  fmStr.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()

    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    } else if (!isNaN(Number(value)) && value !== '') {
      meta[key] = Number(value)
    } else {
      meta[key] = value.replace(/^['"]|['"]$/g, '')
    }
  })

  return { meta, content }
}

function slugFromPath(path) {
  return path.replace(/^.*\//, '').replace(/\.md$/, '')
}

export function getAllEpisodes() {
  return Object.entries(episodeFiles)
    .map(([path, raw]) => {
      const { meta, content } = parseFrontmatter(raw)
      const slug = slugFromPath(path)
      return {
        slug,
        title: meta.title || slug,
        date: meta.date || '',
        episode: meta.episode || 0,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        summary: meta.summary || '',
        content,
      }
    })
    .sort((a, b) => b.episode - a.episode)
}

export function getEpisodeBySlug(slug) {
  return getAllEpisodes().find(ep => ep.slug === slug) || null
}
