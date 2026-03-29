// Upstash Redis — plain fetch, no npm package required
// Reads VITE_UPSTASH_URL and VITE_UPSTASH_TOKEN from .env

const BASE  = import.meta.env.VITE_UPSTASH_URL
const TOKEN = import.meta.env.VITE_UPSTASH_TOKEN

async function pipeline(commands) {
  const r = await fetch(`${BASE}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
  if (!r.ok) throw new Error(`Upstash error: ${r.status}`)
  return r.json()
}

async function getKey(key) {
  const res = await pipeline([['GET', key]])
  return res[0]?.result ? JSON.parse(res[0].result) : {}
}

async function setKey(key, value) {
  await pipeline([['SET', key, JSON.stringify(value)]])
}

// ── Exported helpers ────────────────────────────────────────────────────────

export async function getAllData() {
  try {
    const res = await pipeline([
      ['GET', 'wellness:vancouver'],
      ['GET', 'wellness:newportnews'],
    ])
    return {
      vancouver:   res[0]?.result ? JSON.parse(res[0].result) : {},
      newportnews: res[1]?.result ? JSON.parse(res[1].result) : {},
    }
  } catch (e) {
    console.error('Upstash fetch error:', e)
    return { vancouver: {}, newportnews: {} }
  }
}

export async function updateUserPath(userId, path, value) {
  const data = await getKey(`wellness:${userId}`)
  deepSet(data, path, value)
  await setKey(`wellness:${userId}`, data)
}

export async function deleteUserPath(userId, path) {
  const data = await getKey(`wellness:${userId}`)
  deepDelete(data, path)
  await setKey(`wellness:${userId}`, data)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function deepSet(obj, path, value) {
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    const k = String(path[i])
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {}
    cur = cur[k]
  }
  cur[String(path[path.length - 1])] = value
}

function deepDelete(obj, path) {
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    const k = String(path[i])
    if (!cur[k]) return
    cur = cur[k]
  }
  delete cur[String(path[path.length - 1])]
}
