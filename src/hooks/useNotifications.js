import { useEffect, useRef } from 'react'
import { useTrackerContext } from '../context/TrackerContext'

export function useNotifications() {
  const { entries, getEntry } = useTrackerContext()
  const timersRef = useRef([])

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    if (Notification.permission !== 'granted') return

    const todayKey = new Date().toISOString().slice(0, 10)
    const entry = getEntry(todayKey)
    const now = new Date()

    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    for (const task of [...(entry.tasks ?? []), ...(entry.goals ?? [])]) {
      if (!task.time) continue
      const [h, m] = task.time.split(':').map(Number)
      const fire = new Date()
      fire.setHours(h, m, 0, 0)
      const ms = fire - now
      if (ms <= 0) continue
      timersRef.current.push(
        setTimeout(() => new Notification(task.title, { body: 'Time to start · Tracker', icon: '/icon-192.png' }), ms)
      )
    }

    return () => timersRef.current.forEach(clearTimeout)
  }, [entries])
}
