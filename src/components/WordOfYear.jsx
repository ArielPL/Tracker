import { useState } from 'react'
import { useTrackerContext } from '../context/TrackerContext'

export function WordOfYear() {
  const { settings, updateSettings } = useTrackerContext()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')

  function startEdit() {
    setDraft(settings.wordOfYear ?? '')
    setEditing(true)
  }

  function commit() {
    updateSettings({ wordOfYear: draft.trim().toUpperCase() })
    setEditing(false)
  }

  const word = settings.wordOfYear

  return (
    <div
      className="p-4 rounded-lg text-center"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-liner)' }}
    >
      <p className="text-[10px] uppercase tracking-[0.15em] text-coal mb-2">Word of the Year</p>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter')  commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          maxLength={20}
          placeholder="WORD"
          className="w-full text-center text-2xl font-bold tracking-[0.1em] uppercase bg-transparent outline-none text-gold placeholder-coal"
          style={{ fontFamily: 'Georgia, serif' }}
        />
      ) : (
        <button
          onClick={startEdit}
          title="Click to edit"
          className={`text-2xl font-bold tracking-[0.1em] uppercase transition-colors ${
            word ? 'text-gold hover:text-[#f0d998]' : 'text-coal hover:text-ash'
          }`}
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {word || 'Set your word'}
        </button>
      )}
    </div>
  )
}
