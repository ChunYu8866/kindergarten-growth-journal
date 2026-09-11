# 原創裝飾素材生成紀錄

以下三張素材皆使用內建 ImageGen 產生，原始輸出為 1254 × 1254、透明背景 PNG。

網站實際載入的是壓縮後的 WebP：畫布用的全尺寸圖 `public/decor-{spring,woodland,seasons}.webp`（1254 × 1254，quality 82），版型選單縮圖用 `public/decor-{spring,woodland,seasons}-thumb.webp`（240 × 240）。三張原始 PNG 合計 3.6 MB，換成 WebP 後全部素材只剩約 1.0 MB，而且畫布只會下載目前版型用到的那一張。

畫布不是以 1:1 貼上這些素材，而是放大後置中再裁掉超出的部分，讓裝飾往四邊外推、少壓到照片：春日 ×1.24、四季 ×1.20、森林 ×1.18 並額外下移 5%（森林的動物在下緣而非四角）。這些倍率定義在 `app/page.tsx` 的 `DECORATIONS`，版型縮圖用同一組值做 CSS transform。

要重新產生素材時，請依下列 prompt 產出透明 PNG，再轉成同名 WebP 與 240 px 縮圖。

## 春日小花與蝴蝶

```text
Use case: illustration-story
Asset type: original transparent PNG decorative border overlay for a square 1:1 kindergarten growth-journal template
Primary request: create a warm spring border made of small hand-painted flowers and a few gentle butterflies
Scene/backdrop: a genuinely transparent canvas with alpha; no paper, white, colored, or checkerboard background
Subject: delicate clusters of cheerful spring blossoms, tiny green leaves, and two or three friendly butterflies, all original
Style/medium: warm children's-picture-book watercolor, soft hand-painted edges, subtle pigment texture, gentle but clearly readable forms
Composition/framing: square 1:1; decorations hug the outer corners and lightly trail along the perimeter; keep at least the central 70% of the canvas completely empty and transparent for journal content; balanced airy frame, no object crossing the main center
Color palette: warm pastel peach, butter yellow, coral pink, sky blue, fresh leaf green; cohesive and not muddy
Constraints: actual transparent PNG alpha; crisp clean cutout edges with no white fringe; no text, letters, numbers, logos, signatures, or watermark; no UI or screenshot; no full opaque frame panel; no characters other than butterflies
Avoid: photorealism, vector-flat style, heavy outlines, dark colors, clutter, dense center, opaque background, drop shadows extending into the center
```

## 森林小動物與草地

```text
Use case: illustration-story
Asset type: original transparent PNG decorative border overlay for a square 1:1 kindergarten growth-journal template
Primary request: create a friendly woodland-animal border with one rabbit, one little bear, one fox, and a soft grassy edge
Scene/backdrop: a genuinely transparent canvas with alpha; no forest scene, paper, white, colored, or checkerboard background
Subject: three cute original storybook animals—rabbit, bear, and fox—small and gentle, accompanied by tufts of grass, tiny wildflowers, acorns, and a few rounded leaves
Style/medium: warm children's-picture-book watercolor, soft hand-painted edges, subtle paper-like pigment only inside the painted objects, gentle but clear facial features
Composition/framing: square 1:1; animals sit or peek from the lower corners and bottom perimeter, with sparse leaves lightly decorating the upper corners; keep at least the central 68% of the canvas completely empty and transparent for journal content; balanced open frame, no object crossing the main center
Color palette: warm honey brown, soft rust orange, cream, sage and moss green, tiny pastel flower accents; cohesive and cheerful
Constraints: actual transparent PNG alpha; clean isolated artwork with no white fringe; include exactly the rabbit, bear, and fox as the main animals; no text, letters, numbers, logos, signatures, or watermark; no UI or screenshot; no opaque panel or complete painted scenery
Avoid: photorealism, flat vector style, heavy black outlines, scary expressions, crowded composition, dense trees, opaque background, large center objects, drop shadows extending into the central space
```

## 四季通用邊角裝飾

```text
Use case: illustration-story
Asset type: original transparent PNG universal corner-decoration overlay for a square 1:1 kindergarten growth-journal template
Primary request: create a cohesive four-seasons corner frame using leaves, snowflakes, and a small warm sun
Scene/backdrop: a genuinely transparent canvas with alpha; no sky, landscape, paper, white, colored, or checkerboard background
Subject: four coordinated seasonal corner clusters—fresh budding leaves for spring, a friendly simple golden sun with green leaves for summer, amber and rust leaves for autumn, and delicate pale-blue snowflakes with a few winter twigs for winter
Style/medium: warm children's-picture-book watercolor, soft hand-painted edges, subtle pigment texture, gentle and clear; all four clusters must look like one matching illustration set
Composition/framing: square 1:1; place one compact seasonal cluster in each outer corner with only a few tiny accents along the outermost edges; keep at least the central 76% of the canvas completely empty and transparent; open versatile corner decoration rather than a closed border; no object crossing the main center
Color palette: fresh sage green and blush buds, warm butter yellow, amber and terracotta, pale icy blue; softened into one harmonious pastel palette
Constraints: actual transparent PNG alpha; clean isolated artwork with no white fringe; no text, letters, numbers, logos, signatures, or watermark; no UI or screenshot; no opaque panel; sun is a small decorative motif without lettering
Avoid: photorealism, flat vector style, heavy black outlines, harsh neon colors, clutter, dense center, full seasonal scenery, opaque background, large central sun, drop shadows extending into the center
```
