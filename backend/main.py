"""
FastAPI 主入口
=============
API 端點：
  GET  /api/health          - 健康檢查
  GET  /api/skills          - 列出所有可用技能
  POST /api/route           - AI 自動推薦相關 SOP
  POST /api/chat            - 帶 Skill context 的串流問答

前端靜態檔案由 FastAPI 直接託管（/）。
"""
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.skill_loader import load_all_skills
from core.chat_engine import route_question, chat_with_skill

# ── App 初始化 ─────────────────────────────────────────────────────────────────
app = FastAPI(title="AI SOP 問答平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 啟動時載入所有 Skills（熱更新用 /api/reload）
skills: dict[str, dict] = {}

@app.on_event("startup")
async def startup():
    global skills
    skills = load_all_skills()

# ── 前端靜態資源 ───────────────────────────────────────────────────────────────# 前端靜態資源：純 HTML/Vanilla JS，無須打包
FRONTEND_DIST = Path(__file__).parent.parent / "public"

@app.get("/", include_in_schema=False)
async def serve_index():
    return FileResponse(FRONTEND_DIST / "index.html")


# ── Request / Response 模型 ────────────────────────────────────────────────────
class RouteRequest(BaseModel):
    question: str

class ChatRequest(BaseModel):
    skill_id: str
    message: str
    history: list[dict] = []   # [{"role": "user/assistant", "content": "..."}]


# ── API 端點 ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "skills_loaded": len(skills)}


@app.get("/api/skills")
async def list_skills():
    """回傳所有技能（排除內部欄位 knowledge, _filepath）"""
    return [
        {k: v for k, v in skill.items() if k not in ("knowledge", "_filepath", "system_prompt")}
        for skill in skills.values()
    ]


@app.post("/api/route")
async def route(req: RouteRequest):
    """AI 自動根據問題推薦相關 SOP 技能"""
    if not skills:
        return {"recommended": [], "reason": "尚未載入任何技能", "direct_answer": ""}
    result = route_question(req.question, skills)
    # 附上推薦技能的基本資訊
    result["recommended_skills"] = [
        {k: v for k, v in skills[sid].items() if k not in ("knowledge", "_filepath", "system_prompt")}
        for sid in result.get("recommended", [])
        if sid in skills
    ]
    return result


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """帶 Skill context 的串流問答，使用 SSE（text/event-stream）"""
    if req.skill_id not in skills:
        raise HTTPException(status_code=404, detail=f"找不到技能 ID: {req.skill_id}")

    skill = skills[req.skill_id]

    def generate():
        for chunk in chat_with_skill(req.history, req.message, skill):
            # SSE 格式：data: <content>\n\n
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/reload")
async def reload_skills():
    """熱更新：重新載入所有技能（新增 .md 後無需重啟服務）"""
    global skills
    skills = load_all_skills()
    return {"status": "reloaded", "count": len(skills)}

# SPA fallback：所有非 /api 路徑一律回傳 index.html
@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(full_path: str):
    file = FRONTEND_DIST / full_path
    if file.exists() and file.is_file():
        return FileResponse(file)
    return FileResponse(FRONTEND_DIST / "index.html")
