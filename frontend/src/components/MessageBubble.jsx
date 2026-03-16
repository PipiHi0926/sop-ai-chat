import styles from './MessageBubble.module.css'

/** 單一對話訊息氣泡 */
export default function MessageBubble({ role, content, skillName }) {
  const isUser = role === 'user'
  const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`${styles.msg} ${isUser ? styles.user : styles.assistant}`}>
      <div className={styles.bubble}>{content}</div>
      <div className={styles.meta}>
        {isUser ? '你' : (skillName || 'AI')} · {time}
      </div>
    </div>
  )
}

/** 串流中的訊息（正在輸入） */
export function StreamingBubble({ content, skillName }) {
  return (
    <div className={`${styles.msg} ${styles.assistant}`}>
      <div className={styles.bubble}>
        {content || <TypingIndicator />}
      </div>
      <div className={styles.meta}>{skillName || 'AI'} · 回覆中...</div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className={styles.typing}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  )
}
