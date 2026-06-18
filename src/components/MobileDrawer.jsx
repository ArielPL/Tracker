import { useTrackerContext } from '../context/TrackerContext'
import { WheelSection } from './Sidebar'
import {
  today, addDays, weekStart, addWeeks, monthStart, addMonths,
  parseDate, weekNumber, isToday,
} from '../utils/dates'

const DAYS_S   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function MobileDrawer({ open, onClose }) {
  const { currentDate, setCurrentDate, setView } = useTrackerContext()

  const t  = today()
  const ws = weekStart(currentDate)
  const ms = monthStart(currentDate)

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
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-y-auto"
        style={{
          background:   'var(--color-panel)',
          borderTop:    '1px solid var(--color-liner)',
          maxHeight:    '70vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: 'var(--color-liner)' }} />
        </div>

        <p className="text-center text-[9px] uppercase tracking-[0.18em] text-coal mb-3">Navigate</p>

        <div className="px-4 pb-6">
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
      </div>
    </>
  )
}
