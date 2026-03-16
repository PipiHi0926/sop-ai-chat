import styles from './Sidebar.module.css'

export default function Sidebar({ skills, activeSkillId, onSelect, onReload, reloading }) {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🤖</div>
          <div>
            <div className={styles.logoText}>AI SOP 問答</div>
            <div className={styles.logoSub}>智能知識導航平台</div>
          </div>
        </div>
      </div>

      {/* Skill list */}
      <div className={styles.sectionTitle}>可用技能 (Skills)</div>
      <div className={styles.skillList}>
        {skills.length === 0 ? (
          <div className={styles.empty}>
            尚無技能<br />
            <small>請在 backend/skills/ 新增 .md 檔</small>
          </div>
        ) : (
          skills.map(skill => (
            <button
              key={skill.id}
              className={`${styles.skillItem} ${activeSkillId === skill.id ? styles.active : ''}`}
              onClick={() => onSelect(skill)}
            >
              <span className={styles.skillIcon}>{skill.icon}</span>
              <div className={styles.skillInfo}>
                <div className={styles.skillName}>{skill.name}</div>
                <div className={styles.skillCat}>{skill.category}</div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.reloadBtn} onClick={onReload} disabled={reloading}>
          <span className={reloading ? styles.spin : ''}>🔄</span>
          {reloading ? '載入中...' : '重新載入技能'}
        </button>
      </div>
    </aside>
  )
}
