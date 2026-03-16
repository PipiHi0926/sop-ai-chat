# AI SOP 智能問答平台

## 快速啟動

```bash
# 1. 安裝依賴
pip install -r requirements.txt

# 2. 啟動服務
start.bat              # Windows
# 或
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# 3. 開啟瀏覽器
# http://localhost:8000
```

---

## 新增 SOP 技能（只需一個檔案！）

在 `backend/skills/` 建立一個 `.md` 檔，格式如下：

```markdown
---
id: your_skill_id          # 唯一 ID（英文）
name: "技能顯示名稱"
description: "簡短說明，顯示在側欄"
icon: "🔧"                 # Emoji 圖示
category: "設備維運"        # 分類
tags:
  - 關鍵字1
  - 關鍵字2
system_prompt: |
  你是一位 XXX 專家...（此處定義 AI 角色與回答風格）
temperature: 0.2           # 0=嚴謹, 1=創意
max_tokens: 2000
---

# 你的 SOP 知識內容從這裡開始

## 章節 1
...
```

新增後，點選介面上的「🔄 重新載入技能」即可，**無需重啟服務**。

---

## API 文件

| Endpoint | 說明 |
|----------|------|
| `GET  /api/skills`  | 列出所有可用技能 |
| `POST /api/route`   | AI 自動推薦相關 SOP |
| `POST /api/chat`    | 帶 Skill context 的串流問答 |
| `POST /api/reload`  | 熱更新重新載入技能 |
| `GET  /docs`        | FastAPI 自動產生 API 文件 |

---

## 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `LLM_BASE_URL` | 公司內部 URL | LLM API endpoint |
| `LLM_API_KEY`  | 內建 key | API 金鑰 |
| `LLM_MODEL`    | MiniMax-M2.1 | 使用模型 |
