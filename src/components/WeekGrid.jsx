import { useTrackerContext } from '../context/TrackerContext'
import { weekStart, weekDays, parseDate, isToday } from '../utils/dates'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function WeekGrid() {
  const { currentDate, setCurrentDate, setView, contentDots, entries } = useTrackerContext()
  const days = weekDays(weekStart(currentDate))

  function handleClick(iso) {
    setCurrentDate(iso, iso < currentDate ? -1 : 1)
    setView('day')
  }

  return (
    <div>
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((lbl, i) => (
          <div key={i} className="text-center text-[10px] text-coal py-1">{lbl}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(iso => {
          const d        = parseDate(iso)
          const todayDay = isToday(iso)
          const active   = iso === currentDate
          const dots     = contentDots(iso, 4)
          const hasNotes = (entries[iso]?.notes?.length ?? 0) > 0

          return (
            <button
              key={iso}
              onClick={() => handleClick(iso)}
              className={`flex flex-col items-center py-1 rounded transition-colors ${
                todayDay
                  ? 'border border-gold'
                  : active
                    ? 'bg-liner'
                    : 'hover:bg-surface2'
              }`}
            >
              {/* Note indicator */}
              <div className="h-[6px] flex items-center justify-center">
                {hasNotes && (
                  <span className="w-[5px] h-[5px] rounded-[1px]" style={{ background: '#fef3c7' }} />
                )}
              </div>
              <span className={`text-[12px] ${todayDay ? 'text-gold font-medium' : 'text-ash'}`}>
                {d.getDate()}
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
    </div>
  )
}
