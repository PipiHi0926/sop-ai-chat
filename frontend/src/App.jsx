import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import MessageBubble, { StreamingBubble } from './components/MessageBubble'
import RouteBanner from './components/RouteBanner'
import { fetchSkills, routeQuestion, streamChat, reloadSkills } from './api/client'
import styles from './App.module.css'

export default function App() {
  const [skills, setSkills]           = useState([])
  const [activeSkill, setActiveSkill] = useState(null)
  const [messages, setMessages]       = useState([])   // {id, role, content, type?}
  const [history, setHistory]         = useState([])   // [{role, content}] for LLM context
  const [inputVal, setInputVal]       = useState('')
  const [streaming, setStreaming]     = useState(false)
  const [streamText, setStreamText]   = useState('')
  const [reloading, setReloading]     = useState(false)
  const [toast, setToast]             = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)

  // ── Init ────────────────────────────────────────────────────────
  useEffect(() => {
    loadSkills()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  // ── Skills ─────────────────────────────────────────────────────
  async function loadSkills() {
    try {
      const data = await fetchSkills()
      setSkills(data)
    } catch {
      showToast('⚠️ 無法連線後端，請確認服務已啟動')
    }
  }

  async function handleReload() {
    setReloading(true)
    try {
      await reloadSkills()
      await loadSkills()
      showToast('✅ 技能已重新載入')
    } catch {
      showToast('⚠️ 重新載入失敗')
    } finally {
      setReloading(false)
    }
  }

  function selectSkill(skill) {
    setActiveSkill(skill)
  }

  // ── Send ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputVal.trim()
    if (!text || streaming) return

    setInputVal('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const userMsg = { id: Date.now(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])

    if (activeSkill) {
      await doStreamChat(text)
    } else {
      await doRoute(text)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputVal, streaming, activeSkill, history])

  async function doRoute(question) {
    setStreaming(true)
    try {
      const data = await routeQuestion(question)
      const routeMsg = { id: Date.now(), role: 'route', content: '', routeData: data }
      setMessages(prev => [...prev, routeMsg])
    } catch {
      appendAssistantMsg('⚠️ 路由請求失敗，請檢查後端服務。')
    } finally {
      setStreaming(false)
    }
  }

  async function doStreamChat(question, overrideSkill = null) {
    const skill = overrideSkill || activeSkill
    if (!skill) return
    setStreaming(true)
    setStreamText('')
    let full = ''
    try {
      await streamChat(skill.id, question, history.slice(-10), (chunk) => {
        full += chunk
        setStreamText(full)
      })
      // 串流結束：正式加入訊息列表
      appendAssistantMsg(full)
      setHistory(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: full },
      ])
    } catch {
      appendAssistantMsg('⚠️ 串流回應失敗，請檢查網路連線。')
    } finally {
      setStreaming(false)
      setStreamText('')
    }
  }

  function appendAssistantMsg(content) {
    setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content }])
  }

  // 使用者從路由 banner 點選技能
  async function handlePickRouteSkill(skill) {
    setActiveSkill(skill)
    // 找最後一條 user 訊息重新提問
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (lastUser) {
      await doStreamChat(lastUser.content, skill)
    }
  }

  // ── Input ───────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInputChange(e) {
    setInputVal(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  // ── Clear ───────────────────────────────────────────────────────
  function handleClearSkill() {
    setActiveSkill(null)
  }

  function handleClearChat() {
    setMessages([])
    setHistory([])
  }

  // ── Toast ───────────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const isIdle = messages.length === 0 && !streaming

  return (
    <div className={styles.app}>
      <Sidebar
        skills={skills}
        activeSkillId={activeSkill?.id}
        onSelect={selectSkill}
        onReload={handleReload}
        reloading={reloading}
      />

      <main className={styles.main}>
        {/* Skill bar */}
        <div className={styles.skillBar}>
          {activeSkill ? (
            <>
              <span className={styles.skillBarIcon}>{activeSkill.icon}</span>
              <div className={styles.skillBarInfo}>
                <div className={styles.skillBarName}>{activeSkill.name}</div>
                <div className={styles.skillBarDesc}>{activeSkill.description}</div>
              </div>
              <button className={styles.btnSecondary} onClick={handleClearSkill}>✕ 取消</button>
              {messages.length > 0 && (
                <button className={`${styles.btnSecondary} ${styles.danger}`} onClick={handleClearChat}>🗑 清除對話</button>
              )}
            </>
          ) : (
            <span className={styles.placeholder}>← 選擇 SOP 技能，或直接輸入問題讓 AI 自動導航</span>
          )}
        </div>

        {/* Messages area */}
        <div className={styles.messages}>
          {isIdle && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>✨</div>
              <h1 className={styles.welcomeTitle}>你好，我是 SOP 智能助手</h1>
              <p className={styles.welcomeSub}>
                選擇左側 SOP 技能開始問答，或直接輸入問題，我會自動推薦最相關的 SOP 指引
              </p>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.type === 'route' || msg.role === 'route') {
              return (
                <RouteBanner
                  key={msg.id}
                  data={msg.routeData}
                  onPick={handlePickRouteSkill}
                />
              )
            }
            return (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                skillName={activeSkill?.name}
              />
            )
          })}

          {/* 串流中氣泡 */}
          {streaming && (
            <StreamingBubble
              content={streamText}
              skillName={activeSkill?.name}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className={styles.inputBar}>
          <div className={styles.inputWrap}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="請輸入問題... (Shift+Enter 換行，Enter 送出)"
              rows={1}
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={streaming}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={streaming || !inputVal.trim()}
              title="送出"
            >
              ➤
            </button>
          </div>
          <div className={styles.inputHint}>
            {activeSkill
              ? `已選技能：${activeSkill.name}，直接問問題即可`
              : '尚未選擇 SOP，AI 將自動推薦相關技能'}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
