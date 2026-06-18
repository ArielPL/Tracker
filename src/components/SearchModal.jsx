import { useState, useEffect, useRef } from 'react'
import { useTrackerContext } from '../context/TrackerContext'
import { parseDate, weekNumber } from '../utils/dates'

const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_S   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatResultDate(dateKey, scope) {
  if (!dateKey || scope === 'year') return dateKey ?? 'Annual'
  if (scope === 'week') return `W${weekNumber(dateKey)}`
  if (scope === 'month') {
    const d = parseDate(dateKey)
    return `${MONTHS_S[d.getMonth()]} ${d.getFullYear()}`
  }
  // day scope
  const d = parseDate(dateKey)
  return `${DAYS_S[d.getDay()]} ${d.getDate()} ${MONTHS_S[d.getMonth()]}`
}

export function SearchModal() {
  const {
    isSearchOpen, setIsSearchOpen,
    entries, annualGoals,
    setCurrentDate, setView,
    getTagColor,
  } = useTrackerContext()

  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isSearchOpen])

  if (!isSearchOpen) return null

  const q = query.toLowerCase().trim()

  let results = []

  if (q) {
    // Search entries (day/week/month scoped items)
    for (const [dateKey, entry] of Object.entries(entries)) {
      for (const item of (entry.tasks ?? [])) {
        if (item.title?.toLowerCase().includes(q)) {
          results.push({ dateKey, listType: 'task', item, view: item.scope ?? 'day' })
        }
      }
      for (const item of (entry.goals ?? [])) {
        if (item.title?.toLowerCase().includes(q)) {
          results.push({ dateKey, listType: 'goal', item, view: item.scope ?? 'day' })
        }
      }
    }

    // Sort by dateKey descending (most recent first)
    results.sort((a, b) => b.dateKey.localeCompare(a.dateKey))

    // Search annual goals
    for (const goal of annualGoals) {
      if (goal.title?.toLowerCase().includes(q)) {
        results.push({ dateKey: null, listType: 'annual', item: goal, view: 'year' })
      }
    }

    results = results.slice(0, 20)
  }

  function handleSelect(result) {
    if (result.view === 'year') {
      setView('year')
    } else {
      setCurrentDate(result.dateKey, 0)
      setView(result.view)
    }
    setIsSearchOpen(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={() => setIsSearchOpen(false)}
      />

      {/* Modal card */}
      <div
        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[480px] max-w-[90vw] z-50 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-panel)', border: '1px solid var(--color-liner)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-none text-coal" style={{ color: 'var(--color-coal)' }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks and goals..."
            className="flex-1 bg-transparent outline-none"
            style={{
              fontSize: 15,
              color: 'var(--color-snow)',
              fontFamily: 'inherit',
            }}
            onKeyDown={e => { if (e.key === 'Escape') setIsSearchOpen(false) }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="flex-none text-coal hover:text-ash transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Divider + results */}
        {results.length > 0 && (
          <>
            <div style={{ height: 1, background: 'var(--color-liner)' }} />
            <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
              {results.map((r, i) => {
                const tagColor = getTagColor(r.item.tag)
                const dateLabel = r.view === 'year'
                  ? 'Annual Goals'
                  : formatResultDate(r.dateKey, r.view)
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ ':hover': { background: 'var(--color-surface2)' } }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '' }}
                  >
                    {/* Tag dot */}
                    <span
                      className="flex-none w-2 h-2 rounded-full"
                      style={{ background: tagColor }}
                    />
                    {/* Title */}
                    <span className="flex-1 min-w-0 truncate" style={{ fontSize: 13, color: 'var(--color-snow)' }}>
                      {r.item.title}
                    </span>
                    {/* Date label */}
                    <span className="flex-none" style={{ fontSize: 11, color: 'var(--color-coal)' }}>
                      {dateLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Empty state when query has results = 0 but query non-empty */}
        {q && results.length === 0 && (
          <>
            <div style={{ height: 1, background: 'var(--color-liner)' }} />
            <p className="px-4 py-4 text-center" style={{ fontSize: 13, color: 'var(--color-coal)' }}>
              No results for "{query}"
            </p>
          </>
        )}
      </div>
    </>
  )
}
