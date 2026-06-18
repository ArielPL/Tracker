import { useEffect } from 'react'
import { addDays, addWeeks, addMonths, addYears, weekStart, monthStart } from '../utils/dates'

export function useKeyboardShortcuts({
  view, currentDate, setCurrentDate, setView,
  setIsModalOpen, isModalOpen,
  isSearchOpen, setIsSearchOpen,
  isFocusMode, setIsFocusMode,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

      // Cmd+K / Ctrl+K — open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
        return
      }

      // Escape — close any open modal/search
      if (e.key === 'Escape') {
        if (isSearchOpen) { setIsSearchOpen(false); return }
        if (isModalOpen)  { setIsModalOpen(false);  return }
        return
      }

      // Arrow navigation
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const dir = e.key === 'ArrowLeft' ? -1 : 1
        if (view === 'day')   { setCurrentDate(addDays(currentDate, dir), dir); return }
        if (view === 'week')  { setCurrentDate(weekStart(addWeeks(currentDate, dir)), dir); return }
        if (view === 'month') { setCurrentDate(monthStart(addMonths(currentDate, dir)), dir); return }
        if (view === 'year')  { setCurrentDate(addYears(currentDate, dir), dir); return }
        return
      }

      // Single-letter shortcuts — skip when any modal is open
      if (isModalOpen || isSearchOpen) return

      if (e.key === 'f' || e.key === 'F') { setIsFocusMode(prev => !prev); return }
      if (e.key === 'n' || e.key === 'N') { setIsModalOpen(true); return }
      if (e.key === 'd' || e.key === 'D') { setView('day');   return }
      if (e.key === 'w' || e.key === 'W') { setView('week');  return }
      if (e.key === 'm' || e.key === 'M') { setView('month'); return }
      if (e.key === 'y' || e.key === 'Y') { setView('year');  return }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [view, currentDate, setCurrentDate, setView, setIsModalOpen, isModalOpen, isSearchOpen, setIsSearchOpen, isFocusMode, setIsFocusMode])
}
