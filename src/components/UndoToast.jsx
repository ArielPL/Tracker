import { useTrackerContext } from '../context/TrackerContext'

export function UndoToast() {
  const { undoStack, undoDelete } = useTrackerContext()

  if (!undoStack) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="bg-surface2 text-snow text-[12px] px-4 py-2 rounded-full shadow-lg flex items-center gap-3 relative overflow-hidden">
        <span style={{ color: 'var(--color-ash)' }}>Deleted</span>
        <span style={{ color: 'var(--color-coal)' }}>·</span>
        <button
          onClick={undoDelete}
          className="font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-gold)' }}
        >
          Undo
        </button>

        {/* 4-second countdown bar */}
        <span
          key={undoStack.item?.id ?? undoStack.goal?.id}
          className="absolute bottom-0 left-0 h-[2px] undo-progress"
          style={{ background: 'var(--color-gold)' }}
        />
      </div>
    </div>
  )
}
