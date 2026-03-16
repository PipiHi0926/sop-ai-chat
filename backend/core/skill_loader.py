"""
Skill Loader
============
掃描 skills/ 目錄，解析每個 .md 檔的 YAML Frontmatter 與 Markdown 內容。
一個 .md 檔 = 一個完整 Skill（設定 + 知識庫）。
"""
import re
from pathlib import Path
from typing import Optional
import yaml

SKILLS_DIR = Path(__file__).parent.parent / "skills"


def _parse_skill_file(filepath: Path) -> Optional[dict]:
    """解析單一 skill .md 檔，回傳結構化 Skill 物件"""
    raw = filepath.read_text(encoding="utf-8")

    # 切割 YAML Frontmatter（--- ... ---）與正文
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)", raw, re.DOTALL)
    if not match:
        print(f"[SkillLoader] Warning: {filepath.name} is missing YAML frontmatter, skipping")
        return None

    try:
        meta = yaml.safe_load(match.group(1))
        content = match.group(2).strip()
    except yaml.YAMLError as e:
        print(f"[SkillLoader] Warning: {filepath.name} YAML parsing failed - {e}")
        return None

    # 必要欄位檢查
    required = ["id", "name", "description", "system_prompt"]
    for field in required:
        if field not in meta:
            print(f"[SkillLoader] Warning: {filepath.name} is missing required field '{field}', skipping")
            return None

    return {
        "id": meta["id"],
        "name": meta["name"],
        "description": meta["description"],
        "icon": meta.get("icon", "📄"),
        "category": meta.get("category", "通用"),
        "tags": meta.get("tags", []),
        "system_prompt": meta["system_prompt"],
        "temperature": float(meta.get("temperature", 0.3)),
        "max_tokens": int(meta.get("max_tokens", 2000)),
        # Markdown 正文即為知識庫內容（直接注入 prompt）
        "knowledge": content,
        "_filepath": str(filepath),
    }


def load_all_skills() -> dict[str, dict]:
    """載入所有技能，回傳以 skill_id 為 key 的字典"""
    skills = {}
    for md_file in sorted(SKILLS_DIR.glob("*.md")):
        skill = _parse_skill_file(md_file)
        if skill:
            skills[skill["id"]] = skill
            print(f"[SkillLoader] Loaded skill: {skill['name']} ({md_file.name})")
    print(f"[SkillLoader] Successfully loaded {len(skills)} skills")
    return skills


def get_skills_summary(skills: dict[str, dict]) -> str:
    """
    產生所有技能的摘要文字，供 AI Router 判斷該用哪個 Skill。
    """
    lines = ["以下是目前系統中所有可用的專業技能（SOP）：\n"]
    for skill in skills.values():
        lines.append(
            f"- **[{skill['id']}] {skill['icon']} {skill['name']}**\n"
            f"  描述：{skill['description']}\n"
            f"  標籤：{', '.join(skill['tags']) if skill['tags'] else '無'}\n"
        )
    return "\n".join(lines)
