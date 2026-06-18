import { useState, useRef, useEffect } from 'react'
import { useTrackerContext } from '../context/TrackerContext'

export function TaskRow({ item, dateKey, listType }) {
  const { toggleDone, deleteItem, updateItem, getTagColor } = useTrackerContext()
  const [editing,    setEditing]    = useState(false)
  const [draft,      setDraft]      = useState(item.title)
  const [expanded,   setExpanded]   = useState(false)
  const inputRef = useRef(null)
  const color    = getTagColor(item.tag)
  const isNote   = item.type === 'note'

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEdit() {
    setDraft(item.title)
    setEditing(true)
  }

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.title) {
      updateItem(dateKey, listType, item.id, { title: trimmed })
    }
    setEditing(false)
  }

  function cancel() {
    setDraft(item.title)
    setEditing(false)
  }

  return (
    <div
      className="group rounded-md transition-colors hover:bg-surface2"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <div className="task-row-inner flex items-start gap-3 px-3 py-2">
        {/* Checkbox — wrapped in a larger touch target for mobile */}
        {!isNote && (
          <button
            onClick={() => toggleDone(dateKey, listType, item.id)}
            aria-label={item.done ? 'Mark undone' : 'Mark done'}
            className="task-checkbox-wrap mt-0.5 flex-none w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all"
            style={{
              borderColor: item.done ? color : '#444',
              background:  item.done ? color : 'transparent',
            }}
          >
            {item.done && (
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path d="M1 3.5l2.5 2.5 4.5-5" stroke="var(--color-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        {/* Title — inline edit on double-click or pencil */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => {
                if (e.key === 'Enter')  commit()
                if (e.key === 'Escape') cancel()
              }}
              className="w-full bg-transparent text-[13px] text-snow outline-none border-b border-ash"
              style={{ fontFamily: 'inherit' }}
            />
          ) : (
            <span
              onDoubleClick={startEdit}
              className={`text-[13px] leading-relaxed break-words cursor-text select-none ${
                item.done && !isNote ? 'task-done' : 'text-snow'
              }`}
            >
              {item.title}
              {!expanded && item.taskNote && (
                <span className="ml-1 text-[9px] text-coal select-none">■</span>
              )}
            </span>
          )}
        </div>

        {/* Right-side indicators + controls */}
        <div className="flex items-center gap-1.5 flex-none">
          {/* Time */}
          {item.time && !editing && (
            <span className="text-[10px] text-coal tabular-nums">{item.time}</span>
          )}
          {/* Tag */}
          {item.tag && !editing && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ color, background: `${color}1a` }}
            >
              {item.tag}
            </span>
          )}
          {/* Priority indicators */}
          {item.priority === 'high' && !item.done && !editing && (
            <span className="text-[11px] font-bold leading-none" style={{ color: '#ef4444' }}>!!</span>
          )}
          {item.priority === 'low' && !item.done && !editing && (
            <span className="text-[10px] tracking-widest leading-none" style={{ color: '#3b82f6' }}>zzz</span>
          )}
          {/* Edit button */}
          {!editing && (
            <button
              onClick={startEdit}
              aria-label="Edit"
              className="task-actions opacity-0 group-hover:opacity-100 transition-opacity text-coal hover:text-ash w-6 h-6 flex items-center justify-center"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5l2 2L3 11H1V9L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {/* Delete button */}
          {!editing && (
            <button
              onClick={() => deleteItem(dateKey, listType, item.id)}
              aria-label="Delete"
              className="task-actions opacity-0 group-hover:opacity-100 transition-opacity text-coal hover:text-ash text-base leading-none w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          )}
          {/* Expand/collapse note toggle */}
          {!editing && (
            <button
              onClick={() => setExpanded(v => !v)}
              aria-label={expanded ? 'Collapse note' : 'Expand note'}
              className="task-actions w-6 h-6 flex items-center justify-center text-coal hover:text-ash transition-colors opacity-0 group-hover:opacity-100"
              style={{ fontSize: 13, lineHeight: 1 }}
            >
              <span style={{ display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>›</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable note area */}
      {expanded && (
        <div className="px-3 pb-2">
          <textarea
            value={item.taskNote ?? ''}
            onChange={e => updateItem(dateKey, listType, item.id, { taskNote: e.target.value })}
            placeholder="Add a note…"
            rows={2}
            className="w-full mt-1 mb-1 text-[12px] text-ash bg-transparent border border-liner rounded px-2 py-1 resize-none outline-none focus:border-ash placeholder:text-coal transition-colors"
          />
        </div>
      )}
    </div>
  )
}
