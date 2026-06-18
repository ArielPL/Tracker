import { useTrackerContext } from '../context/TrackerContext'
import { WeekGrid }   from './WeekGrid'
import { WordOfYear } from './WordOfYear'
import { today, weekStart, monthStart, addDays, addWeeks } from '../utils/dates'

// ── helpers ────────────────────────────────────────────────────────────────

const MONTHS_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function getMonthLabel(isoKey) {
  const ms = monthStart(isoKey)
  const [y, m] = ms.split('-').map(Number)
  return `${MONTHS_FULL[m - 1]} ${y}`
}

function getMonthOrder(isoKey) {
  const ms = monthStart(isoKey)
  const [y, m] = ms.split('-').map(Number)
  return 1000 + (y - 2020) * 12 + m
}

function buildUpcoming(entries, todayISO) {
  const thisWeekStartISO  = weekStart(todayISO)
  const nextWeekStartISO  = addWeeks(thisWeekStartISO, 1)
  const thisMonthStartISO = monthStart(todayISO)
  const tomorrow          = addDays(todayISO, 1)
  const thisWeekEnd       = addDays(thisWeekStartISO, 6)
  const nextWeekEnd       = addDays(nextWeekStartISO, 6)

  const buckets = {} // label → { order, items[] }

  function push(label, order, item) {
    if (!buckets[label]) buckets[label] = { order, items: [] }
    buckets[label].items.push(item)
  }

  for (const [key, entry] of Object.entries(entries)) {
    if (!entry) continue

    const pending = [
      ...(entry.tasks ?? []).map(t => ({ ...t, _itemType: 'task' })),
      ...(entry.goals ?? []).map(g => ({ ...g, _itemType: 'goal' })),
    ].filter(item => !item.done)

    for (const item of pending) {
      const { scope } = item

      if (scope === 'day') {
        if (key < todayISO) continue
        if (key === todayISO)        push('Today',     0, item)
        else if (key === tomorrow)   push('Tomorrow',  1, item)
        else if (key <= thisWeekEnd) push('This Week', 2, item)
        else if (key <= nextWeekEnd) push('Next Week', 3, item)
        else                         push(getMonthLabel(key), getMonthOrder(key), item)
      } else if (scope === 'week') {
        if (key < thisWeekStartISO) continue
        if (key === thisWeekStartISO)      push('This Week', 2, item)
        else if (key === nextWeekStartISO) push('Next Week', 3, item)
        else                               push(getMonthLabel(key), getMonthOrder(key), item)
      } else if (scope === 'month') {
        if (key < thisMonthStartISO) continue
        push(getMonthLabel(key), getMonthOrder(key), item)
      }
    }
  }

  return Object.entries(buckets)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([label, { items }]) => ({ label, items }))
}

// ── sub-components ─────────────────────────────────────────────────────────

function UpcomingItem({ item, color }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div
        className="w-1.5 h-1.5 rounded-full flex-none"
        style={{ border: `1.5px solid ${color}` }}
      />
      <span className="text-[12px] text-ash flex-1 truncate">{item.title}</span>
      {item.scope !== 'day' && (
        <span className="text-[9px] text-coal flex-none capitalize">{item.scope}</span>
      )}
    </div>
  )
}

function UpcomingGroup({ label, items, getTagColor }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.14em] text-coal mb-1">{label}</p>
      <div className="flex flex-col">
        {items.map(item => (
          <UpcomingItem key={item.id} item={item} color={getTagColor(item.tag)} />
        ))}
      </div>
    </div>
  )
}

// ── RightPanelContent — shareable inner content (used by MobilePanels too) ──

export function RightPanelContent() {
  const { entries, getTagColor } = useTrackerContext()
  const todayISO = today()
  const groups   = buildUpcoming(entries, todayISO)

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Week strip */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-3">This Week</p>
        <WeekGrid />
      </section>

      <div className="border-t" style={{ borderColor: 'var(--color-liner)' }} />

      {/* Upcoming items feed */}
      {groups.length > 0 ? (
        <div className="flex flex-col gap-4">
          {groups.map(({ label, items }) => (
            <UpcomingGroup
              key={label}
              label={label}
              items={items}
              getTagColor={getTagColor}
            />
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-coal">Nothing coming up.</p>
      )}

      <div className="border-t" style={{ borderColor: 'var(--color-liner)' }} />

      {/* Word of the Year */}
      <section>
        <WordOfYear />
      </section>
    </div>
  )
}

// ── RightPanel — desktop sidebar wrapper ────────────────────────────────────

export function RightPanel() {
  return (
    <aside
      className="hidden lg:flex flex-col h-full overflow-y-auto"
      style={{ borderLeft: '1px solid var(--color-liner)', background: 'var(--color-panel)' }}
    >
      <RightPanelContent />
    </aside>
  )
}
