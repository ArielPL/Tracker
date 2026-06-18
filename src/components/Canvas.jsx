import { useState, useRef, useEffect, useCallback } from 'react'
import { useTrackerContext } from '../context/TrackerContext'
import { TaskRow }       from './TaskRow'
import { ReflectionBox } from './ReflectionBox'
import { YearGoalCard }  from './YearGoalCard'
import { WeekGrid }      from './WeekGrid'
import { WordOfYear }    from './WordOfYear'
import {
  weekStart, weekDays, monthStart, addMonths,
  getYear, getMonth, formatDateHeader, weekNumber,
  isToday, calendarGrid, monthsInYear, parseDate,
  formatMonthYear, addDays, addWeeks, addYears,
} from '../utils/dates'

// ─── helpers ────────────────────────────────────────────────────────────────

function QuickAdd({ onAdd }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  function handleKey(e) {
    if (e.key === 'Enter') {
      const trimmed = text.trim()
      if (trimmed) {
        onAdd(trimmed)
        setText('')
      }
    }
    if (e.key === 'Escape') {
      setText('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="quick-add-row flex items-center gap-2 mt-2 px-1">
      <span className="text-coal text-[13px] select-none">+</span>
      <input
        ref={inputRef}
        placeholder="Add task…"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
        className="flex-1 bg-transparent text-[13px] text-snow placeholder:text-coal outline-none border-b border-transparent focus:border-liner transition-colors py-0.5"
      />
    </div>
  )
}

function SectionHeader({ label }) {
  return <h3 className="text-[10px] uppercase tracking-[0.14em] text-coal mb-2">{label}</h3>
}

function AddBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 text-[11px] text-coal hover:text-ash transition-colors"
    >
      + {label}
    </button>
  )
}

function sortByPriority(items) {
  const order = { high: 0, normal: 1, low: 2 }
  return [...items].sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1))
}

const DAYS_S   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Copy-to-next-period button ────────────────────────────────────────────────
function CopyBtn({ toLabel, onClick }) {
  const [copied, setCopied] = useState(false)
  function handle() {
    onClick()
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <button
      onClick={handle}
      title={`Copy all tasks & goals to ${toLabel}`}
      className="flex items-center gap-1 text-[10px] text-coal hover:text-ash transition-colors px-2 py-1 rounded hover:bg-liner flex-none"
    >
      {copied ? (
        <>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="copy-btn-label">copied</span>
        </>
      ) : (
        <>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="3" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 3V2a1 1 0 011-1h5a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          <span className="copy-btn-label">copy → {toLabel}</span>
        </>
      )}
    </button>
  )
}

// ─── Sticky Note components ──────────────────────────────────────────────────

const NOTE_COLORS = ['#fef3c7', '#fde68a', '#fef9c3', '#fef2f2', '#f0fdf4']

function NoteCard({ note, dateKey, colorIdx }) {
  const { deleteNote, updateNote } = useTrackerContext()
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(note.text)
  const textRef = useRef(null)
  const bg = NOTE_COLORS[colorIdx % NOTE_COLORS.length]

  useEffect(() => {
    if (editing) {
      textRef.current?.focus()
      textRef.current?.select()
    }
  }, [editing])

  function startEdit() { setDraft(note.text); setEditing(true) }

  function commit() {
    const t = draft.trim()
    if (!t) { deleteNote(dateKey, note.id); return }
    if (t !== note.text) updateNote(dateKey, note.id, t)
    setEditing(false)
  }

  return (
    <div
      className="relative group rounded-md p-2.5 overflow-hidden"
      style={{ background: bg, aspectRatio: '1 / 1' }}
      onDoubleClick={startEdit}
    >
      {editing ? (
        <textarea
          ref={textRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Escape') { setDraft(note.text); setEditing(false) }
          }}
          className="w-full h-full bg-transparent text-[11px] leading-snug resize-none outline-none cursor-text"
          style={{ color: '#1c1917', fontFamily: 'inherit' }}
        />
      ) : (
        <p
          className="text-[11px] leading-snug break-words overflow-hidden cursor-default"
          style={{ color: '#1c1917', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' }}
        >
          {note.text}
        </p>
      )}

      {/* Edit + delete controls — appear on hover */}
      {!editing && (
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); startEdit() }}
            aria-label="Edit note"
            className="w-4 h-4 flex items-center justify-center text-[#92400e] hover:text-[#1c1917] transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5l2 2L3 11H1V9L8.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); deleteNote(dateKey, note.id) }}
            aria-label="Delete note"
            className="w-4 h-4 flex items-center justify-center text-[#92400e] hover:text-[#1c1917] transition-colors text-xs leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

function AddNoteCard({ dateKey }) {
  const { addNote } = useTrackerContext()
  const [adding, setAdding] = useState(false)
  const [text,   setText]   = useState('')
  const ref = useRef(null)

  useEffect(() => { if (adding) ref.current?.focus() }, [adding])

  function submit() {
    const t = text.trim()
    if (t) addNote(dateKey, t)
    setText('')
    setAdding(false)
  }

  if (adding) {
    return (
      <div
        className="rounded-md p-2.5"
        style={{ background: NOTE_COLORS[0], aspectRatio: '1 / 1' }}
      >
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={submit}
          onKeyDown={e => {
            if (e.key === 'Escape') { setText(''); setAdding(false) }
          }}
          placeholder="Write a note…"
          className="w-full h-full bg-transparent text-[11px] leading-snug resize-none outline-none"
          style={{ color: '#1c1917', fontFamily: 'inherit' }}
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="rounded-md border-2 border-dashed flex items-center justify-center transition-colors hover:border-ash"
      style={{ borderColor: 'var(--color-coal)', aspectRatio: '1 / 1' }}
      aria-label="Add note"
    >
      <span className="text-2xl text-coal leading-none">+</span>
    </button>
  )
}

function NotesGrid({ dateKey, notes }) {
  return (
    <section className="canvas-section mb-8">
      <SectionHeader label="Notes" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {notes.map((note, i) => (
          <NoteCard key={note.id} note={note} dateKey={dateKey} colorIdx={i} />
        ))}
        <AddNoteCard dateKey={dateKey} />
      </div>
    </section>
  )
}

// ─── Filter Bar ─────────────────────────────────────────────────────────────

function FilterBar({ items, filterTag, setFilterTag, filterPriority, setFilterPriority }) {
  const { getTagColor } = useTrackerContext()

  const uniqueTags = [...new Set(items.map(i => i.tag).filter(Boolean))]
  const anyActive  = filterTag !== null || filterPriority !== null

  const PRIORITIES = [
    { value: 'high',   label: '↑ High' },
    { value: 'normal', label: '— Normal' },
    { value: 'low',    label: '↓ Low' },
  ]

  function pillBase(active, activeStyle) {
    return {
      fontSize: 10,
      padding: '2px 8px',
      borderRadius: 9999,
      border: active ? '1px solid transparent' : '1px solid var(--color-liner)',
      cursor: 'pointer',
      transition: 'all 0.15s',
      ...(active ? activeStyle : { background: 'transparent', color: 'var(--color-coal)' }),
    }
  }

  return (
    <div className="filter-bar flex items-center gap-1.5 mb-3 flex-wrap">
      {uniqueTags.map(tag => {
        const color  = getTagColor(tag)
        const active = filterTag === tag
        return (
          <button
            key={tag}
            onClick={() => setFilterTag(active ? null : tag)}
            style={pillBase(active, { background: color, color: 'var(--color-bg)' })}
          >
            {tag}
          </button>
        )
      })}

      {uniqueTags.length > 0 && (
        <span style={{ width: 1, height: 14, background: 'var(--color-liner)', flexShrink: 0 }} />
      )}

      {PRIORITIES.map(({ value, label }) => {
        const active = filterPriority === value
        return (
          <button
            key={value}
            onClick={() => setFilterPriority(active ? null : value)}
            style={pillBase(active, { background: 'var(--color-gold)', color: 'var(--color-bg)' })}
          >
            {label}
          </button>
        )
      })}

      {anyActive && (
        <button
          onClick={() => { setFilterTag(null); setFilterPriority(null) }}
          style={{ fontSize: 10, color: 'var(--color-coal)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
          className="hover:text-ash transition-colors"
        >
          ✕ Clear
        </button>
      )}
    </div>
  )
}

// ─── Draggable task list ─────────────────────────────────────────────────────

function DraggableList({ items, dateKey, listType, recurringItems, onMarkRecurringDone }) {
  const { reorderItems } = useTrackerContext()
  const dragIndexRef = useRef(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleDrop = useCallback((toIndex) => {
    if (dragIndexRef.current === null || dragIndexRef.current === toIndex) {
      dragIndexRef.current = null
      setDragOverIndex(null)
      return
    }
    reorderItems(dateKey, listType, dragIndexRef.current, toIndex)
    dragIndexRef.current = null
    setDragOverIndex(null)
  }, [dateKey, listType, reorderItems])

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => { dragIndexRef.current = index }}
          onDragOver={e => { e.preventDefault(); setDragOverIndex(index) }}
          onDragLeave={() => setDragOverIndex(null)}
          onDrop={() => handleDrop(index)}
          className="group/drag relative"
          style={dragOverIndex === index && dragIndexRef.current !== index ? { borderTop: '2px solid var(--color-gold)' } : {}}
        >
          {/* Drag handle — desktop only (no drag on touch) */}
          <span
            className="drag-handle absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab text-coal select-none text-[11px] leading-none"
            draggable={false}
          >
            ⠿
          </span>
          <TaskRow item={item} dateKey={dateKey} listType={listType} />
        </div>
      ))}
      {(recurringItems ?? []).map(rt => (
        <RecurringRow key={rt.id} item={rt} onMarkDone={() => onMarkRecurringDone(rt)} />
      ))}
    </div>
  )
}

// ─── Recurring placeholder row ───────────────────────────────────────────────

function RecurringRow({ item, onMarkDone }) {
  const { getTagColor } = useTrackerContext()
  const color = getTagColor(item.tag)
  return (
    <div
      className="group flex items-start gap-3 px-3 py-2 rounded-md transition-colors hover:bg-surface2 opacity-60"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <button
        onClick={onMarkDone}
        aria-label="Mark done"
        className="mt-0.5 flex-none w-4 h-4 rounded border-[1.5px] flex items-center justify-center"
        style={{ borderColor: '#444', background: 'transparent' }}
      />
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className="text-[13px] leading-relaxed text-snow">{item.title}</span>
        <span className="text-[10px]" style={{ color: 'var(--color-gold)' }}>↻</span>
      </div>
      <div className="flex items-center gap-1.5 flex-none">
        {item.time && <span className="text-[10px] text-coal tabular-nums">{item.time}</span>}
        {item.tag && (
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color, background: `${color}1a` }}>
            {item.tag}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Day Canvas ─────────────────────────────────────────────────────────────

function DayCanvas() {
  const { currentDate, setCurrentDate, setView, getEntry, setIsModalOpen, copyPeriod, recurringTasks, addItem } = useTrackerContext()
  const entry = getEntry(currentDate)
  const tasks = sortByPriority(entry.tasks ?? [])
  const goals = entry.goals ?? []
  const notes = entry.notes ?? []

  const [filterTag,      setFilterTag]      = useState(null)
  const [filterPriority, setFilterPriority] = useState(null)

  useEffect(() => { setFilterTag(null); setFilterPriority(null) }, [currentDate])

  const pendingRecurring = (recurringTasks ?? []).filter(rt => {
    if (rt.scope !== 'day' && rt.recurring !== 'daily') return false
    const alreadySaved = [...tasks, ...goals].some(t => t.title === rt.title)
    return !alreadySaved
  })

  function markRecurringDone(rt) {
    addItem({ type: rt.type ?? 'task', scope: 'day', title: rt.title, tag: rt.tag, date: currentDate, priority: rt.priority ?? 'normal', ...(rt.time ? { time: rt.time } : {}) })
  }

  const allItems      = [...tasks, ...goals]
  const visibleTasks  = tasks.filter(t =>
    (!filterTag      || t.tag      === filterTag) &&
    (!filterPriority || t.priority === filterPriority)
  )
  const visibleGoals  = goals.filter(g =>
    (!filterTag      || g.tag      === filterTag) &&
    (!filterPriority || g.priority === filterPriority)
  )

  const prevDay = addDays(currentDate, -1)
  const nextDay = addDays(currentDate, 1)
  const nd = parseDate(nextDay)
  const nextDayLabel = `${DAYS_S[nd.getDay()]} ${nd.getDate()} ${MONTHS_S[nd.getMonth()]}`

  const NAV_BTN = 'w-8 h-8 flex items-center justify-center rounded text-ash hover:text-snow hover:bg-liner transition-colors flex-none text-lg leading-none'

  return (
    <div className="canvas-pad p-6 fade-in">
      <div className="canvas-header mb-8 flex items-center gap-2">
        {/* Prev day */}
        <button onClick={() => { setCurrentDate(prevDay, -1); setView('day') }} className={NAV_BTN} aria-label="Previous day">‹</button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-medium text-snow leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {formatDateHeader(currentDate)}
          </h2>
          <p className="text-[11px] text-coal mt-1 flex items-center gap-2">
            <span>Week {weekNumber(currentDate)} · {currentDate.split('-')[0]}</span>
            {isToday(currentDate) && <span className="text-gold">Today</span>}
          </p>
        </div>

        {/* Copy + next day */}
        <div className="flex items-center gap-1 flex-none">
          <CopyBtn toLabel={nextDayLabel} onClick={() => copyPeriod(currentDate, nextDay, 'day')} />
          <button onClick={() => { setCurrentDate(nextDay, 1); setView('day') }} className={NAV_BTN} aria-label="Next day">›</button>
        </div>
      </div>

      {allItems.length >= 3 && (
        <FilterBar
          items={allItems}
          filterTag={filterTag} setFilterTag={setFilterTag}
          filterPriority={filterPriority} setFilterPriority={setFilterPriority}
        />
      )}

      <section className="canvas-section mb-8">
        <SectionHeader label="Tasks" />
        {tasks.length === 0 && pendingRecurring.length === 0
          ? <p className="text-[12px] text-coal py-2">Nothing here yet. Tap ＋ to add your first task.</p>
          : visibleTasks.length === 0 && pendingRecurring.length === 0
            ? <p className="text-[12px] text-coal py-2">No tasks match the current filter.</p>
            : <DraggableList
                items={visibleTasks}
                dateKey={currentDate}
                listType="task"
                recurringItems={pendingRecurring}
                onMarkRecurringDone={markRecurringDone}
              />
        }
        <QuickAdd onAdd={title => addItem({ type: 'task', scope: 'day', title, date: currentDate })} />
        <AddBtn label="add task" onClick={() => setIsModalOpen(true)} />
      </section>

      <section className="canvas-section mb-8">
        <SectionHeader label="Goals" />
        {goals.length === 0
          ? <p className="text-[12px] text-coal py-2">Set a goal for today.</p>
          : visibleGoals.length === 0
            ? <p className="text-[12px] text-coal py-2">No goals match the current filter.</p>
            : <DraggableList items={visibleGoals} dateKey={currentDate} listType="goal" />
        }
        <AddBtn label="add goal" onClick={() => setIsModalOpen(true)} />
      </section>

      <NotesGrid dateKey={currentDate} notes={notes} />

      <section>
        <SectionHeader label="Reflection" />
        <ReflectionBox dateKey={currentDate} />
      </section>
    </div>
  )
}

// ─── Week Canvas ─────────────────────────────────────────────────────────────

function WeekCanvas() {
  const { currentDate, setCurrentDate, setView, getEntry, setIsModalOpen, copyPeriod, recurringTasks, addItem } = useTrackerContext()
  const ws    = weekStart(currentDate)
  const entry = getEntry(ws)
  const tasks = sortByPriority((entry.tasks ?? []).filter(t => t.scope === 'week'))
  const goals = (entry.goals ?? []).filter(g => g.scope === 'week')
  const notes = entry.notes ?? []
  const days  = weekDays(ws)

  const [filterTag,      setFilterTag]      = useState(null)
  const [filterPriority, setFilterPriority] = useState(null)

  useEffect(() => { setFilterTag(null); setFilterPriority(null) }, [currentDate])

  const weekRecurring = (recurringTasks ?? []).filter(rt => {
    if (rt.recurring !== 'weekly') return false
    return ![...tasks, ...goals].some(t => t.title === rt.title)
  })

  function markWeekRecurringDone(rt) {
    addItem({ type: rt.type ?? 'task', scope: 'week', title: rt.title, tag: rt.tag, date: ws, priority: rt.priority ?? 'normal', ...(rt.time ? { time: rt.time } : {}) })
  }

  const allItems     = [...tasks, ...goals]
  const visibleTasks = tasks.filter(t =>
    (!filterTag      || t.tag      === filterTag) &&
    (!filterPriority || t.priority === filterPriority)
  )
  const visibleGoals = goals.filter(g =>
    (!filterTag      || g.tag      === filterTag) &&
    (!filterPriority || g.priority === filterPriority)
  )

  const start = parseDate(days[0])
  const end   = parseDate(days[6])
  const range = `${start.getDate()} ${MONTHS_S[start.getMonth()]} – ${end.getDate()} ${MONTHS_S[end.getMonth()]} ${end.getFullYear()}`

  const prevWS  = addWeeks(ws, -1)
  const nextWS  = addWeeks(ws, 1)
  const nextWLabel = `W${weekNumber(nextWS)}`

  const NAV_BTN = 'w-8 h-8 flex items-center justify-center rounded text-ash hover:text-snow hover:bg-liner transition-colors flex-none text-lg leading-none'

  return (
    <div className="canvas-pad p-6 fade-in">
      <div className="canvas-header mb-8 flex items-center gap-2">
        {/* Prev week */}
        <button onClick={() => { setCurrentDate(prevWS, -1); setView('week') }} className={NAV_BTN} aria-label="Previous week">‹</button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-medium text-snow leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Week {weekNumber(currentDate)}
          </h2>
          <p className="text-[11px] text-coal mt-1">{range}</p>
        </div>

        {/* Copy + next week */}
        <div className="flex items-center gap-1 flex-none">
          <CopyBtn toLabel={nextWLabel} onClick={() => copyPeriod(ws, nextWS, 'week')} />
          <button onClick={() => { setCurrentDate(nextWS, 1); setView('week') }} className={NAV_BTN} aria-label="Next week">›</button>
        </div>
      </div>

      <section className="canvas-section mb-8">
        <WeekGrid />
      </section>

      {allItems.length >= 3 && (
        <FilterBar
          items={allItems}
          filterTag={filterTag} setFilterTag={setFilterTag}
          filterPriority={filterPriority} setFilterPriority={setFilterPriority}
        />
      )}

      <section className="canvas-section mb-8">
        <SectionHeader label="Weekly Goals" />
        <div className="flex flex-col gap-0.5">
          {goals.length === 0
            ? <p className="text-[12px] text-coal py-2">Set a goal for this week.</p>
            : visibleGoals.length === 0
              ? <p className="text-[12px] text-coal py-2">No goals match the current filter.</p>
              : visibleGoals.map(item => <TaskRow key={item.id} item={item} dateKey={ws} listType="goal" />)
          }
        </div>
        <AddBtn label="add goal" onClick={() => setIsModalOpen(true)} />
      </section>

      <section className="canvas-section mb-8">
        <SectionHeader label="Weekly Tasks" />
        <div className="flex flex-col gap-0.5">
          {tasks.length === 0 && weekRecurring.length === 0
            ? <p className="text-[12px] text-coal py-2">Add tasks for this week.</p>
            : visibleTasks.length === 0 && weekRecurring.length === 0
              ? <p className="text-[12px] text-coal py-2">No tasks match the current filter.</p>
              : <>
                  {visibleTasks.map(item => <TaskRow key={item.id} item={item} dateKey={ws} listType="task" />)}
                  {weekRecurring.map(rt => <RecurringRow key={rt.id} item={rt} onMarkDone={() => markWeekRecurringDone(rt)} />)}
                </>
          }
        </div>
        <QuickAdd onAdd={title => addItem({ type: 'task', scope: 'week', title, date: ws })} />
        <AddBtn label="add task" onClick={() => setIsModalOpen(true)} />
      </section>

      <NotesGrid dateKey={ws} notes={notes} />

      <section>
        <SectionHeader label="Weekly Reflection" />
        <ReflectionBox dateKey={ws} placeholder="How was your week? Write here…" />
      </section>
    </div>
  )
}

// ─── Month Canvas ─────────────────────────────────────────────────────────────

function MonthCanvas() {
  const {
    currentDate, setCurrentDate, setView,
    getEntry, setIsModalOpen, contentDots, entries,
    monthWords, updateMonthWord, copyPeriod,
    recurringTasks, addItem,
  } = useTrackerContext()

  const ms    = monthStart(currentDate)
  const entry = getEntry(ms)
  const tasks = sortByPriority((entry.tasks ?? []).filter(t => t.scope === 'month'))
  const goals = (entry.goals ?? []).filter(g => g.scope === 'month')
  const notes = entry.notes ?? []

  const [filterTag,      setFilterTag]      = useState(null)
  const [filterPriority, setFilterPriority] = useState(null)

  useEffect(() => { setFilterTag(null); setFilterPriority(null) }, [currentDate])

  const monthRecurring = (recurringTasks ?? []).filter(rt => {
    if (rt.recurring !== 'monthly') return false
    return ![...tasks, ...goals].some(t => t.title === rt.title)
  })

  function markMonthRecurringDone(rt) {
    addItem({ type: rt.type ?? 'task', scope: 'month', title: rt.title, tag: rt.tag, date: ms, priority: rt.priority ?? 'normal', ...(rt.time ? { time: rt.time } : {}) })
  }

  const allItems     = [...tasks, ...goals]
  const visibleTasks = tasks.filter(t =>
    (!filterTag      || t.tag      === filterTag) &&
    (!filterPriority || t.priority === filterPriority)
  )
  const visibleGoals = goals.filter(g =>
    (!filterTag      || g.tag      === filterTag) &&
    (!filterPriority || g.priority === filterPriority)
  )

  const year  = getYear(currentDate)
  const month = getMonth(currentDate)
  const grid  = calendarGrid(year, month)

  const monthKey  = `${year}-${String(month).padStart(2, '0')}`
  const wordOfMonth = monthWords[monthKey] ?? ''

  function goDay(iso) {
    setCurrentDate(iso, iso < currentDate ? -1 : 1)
    setView('day')
  }

  function goMonth(dir) {
    const next = monthStart(addMonths(currentDate, dir))
    setCurrentDate(next, dir)
  }

  const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const nextMS = monthStart(addMonths(ms, 1))
  const nextMDate = parseDate(nextMS)
  const nextMLabel = MONTHS_S[nextMDate.getMonth()]

  return (
    <div className="canvas-pad p-6 fade-in">
      {/* Header */}
      <div className="canvas-header mb-8 flex items-start gap-2">
        {/* Prev month */}
        <button
          onClick={() => goMonth(-1)}
          className="w-8 h-8 flex items-center justify-center rounded text-ash hover:text-snow hover:bg-liner transition-colors flex-none text-lg leading-none mt-0.5"
          aria-label="Previous month"
        >‹</button>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-medium text-snow leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {MONTHS_LONG[month - 1]}
          </h2>
          <p className="text-[11px] text-coal mt-1">{year}</p>
          {/* Word of the Month */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[9px] uppercase tracking-[0.12em] text-coal flex-none">Word</span>
            <input
              value={wordOfMonth}
              onChange={e => updateMonthWord(monthKey, e.target.value)}
              placeholder="of the month…"
              className="bg-transparent text-[13px] text-gold placeholder-coal outline-none border-b border-liner pb-0.5 focus:border-ash transition-colors min-w-0 flex-1"
              style={{ fontFamily: 'inherit', maxWidth: 200 }}
            />
          </div>
        </div>

        {/* Copy + next month */}
        <div className="flex items-center gap-1 flex-none mt-0.5">
          <CopyBtn toLabel={nextMLabel} onClick={() => copyPeriod(ms, nextMS, 'month')} />
          <button
            onClick={() => goMonth(1)}
            className="w-8 h-8 flex items-center justify-center rounded text-ash hover:text-snow hover:bg-liner transition-colors text-lg leading-none"
            aria-label="Next month"
          >›</button>
        </div>
      </div>

      {/* Full month calendar grid */}
      <section className="canvas-section mb-8">
        <div className="grid grid-cols-[28px_repeat(7,1fr)] mb-1">
          <div />
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-coal">{d}</div>
          ))}
        </div>
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: 6 }, (_, rowIdx) => {
            const row = grid.slice(rowIdx * 7, rowIdx * 7 + 7)
            return (
              <div key={rowIdx} className="grid grid-cols-[28px_repeat(7,1fr)] gap-0.5">
                <div className="flex items-center justify-center">
                  <span className="text-[8px] text-coal">W{weekNumber(row[0].iso)}</span>
                </div>
                {row.map(({ iso, day, currentMonth }) => {
                  const todayDay = isToday(iso)
                  const active   = iso === currentDate
                  const dots     = currentMonth ? contentDots(iso, 3) : []
                  const hasNotes = currentMonth && (entries[iso]?.notes?.length ?? 0) > 0
                  return (
                    <button
                      key={iso}
                      onClick={() => goDay(iso)}
                      className={`flex flex-col items-center py-1 rounded transition-colors ${
                        !currentMonth
                          ? 'opacity-30'
                          : todayDay
                            ? 'border border-gold'
                            : active
                              ? 'bg-liner'
                              : 'hover:bg-surface2'
                      }`}
                    >
                      {/* Note indicator */}
                      <div className="h-[5px] flex items-center justify-center">
                        {hasNotes && (
                          <span className="w-[4px] h-[4px] rounded-[1px]" style={{ background: '#fef3c7' }} />
                        )}
                      </div>
                      <span className={`text-[12px] ${todayDay ? 'text-gold font-medium' : currentMonth ? 'text-ash' : 'text-coal'}`}>
                        {day}
                      </span>
                      <div className="flex gap-[2px] mt-0.5 h-[4px] items-center">
                        {dots.map((color, i) => (
                          <span key={i} className="w-[3px] h-[3px] rounded-full" style={{ background: color }} />
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </section>

      {allItems.length >= 3 && (
        <FilterBar
          items={allItems}
          filterTag={filterTag} setFilterTag={setFilterTag}
          filterPriority={filterPriority} setFilterPriority={setFilterPriority}
        />
      )}

      <section className="canvas-section mb-8">
        <SectionHeader label="Monthly Goals" />
        <div className="flex flex-col gap-0.5">
          {goals.length === 0
            ? <p className="text-[12px] text-coal py-2">Set a goal for this month.</p>
            : visibleGoals.length === 0
              ? <p className="text-[12px] text-coal py-2">No goals match the current filter.</p>
              : visibleGoals.map(item => <TaskRow key={item.id} item={item} dateKey={ms} listType="goal" />)
          }
        </div>
        <AddBtn label="add goal" onClick={() => setIsModalOpen(true)} />
      </section>

      <section className="canvas-section mb-8">
        <SectionHeader label="Monthly Tasks" />
        <div className="flex flex-col gap-0.5">
          {tasks.length === 0 && monthRecurring.length === 0
            ? <p className="text-[12px] text-coal py-2">Add tasks for this month.</p>
            : visibleTasks.length === 0 && monthRecurring.length === 0
              ? <p className="text-[12px] text-coal py-2">No tasks match the current filter.</p>
              : <>
                  {visibleTasks.map(item => <TaskRow key={item.id} item={item} dateKey={ms} listType="task" />)}
                  {monthRecurring.map(rt => <RecurringRow key={rt.id} item={rt} onMarkDone={() => markMonthRecurringDone(rt)} />)}
                </>
          }
        </div>
        <QuickAdd onAdd={title => addItem({ type: 'task', scope: 'month', title, date: ms })} />
        <AddBtn label="add task" onClick={() => setIsModalOpen(true)} />
      </section>

      <NotesGrid dateKey={ms} notes={notes} />

      <section>
        <SectionHeader label="Monthly Reflection" />
        <ReflectionBox dateKey={ms} placeholder="How was your month? Write here…" />
      </section>
    </div>
  )
}

// ─── Year Canvas ─────────────────────────────────────────────────────────────

function YearCanvas() {
  const {
    currentDate, annualGoals, annualReflections,
    updateAnnualReflection, setIsModalOpen,
    setCurrentDate, setView, getEntry,
  } = useTrackerContext()

  const year      = getYear(currentDate)
  const months    = monthsInYear(year)
  const yearText  = annualReflections[String(year)] ?? ''
  const yearKey   = String(year)           // key for year-scoped notes
  const yearNotes = getEntry(yearKey).notes ?? []

  function goMonth(iso) {
    setCurrentDate(iso, 1)
    setView('month')
  }

  function goYear(dir) {
    setCurrentDate(addYears(currentDate, dir), dir)
  }

  const NAV_BTN = 'w-8 h-8 flex items-center justify-center rounded text-ash hover:text-snow hover:bg-liner transition-colors flex-none text-lg leading-none'

  return (
    <div className="canvas-pad p-6 fade-in">
      <div className="canvas-header mb-8 flex items-center gap-2">
        <button onClick={() => goYear(-1)} className={NAV_BTN} aria-label="Previous year">‹</button>
        <h2 className="flex-1 text-xl font-medium text-snow leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
          {year}
        </h2>
        <button onClick={() => goYear(1)} className={NAV_BTN} aria-label="Next year">›</button>
      </div>

      <div className="mb-8 lg:hidden">
        <WordOfYear />
      </div>

      <section className="canvas-section mb-8">
        <SectionHeader label="Annual Goals" />
        {annualGoals.length === 0
          ? <p className="text-[12px] text-coal py-2">Add your first annual goal with ＋</p>
          : <div className="flex flex-col gap-3">
              {annualGoals.map(g => <YearGoalCard key={g.id} goal={g} />)}
            </div>
        }
        <AddBtn label="add annual goal" onClick={() => setIsModalOpen(true)} />
      </section>

      <section className="canvas-section mb-8">
        <SectionHeader label="Months" />
        <div className="grid grid-cols-4 gap-2">
          {months.map(({ name, short, iso, month }) => {
            const active = getMonth(currentDate) === month && getYear(currentDate) === year
            return (
              <button
                key={iso}
                onClick={() => goMonth(iso)}
                className={`py-3 rounded-lg text-[12px] transition-colors ${
                  active ? 'text-gold' : 'bg-surface hover:bg-liner text-ash hover:text-snow'
                }`}
                style={{
                  border: '1px solid var(--color-liner)',
                  background: active ? 'var(--color-liner)' : undefined,
                }}
              >
                {short}
              </button>
            )
          })}
        </div>
      </section>

      <NotesGrid dateKey={yearKey} notes={yearNotes} />

      <section>
        <SectionHeader label="Annual Reflection" />
        <textarea
          value={yearText}
          onChange={e => updateAnnualReflection(year, e.target.value)}
          placeholder="Reflect on your year…"
          className="w-full min-h-[120px] bg-transparent text-[13px] text-snow placeholder-coal resize-none outline-none leading-relaxed"
          style={{ fontFamily: 'inherit' }}
        />
      </section>
    </div>
  )
}

// ─── Canvas (router) ─────────────────────────────────────────────────────────

export function Canvas() {
  const { view } = useTrackerContext()

  return (
    <div className="flex-1 overflow-y-auto">
      {view === 'day'   && <DayCanvas />}
      {view === 'week'  && <WeekCanvas />}
      {view === 'month' && <MonthCanvas />}
      {view === 'year'  && <YearCanvas />}
    </div>
  )
}
