'use client'

import { useState, useEffect, useRef } from 'react'

// =============================================
// HELPERS
// =============================================

function formatDuration(seconds) {
  if (!seconds || seconds < 1) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ''}`
  return `${s}s`
}

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function formatDateShort(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

// =============================================
// NOTIFICATION BELL
// =============================================

function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const notes = [523, 659, 784]
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
  } catch { }
}

// =============================================
// SETTINGS / IMPORT / EXPORT MODAL
// =============================================

function SettingsModal({ todos, sessions, onImport, onClose, dark }) {
  const fileInputRef = useRef(null)
  const [importStatus, setImportStatus] = useState(null) // 'success' | 'error' | null

  const totalFocusSecs = sessions.filter(s => s.mode === 'focus').reduce((a, s) => a + (s.durationSeconds || 0), 0)
  const completedCount = todos.filter(t => t.done).length

  // Build and download the JSON export
  const handleExport = () => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      summary: {
        totalTasks: todos.length,
        completedTasks: completedCount,
        totalFocusSeconds: totalFocusSecs,
        totalFocusFormatted: formatDuration(totalFocusSecs) || '0m',
        totalSessions: sessions.filter(s => s.mode === 'focus').length,
      },
      todos: todos.map(t => ({
        id: t.id,
        taskName: t.text,
        createdAt: t.createdAt || new Date().toISOString(),
        dateCreated: formatDateShort(t.createdAt || new Date().toISOString()),
        completionStatus: t.done ? 'Done' : 'Pending',
        doneAt: t.doneAt || null,
        timeSpentSeconds: t.timeSpentSeconds || 0,
        timeSpentFormatted: formatDuration(t.timeSpentSeconds) || '0m',
      })),
      sessions: sessions.map(s => ({
        id: s.id,
        mode: s.mode,
        startedAt: s.startedAt,
        dateStarted: formatDateShort(s.startedAt),
        durationSeconds: s.durationSeconds,
        durationFormatted: formatDuration(s.durationSeconds) || '0s',
        completed: s.completed,
        linkedTaskId: s.taskId || null,
        linkedTaskName: s.taskId ? (todos.find(t => t.id === s.taskId)?.text ?? null) : null,
      })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focus-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.todos) throw new Error('Missing todos field')
        if (window.confirm('Import will replace your current tasks and sessions. Continue?')) {
          onImport(data)
          setImportStatus('success')
        }
      } catch {
        setImportStatus('error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Theme tokens
  const bg = dark ? '#1c1917' : '#ffffff'
  const subBg = dark ? '#0c0a09' : '#fafaf9'
  const border = dark ? '#44403c' : '#e7e5e4'
  const text = dark ? '#e7e5e4' : '#1c1917'
  const muted = dark ? '#78716c' : '#a8a29e'
  const primary = dark ? '#e7e5e4' : '#1c1917'
  const primTxt = dark ? '#1c1917' : '#fafaf9'
  const warn = '#f59e0b'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: bg, border: `1px solid ${border}` }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: text }}>Data & Export</h2>
            <p className="text-xs mt-0.5" style={{ color: muted }}>Backup and restore your focus history</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-lg leading-none transition-colors"
            style={{ color: muted, backgroundColor: subBg }}
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── Summary ── */}
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: subBg }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: muted }}>Session Summary</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total tasks', value: todos.length },
                { label: 'Completed', value: completedCount },
                { label: 'Focus sessions', value: sessions.filter(s => s.mode === 'focus').length },
                { label: 'Total focus', value: formatDuration(totalFocusSecs) || '0m' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg p-2.5" style={{ backgroundColor: bg }}>
                  <p className="text-[10px]" style={{ color: muted }}>{label}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: text }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Export ── */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: muted }}>Export</p>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: muted }}>
              Downloads a JSON file with all tasks, time spent per task, dates created, completion status, and session history.
            </p>
            <button
              onClick={handleExport}
              disabled={todos.length === 0 && sessions.length === 0}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ backgroundColor: primary, color: primTxt }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>
          </div>

          {/* ── Import ── */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: muted }}>Import</p>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: muted }}>
              Restore from a previously exported JSON file.{' '}
              <span style={{ color: warn }}>This will overwrite your current data.</span>
            </p>
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: subBg, color: text, border: `1px solid ${border}` }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Choose JSON File
            </button>

            {importStatus === 'success' && (
              <p className="text-xs mt-2 text-green-500 text-center">✓ Data imported successfully</p>
            )}
            {importStatus === 'error' && (
              <p className="text-xs mt-2 text-red-400 text-center">✕ Invalid file — please use a Focus export</p>
            )}
          </div>

          {/* ── Schema Reference ── */}
          <div className="rounded-xl p-3" style={{ backgroundColor: subBg, border: `1px solid ${border}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: muted }}>Export Schema</p>
            <pre className="text-[10px] leading-relaxed overflow-x-auto" style={{ color: muted }}>
              {`{
  taskName,        // Task title
  dateCreated,     // e.g. "Jun 1, 2025"
  timeSpentFormatted, // e.g. "25m 30s"
  completionStatus // "Done" | "Pending"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================
// POMODORO TIMER (with session tracking)
// =============================================

function PomodoroTimer({ activeTaskId, activeTaskName, onClearTask, onSessionEnd, dark }) {
  const [mode, setMode] = useState('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)

  const intervalRef = useRef(null)
  const sessionStartRef = useRef(null)
  const endTimeRef = useRef(null)
  const modeRef = useRef(mode)
  const activeTaskIdRef = useRef(activeTaskId)
  const onSessionEndRef = useRef(onSessionEnd)

  // Keep refs in sync
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { activeTaskIdRef.current = activeTaskId }, [activeTaskId])
  useEffect(() => { onSessionEndRef.current = onSessionEnd }, [onSessionEnd])

  const DURATIONS = { focus: 25 * 60, break: 5 * 60 }

  // Flush the current running session to storage
  const flushSession = (elapsedSecs, completed) => {
    if (!sessionStartRef.current || elapsedSecs < 5) return
    onSessionEndRef.current?.({
      id: Date.now().toString(),
      startedAt: sessionStartRef.current.toISOString(),
      durationSeconds: Math.round(elapsedSecs),
      mode: modeRef.current,
      completed,
      taskId: activeTaskIdRef.current || null,
    })
    sessionStartRef.current = null
  }
  // Update time based on actual elapsed time (fixes background tab throttling)
  const updateTimeFromTimestamp = () => {
    if (!endTimeRef.current) return
    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))

    if (remaining === 0) {
      setTimeLeft(0)
      setIsRunning(false)
      clearInterval(intervalRef.current)
      flushSession(DURATIONS[modeRef.current], true)
      playBell()
      endTimeRef.current = null
    } else {
      setTimeLeft(remaining)
    }
  }

  // Handle page visibility changes to maintain accurate time
  useEffect(() => {
    if (isRunning) {
      // Set the target end time when starting
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + (timeLeft * 1000)
      }
      intervalRef.current = setInterval(() => {
        updateTimeFromTimestamp()
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
      endTimeRef.current = null
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning]) // eslint-disable-line

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isRunning) return
      if (!document.hidden) {
        updateTimer()
      } else {
        lastUpdateRef.current = Date.now()
      }
    }

    if (isRunning) {
      lastUpdateRef.current = Date.now()
      intervalRef.current = setInterval(updateTimer, 1000)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => {
      clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isRunning])  // eslint-disable-line

  const handleStartPause = () => {
    if (isRunning) {
      // Pausing: save elapsed time up to now
      if (endTimeRef.current) {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
        setTimeLeft(remaining)
      }
      const elapsed = DURATIONS[mode] - timeLeft
      flushSession(elapsed, false)
      endTimeRef.current = null
    } else {
      // Starting: record session start if fresh
      if (!sessionStartRef.current) sessionStartRef.current = new Date()
      lastUpdateRef.current = Date.now()
    }
    setIsRunning(r => !r)
  }

  const switchMode = (newMode) => {
    clearInterval(intervalRef.current)
    if (isRunning) {
      if (endTimeRef.current) {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
        setTimeLeft(remaining)
      }
      flushSession(DURATIONS[mode] - timeLeft, false)
    }
    setMode(newMode)
    setTimeLeft(DURATIONS[newMode])
    setIsRunning(false)
    sessionStartRef.current = null
    endTimeRef.current = null
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    if (isRunning) {
      if (endTimeRef.current) {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
        setTimeLeft(remaining)
      }
      flushSession(DURATIONS[mode] - timeLeft, false)
    }
    setTimeLeft(DURATIONS[mode])
    setIsRunning(false)
    sessionStartRef.current = null
    endTimeRef.current = null
  }

  const progress = (DURATIONS[mode] - timeLeft) / DURATIONS[mode]
  const muted = dark ? '#78716c' : '#a8a29e'
  const faint = dark ? '#57534e' : '#d6d3d1'
  const accent = dark ? '#a8a29e' : '#78716c'

  return (
    <div className="flex flex-col items-center gap-8 w-full">

      {/* Mode toggle */}
      <div className="flex rounded-full p-1 gap-0.5" style={{ backgroundColor: dark ? '#292524' : '#f5f5f4' }}>
        {['focus', 'break'].map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: mode === m ? (dark ? '#44403c' : '#ffffff') : 'transparent',
              color: mode === m ? (dark ? '#fafaf9' : '#1c1917') : muted,
              boxShadow: mode === m && !dark ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Active task pill */}
      {activeTaskName ? (
        <div className="flex items-center gap-2 -my-3 px-3 py-1.5 rounded-full" style={{ backgroundColor: dark ? '#1c1917' : '#f5f5f4' }}>
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRunning ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: isRunning ? '#22c55e' : faint }}
          />
          <span
            className="text-xs max-w-[180px] truncate"
            style={{ color: accent }}
            title={activeTaskName}
          >
            {activeTaskName}
          </span>
          <button onClick={onClearTask} className="text-xs leading-none" style={{ color: faint }}>×</button>
        </div>
      ) : (
        <p className="text-xs -my-3" style={{ color: faint }}>Select a task below to track time</p>
      )}

      {/* Timer digits */}
      <div className="select-none">
        <span
          className="tabular-nums leading-none"
          style={{ fontSize: 'clamp(5rem,15vw,8.5rem)', fontWeight: 200, color: dark ? '#fafaf9' : '#1c1917', letterSpacing: '-0.04em' }}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button onClick={reset} className="text-sm px-2 py-1" style={{ color: muted }}>Reset</button>
        <button
          onClick={handleStartPause}
          className="w-36 py-3 rounded-full text-sm font-medium transition-all active:scale-95"
          style={{ backgroundColor: dark ? '#e7e5e4' : '#1c1917', color: dark ? '#1c1917' : '#fafaf9' }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-56 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: dark ? '#44403c' : '#e7e5e4' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%`, backgroundColor: dark ? '#a8a29e' : '#78716c' }}
        />
      </div>
    </div>
  )
}

// =============================================
// TODO LIST (with time tracking + focus linking)
// =============================================

function TodoList({ todos, onPersist, activeTaskId, onTaskSelect, dark }) {
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const editInputRef = useRef(null)


  const add = () => {
    const text = input.trim()
    if (!text) return
    onPersist([...todos, {
      id: Date.now().toString(),
      text,
      done: false,
      createdAt: new Date().toISOString(),
      doneAt: null,
      timeSpentSeconds: 0,
    }])
    setInput('')
  }

  const toggle = (id) => onPersist(todos.map(t =>
    t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : null } : t
  ))

  const remove = (id) => {
    onPersist(todos.filter(t => t.id !== id))
    if (activeTaskId === id) onTaskSelect(null)
  }


  // Start editing a task
  const startEdit = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
    // Focus the input after state update
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  // Save edited task
  const saveEdit = () => {
    const trimmed = editText.trim()
    if (!trimmed) {
      cancelEdit()
      return
    }
    const updated = todos.map(t =>
      t.id === editingId ? { ...t, text: trimmed } : t
    )
    onPersist(updated)
    setEditingId(null)
    setEditText('')
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  // Handle keyboard shortcuts in edit mode
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  const pending = todos.filter(t => !t.done)
  const done = todos.filter(t => t.done)
  const sorted = [...pending, ...done]

  const muted = dark ? '#78716c' : '#a8a29e'
  const faint = dark ? '#57534e' : '#d6d3d1'
  const primary = { backgroundColor: dark ? '#e7e5e4' : '#1c1917', color: dark ? '#1c1917' : '#fafaf9' }

  return (
    <div className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: muted }}>Tasks</p>

      {/* Input row */}
      <div className="flex gap-2 mb-5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="What needs to be done?"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{
            backgroundColor: dark ? '#1c1917' : '#f5f5f4',
            color: dark ? '#e7e5e4' : '#44403c',
            border: `1px solid ${dark ? '#44403c' : '#e7e5e4'}`,
          }}
        />
        <button onClick={add} className="px-4 py-2.5 text-sm rounded-xl flex-shrink-0 transition-all active:scale-95" style={primary}>
          Add
        </button>
      </div>

      {/* List */}
      <div className="space-y-0.5">
        {sorted.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: faint }}>All clear</p>
        )}
        {sorted.map(todo => {
          const isActive = activeTaskId === todo.id
          const isEditing = editingId === todo.id
          const timeFmt = formatDuration(todo.timeSpentSeconds)

          return (
            <div
              key={todo.id}
              className="flex items-center gap-3 py-2.5 px-2 group rounded-xl transition-colors"
              style={{ backgroundColor: isActive ? (dark ? '#1c1917' : '#f5f5f4') : 'transparent' }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggle(todo.id)}
                className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
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

              {/* Text + time badge OR Edit input */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={saveEdit}
                    autoFocus
                    className="bg-transparent border-none outline-none text-sm leading-relaxed block truncate"
                    style={{
                      backgroundColor: dark ? '#292524' : '#ffffff',
                      color: dark ? '#e7e5e4' : '#44403c',
                      border: `1px solid ${dark ? '#57534e' : '#d6d3d1'}`,
                    }}
                  />
                ) : (
                  <>
                    <span
                      className="text-sm leading-relaxed block truncate"
                      title={todo.text}
                      style={{
                        color: todo.done ? faint : (dark ? '#e7e5e4' : '#57534e'),
                        textDecoration: todo.done ? 'line-through' : 'none',
                      }}
                    >
                      {todo.text}
                    </span>
                    {timeFmt && (
                      <span className="text-[10px]" style={{ color: isActive ? (dark ? '#a8a29e' : '#78716c') : faint }}>
                        ⏱ {timeFmt} focused
                      </span>
                    )}
                  </>
                )}

              </div>

              {/* Edit mode: Save & Cancel buttons */}
              {isEditing ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={saveEdit}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                    style={{ backgroundColor: dark ? '#22c55e' : '#16a34a', color: '#ffffff' }}
                    title="Save (Enter)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                    style={{ backgroundColor: dark ? '#292524' : '#e7e5e4', color: muted }}
                    title="Cancel (Escape)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  {/* Edit button — show on hover */}
                  {!todo.done && (
                    <button
                      onClick={() => startEdit(todo)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                      style={{ backgroundColor: dark ? '#292524' : '#f0efee', color: muted }}
                      title="Edit task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  )}

                  {/* Focus button — only for incomplete tasks */}
                  {!todo.done && (
                    <button
                      onClick={() => onTaskSelect(isActive ? null : todo.id)}
                      className="transition-all rounded-lg px-2 py-1 text-[10px] font-medium flex-shrink-0"
                      style={{
                        opacity: isActive ? 1 : undefined,
                        backgroundColor: isActive ? (dark ? '#44403c' : '#e7e5e4') : (dark ? '#292524' : '#f0efee'),
                        color: isActive ? (dark ? '#fafaf9' : '#44403c') : muted,
                        // show on hover via group — but always show when active
                        display: isActive ? 'flex' : undefined,
                      }}
                      title={isActive ? 'Stop tracking this task' : 'Start Pomodoro for this task'}
                    >
                      {isActive ? '✓ Focusing' : '⏱ Focus'}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => remove(todo.id)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-base leading-none transition-all"
                    style={{ color: faint }}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================
// SOUND PLAYER
// =============================================

const SOUNDS = [
  { id: 'rain', label: 'Rain', emoji: '🌧' },
  { id: 'forest', label: 'Forest', emoji: '🌿' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
  { id: 'white', label: 'White Noise', emoji: '〰' },
]

function SoundPlayer({ dark }) {
  const [active, setActive] = useState(null)
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef(null)

  useEffect(() => {
    try {
      const v = localStorage.getItem('focus-volume')
      if (v !== null) setVolume(parseFloat(v))
    } catch { }
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null } }
  }, [])

  const playSound = (id) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null }
    if (active === id) {
      setActive(null)
      try { localStorage.removeItem('focus-sound') } catch { }
      return
    }
    try {
      const audio = new Audio(`/audio/${id}.mp3`)
      audio.loop = true
      audio.volume = volume
      audio.play().catch(() => { })
      audioRef.current = audio
      setActive(id)
      try { localStorage.setItem('focus-sound', id) } catch { }
    } catch { }
  }

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
    try { localStorage.setItem('focus-volume', String(v)) } catch { }
  }

  const muted = dark ? '#78716c' : '#a8a29e'
  const trackBg = dark ? '#292524' : '#e7e5e4'
  const thumbBg = dark ? '#e7e5e4' : '#44403c'

  return (
    <div className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: muted }}>Sounds</p>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {SOUNDS.map(s => {
          const on = active === s.id
          return (
            <button
              key={s.id}
              onClick={() => playSound(s.id)}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: on ? (dark ? '#e7e5e4' : '#1c1917') : (dark ? '#1c1917' : '#f5f5f4'),
                color: on ? (dark ? '#1c1917' : '#fafaf9') : (dark ? '#a8a29e' : '#78716c'),
              }}
            >
              <span className="text-base leading-none">{s.emoji}</span>
              <span className="text-[11px] font-medium">{s.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 px-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: muted }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494m0 0l-3.75-3.75H4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 01.75-.75h3.75L12 6.253z" />
        </svg>
        <input
          type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolume}
          className="focus-range flex-1"
          style={{ '--track-bg': trackBg, '--thumb-bg': thumbBg }}
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: muted }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      </div>
    </div>
  )
}

// =============================================
// DARK MODE TOGGLE
// =============================================

function DarkToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
      style={{ backgroundColor: dark ? '#292524' : '#f5f5f4', color: '#a8a29e' }}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9H21M3 12H2.34m15.07-6.07l-.7.7M7.05 16.95l-.7.7M19.07 17.07l-.7-.7M6.05 7.05l-.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

// =============================================
// SETTINGS GEAR BUTTON
// =============================================

function SettingsButton({ onClick, dark }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
      style={{ backgroundColor: dark ? '#292524' : '#f5f5f4', color: '#a8a29e' }}
      title="Data & Export"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  )
}

// =============================================
// MAIN APP — coordinates all state
// =============================================

export default function App() {
  const [dark, setDark] = useState(false)
  const [todos, setTodos] = useState([])
  const [sessions, setSessions] = useState([])
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ── Load persisted data on first mount ──
  useEffect(() => {
    try {
      const t = localStorage.getItem('focus-todos')
      const s = localStorage.getItem('focus-sessions')
      const d = localStorage.getItem('focus-dark')
      if (t) setTodos(JSON.parse(t))
      if (s) setSessions(JSON.parse(s))
      if (d === '1') setDark(true)
    } catch { }
    setMounted(true)
  }, [])

  // ── Dark mode class on <html> ──
  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('focus-dark', dark ? '1' : '0') } catch { }
  }, [dark, mounted])

  // ── Persist todos helper ──
  const persistTodos = (next) => {
    setTodos(next)
    try { localStorage.setItem('focus-todos', JSON.stringify(next)) } catch { }
  }

  // ── Called by PomodoroTimer when a session ends (pause OR complete) ──
  const handleSessionEnd = (session) => {
    setSessions(prev => {
      const next = [...prev, session]
      try { localStorage.setItem('focus-sessions', JSON.stringify(next)) } catch { }
      return next
    })

    // Credit elapsed time to the linked task (focus sessions only, min 5 sec)
    if (session.taskId && session.mode === 'focus' && session.durationSeconds >= 5) {
      setTodos(prev => {
        const next = prev.map(t =>
          t.id === session.taskId
            ? { ...t, timeSpentSeconds: (t.timeSpentSeconds || 0) + session.durationSeconds }
            : t
        )
        try { localStorage.setItem('focus-todos', JSON.stringify(next)) } catch { }
        return next
      })
    }
  }

  // ── Import handler ──
  const handleImport = (data) => {
    const newTodos = (data.todos || []).map(t => ({
      id: t.id || Date.now().toString(),
      text: t.taskName || t.text || '',
      done: t.done ?? (t.completionStatus === 'Done'),
      createdAt: t.createdAt || new Date().toISOString(),
      doneAt: t.doneAt || null,
      timeSpentSeconds: t.timeSpentSeconds || 0,
    }))
    const newSessions = (data.sessions || data.focusSessions || []).map(s => ({
      id: s.id || Date.now().toString(),
      startedAt: s.startedAt || new Date().toISOString(),
      durationSeconds: s.durationSeconds || 0,
      mode: s.mode || 'focus',
      completed: s.completed ?? true,
      taskId: s.linkedTaskId || s.taskId || null,
    }))

    persistTodos(newTodos)
    setSessions(newSessions)
    try { localStorage.setItem('focus-sessions', JSON.stringify(newSessions)) } catch { }
    setShowSettings(false)
    setActiveTaskId(null)
  }

  const activeTask = todos.find(t => t.id === activeTaskId) ?? null

  if (!mounted) return null

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-14 transition-colors duration-300"
      style={{ backgroundColor: dark ? '#0c0a09' : '#fafaf9' }}
    >
      {/* ── Top-left: Settings gear ── */}
      <div className="fixed top-5 left-5 z-40">
        <SettingsButton onClick={() => setShowSettings(true)} dark={dark} />
      </div>

      {/* ── Top-right: Dark mode toggle ── */}
      <div className="fixed top-5 right-5 z-40">
        <DarkToggle dark={dark} onToggle={() => setDark(d => !d)} />
      </div>

      {/* ── Header ── */}
      <header className="mb-16">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.35em]"
          style={{ color: dark ? '#57534e' : '#d6d3d1' }}
        >
          Focus
        </p>
      </header>

      {/* ── Pomodoro Timer ── */}
      <section className="w-full max-w-sm flex justify-center mb-16">
        <PomodoroTimer
          activeTaskId={activeTaskId}
          activeTaskName={activeTask?.text ?? null}
          onClearTask={() => setActiveTaskId(null)}
          onSessionEnd={handleSessionEnd}
          dark={dark}
        />
      </section>

      {/* ── Divider ── */}
      <div className="w-32 h-px mb-16" style={{ backgroundColor: dark ? '#292524' : '#e7e5e4' }} />

      {/* ── Task list + Sounds ── */}
      <div className="w-full max-w-xs space-y-12">
        <TodoList
          todos={todos}
          onPersist={persistTodos}
          activeTaskId={activeTaskId}
          onTaskSelect={setActiveTaskId}
          dark={dark}
        />
        <SoundPlayer dark={dark} />
      </div>

      {/* ── Footer ── */}
      <footer className="mt-20 pb-4">
        <p className="text-[11px] tracking-wide" style={{ color: dark ? '#57534e' : '#d6d3d1' }}>
          Stay focused.
        </p>
      </footer>

      {/* ── Settings / Export modal ── */}
      {showSettings && (
        <SettingsModal
          todos={todos}
          sessions={sessions}
          onImport={handleImport}
          onClose={() => setShowSettings(false)}
          dark={dark}
        />
      )}
    </div>
  )
}
