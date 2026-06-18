import { useTrackerContext } from '../context/TrackerContext'

export function ReflectionBox({ dateKey, placeholder = 'How is your day going? Write here...' }) {
  const { getEntry, updateReflection } = useTrackerContext()
  const entry = getEntry(dateKey)

  return (
    <textarea
      value={entry.reflection ?? ''}
      onChange={e => updateReflection(dateKey, e.target.value)}
      placeholder={placeholder}
      className="w-full min-h-[110px] bg-transparent text-[13px] text-snow placeholder-coal resize-none outline-none leading-relaxed"
      style={{ fontFamily: 'inherit' }}
    />
  )
}
