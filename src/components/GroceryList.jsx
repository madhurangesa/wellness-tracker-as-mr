import { useState } from 'react'
import { generateId } from '../upstash'
import { USERS, getWeekKey } from '../utils'

const CATEGORIES = ['Proteins', 'Vegetables', 'Fruits', 'Grains', 'Dairy/Alt', 'Pantry', 'Other']

const STAPLES = {
  Proteins:    ['Chicken breast', 'Salmon fillet', 'Eggs (x12)', 'Greek yogurt', 'Canned tuna', 'Lean beef mince', 'Cottage cheese'],
  Vegetables:  ['Broccoli', 'Spinach', 'Sweet potato', 'Zucchini', 'Bell peppers', 'Carrots', 'Cherry tomatoes'],
  Fruits:      ['Blueberries', 'Banana', 'Apple', 'Frozen mixed berries', 'Orange'],
  Grains:      ['Rolled oats', 'Brown rice', 'Whole grain bread', 'Quinoa'],
  'Dairy/Alt': ['Almond milk', 'Low-fat cheese', 'Unsweetened yogurt'],
  Pantry:      ['Olive oil', 'Almond butter', 'Hummus', 'Canned chickpeas', 'Lentils (dry)'],
  Other:       [],
}

export default function GroceryList({ activeUser, allData, onUpdate, onDelete }) {
  const [viewUser,    setViewUser]    = useState(activeUser)
  const [newItem,     setNewItem]     = useState('')
  const [newCat,      setNewCat]      = useState('Other')
  const [showStaples, setShowStaples] = useState(false)

  const weekKey  = getWeekKey()
  const canEdit  = viewUser === activeUser
  const items    = allData?.[viewUser]?.groceries?.[weekKey]?.items || {}
  const itemList = Object.entries(items)

  const addItem = (name, cat = newCat) => {
    if (!name.trim()) return
    const id = generateId()
    onUpdate(viewUser, ['groceries', weekKey, 'items', id], {
      name: name.trim(), category: cat, checked: false,
    })
    setNewItem('')
  }

  const toggleItem = (id, cur) => {
    if (!canEdit) return
    onUpdate(viewUser, ['groceries', weekKey, 'items', id, 'checked'], !cur)
  }

  const deleteItem = (id) => {
    if (!canEdit) return
    onDelete(viewUser, ['groceries', weekKey, 'items', id])
  }

  const clearChecked = () =>
    itemList.filter(([, v]) => v.checked).forEach(([id]) =>
      onDelete(viewUser, ['groceries', weekKey, 'items', id]))

  const unchecked    = itemList.filter(([, v]) => !v.checked).length
  const checkedCount = itemList.filter(([, v]) =>  v.checked).length
  const alreadyAdded = (name) => itemList.some(([, v]) => v.name === name)

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = itemList.filter(([, v]) => v.category === cat)
    return acc
  }, {})

  return (
    <div className="page">
      <div className="page-header">
        <h2>Groceries</h2>
        <div className="grocery-counts">
          <span className="g-count">{unchecked} to get</span>
          {checkedCount > 0 && <span className="g-count muted">{checkedCount} done</span>}
          {checkedCount > 0 && canEdit && (
            <button className="clear-btn" onClick={clearChecked}>Clear done</button>
          )}
        </div>
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
        <div className="info-banner">Viewing {USERS[viewUser].name}'s list (read-only)</div>
      )}

      {canEdit && (
        <div className="add-section">
          <div className="add-row">
            <input value={newItem} onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(newItem)}
              placeholder="Add an item…" />
            <select value={newCat} onChange={e => setNewCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-add" onClick={() => addItem(newItem)}>Add</button>
          </div>
          <button className="staples-toggle" onClick={() => setShowStaples(v => !v)}>
            {showStaples ? '▲ Hide' : '▼ Show'} healthy staples
          </button>
          {showStaples && (
            <div className="staples-panel">
              {CATEGORIES.filter(c => STAPLES[c].length > 0).map(cat => (
                <div key={cat} className="staple-group">
                  <div className="staple-cat">{cat}</div>
                  <div className="staple-chips">
                    {STAPLES[cat].map(item => {
                      const added = alreadyAdded(item)
                      return (
                        <button key={item} className={`chip ${added ? 'added' : ''}`}
                          disabled={added} onClick={() => !added && addItem(item, cat)}>
                          {added ? '✓ ' : ''}{item}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grocery-list">
        {CATEGORIES.map(cat => {
          const catItems = grouped[cat]
          if (!catItems?.length) return null
          return (
            <div key={cat} className="g-category">
              <div className="g-cat-header">{cat}</div>
              {catItems.map(([id, item]) => (
                <div key={id} className={`g-item ${item.checked ? 'checked' : ''}`}>
                  <label className="g-check">
                    <input type="checkbox" checked={!!item.checked}
                      onChange={() => toggleItem(id, item.checked)} disabled={!canEdit} />
                    <span className="g-name">{item.name}</span>
                  </label>
                  {canEdit && (
                    <button className="g-delete" onClick={() => deleteItem(id)}>×</button>
                  )}
                </div>
              ))}
            </div>
          )
        })}
        {itemList.length === 0 && (
          <div className="empty-state">
            {canEdit ? 'Add items above or pick from the staples list' : 'No items yet'}
          </div>
        )}
      </div>
    </div>
  )
}
