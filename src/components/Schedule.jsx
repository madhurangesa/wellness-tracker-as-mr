import { useState, useEffect, useRef } from 'react'
import { USERS, OTHER_USER, DAYS, SHORT_DAYS, DAY_TYPES, getWeekKey, getTodayIndex } from '../utils'

const DESK_BREAKS = [
  { name: 'Chin tucks',         target: 'Neck hump',     rep: '10 reps' },
  { name: 'Shoulder squeeze',   target: 'Upper back',    rep: '10 reps · 2s hold' },
  { name: 'Sit-to-stand',       target: 'Lower back',    rep: '5 reps slow' },
  { name: 'Piriformis stretch', target: 'Sciatica',      rep: '20s each side' },
  { name: 'Chest opener',       target: 'Posture reset', rep: '20s hold' },
]

const SCHEDULE = {
  vancouver: [
    { time: '8:00 AM',           label: 'Wake up + bed stretch',   sub: '5 min — every day',       type: 'morning'  },
    { time: '8:10 AM',           label: 'Get ready + breakfast',   sub: 'High protein',            type: 'morning'  },
    { time: '9:00 AM – 5:00 PM', label: 'Work',                    sub: 'Desk break every hour',   type: 'work'     },
    { time: '5:00 PM',           label: '__ACTIVITY__',            sub: '',                         type: 'exercise' },
    { time: '5:30 PM',           label: 'Freshen up + decompress', sub: '',                         type: 'default'  },
    { time: '5:30 – 7:00 PM',    label: 'Joint time with friend',  sub: '= 8:30–10:00 PM ET',      type: 'joint'    },
    { time: '7:00 PM',           label: 'Dinner',                  sub: '',                         type: 'default'  },
    { time: '8:00 – 9:30 PM',    label: 'Creative writing',        sub: 'Solo focus · phone away',  type: 'creative' },
    { time: '9:30 PM',           label: 'Wind down',               sub: 'No screens',               type: 'default'  },
    { time: '10:30 PM',          label: 'Sleep',                   sub: '',                         type: 'sleep'    },
  ],
  newportnews: [
    { time: '8:00 AM',           label: 'Wake up + bed stretch',   sub: '5 min — every day',       type: 'morning'  },
    { time: '8:10 AM',           label: 'Get ready + breakfast',   sub: 'High protein',            type: 'morning'  },
    { time: '9:00 AM – 5:00 PM', label: 'Work',                    sub: 'Desk break every hour',   type: 'work'     },
    { time: '5:00 PM',           label: '__ACTIVITY__',            sub: '',                         type: 'exercise' },
    { time: '5:30 PM',           label: 'Dinner prep + dinner',    sub: '',                         type: 'default'  },
    { time: '7:00 – 8:30 PM',    label: 'Art time',                sub: 'Solo creative focus',     type: 'creative' },
    { time: '8:30 – 10:00 PM',   label: 'Joint time with friend',  sub: '= 5:30–7:00 PM PT',       type: 'joint'    },
    { time: '10:00 PM',          label: 'Wind down',               sub: 'No screens',               type: 'default'  },
    { time: '10:30 PM',          label: 'Sleep',                   sub: '',                         type: 'sleep'    },
  ],
}

const BLOCK_BG = {
  morning: '#fff8f0', work: '#eef2ff', exercise: '#e8f5f0',
  joint: '#eeecfe', creative: '#fff8e6', default: '#f9f9f9', sleep: '#f2f2f2',
}

const BADGE = {
  exercise: { bg: '#e8f5f0', color: '#0F6E56' },
  walk:     { bg: '#e8f5e8', color: '#2e7d32' },
  rest:     { bg: '#f0f0f0', color: '#888'    },
}

// Returns an array of 7 Date objects for Mon–Sun of the current week
function getCurrentWeekDates() {
  const today      = new Date()
  const dayOfWeek  = today.getDay() || 7       // 1 = Mon … 7 = Sun
  const monday     = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + 1)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function fmtRange(dates) {
  const opts = { month: 'short', day: 'numeric' }
  const start = dates[0].toLocaleDateString('en-US', opts)
  const end   = dates[6].toLocaleDateString('en-US', { ...opts, year: 'numeric' })
  return `${start} – ${end}`
}

export default function Schedule({ activeUser, allData, onUpdate }) {
  const weekKey   = getWeekKey()
  const todayIdx  = getTodayIndex()
  const otherUser = OTHER_USER[activeUser]
  const userColor = USERS[activeUser].color
  const weekDates = getCurrentWeekDates()

  const [selDay,    setSelDay]    = useState(todayIdx)
  const [noteVal,   setNoteVal]   = useState('')
  const [showDesk,  setShowDesk]  = useState(false)
  const [timerOn,   setTimerOn]   = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [secs,      setSecs]      = useState(3600)
  const timerRef = useRef(null)

  const myWeek    = allData?.[activeUser]?.schedule?.[weekKey] || {}
  const otherWeek = allData?.[otherUser]?.schedule?.[weekKey]  || {}

  useEffect(() => {
    setNoteVal(myWeek?.[selDay]?.note || '')
  }, [selDay, weekKey])

  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(timerRef.current)
            setTimerOn(false)
            setTimerDone(true)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerOn])

  const startTimer = () => { setSecs(3600); setTimerOn(true);  setTimerDone(false) }
  const stopTimer  = () => { setTimerOn(false); setSecs(3600); setTimerDone(false) }
  const fmt        = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // Toggle checkbox — tap once to check, tap again to uncheck
  const toggle = (dayIdx, field) => {
    const cur = myWeek?.[dayIdx]?.[field] || false
    onUpdate(activeUser, ['schedule', weekKey, dayIdx, field], !cur)
  }

  const saveNote = () => onUpdate(activeUser, ['schedule', weekKey, selDay, 'note'], noteVal)

  const dayType  = DAY_TYPES[selDay]
  const activity =
    dayType === 'exercise' ? 'Exercise · 25 min' :
    dayType === 'walk'     ? 'Walk · 15–20 min'  : 'Rest day'

  const blocks = SCHEDULE[activeUser].map(b => ({
    ...b, label: b.label.replace('__ACTIVITY__', activity),
  }))

  const completedCount = Object.values(myWeek).filter(d => d?.mainDone).length

  // Full date label for the selected day detail header
  const selDateLabel = weekDates[selDay].toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Schedule</h2>
          <div className="week-range-label">{fmtRange(weekDates)}</div>
        </div>
        <span className="streak-badge" style={{ background: '#e8f5f0', color: '#0F6E56' }}>
          {completedCount}/6 this week
        </span>
      </div>

      {/* Week strip — shows day name + date number */}
      <div className="week-strip">
        {SHORT_DAYS.map((d, i) => {
          const type      = DAY_TYPES[i]
          const done      = !!myWeek?.[i]?.mainDone
          const isTdy     = i === todayIdx
          const isSel     = i === selDay
          const dateNum   = weekDates[i].getDate()
          return (
            <button key={i}
              className={`day-pill ${isSel ? 'sel' : ''} ${isTdy ? 'tdy' : ''}`}
              onClick={() => setSelDay(i)}
              style={{ '--uc': userColor }}>
              <span className="dp-d">{d}</span>
              <span className="dp-num">{dateNum}</span>
              <span className="dp-t">{type === 'rest' ? '—' : type.slice(0, 2)}</span>
              <span className="dp-c" style={{ color: done ? userColor : '#ccc' }}>
                {type === 'rest' ? '' : done ? '✓' : '○'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      <div className="detail-card">
        <div className="detail-header">
          <div>
            <h3>{selDateLabel}</h3>
            {selDay === todayIdx && <span className="today-tag">Today</span>}
          </div>
          <span className="type-badge" style={BADGE[dayType]}>{dayType}</span>
        </div>

        {/* Checkboxes — tap to check, tap again to uncheck */}
        {dayType !== 'rest' && (
          <div className="check-group">
            <p className="check-hint">Tap to check off · tap again to undo</p>
            {[
              { key: 'bedStretch', label: 'Morning bed stretch (5 min)' },
              { key: 'mainDone',   label: dayType === 'exercise' ? 'Exercise session (25 min)' : 'Walk (15–20 min)' },
              { key: 'deskBreaks', label: 'Hourly desk breaks' },
            ].map(({ key, label }) => (
              <label key={key} className="check-row">
                <input type="checkbox"
                  checked={!!myWeek?.[selDay]?.[key]}
                  onChange={() => toggle(selDay, key)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Friend status */}
        <div className="friend-strip" style={{ borderColor: USERS[otherUser].color + '44' }}>
          <span style={{ color: USERS[otherUser].color, fontWeight: 500 }}>
            {USERS[otherUser].name}:
          </span>
          <span className="friend-status-text">
            {dayType === 'rest' ? ' rest day' : (
              [
                otherWeek?.[selDay]?.bedStretch ? 'stretch ✓' : null,
                otherWeek?.[selDay]?.mainDone
                  ? (dayType === 'exercise' ? 'exercise ✓' : 'walk ✓') : null,
                otherWeek?.[selDay]?.deskBreaks ? 'desk ✓' : null,
              ].filter(Boolean).join(' · ') || ' nothing logged yet'
            )}
          </span>
        </div>

        {/* Note field — type anything, saves automatically when you tap away */}
        <div className="note-wrap">
          <input className="note-input"
            placeholder="Note — skipped, feeling sore, substituted… (saves when you tap away)"
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            onBlur={saveNote} />
        </div>

        {/* Time blocks */}
        <div className="time-blocks">
          {blocks.map((b, i) => (
            <div key={i} className="time-block" style={{ background: BLOCK_BG[b.type] }}>
              <span className="tb-time">{b.time}</span>
              <div className="tb-body">
                <span className="tb-label">{b.label}</span>
                {b.sub && <span className="tb-sub">{b.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desk break section */}
      <div className="desk-section">
        <div className="desk-header" onClick={() => setShowDesk(v => !v)}>
          <span>Desk break moves</span>
          <span className="desk-chevron">{showDesk ? '▲' : '▼'}</span>
          {!timerOn && !timerDone && (
            <button className="timer-btn" onClick={e => { e.stopPropagation(); startTimer() }}>
              Start 60 min timer
            </button>
          )}
          {timerOn && (
            <span className="timer-live" onClick={e => e.stopPropagation()}>
              Next break in {fmt(secs)}
              <button onClick={e => { e.stopPropagation(); stopTimer() }}>✕</button>
            </span>
          )}
          {timerDone && (
            <span className="timer-done" onClick={e => { e.stopPropagation(); startTimer() }}>
              Break time! Tap to restart
            </span>
          )}
        </div>
        {showDesk && (
          <div className="desk-grid">
            {DESK_BREAKS.map((m, i) => (
              <div key={i} className="desk-card">
                <div className="desk-name">{m.name}</div>
                <div className="desk-target">{m.target}</div>
                <div className="desk-rep">{m.rep}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
