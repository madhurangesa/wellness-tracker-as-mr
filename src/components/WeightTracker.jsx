import { useState } from 'react'
import { USERS, formatDate } from '../utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

export default function WeightTracker({ activeUser, allData, onUpdate, onDelete }) {
  const [unit,    setUnit]    = useState(() => localStorage.getItem('wt_unit') || 'lbs')
  const [weight,  setWeight]  = useState('')
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0])
  const [goalMap, setGoalMap] = useState({})

  const toggleUnit = () => {
    const nu = unit === 'lbs' ? 'kg' : 'lbs'
    setUnit(nu)
    localStorage.setItem('wt_unit', nu)
  }

  const toDisplay = (val, fromUnit) => {
    if (!val) return null
    const v = parseFloat(val)
    if (fromUnit === unit) return Math.round(v * 10) / 10
    return fromUnit === 'lbs'
      ? Math.round(v * 0.453592 * 10) / 10
      : Math.round(v * 2.20462  * 10) / 10
  }

  const logWeight = () => {
    const v = parseFloat(weight)
    if (!v || isNaN(v) || v <= 0) return
    onUpdate(activeUser, ['weight', dateVal], { value: v, unit })
    setWeight('')
  }

  const deleteEntry = (dateKey) => onDelete(activeUser, ['weight', dateKey])

  const buildSeries = (uid) => {
    const raw = allData?.[uid]?.weight || {}
    return Object.entries(raw)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, e]) => ({
        dateKey:     d,
        displayDate: formatDate(d),
        weight:      toDisplay(e.value, e.unit || 'lbs'),
      }))
      .filter(e => e.weight !== null)
  }

  const yvSeries = buildSeries('vancouver')
  const nnSeries = buildSeries('newportnews')

  const allDates = [...new Set([...yvSeries.map(e => e.dateKey), ...nnSeries.map(e => e.dateKey)])].sort()
  const chartData = allDates.map(d => ({
    date:        formatDate(d),
    vancouver:   yvSeries.find(e => e.dateKey === d)?.weight,
    newportnews: nnSeries.find(e => e.dateKey === d)?.weight,
  }))

  const mySeries  = activeUser === 'vancouver' ? yvSeries : nnSeries
  const first     = mySeries[0]
  const last      = mySeries[mySeries.length - 1]
  const totalLost = first && last ? Math.round((first.weight - last.weight) * 10) / 10 : null
  const goal      = goalMap[activeUser] ? parseFloat(goalMap[activeUser]) : null

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <div className="tt-date">{label}</div>
        {payload.map(p => (
          <div key={p.dataKey} className="tt-row" style={{ color: p.stroke }}>
            {USERS[p.dataKey]?.name}: <strong>{p.value} {unit}</strong>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Weight</h2>
        <button className="unit-toggle" onClick={toggleUnit}>{unit}</button>
      </div>

      {mySeries.length > 0 && (
        <div className="weight-stats">
          <div className="wstat">
            <div className="wstat-label">Start</div>
            <div className="wstat-value">{first.weight}</div>
            <div className="wstat-unit">{unit}</div>
          </div>
          <div className="wstat">
            <div className="wstat-label">Current</div>
            <div className="wstat-value">{last.weight}</div>
            <div className="wstat-unit">{unit}</div>
          </div>
          {totalLost !== null && (
            <div className={`wstat ${totalLost > 0 ? 'positive' : ''}`}>
              <div className="wstat-label">Lost</div>
              <div className="wstat-value" style={{ color: totalLost > 0 ? '#1D9E75' : '#888' }}>
                {totalLost > 0 ? `−${totalLost}` : totalLost}
              </div>
              <div className="wstat-unit">{unit}</div>
            </div>
          )}
          {goal && last && (
            <div className="wstat">
              <div className="wstat-label">To goal</div>
              <div className="wstat-value" style={{ color: '#7F77DD' }}>
                {last.weight - goal > 0 ? `−${Math.round((last.weight - goal) * 10) / 10}` : '🎉'}
              </div>
              <div className="wstat-unit">{unit}</div>
            </div>
          )}
        </div>
      )}

      <div className="goal-row">
        <label className="goal-label">Goal weight</label>
        <input className="goal-input" type="number" step="0.5"
          placeholder={unit === 'lbs' ? '160' : '73'}
          value={goalMap[activeUser] || ''}
          onChange={e => setGoalMap(m => ({ ...m, [activeUser]: e.target.value }))} />
        <span className="goal-unit">{unit}</span>
      </div>

      <div className="log-card">
        <h3>Log weight</h3>
        <div className="log-row">
          <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} />
          <input type="number" step="0.1" placeholder={`Weight (${unit})`}
            value={weight} onChange={e => setWeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && logWeight()} />
          <button className="btn-log" onClick={logWeight}>Log</button>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="chart-card">
          <h3>Progress chart</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => USERS[v]?.name || v} />
              {goal && (
                <ReferenceLine y={goal} stroke="#7F77DD" strokeDasharray="4 4"
                  label={{ value: 'Goal', fontSize: 10, fill: '#7F77DD' }} />
              )}
              <Line type="monotone" dataKey="vancouver" stroke={USERS.vancouver.color}
                strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
              <Line type="monotone" dataKey="newportnews" stroke={USERS.newportnews.color}
                strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {mySeries.length > 0 && (
        <div className="history-card">
          <h3>My log</h3>
          <div className="history-rows">
            {[...mySeries].reverse().slice(0, 15).map((e, i) => (
              <div key={i} className="h-row">
                <span className="h-date">{e.displayDate}</span>
                <span className="h-val">{e.weight} {unit}</span>
                <button className="h-del" onClick={() => deleteEntry(e.dateKey)}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartData.length === 0 && (
        <div className="empty-state">Log your starting weight to begin tracking</div>
      )}
    </div>
  )
}
