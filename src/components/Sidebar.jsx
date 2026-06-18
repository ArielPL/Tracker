import { useTrackerContext } from '../context/TrackerContext'
import { YearGoalMini }      from './YearGoalCard'
import {
  today, addDays, weekStart, addWeeks, monthStart, addMonths,
  parseDate, weekNumber, isToday,
} from '../utils/dates'

const DAYS_S   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function CheckIcon({ color }) {
  return (
    <div
      className="flex-none w-3 h-3 rounded border-[1.5px] flex items-center justify-center"
      style={{ borderColor: color, background: color }}
    >
      <svg width="6" height="5" viewBox="0 0 9 7" fill="none">
        <path d="M1 3.5l2.5 2.5 4.5-5" stroke="var(--color-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ── Scroll-wheel date picker section ──────────────────────────────────────── */
export function WheelSection({ label, items, onPrev, onNext, onSelect }) {
  return (
    <div className="mb-5">
      <p className="text-[9px] uppercase tracking-[0.14em] text-coal mb-1 px-3">{label}</p>

      {/* Up arrow */}
      <button
        onClick={onPrev}
        className="wheel-arrow w-full flex justify-center py-0.5 text-coal hover:text-ash transition-colors"
        aria-label={`Previous ${label}`}
      >
        <svg width="9" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 5l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Items — index 2 is the active center */}
      {items.map((item, i) => {
        const isCenter = i === 2
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item)}
            className={`wheel-item w-full text-left px-3 py-[3px] rounded text-[11px] transition-colors ${
              isCenter
                ? 'bg-liner text-snow font-medium'
                : 'text-coal hover:text-ash hover:bg-surface2'
            }`}
          >
            <span style={item.isRef && !isCenter ? { color: 'var(--color-gold)' } : {}}>
              {item.label}
            </span>
          </button>
        )
      })}

      {/* Down arrow */}
      <button
        onClick={onNext}
        className="wheel-arrow w-full flex justify-center py-0.5 text-coal hover:text-ash transition-colors"
        aria-label={`Next ${label}`}
      >
        <svg width="9" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}

export function Sidebar() {
  const {
    currentDate, setCurrentDate, setView,
    annualGoals, entries, getTagColor,
  } = useTrackerContext()

  const t  = today()
  const ws = weekStart(currentDate)
  const ms = monthStart(currentDate)
  const thisMonthStart = monthStart(t)

  // ── Day wheel: 5 days centered on currentDate ──
  const dayItems = [-2, -1, 0, 1, 2].map(offset => {
    const iso = addDays(currentDate, offset)
    const d   = parseDate(iso)
    return {
      key:   iso,
      iso,
      label: `${DAYS_S[d.getDay()]}  ${d.getDate()} ${MONTHS_S[d.getMonth()]}`,
      isRef: isToday(iso),
      dir:   offset < 0 ? -1 : offset > 0 ? 1 : 0,
      view:  'day',
    }
  })

  // ── Week wheel: 5 weeks centered on weekStart(currentDate) ──
  const weekItems = [-2, -1, 0, 1, 2].map(offset => {
    const wISO = addWeeks(ws, offset)
    const d    = parseDate(wISO)
    return {
      key:   wISO,
      iso:   wISO,
      label: `W${weekNumber(wISO)}  ${MONTHS_S[d.getMonth()]} ${d.getDate()}`,
      isRef: weekStart(t) === wISO,
      dir:   offset < 0 ? -1 : offset > 0 ? 1 : 0,
      view:  'week',
    }
  })

  // ── Month wheel: 5 months centered on monthStart(currentDate) ──
  const monthItems = [-2, -1, 0, 1, 2].map(offset => {
    const mISO = monthStart(addMonths(ms, offset))
    const d    = parseDate(mISO)
    return {
      key:   mISO,
      iso:   mISO,
      label: `${MONTHS_S[d.getMonth()]} ${d.getFullYear()}`,
      isRef: monthStart(t) === mISO,
      dir:   offset < 0 ? -1 : offset > 0 ? 1 : 0,
      view:  'month',
    }
  })

  function goItem(item) {
    setCurrentDate(item.iso, item.dir)
    setView(item.view)
  }

  // ── Completed this month ──
  const completedItems = []
  for (const [key, entry] of Object.entries(entries)) {
    if (!entry) continue
    if (monthStart(key) !== thisMonthStart) continue
    const done = [
      ...(entry.tasks ?? []).filter(i => i.done),
      ...(entry.goals ?? []).filter(i => i.done),
    ]
    completedItems.push(...done)
  }

  return (
    <aside
      className="hidden lg:flex flex-col h-full overflow-y-auto"
      style={{ borderRight: '1px solid var(--color-liner)', background: 'var(--color-panel)' }}
    >
      {/* Scroll-wheel date pickers */}
      <div className="p-4 pt-5">
        <WheelSection
          label="Day"
          items={dayItems}
          onPrev={() => goItem(dayItems[1])}
          onNext={() => goItem(dayItems[3])}
          onSelect={goItem}
        />
        <WheelSection
          label="Week"
          items={weekItems}
          onPrev={() => goItem(weekItems[1])}
          onNext={() => goItem(weekItems[3])}
          onSelect={goItem}
        />
        <WheelSection
          label="Month"
          items={monthItems}
          onPrev={() => goItem(monthItems[1])}
          onNext={() => goItem(monthItems[3])}
          onSelect={goItem}
        />
      </div>

      <div className="mx-4 border-t" style={{ borderColor: 'var(--color-liner)' }} />

      {/* Annual goal mini-bars */}
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-3 px-1">Annual Goals</p>
        {annualGoals.length === 0
          ? <p className="text-[11px] text-coal px-1">No goals yet.</p>
          : <div className="flex flex-col">
              {annualGoals.map(g => <YearGoalMini key={g.id} goal={g} />)}
            </div>
        }
      </div>

      {/* Completed this month */}
      {completedItems.length > 0 && (
        <>
          <div className="mx-4 border-t" style={{ borderColor: 'var(--color-liner)' }} />
          <div className="p-4 pb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
              <p className="text-[10px] uppercase tracking-[0.12em] text-coal">Completed</p>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-liner)', color: 'var(--color-sage)' }}
              >
                {completedItems.length}
              </span>
            </div>
            <div className="flex flex-col">
              {completedItems.map((item, i) => (
                <div key={item.id ?? i} className="flex items-center gap-2 py-1 px-1">
                  <CheckIcon color={getTagColor(item.tag)} />
                  <span className="text-[11px] text-coal line-through truncate flex-1">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
