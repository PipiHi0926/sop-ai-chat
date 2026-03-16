// API client — 所有與後端通訊的函式集中在此

const BASE = '/api'

/** 取得所有技能清單 */
export async function fetchSkills() {
  const res = await fetch(`${BASE}/skills`)
  if (!res.ok) throw new Error('無法取得技能清單')
  return res.json()
}

/** AI 自動推薦相關 SOP */
export async function routeQuestion(question) {
  const res = await fetch(`${BASE}/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) throw new Error('路由請求失敗')
  return res.json()
}

/**
 * 帶 Skill context 的串流問答
 * @param {string} skillId
 * @param {string} message
 * @param {Array}  history  - [{role, content}]
 * @param {(chunk: string) => void} onChunk - 每個串流 chunk 的回呼
 */
export async function streamChat(skillId, message, history, onChunk) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skill_id: skillId, message, history }),
  })
  if (!res.ok) throw new Error('聊天請求失敗')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const chunk = line.slice(5).trim()
      if (chunk === '[DONE]') return
      onChunk(chunk)
    }
  }
}

/** 重新載入技能（熱更新） */
export async function reloadSkills() {
  const res = await fetch(`${BASE}/reload`, { method: 'POST' })
  if (!res.ok) throw new Error('重新載入失敗')
  return res.json()
}
