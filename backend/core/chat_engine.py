"""
Chat Engine
===========
系統的核心邏輯層，負責：
1. Auto-Route：AI 自動根據問題推薦最適合的 Skill
2. Contextual Chat：將 Skill 的 system_prompt + knowledge 注入 LLM
"""
import json
from typing import Iterator
from core.llm_client import chat_complete, chat_stream
from core.skill_loader import get_skills_summary

# ── Router Prompt ──────────────────────────────────────────────────────────────
ROUTER_SYSTEM_PROMPT = """你是一個智慧型 SOP 導航助手。
你的任務是：根據使用者提出的問題，從下方技能清單中找出最合適的一個或多個 SOP 技能。

回應格式必須是合法的 JSON，如下：
{
  "recommended": ["skill_id_1", "skill_id_2"],
  "reason": "簡短說明為何推薦這些技能（繁體中文，一句話）",
  "direct_answer": "若問題非常明確，可在此提供簡短直接的回答；若不確定則留空字串"
}

規則：
- recommended 最多 3 個技能，按相關性排序
- 若無任何技能相關，recommended 回傳空陣列 []
- 只回傳 JSON，不要有其他文字
"""


def route_question(question: str, skills: dict[str, dict]) -> dict:
    """
    AI Router：根據問題推薦相關 Skill。
    回傳 { recommended: [...], reason: "...", direct_answer: "..." }
    """
    skills_summary = get_skills_summary(skills)
    messages = [
        {"role": "system", "content": ROUTER_SYSTEM_PROMPT + "\n\n" + skills_summary},
        {"role": "user", "content": question},
    ]
    raw = chat_complete(messages, temperature=0.1, max_tokens=500)

    # 嘗試解析 JSON（若模型回傳有雜訊則 fallback）
    try:
        # 有時模型會包 ```json ... ``` 的 code fence，先清掉
        cleaned = raw.strip().removeprefix("```json").removesuffix("```").strip()
        result = json.loads(cleaned)
        # 驗證 recommended 的 id 都存在
        result["recommended"] = [sid for sid in result.get("recommended", []) if sid in skills]
        return result
    except (json.JSONDecodeError, KeyError):
        return {"recommended": [], "reason": "無法解析推薦結果", "direct_answer": ""}


def build_messages(
    history: list[dict],
    user_message: str,
    skill: dict,
) -> list[dict]:
    """
    組裝送給 LLM 的 messages 列表：
      [system(prompt + knowledge)] + [history] + [user]
    """
    system_content = (
        skill["system_prompt"].strip()
        + "\n\n"
        + "─" * 60
        + "\n📋 以下是你可以參考的 SOP 知識庫內容：\n"
        + "─" * 60
        + "\n"
        + skill["knowledge"]
    )
    messages = [{"role": "system", "content": system_content}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    return messages


def chat_with_skill(
    history: list[dict],
    user_message: str,
    skill: dict,
) -> Iterator[str]:
    """帶 Skill context 的串流問答"""
    messages = build_messages(history, user_message, skill)
    yield from chat_stream(
        messages,
        temperature=skill["temperature"],
        max_tokens=skill["max_tokens"],
    )
