import { createContext, useContext } from 'react'
import { useTracker } from '../hooks/useTracker'

export const TrackerContext = createContext(null)

export function TrackerProvider({ children }) {
  const tracker = useTracker()
  return (
    <TrackerContext.Provider value={tracker}>
      {children}
    </TrackerContext.Provider>
  )
}

export function useTrackerContext() {
  return useContext(TrackerContext)
}
