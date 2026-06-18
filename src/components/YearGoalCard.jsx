import { useState, useRef, useEffect } from 'react'
import { useTrackerContext } from '../context/TrackerContext'

/* ── One-time goal (checkbox) ── */
function OneTimeCard({ goal, color, onEdit, onDelete }) {
  const { toggleAnnualGoalDone, updateAnnualGoal } = useTrackerContext()
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(goal.title)
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== goal.title) updateAnnualGoal(goal.id, { title: trimmed })
    setEditing(false)
  }
  function cancel() { setDraft(goal.title); setEditing(false) }

  return (
    <div
      className="p-4 rounded-lg group"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-liner)', borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={() => toggleAnnualGoalDone(goal.id)}
          className="flex-none w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all"
          style={{ borderColor: goal.done ? color : '#444', background: goal.done ? color : 'transparent' }}
          aria-label={goal.done ? 'Mark undone' : 'Mark done'}
        >
          {goal.done && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5l2.5 2.5 4.5-5" stroke="var(--color-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
              className="w-full bg-transparent text-[13px] text-snow outline-none border-b border-ash"
              style={{ fontFamily: 'inherit' }}
            />
          ) : (
            <p
              onDoubleClick={() => { setDraft(goal.title); setEditing(true) }}
              className={`text-[13px] font-medium truncate cursor-text ${goal.done ? 'line-through text-coal' : 'text-snow'}`}
            >
              {goal.title}
            </p>
          )}
          {goal.tag && <p className="text-[11px] mt-0.5" style={{ color }}>{goal.tag}</p>}
        </div>

        {/* Controls */}
        {!editing && (
          <div className="flex items-center gap-2 flex-none opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setDraft(goal.title); setEditing(true) }} aria-label="Edit" className="text-coal hover:text-ash">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5l2 2L3 11H1V9L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={onDelete} aria-label="Delete" className="text-coal hover:text-ash text-base leading-none">×</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Quantified goal (slider) ── */
function QuantifiedCard({ goal, color, onDelete }) {
  const { updateAnnualGoalProgress, updateAnnualGoal } = useTrackerContext()
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(goal.title)
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== goal.title) updateAnnualGoal(goal.id, { title: trimmed })
    setEditing(false)
  }
  function cancel() { setDraft(goal.title); setEditing(false) }

  const pct = Math.min(100, Math.round((goal.progress / Math.max(1, goal.target)) * 100))

  return (
    <div
      className="p-4 rounded-lg group"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-liner)', borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-3">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
              className="w-full bg-transparent text-[13px] text-snow font-medium outline-none border-b border-ash"
              style={{ fontFamily: 'inherit' }}
            />
          ) : (
            <p onDoubleClick={() => { setDraft(goal.title); setEditing(true) }} className="text-[13px] text-snow font-medium truncate cursor-text">
              {goal.title}
            </p>
          )}
          {goal.tag && <p className="text-[11px] mt-0.5" style={{ color }}>{goal.tag}</p>}
        </div>
        <div className="flex items-center gap-2 flex-none">
          <span className="text-sm font-medium" style={{ color }}>{pct}%</span>
          {!editing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <button onClick={() => { setDraft(goal.title); setEditing(true) }} aria-label="Edit" className="text-coal hover:text-ash">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 1.5l2 2L3 11H1V9L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={onDelete} aria-label="Delete" className="text-coal hover:text-ash text-base leading-none">×</button>
            </div>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-liner overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={goal.target}
          value={goal.progress}
          onChange={e => updateAnnualGoalProgress(goal.id, Number(e.target.value))}
          className="flex-1"
          style={{ color }}
          aria-label="Update progress"
        />
        <span className="text-[11px] text-coal whitespace-nowrap">
          {goal.progress} / {goal.target}{goal.unit ? ` ${goal.unit}` : ''}
        </span>
      </div>
    </div>
  )
}

/* ── Milestone goal (steps) ── */
function MilestoneCard({ goal, color, onDelete }) {
  const { addAnnualGoalStep, toggleAnnualGoalStep, removeAnnualGoalStep, updateAnnualGoal } = useTrackerContext()
  const [editing,  setEditing]  = useState(false)
  const [draft,    setDraft]    = useState(goal.title)
  const [newStep,  setNewStep]  = useState('')
  const [addingStep, setAddingStep] = useState(false)
  const titleRef = useRef(null)
  const stepRef  = useRef(null)

  useEffect(() => { if (editing) titleRef.current?.select() }, [editing])
  useEffect(() => { if (addingStep) stepRef.current?.focus() }, [addingStep])

  function commitTitle() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== goal.title) updateAnnualGoal(goal.id, { title: trimmed })
    setEditing(false)
  }
  function cancelTitle() { setDraft(goal.title); setEditing(false) }

  function submitStep() {
    const trimmed = newStep.trim()
    if (trimmed) addAnnualGoalStep(goal.id, trimmed)
    setNewStep('')
    setAddingStep(false)
  }

  const steps   = goal.steps ?? []
  const done    = steps.filter(s => s.done).length
  const pct     = steps.length === 0 ? 0 : Math.round((done / steps.length) * 100)

  return (
    <div
      className="p-4 rounded-lg group"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-liner)', borderLeft: `3px solid ${color}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-3">
          {editing ? (
            <input
              ref={titleRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') cancelTitle() }}
              className="w-full bg-transparent text-[13px] text-snow font-medium outline-none border-b border-ash"
              style={{ fontFamily: 'inherit' }}
            />
          ) : (
            <p onDoubleClick={() => { setDraft(goal.title); setEditing(true) }} className="text-[13px] text-snow font-medium truncate cursor-text">
              {goal.title}
            </p>
          )}
          {goal.tag && <p className="text-[11px] mt-0.5" style={{ color }}>{goal.tag}</p>}
        </div>
        <div className="flex items-center gap-2 flex-none">
          {steps.length > 0 && <span className="text-[11px] font-medium" style={{ color }}>{done}/{steps.length}</span>}
          {!editing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <button onClick={() => { setDraft(goal.title); setEditing(true) }} aria-label="Edit" className="text-coal hover:text-ash">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 1.5l2 2L3 11H1V9L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={onDelete} aria-label="Delete" className="text-coal hover:text-ash text-base leading-none">×</button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="h-1 rounded-full bg-liner overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}

      {/* Steps */}
      <div className="flex flex-col gap-1 mb-2">
        {steps.map(step => (
          <div key={step.id} className="flex items-center gap-2 group/step">
            <button
              onClick={() => toggleAnnualGoalStep(goal.id, step.id)}
              className="flex-none w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center transition-all"
              style={{ borderColor: step.done ? color : '#444', background: step.done ? color : 'transparent' }}
            >
              {step.done && (
                <svg width="7" height="5" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5l2.5 2.5 4.5-5" stroke="var(--color-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className={`text-[12px] flex-1 ${step.done ? 'line-through text-coal' : 'text-ash'}`}>{step.text}</span>
            <button
              onClick={() => removeAnnualGoalStep(goal.id, step.id)}
              className="opacity-0 group-hover/step:opacity-100 transition-opacity text-coal hover:text-ash text-sm leading-none"
              aria-label="Remove step"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add step */}
      {addingStep ? (
        <div className="flex items-center gap-2 mt-1">
          <input
            ref={stepRef}
            value={newStep}
            onChange={e => setNewStep(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  submitStep()
              if (e.key === 'Escape') { setNewStep(''); setAddingStep(false) }
            }}
            onBlur={() => { if (!newStep.trim()) setAddingStep(false) }}
            placeholder="Step description…"
            className="flex-1 bg-transparent text-[12px] text-snow placeholder-coal outline-none border-b border-liner"
            style={{ fontFamily: 'inherit' }}
          />
          <button onClick={submitStep} className="text-[11px] px-2 py-0.5 rounded" style={{ background: color, color: 'var(--color-bg)' }}>Add</button>
        </div>
      ) : (
        <button
          onClick={() => setAddingStep(true)}
          className="text-[11px] text-coal hover:text-ash transition-colors mt-1 flex items-center gap-1"
        >
          <span className="text-base leading-none">+</span> Add step
        </button>
      )}
    </div>
  )
}

/* ── Public card — routes to correct sub-component ── */
export function YearGoalCard({ goal }) {
  const { deleteAnnualGoal, getTagColor } = useTrackerContext()
  const color = getTagColor(goal.tag)
  const onDelete = () => deleteAnnualGoal(goal.id)

  if (goal.goalType === 'one-time')  return <OneTimeCard    goal={goal} color={color} onDelete={onDelete} />
  if (goal.goalType === 'milestone') return <MilestoneCard  goal={goal} color={color} onDelete={onDelete} />
  return <QuantifiedCard goal={goal} color={color} onDelete={onDelete} />
}

/* ── Mini bar for sidebar ── */
export function YearGoalMini({ goal }) {
  const { getTagColor } = useTrackerContext()
  const color = getTagColor(goal.tag)

  if (goal.goalType === 'one-time') {
    return (
      <div className="py-2 flex items-center gap-2">
        <div
          className="flex-none w-3 h-3 rounded border-[1.5px]"
          style={{ borderColor: color, background: goal.done ? color : 'transparent' }}
        />
        <span className={`text-[12px] truncate flex-1 ${goal.done ? 'line-through text-coal' : 'text-ash'}`}>{goal.title}</span>
      </div>
    )
  }

  if (goal.goalType === 'milestone') {
    const steps = goal.steps ?? []
    const done  = steps.filter(s => s.done).length
    const pct   = steps.length === 0 ? 0 : Math.round((done / steps.length) * 100)
    return (
      <div className="py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] text-ash truncate flex-1">{goal.title}</span>
          <span className="text-[11px] text-coal ml-2">{done}/{steps.length}</span>
        </div>
        <div className="h-[3px] rounded-full bg-liner overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    )
  }

  // Quantified
  const pct = Math.min(100, Math.round((goal.progress / Math.max(1, goal.target)) * 100))
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-ash truncate flex-1">{goal.title}</span>
        <span className="text-[11px] text-coal ml-2">{pct}%</span>
      </div>
      <div className="h-[3px] rounded-full bg-liner overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
