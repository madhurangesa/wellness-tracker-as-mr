import { useState, useEffect, useCallback } from 'react'
import { getAllData, updateUserPath, deleteUserPath } from './upstash'
import { USERS } from './utils'
import Schedule      from './components/Schedule'
import MealPlanner   from './components/MealPlanner'
import GroceryList   from './components/GroceryList'
import WeightTracker from './components/WeightTracker'

const TABS = [
  { id: 'schedule',  icon: '📅', label: 'Schedule'  },
  { id: 'meals',     icon: '🥗', label: 'Meals'     },
  { id: 'groceries', icon: '🛒', label: 'Groceries' },
  { id: 'weight',    icon: '📊', label: 'Weight'    },
]

function applyPath(obj, path, value) {
  const next = JSON.parse(JSON.stringify(obj || {}))
  let cur = next
  for (let i = 0; i < path.length - 1; i++) {
    const k = String(path[i])
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {}
    cur = cur[k]
  }
  cur[String(path[path.length - 1])] = value
  return next
}

function removePath(obj, path) {
  const next = JSON.parse(JSON.stringify(obj || {}))
  let cur = next
  for (let i = 0; i < path.length - 1; i++) {
    const k = String(path[i])
    if (!cur[k]) return next
    cur = cur[k]
  }
  delete cur[String(path[path.length - 1])]
  return next
}

export default function App() {
  const [activeUser, setActiveUser] = useState(() => localStorage.getItem('wt_user') || null)
  const [activeTab,  setActiveTab]  = useState('schedule')
  const [allData,    setAllData]    = useState({ vancouver: {}, newportnews: {} })
  const [loading,    setLoading]    = useState(true)
  const [syncing,    setSyncing]    = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const data = await getAllData()
      setAllData(data)
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!activeUser) { setLoading(false); return }
    fetchData()
    const iv = setInterval(fetchData, 20000)
    window.addEventListener('focus', fetchData)
    return () => { clearInterval(iv); window.removeEventListener('focus', fetchData) }
  }, [activeUser, fetchData])

  const onUpdate = useCallback(async (userId, path, value) => {
    setAllData(prev => ({
      ...prev,
      [userId]: applyPath(prev[userId], path, value),
    }))
    setSyncing(true)
    try   { await updateUserPath(userId, path, value) }
    catch (e) { console.error('Save error:', e) }
    finally   { setSyncing(false) }
  }, [])

  const onDelete = useCallback(async (userId, path) => {
    setAllData(prev => ({
      ...prev,
      [userId]: removePath(prev[userId], path),
    }))
    setSyncing(true)
    try   { await deleteUserPath(userId, path) }
    catch (e) { console.error('Delete error:', e) }
    finally   { setSyncing(false) }
  }, [])

  const selectUser = (uid) => {
    localStorage.setItem('wt_user', uid)
    setActiveUser(uid)
    setLoading(true)
  }

  const signOut = () => {
    localStorage.removeItem('wt_user')
    setActiveUser(null)
    setAllData({ vancouver: {}, newportnews: {} })
    setLoading(true)
  }

  if (!activeUser) {
    return (
      <div className="user-select-screen">
        <div className="user-select-card">
          <div className="app-logo">💪</div>
          <h1>Wellness Tracker</h1>
          <p className="app-subtitle">Phase 1 · Weeks 1–4</p>
          <div className="user-buttons">
            {Object.entries(USERS).map(([uid, u]) => (
              <button key={uid} className="user-select-btn"
                onClick={() => selectUser(uid)} style={{ '--uc': u.color }}>
                <div className="user-avatar" style={{ background: u.color }}>{u.short}</div>
                <div className="user-select-info">
                  <div className="user-select-name">{u.name}</div>
                  <div className="user-select-loc">{u.label} · {u.tz}</div>
                </div>
                <span className="user-select-arrow">→</span>
              </button>
            ))}
          </div>
          <p className="user-note">Your choice is saved on this device</p>
        </div>
      </div>
    )
  }

  const u = USERS[activeUser]

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="header-title">Wellness Tracker</span>
          <span className="header-phase">Phase 1</span>
          {syncing && <span className="syncing-dot" title="Saving…" />}
        </div>
        <button className="header-user-btn" onClick={signOut} style={{ '--uc': u.color }}>
          <div className="hu-avatar" style={{ background: u.color }}>{u.short}</div>
          <span className="hu-tz">{u.tz}</span>
        </button>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : (
          <>
            {activeTab === 'schedule'  && <Schedule      activeUser={activeUser} allData={allData} onUpdate={onUpdate} onDelete={onDelete} />}
            {activeTab === 'meals'     && <MealPlanner   activeUser={activeUser} allData={allData} onUpdate={onUpdate} onDelete={onDelete} />}
            {activeTab === 'groceries' && <GroceryList   activeUser={activeUser} allData={allData} onUpdate={onUpdate} onDelete={onDelete} />}
            {activeTab === 'weight'    && <WeightTracker activeUser={activeUser} allData={allData} onUpdate={onUpdate} onDelete={onDelete} />}
          </>
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map(t => (
          <button key={t.id}
            className={`nav-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={{ '--uc': u.color }}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
