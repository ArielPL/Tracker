import { useState, useRef, useEffect } from 'react'
import { Canvas }             from './Canvas'
import { RightPanelContent }  from './RightPanel'
import { usePanelSwipe }      from '../hooks/usePanelSwipe'
import { useTrackerContext }   from '../context/TrackerContext'
import { formatDateHeader }    from '../utils/dates'

// ── Sticky note colours ────────────────────────────────────────────────────
const NOTE_COLORS = ['#fef3c7', '#fde68a', '#fef9c3', '#fef2f2', '#f0fdf4']

function NoteCard({ note, dateKey, colorIdx }) {
  const { deleteNote, updateNote } = useTrackerContext()
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(note.text)
  const textRef = useRef(null)
  const bg = NOTE_COLORS[colorIdx % NOTE_COLORS.length]

  useEffect(() => {
    if (editing) {
      textRef.current?.focus()
      textRef.current?.select()
    }
  }, [editing])

  function startEdit() { setDraft(note.text); setEditing(true) }

  function commit() {
    const t = draft.trim()
    if (!t) { deleteNote(dateKey, note.id); return }
    if (t !== note.text) updateNote(dateKey, note.id, t)
    setEditing(false)
  }

  return (
    <div
      className="relative group rounded-md p-3 overflow-hidden"
      style={{ background: bg, minHeight: 90 }}
      onDoubleClick={startEdit}
    >
      {editing ? (
        <textarea
          ref={textRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Escape') { setDraft(note.text); setEditing(false) }
          }}
          className="w-full h-full bg-transparent text-[12px] leading-snug resize-none outline-none cursor-text"
          style={{ color: '#1c1917', fontFamily: 'inherit', minHeight: 70 }}
        />
      ) : (
        <p
          className="text-[12px] leading-snug break-words overflow-hidden cursor-default"
          style={{ color: '#1c1917', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' }}
        >
          {note.text}
        </p>
      )}

      {!editing && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); startEdit() }}
            aria-label="Edit note"
            className="w-5 h-5 flex items-center justify-center text-[#92400e] hover:text-[#1c1917] transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5l2 2L3 11H1V9L8.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); deleteNote(dateKey, note.id) }}
            aria-label="Delete note"
            className="w-5 h-5 flex items-center justify-center text-[#92400e] hover:text-[#1c1917] transition-colors text-sm leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

function AddNoteCard({ dateKey }) {
  const { addNote } = useTrackerContext()
  const [adding, setAdding] = useState(false)
  const [text,   setText]   = useState('')
  const ref = useRef(null)

  useEffect(() => { if (adding) ref.current?.focus() }, [adding])

  function submit() {
    const t = text.trim()
    if (t) addNote(dateKey, t)
    setText('')
    setAdding(false)
  }

  if (adding) {
    return (
      <div className="rounded-md p-3" style={{ background: NOTE_COLORS[0], minHeight: 90 }}>
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={submit}
          onKeyDown={e => {
            if (e.key === 'Escape') { setText(''); setAdding(false) }
          }}
          placeholder="Write a note…"
          className="w-full bg-transparent text-[12px] leading-snug resize-none outline-none"
          style={{ color: '#1c1917', fontFamily: 'inherit', minHeight: 70 }}
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="rounded-md border-2 border-dashed flex items-center justify-center transition-colors hover:border-ash"
      style={{ borderColor: 'var(--color-coal)', minHeight: 90 }}
      aria-label="Add note"
    >
      <span className="text-2xl text-coal leading-none">+</span>
    </button>
  )
}

function MobileNotesPanel() {
  const { currentDate, getEntry } = useTrackerContext()
  const notes = getEntry(currentDate).notes ?? []

  return (
    <div className="p-4">
      <p
        className="text-[9px] uppercase tracking-[0.14em] mb-4"
        style={{ color: 'var(--color-coal)' }}
      >
        Notes · {formatDateHeader(currentDate)}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {notes.map((note, i) => (
          <NoteCard key={note.id} note={note} dateKey={currentDate} colorIdx={i} />
        ))}
        <AddNoteCard dateKey={currentDate} />
      </div>
    </div>
  )
}

// ── Panel carousel ─────────────────────────────────────────────────────────

const PANELS = ['Tasks', 'Notes', 'Feed']

export function MobilePanels() {
  const { panel, setPanel, onTouchStart, onTouchEnd } = usePanelSwipe(PANELS.length)

  return (
    <div className="flex flex-col h-full">
      {/* Panel indicator dots with labels */}
      <div
        className="flex justify-center gap-0 flex-none py-2"
        style={{ borderBottom: '1px solid var(--color-liner)' }}
      >
        {PANELS.map((label, i) => (
          <button
            key={label}
            onClick={() => setPanel(i)}
            className="flex flex-col items-center gap-1 px-4 py-1"
          >
            <span
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: panel === i ? 'var(--color-gold)' : 'var(--color-liner)' }}
            />
            <span
              className="text-[9px] uppercase tracking-wider transition-colors"
              style={{ color: panel === i ? 'var(--color-gold)' : 'var(--color-coal)' }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Sliding container */}
      <div
        className="flex-1 overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${panel * 33.333}%)`, width: '300%' }}
        >
          {/* Panel 0: Tasks & Goals */}
          <div className="h-full overflow-y-auto flex-none" style={{ width: '33.333%' }}>
            <Canvas />
          </div>

          {/* Panel 1: Notes */}
          <div className="h-full overflow-y-auto flex-none" style={{ width: '33.333%' }}>
            <MobileNotesPanel />
          </div>

          {/* Panel 2: Feed & Upcoming */}
          <div className="h-full overflow-y-auto flex-none" style={{ width: '33.333%' }}>
            <RightPanelContent />
          </div>
        </div>
      </div>
    </div>
  )
}
