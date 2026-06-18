import { useState, useRef, useEffect } from 'react'
import { useTrackerContext } from '../context/TrackerContext'
import {
  addDays, addWeeks, addMonths, addYears,
  formatShortDate, formatMonthYear, calendarGrid,
  getYear, getMonth, parseDate, toISO, monthStart,
} from '../utils/dates'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function DateNav() {
  const { view, currentDate, setCurrentDate, contentDots } = useTrackerContext()
  const [open, setOpen]           = useState(false)
  const [pickerISO, setPickerISO] = useState(currentDate)
  const ref = useRef(null)

  // Close picker on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function step(dir) {
    if (view === 'day')   setCurrentDate(addDays(currentDate, dir), dir)
    if (view === 'week')  setCurrentDate(addWeeks(currentDate, dir), dir)
    if (view === 'month') setCurrentDate(monthStart(addMonths(currentDate, dir)), dir)
    if (view === 'year')  setCurrentDate(addYears(currentDate, dir), dir)
  }

  function openPicker() {
    setPickerISO(currentDate)
    setOpen(v => !v)
  }

  function pickerNav(dir) {
    const d = parseDate(pickerISO)
    d.setMonth(d.getMonth() + dir)
    setPickerISO(toISO(d))
  }

  function selectDay(iso) {
    setCurrentDate(iso, iso < currentDate ? -1 : 1)
    setOpen(false)
  }

  const year  = getYear(pickerISO)
  const month = getMonth(pickerISO)
  const grid  = calendarGrid(year, month)

  return (
    <div className="relative flex items-center gap-1" ref={ref}>
      <button
        onClick={() => step(-1)}
        className="w-7 h-7 flex items-center justify-center rounded text-ash hover:text-snow hover:bg-liner transition-colors"
        aria-label="Previous"
      >
        ‹
      </button>

      <button
        onClick={openPicker}
        className="text-[13px] font-medium text-snow hover:text-gold transition-colors px-2 py-1 rounded hover:bg-liner min-w-[120px] text-center"
      >
        {view === 'month' ? formatMonthYear(currentDate) : formatShortDate(currentDate)}
      </button>

      <button
        onClick={() => step(1)}
        className="w-7 h-7 flex items-center justify-center rounded text-ash hover:text-snow hover:bg-liner transition-colors"
        aria-label="Next"
      >
        ›
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 z-50 rounded-xl p-3 shadow-2xl slide-up"
          style={{
            background: 'var(--color-surface2)',
            border: '1px solid var(--color-liner)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 252,
          }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => pickerNav(-1)} className="w-6 h-6 flex items-center justify-center rounded text-ash hover:text-snow hover:bg-liner transition-colors text-sm">‹</button>
            <span className="text-[12px] font-medium text-snow">{MONTH_NAMES[month - 1]} {year}</span>
            <button onClick={() => pickerNav(1)}  className="w-6 h-6 flex items-center justify-center rounded text-ash hover:text-snow hover:bg-liner transition-colors text-sm">›</button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-coal">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {grid.map(({ iso, day, currentMonth }) => {
              const dots     = currentMonth ? contentDots(iso, 3) : []
              const selected = iso === currentDate
              return (
                <button
                  key={iso}
                  onClick={() => selectDay(iso)}
                  className={`
                    flex flex-col items-center py-1 rounded transition-colors
                    ${!currentMonth ? 'text-coal' : selected ? 'bg-gold text-bg font-medium' : 'text-ash hover:bg-liner hover:text-snow'}
                  `}
                >
                  <span className="text-[12px]">{day}</span>
                  <div className="flex gap-[1px] h-[4px] items-center">
                    {dots.map((color, i) => (
                      <span
                        key={i}
                        className="w-[2px] h-[2px] rounded-full"
                        style={{ background: selected ? 'var(--color-bg)' : color, opacity: selected ? 0.6 : 1 }}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
