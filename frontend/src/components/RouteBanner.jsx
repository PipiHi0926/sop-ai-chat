import styles from './RouteBanner.module.css'

/**
 * AI 推薦路由 Banner
 * @prop {object} data - { reason, recommended_skills, direct_answer }
 * @prop {(skill) => void} onPick - 使用者點選某個推薦技能
 */
export default function RouteBanner({ data, onPick }) {
  if (!data) return null

  return (
    <div className={styles.banner}>
      <div className={styles.header}>
        <span className={styles.compass}>🧭</span>
        <span className={styles.title}>AI 推薦相關 SOP</span>
      </div>

      {data.reason && (
        <p className={styles.reason}>{data.reason}</p>
      )}

      <div className={styles.pills}>
        {(data.recommended_skills || []).map(skill => (
          <button
            key={skill.id}
            className={styles.pill}
            onClick={() => onPick(skill)}
          >
            {skill.icon} {skill.name}
          </button>
        ))}
        {(data.recommended_skills || []).length === 0 && (
          <span className={styles.noMatch}>目前沒有找到相關 SOP，請直接選擇左側技能</span>
        )}
      </div>

      {data.direct_answer && (
        <>
          <hr className={styles.divider} />
          <p className={styles.directAnswer}>{data.direct_answer}</p>
        </>
      )}
    </div>
  )
}
