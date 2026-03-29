import { useState } from 'react'
import { USERS, DAYS, getWeekKey } from '../utils'

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const SUGGESTIONS = {
  Breakfast: ['Greek yogurt + berries', 'Eggs + avocado toast', 'Oats + protein powder', 'Cottage cheese + banana', '2 eggs + fruit'],
  Lunch:     ['Grilled chicken salad', 'Lentil soup', 'Tuna + whole grain crackers', 'Turkey wrap + greens', 'Salmon + salad'],
  Dinner:    ['Salmon + roasted veg', 'Chicken + sweet potato', 'Turkey mince stir-fry', 'Baked cod + broccoli', 'Lean beef bowl + rice'],
  Snack:     ['Apple + almond butter', 'Handful of mixed nuts', 'Hard-boiled egg', 'Hummus + veggie sticks', 'Protein bar'],
}

export default function MealPlanner({ activeUser, allData, onUpdate }) {
  const [viewUser,  setViewUser]  = useState(activeUser)
  const [editCell,  setEditCell]  = useState(null)
  const [editValue, setEditValue] = useState('')
  const [selDay,    setSelDay]    = useState(0)

  const weekKey = getWeekKey()
  const canEdit = viewUser === activeUser
  const meals   = allData?.[viewUser]?.meals?.[weekKey] || {}

  const getCell   = (dayIdx, meal) => meals?.[dayIdx]?.[meal.toLowerCase()] || ''
  const isEditing = (dayIdx, meal) => editCell?.day === dayIdx && editCell?.meal === meal

  const saveCell = async (dayIdx, meal, value) => {
    await onUpdate(viewUser, ['meals', weekKey, dayIdx, meal.toLowerCase()], value.trim())
    setEditCell(null)
    setEditValue('')
  }

  const openCell = (dayIdx, meal) => {
    if (!canEdit) return
    setEditCell({ day: dayIdx, meal })
    setEditValue(getCell(dayIdx, meal))
  }

  const planned = DAYS.reduce((acc, _, i) =>
    acc + MEALS.filter(m => getCell(i, m)).length, 0)

  return (
    <div className="page">
      <div className="page-header">
        <h2>Meal Planner</h2>
        <span className="streak-badge" style={{ background: '#fff8e6', color: '#BA7517' }}>
          {planned}/{DAYS.length * MEALS.length} planned
        </span>
      </div>

      <div className="user-toggle">
        {Object.entries(USERS).map(([uid, u]) => (
          <button key={uid} className={`toggle-btn ${viewUser === uid ? 'on' : ''}`}
            style={{ '--uc': u.color }} onClick={() => setViewUser(uid)}>
            {u.name} · {u.label}
          </button>
        ))}
      </div>

      {!canEdit && (
        <div className="info-banner">Viewing {USERS[viewUser].name}'s meal plan (read-only)</div>
      )}

      <div className="day-tab-strip">
        {DAYS.map((d, i) => (
          <button key={i} className={`day-tab ${selDay === i ? 'on' : ''}`}
            style={{ '--uc': USERS[viewUser].color }} onClick={() => setSelDay(i)}>
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="meal-day-label">{DAYS[selDay]}</div>

      <div className="meal-cards">
        {MEALS.map(meal => {
          const val     = getCell(selDay, meal)
          const editing = isEditing(selDay, meal)
          return (
            <div key={meal} className={`meal-card ${editing ? 'editing' : ''}`}>
              <div className="meal-card-header">
                <span className="meal-label">{meal}</span>
                {canEdit && !editing && (
                  <button className="edit-btn" onClick={() => openCell(selDay, meal)}>
                    {val ? 'Edit' : '+ Add'}
                  </button>
                )}
              </div>
              {editing ? (
                <div className="meal-edit">
                  <input autoFocus value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    placeholder={`Enter ${meal.toLowerCase()}…`}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  saveCell(selDay, meal, editValue)
                      if (e.key === 'Escape') setEditCell(null)
                    }} />
                  <div className="suggestion-list">
                    {SUGGESTIONS[meal].map(s => (
                      <button key={s} className="sug-chip" onClick={() => saveCell(selDay, meal, s)}>{s}</button>
                    ))}
                  </div>
                  <div className="edit-actions">
                    <button className="btn-save"   onClick={() => saveCell(selDay, meal, editValue)}>Save</button>
                    <button className="btn-cancel" onClick={() => setEditCell(null)}>Cancel</button>
                    {val && <button className="btn-clear" onClick={() => saveCell(selDay, meal, '')}>Clear</button>}
                  </div>
                </div>
              ) : (
                <div className={`meal-value ${val ? '' : 'empty'}`} onClick={() => canEdit && openCell(selDay, meal)}>
                  {val || (canEdit ? 'Tap to add…' : '—')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <details className="week-summary-toggle">
        <summary>Full week overview</summary>
        <div className="week-summary-grid-wrap">
          <div className="week-summary-grid">
            <div className="wsg-corner" />
            {MEALS.map(m => <div key={m} className="wsg-col-hd">{m.slice(0, 1)}</div>)}
            {DAYS.map((d, di) => (
              <>
                <div key={`h${di}`} className="wsg-row-hd">{d.slice(0, 3)}</div>
                {MEALS.map(m => (
                  <div key={`${di}-${m}`}
                    className={`wsg-cell ${getCell(di, m) ? 'filled' : ''}`}
                    style={{ '--uc': USERS[viewUser].color }}
                    title={getCell(di, m) || 'Empty'} />
                ))}
              </>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}
