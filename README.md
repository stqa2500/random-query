# 檔案室亂數表查詢器

這是一個可直接放到 GitHub Pages 的純靜態網站。資料來源是 `逐列排序_完成.xlsx` 的 `Sheet1`，欄位為「數量」「要抽」「不要」。

## 放到 GitHub Pages

1. 建立一個 GitHub repository。
2. 把這個資料夾內的所有檔案放到 repository 根目錄。
3. 到 GitHub 的 `Settings` → `Pages`。
4. Source 選 `Deploy from a branch`，Branch 選 `main` 和 `/root`。
5. 等 GitHub Pages 完成部署後開啟頁面。

## 檔案

- `index.html`: 網站首頁。
- `styles.css`: 頁面樣式。
- `script.js`: 查詢與複製功能。
- `data.js`: 由 Excel 轉出的查詢資料。
- `assets/archive-lookup.png`: 頁面視覺圖。
