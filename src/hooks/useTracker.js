import { useState, useEffect, useRef } from 'react'
import { today, weekStart, monthStart, parseDate, toISO } from '../utils/dates'
import { DEFAULT_TAGS, FALLBACK_COLOR } from '../utils/tags'
import { uuid } from '../utils/uuid'

const KEYS = {
  entries:            'tracker_entries',
  annualGoals:        'tracker_annual_goals',
  settings:           'tracker_settings',
  annualReflections:  'tracker_annual_reflections',
  customTags:         'tracker_custom_tags',
  monthWords:         'tracker_month_words',
  recurring:          'tracker_recurring',
}

const DEFAULT_SETTINGS = {
  wordOfYear: '',
  yearStart: `${new Date().getFullYear()}-01-01`,
  theme: '',
}

const EMPTY_ENTRY = () => ({ tasks: [], goals: [], notes: [], reflection: '', mood: null })

function computeStreak(entries) {
  let count = 0
  let cursor = today()
  while (true) {
    const entry = entries[cursor]
    const hasDone = entry && (
      (entry.tasks ?? []).some(i => i.done) ||
      (entry.goals ?? []).some(i => i.done)
    )
    if (!hasDone) break
    count++
    const d = parseDate(cursor)
    d.setDate(d.getDate() - 1)
    cursor = toISO(d)
  }
  return count
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function useTracker() {
  const [view, setView]         = useState('day')
  const [currentDate, _setCurrentDate] = useState(today)
  const [navDir, setNavDir]     = useState(0) // -1 back, 1 fwd, for slide animation
  const [entries, setEntries]   = useState(() => load(KEYS.entries, {}))
  const [annualGoals, setAnnualGoals] = useState(() => load(KEYS.annualGoals, []))
  const [settings, setSettings] = useState(() => load(KEYS.settings, DEFAULT_SETTINGS))
  const [annualReflections, setAnnualReflections] = useState(() => load(KEYS.annualReflections, {}))
  const [customTags, setCustomTags] = useState(() => load(KEYS.customTags, []))
  const [monthWords, setMonthWords] = useState(() => load(KEYS.monthWords, {}))
  const [recurringTasks, setRecurringTasks] = useState(() => load(KEYS.recurring, []))
  const [isModalOpen, setIsModalOpen]   = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFocusMode, setIsFocusMode]   = useState(false)
  const [undoStack, setUndoStack]       = useState(null)
  const undoTimerRef = useRef(null)

  useEffect(() => { save(KEYS.entries,           entries)           }, [entries])
  useEffect(() => { save(KEYS.annualGoals,        annualGoals)       }, [annualGoals])
  useEffect(() => { save(KEYS.settings,           settings)          }, [settings])
  useEffect(() => { save(KEYS.annualReflections,  annualReflections) }, [annualReflections])
  useEffect(() => { save(KEYS.customTags,         customTags)        }, [customTags])
  useEffect(() => { save(KEYS.monthWords,         monthWords)        }, [monthWords])
  useEffect(() => { save(KEYS.recurring,          recurringTasks)    }, [recurringTasks])

  // Apply theme to <html> element whenever settings.theme changes
  useEffect(() => {
    const theme = settings.theme ?? ''
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [settings.theme])

  function setCurrentDate(iso, dir = 0) {
    setNavDir(dir)
    _setCurrentDate(iso)
  }

  function getEntry(dateKey) {
    return entries[dateKey] ?? EMPTY_ENTRY()
  }

  function updateEntry(dateKey, updates) {
    setEntries(prev => ({
      ...prev,
      [dateKey]: { ...EMPTY_ENTRY(), ...prev[dateKey], ...updates },
    }))
  }

  // For day/week/month scoped items, resolve the storage key
  function resolveKey(scope, date) {
    const base = date ?? currentDate
    if (scope === 'week')  return weekStart(base)
    if (scope === 'month') return monthStart(base)
    return base
  }

  function addItem({ type, scope, title, tag, date, priority, goalType, target, unit, time }) {
    if (scope === 'year') {
      const gType = goalType ?? 'quantified'
      const base = { id: uuid(), title, tag: tag ?? '', goalType: gType }
      if (gType === 'one-time') {
        setAnnualGoals(prev => [...prev, { ...base, done: false }])
      } else if (gType === 'milestone') {
        setAnnualGoals(prev => [...prev, { ...base, steps: [] }])
      } else {
        // quantified
        setAnnualGoals(prev => [...prev, { ...base, progress: 0, target: target ?? 100, unit: unit ?? '' }])
      }
      return
    }

    const key = resolveKey(scope, date)
    const entry = getEntry(key)
    const base = {
      id:       uuid(),
      title,
      tag:      tag ?? '',
      done:     false,
      scope,
      priority: priority ?? 'normal',
      ...(time ? { time } : {}),
    }

    if (type === 'goal') {
      updateEntry(key, { goals: [...entry.goals, { ...base, progress: 0, target: 100 }] })
    } else {
      // task or note
      updateEntry(key, { tasks: [...entry.tasks, { ...base, type: type ?? 'task' }] })
    }
  }

  function toggleDone(dateKey, listType, id) {
    const entry = getEntry(dateKey)
    const key = listType === 'goal' ? 'goals' : 'tasks'
    updateEntry(dateKey, {
      [key]: entry[key].map(item => item.id === id ? { ...item, done: !item.done } : item),
    })
  }

  function scheduleUndoClear() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      setUndoStack(null)
      undoTimerRef.current = null
    }, 4000)
  }

  function deleteItem(dateKey, listType, id) {
    const entry = getEntry(dateKey)
    const key = listType === 'goal' ? 'goals' : 'tasks'
    const index = entry[key].findIndex(i => i.id === id)
    const item  = entry[key][index]
    if (!item) return
    setUndoStack({ dateKey, listType, item, index })
    scheduleUndoClear()
    updateEntry(dateKey, { [key]: entry[key].filter(i => i.id !== id) })
  }

  function updateItem(dateKey, listType, id, updates) {
    const entry = getEntry(dateKey)
    const key = listType === 'goal' ? 'goals' : 'tasks'
    updateEntry(dateKey, {
      [key]: entry[key].map(item => item.id === id ? { ...item, ...updates } : item),
    })
  }

  function updateAnnualGoal(id, updates) {
    setAnnualGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }

  function updateAnnualGoalProgress(id, progress) {
    setAnnualGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g))
  }

  function toggleAnnualGoalDone(id) {
    setAnnualGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g))
  }

  function deleteAnnualGoal(id) {
    setAnnualGoals(prev => {
      const index = prev.findIndex(g => g.id === id)
      const goal  = prev[index]
      if (!goal) return prev
      setUndoStack({ type: 'annual', goal, index })
      scheduleUndoClear()
      return prev.filter(g => g.id !== id)
    })
  }

  function undoDelete() {
    if (!undoStack) return
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null }
    if (undoStack.type === 'annual') {
      setAnnualGoals(prev => {
        const next = [...prev]
        next.splice(undoStack.index, 0, undoStack.goal)
        return next
      })
    } else {
      const { dateKey, listType, item, index } = undoStack
      const entry = getEntry(dateKey)
      const key   = listType === 'goal' ? 'goals' : 'tasks'
      const list  = [...(entry[key] ?? [])]
      list.splice(index, 0, item)
      updateEntry(dateKey, { [key]: list })
    }
    setUndoStack(null)
  }

  // Milestone step management
  function addAnnualGoalStep(goalId, text) {
    setAnnualGoals(prev => prev.map(g =>
      g.id === goalId
        ? { ...g, steps: [...(g.steps ?? []), { id: uuid(), text, done: false }] }
        : g
    ))
  }

  function toggleAnnualGoalStep(goalId, stepId) {
    setAnnualGoals(prev => prev.map(g =>
      g.id === goalId
        ? { ...g, steps: g.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s) }
        : g
    ))
  }

  function removeAnnualGoalStep(goalId, stepId) {
    setAnnualGoals(prev => prev.map(g =>
      g.id === goalId
        ? { ...g, steps: g.steps.filter(s => s.id !== stepId) }
        : g
    ))
  }

  function updateReflection(dateKey, reflection) {
    updateEntry(dateKey, { reflection })
  }

  function updateMood(dateKey, mood) {
    updateEntry(dateKey, { mood })
  }

  function updateSettings(updates) {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  function updateAnnualReflection(year, text) {
    setAnnualReflections(prev => ({ ...prev, [String(year)]: text }))
  }

  // monthKey format: 'YYYY-MM'
  function updateMonthWord(monthKey, word) {
    setMonthWords(prev => ({ ...prev, [monthKey]: word }))
  }

  function addRecurringTask(task) {
    setRecurringTasks(prev => [...prev, { ...task, id: task.id ?? uuid() }])
  }

  function removeRecurringTask(id) {
    setRecurringTasks(prev => prev.filter(t => t.id !== id))
  }

  function updateRecurringTask(id, updates) {
    setRecurringTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  function reorderItems(dateKey, listType, fromIndex, toIndex) {
    const entry = getEntry(dateKey)
    const key = listType === 'goal' ? 'goals' : 'tasks'
    const arr = [...entry[key]]
    const [moved] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, moved)
    updateEntry(dateKey, { [key]: arr })
  }

  function hasContent(dateKey) {
    const e = entries[dateKey]
    if (!e) return false
    return (e.tasks?.length > 0) || (e.goals?.length > 0) || !!e.reflection?.trim()
  }

  function contentCount(dateKey) {
    const e = entries[dateKey]
    if (!e) return 0
    return (e.tasks?.length ?? 0) + (e.goals?.length ?? 0)
  }

  // Returns array of tag colors (up to maxDots), priority-sorted, for dot indicators
  function contentDots(dateKey, maxDots = 4) {
    const e = entries[dateKey]
    if (!e) return []
    const items = [...(e.tasks ?? []), ...(e.goals ?? [])]
    const order = { high: 0, normal: 1, low: 2 }
    const sorted = [...items].sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1))
    return sorted.slice(0, maxDots).map(item => getTagColor(item.tag))
  }

  // Notes (day-scoped sticky notes, separate from tasks/goals)
  function addNote(dateKey, text) {
    const entry = getEntry(dateKey)
    updateEntry(dateKey, { notes: [...(entry.notes ?? []), { id: uuid(), text }] })
  }

  function updateNote(dateKey, id, text) {
    const entry = getEntry(dateKey)
    updateEntry(dateKey, {
      notes: (entry.notes ?? []).map(n => n.id === id ? { ...n, text } : n),
    })
  }

  function deleteNote(dateKey, id) {
    const entry = getEntry(dateKey)
    updateEntry(dateKey, { notes: (entry.notes ?? []).filter(n => n.id !== id) })
  }

  // Copy all tasks + goals of a given scope from one period key to another,
  // resetting done/progress so they start fresh in the destination.
  function copyPeriod(fromKey, toKey, scope) {
    const from = getEntry(fromKey)
    const to   = getEntry(toKey)
    const srcTasks = (from.tasks ?? []).filter(i => i.scope === scope)
    const srcGoals = (from.goals ?? []).filter(i => i.scope === scope)
    if (srcTasks.length === 0 && srcGoals.length === 0) return
    const newTasks = srcTasks.map(t => ({ ...t, id: uuid(), done: false }))
    const newGoals = srcGoals.map(g => ({
      ...g,
      id: uuid(),
      done: false,
      ...(g.progress !== undefined ? { progress: 0 } : {}),
      ...(g.steps ? { steps: g.steps.map(s => ({ ...s, done: false })) } : {}),
    }))
    updateEntry(toKey, {
      tasks: [...(to.tasks ?? []), ...newTasks],
      goals: [...(to.goals ?? []), ...newGoals],
    })
  }

  // Custom tag management
  function addCustomTag(name, color) {
    const trimmed = name.trim()
    if (!trimmed) return
    setCustomTags(prev => [...prev, { id: uuid(), name: trimmed, color }])
  }

  function removeCustomTag(id) {
    setCustomTags(prev => prev.filter(t => t.id !== id))
  }

  function getTagColor(tag) {
    if (!tag) return FALLBACK_COLOR
    const custom = customTags.find(t => t.name === tag)
    if (custom) return custom.color
    return DEFAULT_TAGS[tag] ?? FALLBACK_COLOR
  }

  const streak = computeStreak(entries)

  return {
    view, setView,
    currentDate, setCurrentDate, navDir,
    entries, getEntry,
    annualGoals, annualReflections,
    settings,
    customTags,
    isModalOpen, setIsModalOpen,
    isSearchOpen, setIsSearchOpen,
    isFocusMode, setIsFocusMode,
    streak,
    addItem,
    toggleDone,
    deleteItem,
    updateItem,
    updateAnnualGoal,
    updateAnnualGoalProgress,
    toggleAnnualGoalDone,
    deleteAnnualGoal,
    addAnnualGoalStep,
    toggleAnnualGoalStep,
    removeAnnualGoalStep,
    updateReflection,
    updateMood,
    updateSettings,
    updateAnnualReflection,
    hasContent,
    contentCount,
    contentDots,
    addNote,
    updateNote,
    deleteNote,
    addCustomTag,
    removeCustomTag,
    getTagColor,
    monthWords,
    updateMonthWord,
    copyPeriod,
    undoStack,
    undoDelete,
    recurringTasks,
    addRecurringTask,
    removeRecurringTask,
    updateRecurringTask,
    reorderItems,
  }
}
