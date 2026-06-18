export function toISO(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today() {
  return toISO(new Date())
}

// Parse ISO date without timezone issues
export function parseDate(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function weekStart(isoStr) {
  const d = parseDate(isoStr)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setDate(d.getDate() + diff)
  return toISO(d)
}

export function weekDays(weekStartISO) {
  const start = parseDate(weekStartISO)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return toISO(d)
  })
}

export function weekNumber(isoStr) {
  const d = parseDate(isoStr)
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d - startOfYear) / 86400000)
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

export function monthStart(isoStr) {
  const [y, m] = isoStr.split('-')
  return `${y}-${m}-01`
}

export function addMonths(isoStr, n) {
  const d = parseDate(isoStr)
  d.setMonth(d.getMonth() + n)
  return toISO(d)
}

export function addDays(isoStr, n) {
  const d = parseDate(isoStr)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function addWeeks(isoStr, n) {
  return addDays(isoStr, n * 7)
}

export function addYears(isoStr, n) {
  const d = parseDate(isoStr)
  d.setFullYear(d.getFullYear() + n)
  return toISO(d)
}

export function getYear(isoStr) {
  return parseInt(isoStr.split('-')[0], 10)
}

export function getMonth(isoStr) {
  return parseInt(isoStr.split('-')[1], 10)
}

export function isToday(isoStr) {
  return isoStr === today()
}

export function isSameWeek(a, b) {
  return weekStart(a) === weekStart(b)
}

const DAYS_LONG  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatDateHeader(isoStr) {
  const d = parseDate(isoStr)
  return `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`
}

export function formatShortDate(isoStr) {
  const d = parseDate(isoStr)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export function formatMonthYear(isoStr) {
  const d = parseDate(isoStr)
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

export function monthsInYear(year) {
  return MONTHS_LONG.map((name, i) => ({
    name,
    short: MONTHS_SHORT[i],
    iso: `${year}-${String(i + 1).padStart(2, '0')}-01`,
    month: i + 1,
  }))
}

// Returns 6×7 grid of { iso, day, currentMonth } for a given year/month (1-indexed)
export function calendarGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // offset to Monday start
  const start = new Date(year, month - 1, 1 - startOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return {
      iso: toISO(d),
      day: d.getDate(),
      currentMonth: d.getMonth() + 1 === month,
    }
  })
}
