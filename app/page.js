'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// =============================================
// NOTIFICATION SOUND (Web Audio API bell)
// =============================================
function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const notes = [523, 659, 784] // C5, E5, G5 — soft major chord arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = ctx.currentTime + i * 0.38
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.22, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 1.4)
    })
  } catch {}
}

// =============================================
// POMODORO TIMER
// =============================================
function PomodoroTimer({ dark }) {
  const [mode, setMode] = useState('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)

  const durations = { focus: 25 * 60, break: 5 * 60 }

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            clearInterval(intervalRef.current)
            playBell()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  const switchMode = (newMode) => {
    clearInterval(intervalRef.current)
    setMode(newMode)
    setTimeLeft(durations[newMode])
    setIsRunning(false)
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setTimeLeft(durations[mode])
    setIsRunning(false)
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const progress = (durations[mode] - timeLeft) / durations[mode]

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Mode Toggle */}
      <div
        className="flex rounded-full p-1 gap-0.5"
        style={{ backgroundColor: dark ? '#292524' : '#f5f5f4' }}
      >
        {['focus', 'break'].map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: mode === m ? (dark ? '#44403c' : '#ffffff') : 'transparent',
              color: mode === m ? (dark ? '#fafaf9' : '#1c1917') : (dark ? '#78716c' : '#a8a29e'),
              boxShadow: mode === m ? (dark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)') : 'none',
            }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="select-none">
        <span
          className="tabular-nums leading-none"
          style={{
            fontSize: 'clamp(5rem, 15vw, 8.5rem)',
            fontWeight: 200,
            color: dark ? '#fafaf9' : '#1c1917',
            letterSpacing: '-0.04em',
          }}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={reset}
          className="text-sm px-2 py-1 transition-colors"
          style={{ color: dark ? '#78716c' : '#a8a29e' }}
          onMouseEnter={e => (e.target.style.color = dark ? '#a8a29e' : '#78716c')}
          onMouseLeave={e => (e.target.style.color = dark ? '#78716c' : '#a8a29e')}
        >
          Reset
        </button>
        <button
          onClick={() => setIsRunning(r => !r)}
          className="w-36 py-3 rounded-full text-sm font-medium transition-all duration-150 active:scale-95"
          style={{
            backgroundColor: dark ? '#e7e5e4' : '#1c1917',
            color: dark ? '#1c1917' : '#fafaf9',
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>

      {/* Progress Bar */}
      <div
        className="w-56 h-0.5 rounded-full overflow-hidden"
        style={{ backgroundColor: dark ? '#44403c' : '#e7e5e4' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: dark ? '#a8a29e' : '#78716c',
          }}
        />
      </div>
    </div>
  )
}

// =============================================
// TODO LIST
// =============================================
function TodoList({ dark }) {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('focus-todos')
      if (saved) setTodos(JSON.parse(saved))
    } catch {}
    setLoaded(true)
  }, [])

  const persist = (next) => {
    setTodos(next)
    try { localStorage.setItem('focus-todos', JSON.stringify(next)) } catch {}
  }

  const add = () => {
    const text = input.trim()
    if (!text) return
    persist([...todos, { id: `${Date.now()}`, text, done: false }])
    setInput('')
  }

  const toggle = (id) => persist(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const remove = (id) => persist(todos.filter(t => t.id !== id))

  if (!loaded) return null

  const sorted = [...todos.filter(t => !t.done), ...todos.filter(t => t.done)]

  const inputStyle = {
    backgroundColor: dark ? '#1c1917' : '#f5f5f4',
    color: dark ? '#e7e5e4' : '#44403c',
    border: `1px solid ${dark ? '#44403c' : '#e7e5e4'}`,
  }

  const btnStyle = {
    backgroundColor: dark ? '#e7e5e4' : '#1c1917',
    color: dark ? '#1c1917' : '#fafaf9',
  }

  return (
    <div className="w-full">
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
        style={{ color: dark ? '#78716c' : '#a8a29e' }}
      >
        Tasks
      </p>

      {/* Input */}
      <div className="flex gap-2 mb-5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="What needs to be done?"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2"
          style={{
            ...inputStyle,
            '--tw-ring-color': dark ? '#44403c' : '#d6d3d1',
          }}
        />
        <button
          onClick={add}
          className="px-4 py-2.5 text-sm rounded-xl flex-shrink-0 transition-all active:scale-95"
          style={btnStyle}
        >
          Add
        </button>
      </div>

      {/* Todos */}
      <div className="space-y-0.5">
        {sorted.length === 0 && (
          <p
            className="text-sm text-center py-6"
            style={{ color: dark ? '#57534e' : '#d6d3d1' }}
          >
            All clear
          </p>
        )}
        {sorted.map(todo => (
          <div
            key={todo.id}
            className="flex items-center gap-3 py-2.5 px-1 group rounded-lg transition-colors"
            style={{ ':hover': { backgroundColor: dark ? '#1c1917' : '#f5f5f4' } }}
          >
            {/* Circle checkbox */}
            <button
              onClick={() => toggle(todo.id)}
              className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: todo.done ? (dark ? '#a8a29e' : '#78716c') : 'transparent',
                borderColor: todo.done ? (dark ? '#a8a29e' : '#78716c') : (dark ? '#57534e' : '#d6d3d1'),
              }}
            >
              {todo.done && (
                <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                  <path d="M1 3.5L3 5.5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Text */}
            <span
              className="flex-1 text-sm leading-relaxed"
              style={{
                color: todo.done
                  ? (dark ? '#57534e' : '#d6d3d1')
                  : (dark ? '#e7e5e4' : '#57534e'),
                textDecoration: todo.done ? 'line-through' : 'none',
              }}
            >
              {todo.text}
            </span>

            {/* Delete */}
            <button
              onClick={() => remove(todo.id)}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-base leading-none transition-all"
              style={{ color: dark ? '#57534e' : '#d6d3d1' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================
// SOUND PLAYER (HTML5 Audio + WAV files)
// =============================================
const SOUNDS = [
  { id: 'rain',   label: 'Rain',        emoji: '🌧' },
  { id: 'forest', label: 'Forest',      emoji: '🌿' },
  { id: 'ocean',  label: 'Ocean',       emoji: '🌊' },
  { id: 'white',  label: 'White Noise', emoji: '〰' },
]

function SoundPlayer({ dark }) {
  const [active, setActive] = useState(null)
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef(null)

  useEffect(() => {
    try {
      const v = localStorage.getItem('focus-volume')
      if (v !== null) setVolume(parseFloat(v))
    } catch {}
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const playSound = (id) => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    if (active === id) {
      setActive(null)
      try { localStorage.removeItem('focus-sound') } catch {}
      return
    }

    try {
      const audio = new Audio(`/audio/${id}.wav`)
      audio.loop = true
      audio.volume = volume
      audio.play().catch(() => {})
      audioRef.current = audio
      setActive(id)
      try { localStorage.setItem('focus-sound', id) } catch {}
    } catch (err) {
      console.error('Audio error:', err)
    }
  }

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
    try { localStorage.setItem('focus-volume', String(v)) } catch {}
  }

  const mutedColor = dark ? '#78716c' : '#a8a29e'
  const trackBg = dark ? '#292524' : '#e7e5e4'
  const thumbBg = dark ? '#e7e5e4' : '#44403c'

  return (
    <div className="w-full">
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
        style={{ color: mutedColor }}
      >
        Sounds
      </p>

      {/* Sound Buttons Grid */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {SOUNDS.map(s => {
          const isActive = active === s.id
          return (
            <button
              key={s.id}
              onClick={() => playSound(s.id)}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl text-sm transition-all duration-200 active:scale-95"
              style={{
                backgroundColor: isActive
                  ? (dark ? '#e7e5e4' : '#1c1917')
                  : (dark ? '#1c1917' : '#f5f5f4'),
                color: isActive
                  ? (dark ? '#1c1917' : '#fafaf9')
                  : (dark ? '#a8a29e' : '#78716c'),
              }}
            >
              <span className="text-base leading-none">{s.emoji}</span>
              <span className="text-[11px] font-medium">{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-3 px-1">
        {/* Low volume icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: mutedColor }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494m0 0l-3.75-3.75H4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 01.75-.75h3.75L12 6.253z" />
        </svg>
        <input
          type="range" min="0" max="1" step="0.01"
          value={volume}
          onChange={handleVolume}
          className="focus-range flex-1"
          style={{ '--track-bg': trackBg, '--thumb-bg': thumbBg }}
        />
        {/* High volume icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: mutedColor }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      </div>
    </div>
  )
}

// =============================================
// DARK MODE TOGGLE BUTTON
// =============================================
function DarkToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 z-50"
      style={{
        backgroundColor: dark ? '#292524' : '#f5f5f4',
        color: dark ? '#a8a29e' : '#a8a29e',
      }}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9H21M3 12H2.34m15.07-6.07l-.7.7M7.05 16.95l-.7.7M19.07 17.07l-.7-.7M6.05 7.05l-.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

// =============================================
// MAIN APP
// =============================================
export default function App() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load saved dark mode preference
    try {
      const saved = localStorage.getItem('focus-dark')
      if (saved === '1') setDark(true)
    } catch {}
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try { localStorage.setItem('focus-dark', dark ? '1' : '0') } catch {}
  }, [dark, mounted])

  const toggleDark = () => setDark(d => !d)

  const bgColor = dark ? '#0c0a09' : '#fafaf9'
  const dividerColor = dark ? '#292524' : '#e7e5e4'
  const labelColor = dark ? '#57534e' : '#d6d3d1'

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-14 transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      {/* Dark Mode Toggle */}
      <DarkToggle dark={dark} onToggle={toggleDark} />

      {/* Header */}
      <header className="mb-16">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.35em]"
          style={{ color: labelColor }}
        >
          Focus
        </p>
      </header>

      {/* Timer */}
      <section className="w-full max-w-sm flex justify-center mb-16">
        <PomodoroTimer dark={dark} />
      </section>

      {/* Divider */}
      <div className="w-32 h-px mb-16" style={{ backgroundColor: dividerColor }} />

      {/* Tasks + Sounds */}
      <div className="w-full max-w-xs space-y-12">
        <TodoList dark={dark} />
        <SoundPlayer dark={dark} />
      </div>

      {/* Footer */}
      <footer className="mt-20 pb-4">
        <p
          className="text-[11px] tracking-wide"
          style={{ color: labelColor }}
        >
          Stay focused.
        </p>
      </footer>
    </div>
  )
}
