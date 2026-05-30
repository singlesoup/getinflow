'use client'

import { useState, useEffect, useRef } from 'react'

// =============================================
// POMODORO TIMER
// =============================================
function PomodoroTimer() {
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

  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${m}:${sec}`
  }

  const progress = (durations[mode] - timeLeft) / durations[mode]

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Mode Toggle */}
      <div className="flex bg-stone-100 rounded-full p-1 gap-0.5">
        <button
          onClick={() => switchMode('focus')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            mode === 'focus'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            mode === 'break'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          Break
        </button>
      </div>

      {/* Timer Display */}
      <div className="select-none">
        <span
          className="text-[5.5rem] sm:text-[8rem] font-extralight text-stone-800 tabular-nums tracking-tighter leading-none"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={reset}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors px-2 py-1"
        >
          Reset
        </button>
        <button
          onClick={() => setIsRunning(r => !r)}
          className="w-36 py-3 bg-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-700 active:scale-95 transition-all duration-150"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-56 h-0.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-stone-400 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}

// =============================================
// TODO LIST
// =============================================
function TodoList() {
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
    try {
      localStorage.setItem('focus-todos', JSON.stringify(next))
    } catch {}
  }

  const add = () => {
    const text = input.trim()
    if (!text) return
    persist([...todos, { id: `${Date.now()}`, text, done: false }])
    setInput('')
  }

  const toggle = (id) =>
    persist(todos.map(t => (t.id === id ? { ...t, done: !t.done } : t)))

  const remove = (id) => persist(todos.filter(t => t.id !== id))

  if (!loaded) return null

  const pending = todos.filter(t => !t.done)
  const done = todos.filter(t => t.done)
  const sorted = [...pending, ...done]

  return (
    <div className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-4">
        Tasks
      </p>

      {/* Input Row */}
      <div className="flex gap-2 mb-5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="What needs to be done?"
          className="flex-1 bg-stone-100 border-0 rounded-xl px-4 py-2.5 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
        />
        <button
          onClick={add}
          className="px-4 py-2.5 bg-stone-800 text-white text-sm rounded-xl hover:bg-stone-700 active:scale-95 transition-all duration-150 flex-shrink-0"
        >
          Add
        </button>
      </div>

      {/* Todo Items */}
      <div className="space-y-0.5">
        {sorted.length === 0 && (
          <p className="text-sm text-stone-300 text-center py-6">
            All clear
          </p>
        )}
        {sorted.map(todo => (
          <div
            key={todo.id}
            className="flex items-center gap-3 py-2.5 px-1 group rounded-lg hover:bg-stone-50 transition-colors"
          >
            {/* Checkbox */}
            <button
              onClick={() => toggle(todo.id)}
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                todo.done
                  ? 'bg-stone-600 border-stone-600'
                  : 'border-stone-300 hover:border-stone-500'
              }`}
            >
              {todo.done && (
                <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                  <path
                    d="M1 3.5L3 5.5L7 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* Text */}
            <span
              className={`flex-1 text-sm leading-relaxed ${
                todo.done
                  ? 'line-through text-stone-400'
                  : 'text-stone-600'
              }`}
            >
              {todo.text}
            </span>

            {/* Delete */}
            <button
              onClick={() => remove(todo.id)}
              className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-stone-500 transition-all duration-200 w-5 h-5 flex items-center justify-center text-base leading-none"
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
// SOUND PLAYER
// =============================================
const SOUNDS = [
  { id: 'rain',   label: 'Rain',        emoji: '🌧' },
  { id: 'forest', label: 'Forest',      emoji: '🌿' },
  { id: 'ocean',  label: 'Ocean',       emoji: '🌊' },
  { id: 'white',  label: 'White Noise', emoji: '~' },
]

function SoundPlayer() {
  const [active, setActive] = useState(null)
  const [volume, setVolume] = useState(0.5)
  const audioCtxRef = useRef(null)
  const activeNodesRef = useRef([])
  const gainRef = useRef(null)

  useEffect(() => {
    try {
      const v = localStorage.getItem('focus-volume')
      if (v !== null) setVolume(parseFloat(v))
    } catch {}
    return () => {
      activeNodesRef.current.forEach(n => { try { n.stop() } catch {} })
    }
  }, [])

  const stopAll = () => {
    activeNodesRef.current.forEach(n => { try { n.stop() } catch {} })
    activeNodesRef.current = []
  }

  const playSound = (id) => {
    if (active === id) {
      stopAll()
      setActive(null)
      try { localStorage.removeItem('focus-sound') } catch {}
      return
    }

    stopAll()

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      // Master gain node
      const master = ctx.createGain()
      master.gain.value = volume
      master.connect(ctx.destination)
      gainRef.current = master

      // Create noise buffer (4 seconds, looped)
      const sRate = ctx.sampleRate
      const buf = ctx.createBuffer(1, sRate * 4, sRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true

      const nodes = [src]

      if (id === 'rain') {
        // Bandpass filter — mid-frequency hiss like rainfall
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = 700
        bp.Q.value = 0.6
        src.connect(bp)
        bp.connect(master)
      } else if (id === 'ocean') {
        // Lowpass + slow LFO modulation for wave rhythm
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 500

        const lfo = ctx.createOscillator()
        const lfoGain = ctx.createGain()
        lfo.frequency.value = 0.1
        lfoGain.gain.value = 300
        lfo.connect(lfoGain)
        lfoGain.connect(lp.frequency)
        lfo.start()
        nodes.push(lfo)

        src.connect(lp)
        lp.connect(master)
      } else if (id === 'forest') {
        // Higher bandpass — leafy / ambient nature texture
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = 1800
        bp.Q.value = 2.5
        src.connect(bp)
        bp.connect(master)
      } else {
        // White noise — unfiltered
        src.connect(master)
      }

      src.start()
      activeNodesRef.current = nodes
      setActive(id)
      try { localStorage.setItem('focus-sound', id) } catch {}
    } catch (err) {
      console.error('Audio error:', err)
    }
  }

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (gainRef.current) gainRef.current.gain.value = v
    try { localStorage.setItem('focus-volume', String(v)) } catch {}
  }

  return (
    <div className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-4">
        Sounds
      </p>

      {/* Sound Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {SOUNDS.map(s => (
          <button
            key={s.id}
            onClick={() => playSound(s.id)}
            className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl text-sm transition-all duration-200 ${
              active === s.id
                ? 'bg-stone-800 text-white shadow-sm'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'
            }`}
          >
            <span className="text-base leading-none">{s.emoji}</span>
            <span className="text-[11px] font-medium">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-3 px-1">
        {/* Low volume icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-stone-300 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494m0 0l-3.75-3.75H4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 01.75-.75h3.75L12 6.253z"
          />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolume}
          className="focus-range flex-1"
        />
        {/* High volume icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-stone-400 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
          />
        </svg>
      </div>
    </div>
  )
}

// =============================================
// MAIN APP
// =============================================
export default function App() {
  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-14"
      style={{ backgroundColor: '#fafaf9' }}
    >
      {/* Header */}
      <header className="mb-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-300">
          Focus
        </p>
      </header>

      {/* Timer */}
      <section className="w-full max-w-sm flex justify-center mb-16">
        <PomodoroTimer />
      </section>

      {/* Divider */}
      <div className="w-32 h-px mb-16" style={{ backgroundColor: '#e7e5e4' }} />

      {/* Tasks + Sounds */}
      <div className="w-full max-w-xs space-y-12">
        <TodoList />
        <SoundPlayer />
      </div>

      {/* Footer */}
      <footer className="mt-20 pb-4">
        <p className="text-[11px] text-stone-300 tracking-wide">Stay focused.</p>
      </footer>
    </div>
  )
}
