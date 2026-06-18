import { useState, useRef, useEffect } from 'react'
import { useTrackerContext } from '../context/TrackerContext'
import { Sidebar }     from './Sidebar'
import { Canvas }      from './Canvas'
import { RightPanel }  from './RightPanel'
import { DateNav }     from './DateNav'
import { AddModal }    from './AddModal'
import { SearchModal } from './SearchModal'
import { ThemePicker } from './ThemePicker'
import { UndoToast }     from './UndoToast'
import { MobileDrawer }  from './MobileDrawer'
import { Tutorial }      from './Tutorial'
import { today, addDays, addWeeks, addMonths, addYears } from '../utils/dates'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useNotifications }     from '../hooks/useNotifications'
import { useSwipe }              from '../hooks/useSwipe'
import { MobilePanels }          from './MobilePanels'

const STORAGE_KEYS = {
  entries:           'tracker_entries',
  annualGoals:       'tracker_annual_goals',
  settings:          'tracker_settings',
  annualReflections: 'tracker_annual_reflections',
  customTags:        'tracker_custom_tags',
  monthWords:        'tracker_month_words',
  recurring:         'tracker_recurring',
}

function exportData() {
  const data = {}
  for (const [field, key] of Object.entries(STORAGE_KEYS)) {
    try {
      const raw = localStorage.getItem(key)
      data[field] = raw ? JSON.parse(raw) : null
    } catch {
      data[field] = null
    }
  }
  const payload = { version: 1, exportedAt: new Date().toISOString(), data }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href     = url
  a.download = `tracker-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(file) {
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result)
      if (!parsed?.data) { alert('Invalid backup file.'); return }
      if (!window.confirm('This will replace all your data. Continue?')) return
      const fieldToKey = {
        entries:           STORAGE_KEYS.entries,
        annualGoals:       STORAGE_KEYS.annualGoals,
        settings:          STORAGE_KEYS.settings,
        annualReflections: STORAGE_KEYS.annualReflections,
        customTags:        STORAGE_KEYS.customTags,
        monthWords:        STORAGE_KEYS.monthWords,
        recurring:         STORAGE_KEYS.recurring,
      }
      for (const [field, key] of Object.entries(fieldToKey)) {
        if (parsed.data[field] != null) {
          localStorage.setItem(key, JSON.stringify(parsed.data[field]))
        }
      }
      window.location.reload()
    } catch {
      alert('Failed to parse backup file.')
    }
  }
  reader.readAsText(file)
}

const VIEWS = ['day', 'week', 'month', 'year']

export function Layout() {
  const {
    view, setView, currentDate, setCurrentDate,
    setIsModalOpen, isModalOpen,
    isSearchOpen, setIsSearchOpen,
    isFocusMode, setIsFocusMode,
    streak,
  } = useTrackerContext()

  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('tracker_onboarded'))
  const [tutorialStep, setTutorialStep] = useState(0)

  function completeTutorial() {
    localStorage.setItem('tracker_onboarded', '1')
    setShowTutorial(false)
    setTutorialStep(0)
  }

  useKeyboardShortcuts({
    view, currentDate, setCurrentDate, setView,
    setIsModalOpen, isModalOpen,
    isSearchOpen, setIsSearchOpen,
    isFocusMode, setIsFocusMode,
  })
  useNotifications()

  function navigatePeriod(dir) {
    if (view === 'day')   setCurrentDate(addDays(currentDate, dir), dir)
    if (view === 'week')  setCurrentDate(addWeeks(currentDate, dir), dir)
    if (view === 'month') setCurrentDate(addMonths(currentDate, dir), dir)
    if (view === 'year')  setCurrentDate(addYears(currentDate, dir), dir)
  }

  const { onTouchStart, onTouchEnd } = useSwipe(
    () => navigatePeriod(1),
    () => navigatePeriod(-1),
  )
  const [showThemePicker,  setShowThemePicker]  = useState(false)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)
  const themeRef = useRef(null)
  const importRef = useRef(null)

  // Live digital clock
  const [clockTime, setClockTime] = useState(() => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`
  })
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setClockTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  function goToday() {
    setCurrentDate(today(), 0)
    setView('day')
  }

  // Close theme picker on outside click
  useEffect(() => {
    if (!showThemePicker) return
    function handleClick(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setShowThemePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showThemePicker])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">

      {/* ── Titlebar ── */}
      <header
        className="flex-none flex items-center justify-between px-4 h-12 gap-4 overflow-hidden"
        style={{ borderBottom: '1px solid var(--color-liner)', background: 'var(--color-bg)' }}
      >
        {/* App name + clock */}
        <div className="flex items-center gap-3 flex-none">
          <button
            onClick={goToday}
            className="text-[13px] font-medium text-ash hover:text-snow transition-colors tracking-wider uppercase"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}
          >
            Tracker
          </button>
          <span
            className="hidden sm:block text-[11px] tabular-nums text-coal tracking-widest select-none"
            style={{ fontFamily: 'monospace' }}
          >
            {clockTime}
          </span>
          {streak > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] tabular-nums select-none" style={{ color: 'var(--color-gold)' }}>
              🔥 {streak}
            </span>
          )}
        </div>

        {/* View tabs — desktop only, hidden in focus mode */}
        <nav className={`${isFocusMode ? 'hidden' : 'hidden sm:flex'} items-center gap-0.5 p-1 rounded-lg bg-surface`}>
          {VIEWS.map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded text-[12px] capitalize transition-colors ${
                view === v ? 'bg-liner text-snow' : 'text-ash hover:text-snow'
              }`}
            >
              {v}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-none">
          {/* DateNav — desktop only, hidden in focus mode */}
          <div className={isFocusMode ? 'hidden' : 'hidden sm:flex'}>
            <DateNav />
          </div>

          {/* Export — desktop only */}
          <button
            onClick={exportData}
            className="header-desktop-only w-7 h-7 flex items-center justify-center rounded text-coal hover:text-ash hover:bg-liner transition-colors"
            title="Export data"
            aria-label="Export data"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Import — desktop only */}
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) importData(file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => importRef.current?.click()}
            className="header-desktop-only w-7 h-7 flex items-center justify-center rounded text-coal hover:text-ash hover:bg-liner transition-colors"
            title="Import data"
            aria-label="Import data"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 10V2M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Focus mode — desktop only */}
          <button
            onClick={() => setIsFocusMode(v => !v)}
            className="header-desktop-only w-7 h-7 flex items-center justify-center rounded hover:bg-liner transition-colors"
            title="Focus mode (F)"
            aria-label="Focus mode"
            style={{ color: isFocusMode ? 'var(--color-gold)' : undefined }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Tutorial help — desktop only */}
          <button
            onClick={() => { setTutorialStep(0); setShowTutorial(true) }}
            className="header-desktop-only w-7 h-7 flex items-center justify-center rounded text-coal hover:text-ash hover:bg-liner transition-colors text-[12px] font-medium"
            title="Help / tutorial"
            aria-label="Help"
          >
            ?
          </button>

          {/* Bell — desktop only, hidden on browsers without Notification API (e.g. iOS Safari) */}
          {typeof Notification !== 'undefined' && <button
            onClick={() => {
              if (Notification.permission !== 'granted') {
                Notification.requestPermission()
              }
            }}
            className="header-desktop-only w-7 h-7 flex items-center justify-center rounded text-coal hover:text-ash hover:bg-liner transition-colors"
            title={Notification.permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
            aria-label="Notifications"
          >
            {Notification.permission === 'granted' ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6v4l-1 1.5h11l-1-1.5V6C12.5 3.5 10.5 1.5 8 1.5z" fill="currentColor"/>
                <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6v4l-1 1.5h11l-1-1.5V6C12.5 3.5 10.5 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            )}
          </button>}

          {/* Theme picker */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setShowThemePicker(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded text-coal hover:text-ash hover:bg-liner transition-colors"
              aria-label="Change theme"
              title="Theme"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="5.5" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="10.5" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="11" r="1.5" fill="currentColor"/>
              </svg>
            </button>
            {showThemePicker && (
              <ThemePicker onClose={() => setShowThemePicker(false)} />
            )}
          </div>

          {/* Search button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded text-coal hover:text-ash hover:bg-liner transition-colors"
            title="Search (⌘K)"
            aria-label="Search"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Add button — desktop only (mobile uses bottom tab bar ＋) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="header-desktop-only w-7 h-7 flex items-center justify-center rounded-full text-bg font-bold text-base transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--color-gold)' }}
            aria-label="Add item"
          >
            ＋
          </button>
        </div>
      </header>

      {/* ── 3-column body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar — 200px, desktop only, hidden in focus mode */}
        <div className={isFocusMode ? 'hidden' : 'hidden lg:block flex-none w-[200px]'}>
          <Sidebar />
        </div>

        {/* Canvas — grows */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <div className="hidden sm:block h-full overflow-y-auto" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <Canvas />
          </div>
          <div className="sm:hidden h-full">
            <MobilePanels />
          </div>
        </main>

        {/* Right panel — 280px, desktop only, hidden in focus mode */}
        <div className={isFocusMode ? 'hidden' : 'hidden lg:block flex-none w-[280px]'}>
          <RightPanel />
        </div>

      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="sm:hidden flex-none flex items-center justify-around border-t bottom-tab-bar"
        style={{ borderColor: 'var(--color-liner)', background: 'var(--color-panel)' }}
      >
        {/* Calendar / drawer trigger */}
        <button
          onClick={() => setShowMobileDrawer(v => !v)}
          className={`flex-1 flex items-center justify-center py-3 transition-colors ${
            showMobileDrawer ? 'text-gold' : 'text-coal'
          }`}
          aria-label="Navigate dates"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M5 1v3M11 1v3M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <rect x="4" y="9" width="2" height="2" rx="0.5" fill="currentColor"/>
            <rect x="7" y="9" width="2" height="2" rx="0.5" fill="currentColor"/>
            <rect x="10" y="9" width="2" height="2" rx="0.5" fill="currentColor"/>
          </svg>
        </button>

        {VIEWS.map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-3 text-[11px] uppercase tracking-wider transition-colors ${
              view === v ? 'text-gold' : 'text-coal'
            }`}
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 py-3 text-[22px] text-gold leading-none"
          aria-label="Add item"
        >
          ＋
        </button>
      </nav>

      {/* Mobile drawer */}
      <MobileDrawer open={showMobileDrawer} onClose={() => setShowMobileDrawer(false)} />

      {/* Modals */}
      <AddModal />
      <SearchModal />

      <UndoToast />

      {showTutorial && (
        <Tutorial step={tutorialStep} setStep={setTutorialStep} onComplete={completeTutorial} />
      )}
    </div>
  )
}
