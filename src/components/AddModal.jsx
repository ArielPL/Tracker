import { useState, useEffect, useRef } from 'react'
import { useTrackerContext } from '../context/TrackerContext'
import { DEFAULT_TAG_LIST, CUSTOM_TAG_PALETTE } from '../utils/tags'
import { weekStart, weekDays, formatShortDate, parseDate, monthStart, addMonths, today } from '../utils/dates'

const TYPES       = ['task', 'goal']
const SCOPES      = ['day', 'week', 'month', 'year']
const PRIORITIES  = ['low', 'normal', 'high']
const GOAL_TYPES  = ['one-time', 'quantified', 'milestone']

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['M','T','W','T','F','S','S']

function SegControl({ options, value, onChange, accentSelected = false, format }) {
  return (
    <div className="flex gap-0.5 p-1 rounded-lg bg-bg">
      {options.map(opt => {
        const selected = opt === value
        const label    = format ? format(opt) : opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 py-1.5 rounded text-[12px] capitalize transition-colors ${
              selected
                ? accentSelected ? 'bg-liner text-gold' : 'bg-liner text-snow'
                : 'text-ash hover:text-snow'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Mini day calendar ── */
function MiniCalendar({ selected, onSelect }) {
  const init = selected || today()
  const [nav, setNav] = useState(() => {
    const d = parseDate(init)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })

  function prevMonth() {
    setNav(n => {
      const d = new Date(n.year, n.month - 2, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
  }
  function nextMonth() {
    setNav(n => {
      const d = new Date(n.year, n.month, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
  }

  const firstDay    = new Date(nav.year, nav.month - 1, 1)
  const offset      = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMonth = new Date(nav.year, nav.month, 0).getDate()
  const cells       = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${nav.year}-${String(nav.month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ day: d, iso })
  }
  const todayISO = today()

  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-liner)' }}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="text-ash hover:text-snow text-sm px-1">‹</button>
        <span className="text-[12px] text-snow">{MONTH_NAMES[nav.month - 1]} {nav.year}</span>
        <button onClick={nextMonth} className="text-ash hover:text-snow text-sm px-1">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d, i) => <div key={i} className="text-center text-[10px] text-coal">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) =>
          cell === null ? <div key={i} /> : (
            <button
              key={cell.iso}
              onClick={() => onSelect(cell.iso)}
              className={`text-[11px] py-1 rounded text-center transition-colors ${
                cell.iso === selected
                  ? 'bg-gold text-bg font-medium'
                  : cell.iso === todayISO
                    ? 'border border-gold text-gold'
                    : 'text-ash hover:bg-liner hover:text-snow'
              }`}
            >
              {cell.day}
            </button>
          )
        )}
      </div>
    </div>
  )
}

/* ── Week picker ── */
function WeekPicker({ selected, onSelect }) {
  const chosen  = weekStart(selected)
  const weeks   = []
  for (let i = -2; i <= 2; i++) {
    const base   = parseDate(chosen)
    base.setDate(base.getDate() + i * 7)
    weeks.push(weekStart(base.toISOString().split('T')[0]))
  }
  const todayISO  = today()
  const thisWeek  = weekStart(todayISO)

  function label(monday) {
    const days = weekDays(monday)
    const s    = parseDate(days[0])
    const e    = parseDate(days[6])
    const sm   = MONTH_NAMES[s.getMonth()]
    const em   = MONTH_NAMES[e.getMonth()]
    return sm === em
      ? `${s.getDate()}–${e.getDate()} ${sm}`
      : `${s.getDate()} ${sm} – ${e.getDate()} ${em}`
  }

  return (
    <div className="flex flex-col gap-1">
      {weeks.map(monday => {
        const isSel = monday === chosen
        const isCur = monday === thisWeek
        return (
          <button
            key={monday}
            onClick={() => onSelect(monday)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-[12px] transition-colors ${
              isSel ? 'bg-gold text-bg font-medium' : 'hover:bg-liner text-ash hover:text-snow'
            }`}
            style={!isSel && isCur ? { border: '1px solid var(--color-gold)', color: 'var(--color-gold)' } : { border: '1px solid transparent' }}
          >
            <span>{label(monday)}</span>
            {isCur && !isSel && <span className="text-[10px] opacity-60">This week</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ── Month picker ── */
function MonthPicker({ selected, onSelect }) {
  // selected = monthStart ISO e.g. "2026-05-01"
  const initYear = selected ? parseInt(selected.split('-')[0], 10) : new Date().getFullYear()
  const [year, setYear] = useState(initYear)
  const todayMonth = monthStart(today())

  const months = Array.from({ length: 12 }, (_, i) => {
    const m   = String(i + 1).padStart(2, '0')
    const iso = `${year}-${m}-01`
    return { iso, name: MONTH_NAMES[i] }
  })

  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-liner)' }}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setYear(y => y - 1)} className="text-ash hover:text-snow text-sm px-1">‹</button>
        <span className="text-[12px] text-snow">{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="text-ash hover:text-snow text-sm px-1">›</button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {months.map(({ iso, name }) => (
          <button
            key={iso}
            onClick={() => onSelect(iso)}
            className={`py-1.5 rounded text-[12px] transition-colors text-center ${
              iso === selected
                ? 'bg-gold text-bg font-medium'
                : iso === todayMonth
                  ? 'border border-gold text-gold'
                  : 'text-ash hover:bg-liner hover:text-snow'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Tag row with custom-tag management ── */
function TagSelector({ tag, setTag }) {
  const { customTags, addCustomTag, removeCustomTag, getTagColor } = useTrackerContext()
  const [creating, setCreating]   = useState(false)
  const [newName,  setNewName]    = useState('')
  const [newColor, setNewColor]   = useState(CUSTOM_TAG_PALETTE[0])
  const nameRef = useRef(null)

  useEffect(() => { if (creating) nameRef.current?.focus() }, [creating])

  function submitNew() {
    const n = newName.trim()
    if (!n) { setCreating(false); return }
    addCustomTag(n, newColor)
    setTag(n)
    setNewName('')
    setCreating(false)
  }

  const allTags = [
    ...DEFAULT_TAG_LIST.map(name => ({ name, color: getTagColor(name), custom: false })),
    ...customTags.map(t => ({ name: t.name, color: t.color, custom: true, id: t.id })),
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {allTags.map(t => {
          const selected = tag === t.name
          return (
            <div key={t.name} className="relative group/tag">
              <button
                onClick={() => setTag(selected ? '' : t.name)}
                className="text-[11px] px-2.5 py-1 rounded-full transition-all pr-3"
                style={{
                  color:      selected ? 'var(--color-bg)' : t.color,
                  background: selected ? t.color   : `${t.color}1a`,
                  border:     `1px solid ${selected ? t.color : 'transparent'}`,
                }}
              >
                {t.name}
              </button>
              {/* Remove custom tag */}
              {t.custom && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    removeCustomTag(t.id)
                    if (tag === t.name) setTag('')
                  }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-surface border border-liner text-coal hover:text-ash hidden group-hover/tag:flex items-center justify-center text-[9px] leading-none"
                  aria-label={`Remove ${t.name}`}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}

        {/* Add tag button */}
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="text-[11px] px-2.5 py-1 rounded-full text-coal hover:text-ash border border-dashed border-coal hover:border-ash transition-colors"
          >
            + New
          </button>
        )}
      </div>

      {/* Inline new-tag form */}
      {creating && (
        <div className="rounded-lg p-3 mt-1" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-liner)' }}>
          <input
            ref={nameRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitNew(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
            placeholder="Tag name…"
            className="w-full bg-transparent text-[12px] text-snow placeholder-coal outline-none border-b border-liner mb-3 pb-1"
            style={{ fontFamily: 'inherit' }}
          />
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CUSTOM_TAG_PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c,
                  boxShadow:  newColor === c ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${c}` : 'none',
                }}
                aria-label={c}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={submitNew}
              disabled={!newName.trim()}
              className="flex-1 py-1.5 rounded text-[12px] transition-colors"
              style={{
                background: newName.trim() ? newColor : 'var(--color-liner)',
                color:      newName.trim() ? 'var(--color-bg)' : 'var(--color-coal)',
              }}
            >
              Add tag
            </button>
            <button
              onClick={() => { setCreating(false); setNewName('') }}
              className="px-3 py-1.5 rounded text-[12px] text-coal hover:text-ash hover:bg-liner transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main modal ── */
export function AddModal() {
  const { isModalOpen, setIsModalOpen, currentDate, addItem, addRecurringTask, view } = useTrackerContext()

  const defaultScope = view === 'year' ? 'year' : view === 'week' ? 'week' : 'day'

  const [type,     setType]     = useState('task')
  const [scope,    setScope]    = useState(defaultScope)
  const [goalType, setGoalType] = useState('quantified')
  const [title,    setTitle]    = useState('')
  const [tag,      setTag]      = useState('')
  const [priority, setPriority] = useState('normal')
  const [date,     setDate]     = useState(currentDate)
  const [target,    setTarget]    = useState(100)
  const [unit,      setUnit]      = useState('')
  const [time,      setTime]      = useState('')
  const [recurring, setRecurring] = useState(null)

  useEffect(() => {
    if (isModalOpen) {
      const sc = view === 'year' ? 'year' : view === 'week' ? 'week' : 'day'
      setType('task'); setScope(sc); setGoalType('quantified')
      setTitle(''); setTag(''); setPriority('normal')
      setDate(currentDate)
      setTarget(100); setUnit(''); setTime(''); setRecurring(null)
    }
  }, [isModalOpen, view, currentDate])

  useEffect(() => {
    if (!isModalOpen) return
    const handler = e => { if (e.key === 'Escape') setIsModalOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isModalOpen, setIsModalOpen])

  // When scope changes to month, normalise date to month start
  useEffect(() => {
    if (scope === 'month') setDate(d => monthStart(d))
    if (scope === 'week')  setDate(d => weekStart(d))
  }, [scope])

  function submit() {
    if (!title.trim()) return
    const payload = { type, scope, title: title.trim(), tag, date, priority }
    if (scope !== 'year' && time) payload.time = time
    if (scope === 'year') {
      payload.goalType = goalType
      if (goalType === 'quantified') { payload.target = target; payload.unit = unit }
    }
    if (recurring && scope !== 'year') {
      addRecurringTask({ ...payload, recurring })
    } else {
      addItem(payload)
    }
    setIsModalOpen(false)
  }

  if (!isModalOpen) return null

  const canSubmit = title.trim().length > 0

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
    >
      <div
        className="modal-sheet w-full max-w-md rounded-2xl p-6 overflow-y-auto"
        style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-liner)', maxHeight: 'min(92dvh, 92vh)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[13px] font-medium text-snow uppercase tracking-wider">Add Item</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded text-coal hover:text-ash hover:bg-liner transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Type */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Type</p>
          <SegControl options={TYPES} value={type} onChange={setType} />
        </div>

        {/* Scope */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Scope</p>
          <SegControl
            options={SCOPES}
            value={scope}
            onChange={setScope}
            accentSelected
            format={s => s === 'year' ? 'annual' : s}
          />
        </div>

        {/* Goal type — only for year + goal */}
        {scope === 'year' && type === 'goal' && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Goal type</p>
            <SegControl options={GOAL_TYPES} value={goalType} onChange={setGoalType} format={g => g === 'one-time' ? 'one-time' : g} />
          </div>
        )}

        {/* Date picker — day scope */}
        {scope === 'day' && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Date</p>
            <MiniCalendar selected={date} onSelect={setDate} />
          </div>
        )}

        {/* Time — optional, all non-annual scopes */}
        {scope !== 'year' && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Time <span className="normal-case opacity-60">(optional)</span></p>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="bg-transparent text-[13px] text-snow outline-none border-b border-liner py-1 focus:border-ash transition-colors"
              style={{ fontFamily: 'inherit', colorScheme: 'dark' }}
            />
          </div>
        )}

        {/* Repeat — non-annual tasks only */}
        {scope !== 'year' && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Repeat</p>
            <div className="flex gap-1.5 flex-wrap">
              {[null, 'daily', 'weekly', 'monthly'].map(opt => (
                <button
                  key={String(opt)}
                  onClick={() => setRecurring(opt)}
                  className="px-3 py-1 rounded text-[12px] capitalize transition-colors"
                  style={{
                    background: recurring === opt ? 'var(--color-gold)' : 'var(--color-liner)',
                    color:      recurring === opt ? 'var(--color-bg)'   : 'var(--color-ash)',
                  }}
                >
                  {opt === null ? 'None' : opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Week picker */}
        {scope === 'week' && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Week</p>
            <WeekPicker selected={date} onSelect={setDate} />
          </div>
        )}

        {/* Month picker */}
        {scope === 'month' && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Month</p>
            <MonthPicker selected={date} onSelect={setDate} />
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Title</p>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder={type === 'note' ? 'Write a note…' : `Add a ${type}…`}
            className="w-full bg-transparent text-[13px] text-snow placeholder-coal outline-none border-b border-liner py-2 focus:border-ash transition-colors"
            style={{ fontFamily: 'inherit' }}
          />
        </div>

        {/* Target + unit — quantified annual goal */}
        {scope === 'year' && type === 'goal' && goalType === 'quantified' && (
          <div className="mb-4 flex gap-3">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Target</p>
              <input
                type="number"
                min={1}
                value={target}
                onChange={e => setTarget(Number(e.target.value))}
                className="w-full bg-transparent text-[13px] text-snow outline-none border-b border-liner py-1 focus:border-ash transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Unit (optional)</p>
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="km, books…"
                className="w-full bg-transparent text-[13px] text-snow placeholder-coal outline-none border-b border-liner py-1 focus:border-ash transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
          </div>
        )}

        {/* Tag */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Tag</p>
          <TagSelector tag={tag} setTag={setTag} />
        </div>

        {/* Priority */}
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2">Priority</p>
          <SegControl options={PRIORITIES} value={priority} onChange={setPriority} />
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-2.5 rounded-xl text-[13px] font-medium transition-all"
          style={{
            background: canSubmit ? 'var(--color-gold)' : 'var(--color-liner)',
            color:      canSubmit ? 'var(--color-bg)' : 'var(--color-coal)',
            cursor:     canSubmit ? 'pointer' : 'default',
          }}
        >
          Add {scope === 'year' && type === 'goal' ? goalType + ' goal' : type}
        </button>
      </div>
    </div>
  )
}
