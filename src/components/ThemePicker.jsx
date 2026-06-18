import { useTrackerContext } from '../context/TrackerContext'

const THEMES = [
  { id: '',       label: 'Obsidian', bg: '#0e0e10', accent: '#e8c97a' },
  { id: 'light',  label: 'Light',    bg: '#f5f4ef', accent: '#9a6c10' },
]

export function ThemePicker({ onClose }) {
  const { settings, updateSettings } = useTrackerContext()
  const current = settings.theme ?? ''

  return (
    <div
      className="absolute top-full right-0 mt-2 z-50 p-3 rounded-xl"
      style={{
        background: 'var(--color-surface2)',
        border: '1px solid var(--color-liner)',
        minWidth: '160px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.12em] text-coal mb-2.5">Theme</p>
      <div className="flex flex-col gap-1">
        {THEMES.map(theme => {
          const isActive = current === theme.id
          return (
            <button
              key={theme.id}
              onClick={() => { updateSettings({ theme: theme.id }); onClose?.() }}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-liner w-full text-left"
              style={isActive ? { background: 'var(--color-liner)' } : {}}
            >
              <div
                className="w-4 h-4 rounded-full flex-none"
                style={{
                  background: `radial-gradient(circle at 60% 40%, ${theme.accent} 35%, ${theme.bg} 35%)`,
                  boxShadow: `0 0 0 1.5px ${isActive ? theme.accent : 'var(--color-liner)'}`,
                }}
              />
              <span className={`text-[12px] flex-1 ${isActive ? 'text-snow' : 'text-ash'}`}>
                {theme.label}
              </span>
              {isActive && (
                <span className="text-[11px]" style={{ color: theme.accent }}>✓</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
