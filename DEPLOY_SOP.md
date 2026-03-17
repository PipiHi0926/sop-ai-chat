# AI SOP Platform 部署與服務啟動教學說明

這份說明將指引你如何在另一台全新電腦（例如公司內的設備）完整建置並啟動這個網頁應用系統。系統包含了兩個部分：
1. **Python FastAPI (後端)**：負責提供 API 和 AI 模型銜接。
2. **React + Vite (前端)**：負責建立使用者操作的前端介面。

因此，**首次在新設備上需要先完成前端的開發框架編譯（將 `npm` 源碼編譯為瀏覽器可運行的靜態網頁檔案）**，後端才能將其作為網頁提供服務給瀏覽器讀取。

---

## 🛠️ 事前準備：環境必備需求

請確認你的電腦已安裝以下基礎程式：
1. **Python (推薦 3.10 或以上)**
2. **Node.js (推薦 18 或以上)**，這是執行前端打包工具 `npm` 時必備的。

> ⚠️ **企業網路連線（如 TSMC Proxy 限制）注意**
> 如果你在公司內網，安裝 `pip` 與 `npm` 套件時常遇到逾時 (Timeout) 或 SSL 憑證驗證問題。建議在命令提示字元先設定 Proxy 參數或將 Registry 指向公司內部的 Mirror (Nexus / Artifactory 等)。範例如下：
> 
> ```batch
> :: 設定 npm proxy 範例
> npm config set proxy http://你的公司PROXY位址:PORT
> npm config set https-proxy http://你的公司PROXY位址:PORT
> npm config set strict-ssl false
> ```

---

## 🚀 步驟 1：執行自動化建置 (首次部署必做)

我們已經為您建立了一鍵初始化指令，它會為您執行所有繁瑣的過程：載入依賴、跑 npm、打包專案。

1. 到專案的根目錄 `amhs_ai_sop`。
2. 點擊 **兩下(Double Click)** 檔案 \`build_and_init.bat\`。命令提示字元視窗將會跳出。
3. 它會依序執行以下三個動作：
   - 使用 `pip install -r requirements.txt` 安裝 Python 套件。
   - 進入 `/frontend` 目錄，執行 `npm install` 安裝前端依賴。
   - 執行 `npm run build`，將 React 代碼編譯至 `/frontend/dist` 中發佈狀態。
   
等待指令最後顯示 \`[3/3] 建置前端 React 應用程式\` 成功後，您不需要自己再點擊啟動腳本，服務將會自動帶起！
 
---

## 🏃 步驟 2：日常啟動 (不需要再重新 npm)

只要您在「步驟 1」中成功執行了 `build_and_init.bat` 且沒有報錯。往後重新打開電腦、想要再次啟動伺服器，**無須**再重新編譯前端。

1. 直接 **點擊執行** \`start.bat\` 即可。
2. 啟動後，請不要關閉黑色視窗，開啟瀏覽器並輸入以下網址即可使用服務：
   > [http://localhost:8000](http://localhost:8000)

**💡 溫馨提醒 （亂碼排除與中文支援）：**
為了解決原本你在執行後端時，於命令終端機內可能遇到中文字變成亂碼 (`ä½ å¥½` 之類的情況)，我們在新的 `start.bat` 及 `build_and_init.bat` 已強制加入 `chcp 65001` 指令及 `PYTHONUTF8` 系統變數，它會以全世界通用的 **UTF-8（支援全中文與特殊符號）** 編碼顯示訊息！如果你使用舊終端打開會遇到字體不對齊，建議切換終端機字型為 Consolas 或是 MS Gothic。

---

## 💡 常見問題與除錯 (Q&A)

### Q1: 如果 `npm install` 卡住不動？
A: 大機率是你在公司網路的連外 Proxy 阻擋。請透過公司 IT 申請 Proxy，或是使用可連外的 Wi-Fi 暫時下載。你也可以把你自己的筆電上已經做完 \`npm install\` 與 \`npm run build\` 的 \`/frontend/dist\` 產出資料夾，直接複製到新電腦上相同位置，就可以避開在嚴格網路環境中被限制的困擾。

### Q2: 執行 `start.bat` 閃退？
A: 這個原因通常出在你的電腦尚未安裝 Python、忘記先安裝 `requirements.txt`；或者是 Port `8000` 已經被別的伺服器佔用。請將終端開啟並用打字的方式執行 `start.bat` 觀看錯誤代碼，藉此找出關鍵原因。
