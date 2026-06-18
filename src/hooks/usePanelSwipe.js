import { useRef, useState } from 'react'

export function usePanelSwipe(panelCount) {
  const [panel, setPanel] = useState(0)
  const startX = useRef(null)
  const startY = useRef(null)

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }

  function onTouchEnd(e) {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) setPanel(p => Math.min(p + 1, panelCount - 1))
      else        setPanel(p => Math.max(p - 1, 0))
    }
    startX.current = null
    startY.current = null
  }

  return { panel, setPanel, onTouchStart, onTouchEnd }
}
