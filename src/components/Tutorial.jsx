const STEPS = [
  {
    emoji: '👋',
    title: 'Welcome to Tracker',
    body: 'Your personal planner for tasks, goals, and reflections. Everything stays private on your device.',
  },
  {
    emoji: '📲',
    title: 'Add to your home screen',
    body: 'For the best experience — including notifications — add Tracker to your home screen. In Safari, tap Share → "Add to Home Screen". On desktop, look for the install icon in your browser bar.',
  },
  {
    emoji: '📅',
    title: 'Four views',
    body: 'Switch between Day, Week, Month, and Year using the tabs at the top — or press D, W, M, Y on your keyboard.',
  },
  {
    emoji: '✏️',
    title: 'Add anything fast',
    body: 'Press N to open the add panel, or type directly in the "+ Add task…" box at the bottom of any list. Hit Enter to save.',
  },
  {
    emoji: '🔍',
    title: 'Find it instantly',
    body: "Press Cmd+K to search across all your tasks and goals, no matter what date they're on.",
  },
  {
    emoji: '🎯',
    title: "You're all set!",
    body: 'Navigate with ← → arrows or swipe on mobile. Press F for distraction-free focus mode. Tap ? anytime to see these tips again.',
  },
]

export function Tutorial({ step, setStep, onComplete }) {
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onComplete} />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[380px] max-w-[90vw] rounded-2xl p-8 shadow-2xl"
        style={{ background: 'var(--color-panel)', border: '1px solid var(--color-liner)' }}
        onClick={e => e.stopPropagation()}
      >
        <span className="text-4xl mb-4 text-center block">{current.emoji}</span>
        <p className="text-[17px] font-medium text-center mb-2" style={{ color: 'var(--color-snow)' }}>
          {current.title}
        </p>
        <p className="text-[13px] text-center leading-relaxed mb-6" style={{ color: 'var(--color-ash)' }}>
          {current.body}
        </p>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i === step ? 'var(--color-gold)' : 'var(--color-liner)' }}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2 rounded-lg text-[13px] transition-colors"
              style={{ color: 'var(--color-ash)', background: 'var(--color-surface)' }}
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? onComplete : () => setStep(s => s + 1)}
            className="flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors hover:opacity-90"
            style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
          >
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>

        {/* Skip link */}
        {!isLast && (
          <div className="text-center mt-4">
            <button
              onClick={onComplete}
              className="text-[11px] transition-colors"
              style={{ color: 'var(--color-coal)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ash)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-coal)' }}
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </>
  )
}
