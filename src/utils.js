export const USERS = {
  vancouver: {
    label: 'Vancouver',
    name:  'You',
    short: 'YVR',
    color: '#1D9E75',
    tz:    'PT',
  },
  newportnews: {
    label: 'Newport News',
    name:  'Friend',
    short: 'NN',
    color: '#7F77DD',
    tz:    'ET',
  },
}

export const OTHER_USER = {
  vancouver:   'newportnews',
  newportnews: 'vancouver',
}

export const DAYS       = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
export const SHORT_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
export const DAY_TYPES  = ['exercise','walk','exercise','walk','exercise','walk','rest']

export function getWeekKey(date = new Date()) {
  const d   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo    = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function getTodayIndex() {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

export function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  })
}
