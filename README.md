# 芽芽成長誌

給幼兒園老師使用的 1:1 純照片成長日誌編輯器。每張成品最多 4 張照片，套用 16 款版型後可調整每張照片的位置與大小，最後下載 2048 × 2048 PNG。

## 已完成功能

- 每張成品最多 4 張照片，多選時會明確提示上限
- 16 款 1:1 版型，每款都有花草、森林小動物或四季水彩邊角裝飾
- 所有照片框都是 1:1 正方形或橫式 4:3，不使用直式框
- 點選照片後直接在畫布上拖曳移動，拖右下藍色把手、滾輪或雙指縮放
- 照片以 cover 方式滿版鋪滿照片框，只保留外側邊框
- 花草、小動物與四季裝飾放在照片後方，不會遮蓋照片內容
- 照片可拖曳排序，也有前移／後移按鈕可使用
- 匯出成品只有照片與裝飾，不加姓名、日期或說明文字
- 匯出 2048 × 2048 PNG
- 響應式桌機／手機介面與鍵盤操作
- 所有照片只在瀏覽器本機處理，不會上傳到伺服器

## 本機開發

```bash
pnpm install
pnpm dev
```

開啟終端顯示的本機網址即可使用。

## GitHub Pages

網頁版：[https://chunyu8866.github.io/kindergarten-growth-journal/](https://chunyu8866.github.io/kindergarten-growth-journal/)

專案已包含 `.github/workflows/deploy-pages.yml`，推送到 `main` 後會自動建置與更新網站。

## 原創裝飾素材

三張透明水彩裝飾框位於 `public/`。生成規格與完整 prompts 記錄在 [docs/ASSET_PROMPTS.md](docs/ASSET_PROMPTS.md)。
