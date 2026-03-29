import { useState, useEffect, useRef } from 'react'
import { generateId } from '../upstash'
import { USERS, OTHER_USER, DAYS, SHORT_DAYS, DAY_TYPES, getWeekKey, getTodayIndex } from '../utils'

const DESK_BREAKS = [
  { name: 'Chin tucks',         target: 'Neck hump',     rep: '10 reps' },
  { name: 'Shoulder squeeze',   target: 'Upper back',    rep: '10 reps · 2s hold' },
  { name: 'Sit-to-stand',       target: 'Lower back',    rep: '5 reps slow' },
  { name: 'Piriformis stretch', target: 'Sciatica',      rep: '20s each side' },
  { name: 'Chest opener',       target: 'Posture reset', rep: '20s hold' },
]

const BLOCK_BG = {
  morning: '#fff8f0', work: '#eef2ff', exercise: '#e8f5f0',
  joint: '#eeecfe', creative: '#fff8e6', default: '#f9f9f9', sleep: '#f2f2f2',
}
const BADGE = {
  exercise: { bg: '#e8f5f0', color: '#0F6E56' },
  walk:     { bg: '#e8f5e8', color: '#2e7d32' },
  rest:     { bg: '#f0f0f0', color: '#888'    },
}
const BLOCK_TYPES = ['morning','work','exercise','joint','creative','default','sleep']

// ── Default schedules per user per day-type ───────────────────────────────
const DEFAULTS = {
  vancouver: {
    exercise: [
      { time:'8:00 AM',           label:'Wake up + bed stretch',   sub:'5 min — every day',      type:'morning'  },
      { time:'8:10 AM',           label:'Get ready + breakfast',   sub:'High protein',           type:'morning'  },
      { time:'9:00 AM – 5:00 PM', label:'Work',                    sub:'Desk break every hour',  type:'work'     },
      { time:'5:00 PM',           label:'Exercise · 25 min',       sub:'Cardio + light weights', type:'exercise' },
      { time:'5:30 PM',           label:'Freshen up',              sub:'',                       type:'default'  },
      { time:'5:30 – 7:00 PM',    label:'Joint time with friend',  sub:'= 8:30–10:00 PM ET',     type:'joint'    },
      { time:'7:00 PM',           label:'Dinner',                  sub:'',                       type:'default'  },
      { time:'8:00 – 9:30 PM',    label:'Creative writing',        sub:'Solo focus',             type:'creative' },
      { time:'9:30 PM',           label:'Wind down',               sub:'No screens',             type:'default'  },
      { time:'10:30 PM',          label:'Sleep',                   sub:'',                       type:'sleep'    },
    ],
    walk: [
      { time:'8:00 AM',           label:'Wake up + bed stretch',   sub:'5 min — every day',      type:'morning'  },
      { time:'8:10 AM',           label:'Get ready + breakfast',   sub:'High protein',           type:'morning'  },
      { time:'9:00 AM – 5:00 PM', label:'Work',                    sub:'Desk break every hour',  type:'work'     },
      { time:'5:00 PM',           label:'Walk · 15–20 min',        sub:'Outside if possible',    type:'exercise' },
      { time:'5:30 PM',           label:'Freshen up',              sub:'',                       type:'default'  },
      { time:'5:30 – 7:00 PM',    label:'Joint time with friend',  sub:'= 8:30–10:00 PM ET',     type:'joint'    },
      { time:'7:00 PM',           label:'Dinner',                  sub:'',                       type:'default'  },
      { time:'8:00 – 9:30 PM',    label:'Creative writing',        sub:'Solo focus',             type:'creative' },
      { time:'9:30 PM',           label:'Wind down',               sub:'No screens',             type:'default'  },
      { time:'10:30 PM',          label:'Sleep',                   sub:'',                       type:'sleep'    },
    ],
    rest: [
      { time:'8:00 AM',    label:'Wake up — rest day',       sub:'No alarm needed',          type:'morning'  },
      { time:'Morning',    label:'Gentle stretch or walk',   sub:'Optional, easy pace',      type:'exercise' },
      { time:'Afternoon',  label:'Free time',                sub:'Errands, reading, relax',  type:'default'  },
      { time:'Evening',    label:'Joint time with friend',   sub:'= ET evening',             type:'joint'    },
      { time:'10:30 PM',   label:'Sleep',                    sub:'',                         type:'sleep'    },
    ],
  },
  newportnews: {
    exercise: [
      { time:'8:00 AM',           label:'Wake up + bed stretch',   sub:'5 min — every day',      type:'morning'  },
      { time:'8:10 AM',           label:'Get ready + breakfast',   sub:'High protein',           type:'morning'  },
      { time:'9:00 AM – 5:00 PM', label:'Work',                    sub:'Desk break every hour',  type:'work'     },
      { time:'5:00 PM',           label:'Exercise · 25 min',       sub:'Cardio + light weights', type:'exercise' },
      { time:'5:30 PM',           label:'Dinner prep + dinner',    sub:'',                       type:'default'  },
      { time:'7:00 – 8:30 PM',    label:'Art time',                sub:'Solo creative focus',    type:'creative' },
      { time:'8:30 – 10:00 PM',   label:'Joint time with friend',  sub:'= 5:30–7:00 PM PT',      type:'joint'    },
      { time:'10:00 PM',          label:'Wind down',               sub:'No screens',             type:'default'  },
      { time:'10:30 PM',          label:'Sleep',                   sub:'',                       type:'sleep'    },
    ],
    walk: [
      { time:'8:00 AM',           label:'Wake up + bed stretch',   sub:'5 min — every day',      type:'morning'  },
      { time:'8:10 AM',           label:'Get ready + breakfast',   sub:'High protein',           type:'morning'  },
      { time:'9:00 AM – 5:00 PM', label:'Work',                    sub:'Desk break every hour',  type:'work'     },
      { time:'5:00 PM',           label:'Walk · 15–20 min',        sub:'Outside if possible',    type:'exercise' },
      { time:'5:30 PM',           label:'Dinner prep + dinner',    sub:'',                       type:'default'  },
      { time:'7:00 – 8:30 PM',    label:'Art time',                sub:'Solo creative focus',    type:'creative' },
      { time:'8:30 – 10:00 PM',   label:'Joint time with friend',  sub:'= 5:30–7:00 PM PT',      type:'joint'    },
      { time:'10:00 PM',          label:'Wind down',               sub:'No screens',             type:'default'  },
      { time:'10:30 PM',          label:'Sleep',                   sub:'',                       type:'sleep'    },
    ],
    rest: [
      { time:'8:00 AM',   label:'Wake up — rest day',      sub:'No alarm needed',          type:'morning'  },
      { time:'Morning',   label:'Gentle stretch or walk',  sub:'Optional, easy pace',      type:'exercise' },
      { time:'Afternoon', label:'Free time',               sub:'Errands, reading, relax',  type:'default'  },
      { time:'Evening',   label:'Joint time with friend',  sub:'= PT evening',             type:'joint'    },
      { time:'10:30 PM',  label:'Sleep',                   sub:'',                         type:'sleep'    },
    ],
  },
}

// ── Date helpers ──────────────────────────────────────────────────────────
function getCurrentWeekDates() {
  const today  = new Date()
  const dow    = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow + 1)
  monday.setHours(0,0,0,0)
  return Array.from({ length:7 }, (_,i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function fmtRange(dates) {
  const s = dates[0].toLocaleDateString('en-US', { month:'short', day:'numeric' })
  const e = dates[6].toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
  return `${s} – ${e}`
}

function parseTimeMins(str) {
  const start = str.split('–')[0].trim()
  const m = start.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!m) return null
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  const p = m[3].toUpperCase()
  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0
  return h * 60 + min
}

function isCurrentBlock(blocks, idx) {
  const start = parseTimeMins(blocks[idx].time)
  if (start === null) return false
  const next = blocks.slice(idx+1).map(b => parseTimeMins(b.time)).find(v => v !== null) ?? (24*60)
  const now  = new Date().getHours()*60 + new Date().getMinutes()
  return now >= start && now < next
}

function getSchedule(allData, userId, dayType) {
  const custom = allData?.[userId]?.customSchedule?.[dayType]
  if (custom && Array.isArray(custom) && custom.length > 0) return custom
  return (DEFAULTS[userId]?.[dayType] || DEFAULTS.vancouver.exercise)
    .map((b,i) => ({ ...b, id:`def-${i}` }))
}

// ── Main component ────────────────────────────────────────────────────────
export default function Schedule({ activeUser, allData, onUpdate }) {
  const weekKey   = getWeekKey()
  const todayIdx  = getTodayIndex()
  const otherUser = OTHER_USER[activeUser]
  const userColor = USERS[activeUser].color
  const weekDates = getCurrentWeekDates()

  const [selDay,    setSelDay]    = useState(todayIdx)
  const [noteVal,   setNoteVal]   = useState('')
  const [showDesk,  setShowDesk]  = useState(false)
  const [editMode,  setEditMode]  = useState(false)
  const [timerOn,   setTimerOn]   = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [secs,      setSecs]      = useState(3600)
  const timerRef = useRef(null)

  const myWeek    = allData?.[activeUser]?.schedule?.[weekKey] || {}
  const otherWeek = allData?.[otherUser]?.schedule?.[weekKey]  || {}
  const dayType   = DAY_TYPES[selDay]
  const blocks    = getSchedule(allData, activeUser, dayType)

  useEffect(() => {
    setNoteVal(myWeek?.[selDay]?.note || '')
    setEditMode(false)
  }, [selDay])

  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) { clearInterval(timerRef.current); setTimerOn(false); setTimerDone(true); return 0 }
          return s - 1
        })
      }, 1000)
    } else clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [timerOn])

  const startTimer = () => { setSecs(3600); setTimerOn(true);  setTimerDone(false) }
  const stopTimer  = () => { setTimerOn(false); setSecs(3600); setTimerDone(false) }
  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  const toggle   = (idx, field) =>
    onUpdate(activeUser, ['schedule', weekKey, idx, field], !(myWeek?.[idx]?.[field] || false))
  const saveNote = () =>
    onUpdate(activeUser, ['schedule', weekKey, selDay, 'note'], noteVal)

  // Edit helpers
  const saveBlocks   = updated => onUpdate(activeUser, ['customSchedule', dayType], updated)
  const updateBlock  = (id, field, val) => saveBlocks(blocks.map(b => b.id===id ? {...b,[field]:val} : b))
  const deleteBlock  = id => saveBlocks(blocks.filter(b => b.id !== id))
  const addBlock     = () => saveBlocks([...blocks, { id:generateId(), time:'', label:'New block', sub:'', type:'default' }])
  const moveBlock    = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id)
    const n   = idx + dir
    if (n < 0 || n >= blocks.length) return
    const u = [...blocks];[u[idx],u[n]]=[u[n],u[idx]]; saveBlocks(u)
  }
  const resetToDefault = () =>
    saveBlocks((DEFAULTS[activeUser]?.[dayType]||DEFAULTS.vancouver.exercise).map((b,i)=>({...b,id:`def-${i}`})))

  const completedCount = Object.values(myWeek).filter(d => d?.mainDone).length
  const selDateLabel   = weekDates[selDay].toLocaleDateString('en-US', {
    weekday:'long', month:'long', day:'numeric',
  })

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Schedule</h2>
          <div className="week-range-label">{fmtRange(weekDates)}</div>
        </div>
        <span className="streak-badge" style={{ background:'#e8f5f0', color:'#0F6E56' }}>
          {completedCount}/6 this week
        </span>
      </div>

      {/* Week strip */}
      <div className="week-strip">
        {SHORT_DAYS.map((d,i) => {
          const type    = DAY_TYPES[i]
          const done    = !!myWeek?.[i]?.mainDone
          const isTdy   = i === todayIdx
          const isSel   = i === selDay
          return (
            <button key={i}
              className={`day-pill ${isSel?'sel':''} ${isTdy?'tdy':''}`}
              onClick={() => setSelDay(i)}
              style={{ '--uc': userColor }}>
              <span className="dp-d">{d}</span>
              <span className="dp-num">{weekDates[i].getDate()}</span>
              <span className="dp-t">{type==='rest'?'rest':type.slice(0,2)}</span>
              <span className="dp-c" style={{ color: done ? userColor : '#ccc' }}>
                {type==='rest' ? '' : done ? '✓' : '○'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Detail card */}
      <div className="detail-card">
        <div className="detail-header">
          <div>
            <h3>{selDateLabel}</h3>
            {selDay === todayIdx && <span className="today-tag">Today</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className="type-badge" style={BADGE[dayType]}>{dayType}</span>
            <button
              className={`edit-schedule-btn ${editMode ? 'on' : ''}`}
              onClick={() => setEditMode(v => !v)}>
              {editMode ? 'Done editing' : '✏ Edit'}
            </button>
          </div>
        </div>

        {/* Checkboxes — only active days get these */}
        {dayType !== 'rest' ? (
          <div className="check-group">
            <p className="check-hint">Tap to check · tap again to uncheck</p>
            {[
              { key:'bedStretch', label:'Morning bed stretch (5 min)' },
              { key:'mainDone',   label: dayType==='exercise' ? 'Exercise done (25 min)' : 'Walk done (15–20 min)' },
              { key:'deskBreaks', label:'Hourly desk breaks done' },
            ].map(({ key, label }) => (
              <label key={key} className="check-row">
                <input type="checkbox"
                  checked={!!myWeek?.[selDay]?.[key]}
                  onChange={() => toggle(selDay, key)} />
                <span className={myWeek?.[selDay]?.[key] ? 'check-done' : ''}>{label}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="rest-note">
            Sunday is your rest day — no logging needed.
            Tap Mon–Sat to check off activities.
          </div>
        )}

        {/* Friend status */}
        <div className="friend-strip" style={{ borderColor: USERS[otherUser].color+'44' }}>
          <span style={{ color:USERS[otherUser].color, fontWeight:500 }}>
            {USERS[otherUser].name}:
          </span>
          <span className="friend-status-text">
            {dayType==='rest' ? ' rest day' : (
              [
                otherWeek?.[selDay]?.bedStretch ? 'stretch ✓' : null,
                otherWeek?.[selDay]?.mainDone
                  ? (dayType==='exercise' ? 'exercise ✓' : 'walk ✓') : null,
                otherWeek?.[selDay]?.deskBreaks ? 'desk ✓' : null,
              ].filter(Boolean).join(' · ') || ' nothing logged yet'
            )}
          </span>
        </div>

        {/* Note */}
        <div className="note-wrap">
          <input className="note-input"
            placeholder="Note — skipped, sore, rescheduled… (auto-saves when you tap away)"
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            onBlur={saveNote} />
        </div>

        {/* Normal time blocks view */}
        {!editMode && (
          <div className="time-blocks">
            {blocks.map((b, i) => {
              const isNow = selDay === todayIdx && isCurrentBlock(blocks, i)
              return (
                <div key={b.id}
                  className={`time-block ${isNow ? 'now' : ''}`}
                  style={{ background: isNow ? undefined : BLOCK_BG[b.type] }}>
                  {isNow && <span className="now-dot" />}
                  <span className="tb-time">{b.time}</span>
                  <div className="tb-body">
                    <span className="tb-label">{b.label}</span>
                    {b.sub && <span className="tb-sub">{b.sub}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Edit mode */}
        {editMode && (
          <div className="edit-blocks">
            <p className="edit-hint">
              Editing the <strong>{dayType}</strong> day template.
              Affects all {dayType} days. Changes save instantly.
            </p>
            {blocks.map((b, i) => (
              <div key={b.id} className="edit-block-row">
                <div className="edit-block-fields">
                  <input className="eb-time"
                    value={b.time} placeholder="Time e.g. 5:30 PM"
                    onChange={e => updateBlock(b.id,'time',e.target.value)} />
                  <input className="eb-label"
                    value={b.label} placeholder="Activity name"
                    onChange={e => updateBlock(b.id,'label',e.target.value)} />
                  <input className="eb-sub"
                    value={b.sub} placeholder="Sub-note (optional)"
                    onChange={e => updateBlock(b.id,'sub',e.target.value)} />
                  <select className="eb-type"
                    value={b.type}
                    onChange={e => updateBlock(b.id,'type',e.target.value)}>
                    {BLOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="edit-block-actions">
                  <button className="eb-move" onClick={() => moveBlock(b.id,-1)} disabled={i===0}>↑</button>
                  <button className="eb-move" onClick={() => moveBlock(b.id, 1)} disabled={i===blocks.length-1}>↓</button>
                  <button className="eb-del"  onClick={() => deleteBlock(b.id)}>×</button>
                </div>
              </div>
            ))}
            <div className="edit-block-footer">
              <button className="btn-add-block" onClick={addBlock}>+ Add block</button>
              <button className="btn-reset"     onClick={resetToDefault}>Reset to default</button>
            </div>
          </div>
        )}
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
            {DESK_BREAKS.map((m,i) => (
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
