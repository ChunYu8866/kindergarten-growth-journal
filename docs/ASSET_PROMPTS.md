# 原創裝飾素材生成紀錄

以下六張素材皆使用內建 ImageGen 產生，原始輸出為 1254 × 1254、透明背景 PNG。

網站實際載入的是壓縮後的 WebP：畫布用的全尺寸圖 `public/decor-{spring,woodland,seasons,ocean,rainbow,dino}.webp`（1254 × 1254，quality 82），版型選單縮圖用對應的 `-thumb.webp`（240 × 240）。六組完整圖與縮圖合計約 1.7 MB，而且畫布只會下載目前版型用到的那一張。

畫布不是以 1:1 貼上這些素材，而是放大後置中再裁掉超出的部分，讓裝飾留在外圍：春日 ×1.24、四季 ×1.20、森林 ×1.18 並下移 5%、海洋 ×1.20 並下移 1%、彩虹 ×1.20、恐龍 ×1.18 並下移 2%。這些倍率定義在 `app/page.tsx` 的 `DECORATIONS`，版型縮圖用同一組值做 CSS transform；照片相框繪製在裝飾上方，所以裝飾不會蓋住照片內容。

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

## 海洋好朋友

```text
Use case: illustration-story
Asset type: square transparent PNG decorative border for a kindergarten growth journal
Primary request: Create one original 1:1 decorative border titled only conceptually “Ocean Friends”; do not render any title or text.
Scene/backdrop: No backdrop at all. The canvas background must be genuinely transparent with a real alpha channel, including every open gap between decorations. Do not paint white, off-white, colored paper, a watercolor wash, a rectangular panel, or a checkerboard transparency pattern.
Subject: A few adorable, gentle storybook ocean friends—one small baby whale, one small sea turtle, a few tiny fish, and delicate coral sprigs—arranged only around the extreme perimeter and corners.
Style/medium: soft hand-painted children’s picture-book watercolor, rounded friendly shapes, subtle paper-like pigment texture confined inside the illustrated objects, clean soft cutout edges.
Composition/framing: square 1:1 canvas. Keep a large uninterrupted central window covering at least 72% of the full canvas area completely empty and fully transparent. All creatures, coral, bubbles, and watercolor marks must stay in a thin outer border zone and corner clusters; nothing may enter, overlap, or cross the central transparent window. Favor light, airy corner vignettes rather than a heavy continuous frame. Maintain generous transparent gaps around all objects.
Lighting/mood: tender, cheerful, calm, preschool-friendly.
Color palette: water blue, aqua, pale turquoise, and coral orange with small warm cream accents; soft pastel saturation.
Text: none.
Constraints: actual transparent PNG output; preserve alpha; no opaque or translucent background layer; central area fully alpha-transparent; original artwork; clean separation for web overlay use.
Avoid: any letters, words, numbers, symbols, logo, signature, watermark, border text, UI, mockup, paper sheet, colored rectangle, white background, drop-shadow rectangle, photorealism, scary faces, clutter, or any decoration crossing the central window.
```

## 彩虹雲朵

```text
Use case: illustration-story
Asset type: square transparent PNG decorative border for a kindergarten growth journal
Primary request: Create one original 1:1 decorative border with a “Rainbow Clouds” theme; the name is conceptual only and no text may appear.
Scene/backdrop: Absolutely no backdrop. The complete canvas and all open spaces must be genuinely transparent through a real alpha channel. Do not simulate transparency with white, cream, pastel paper, a watercolor wash, a solid panel, or a checkerboard.
Subject: Soft little rainbow arcs, puffy smiling-free cloud shapes, tiny simple stars, and only a few small floating balloons, used as delicate decoration around the outer edge and corners. Keep imagery icon-like and nonverbal; clouds should have no written marks.
Style/medium: gentle hand-painted children’s picture-book watercolor, soft irregular pigment edges, airy translucent watercolor color inside the objects only, delicate and whimsical, polished for a preschool journal.
Composition/framing: exact square 1:1. Make the arrangement clearly different from a conventional continuous frame: use sparse, playful corner clusters and a few tiny edge accents with abundant transparent gaps. Reserve one uninterrupted centered window covering at least 72% of the entire canvas area as completely empty, fully alpha-transparent space. Every rainbow, cloud, star, balloon, string, sparkle, and paint mark must remain near the extreme outer perimeter and must not enter or cross the central transparent window.
Lighting/mood: dreamy, reassuring, joyful, calm.
Color palette: harmonious soft pastel multicolor—blush pink, peach, butter yellow, mint, powder blue, lilac—with low contrast and no harsh neon.
Text: none.
Constraints: output a true transparent PNG; preserve alpha; transparent central opening; no opaque or translucent background plane; original artwork; clean usable overlay edges.
Avoid: letters, words, numbers, logo, signature, watermark, faces, emojis, symbols resembling text, UI, mockup, paper page, colored rectangle, white background, heavy continuous border, photorealism, excessive balloons, dangling elements across the center, or any decoration intruding into the central window.
```

## 恐龍森林

```text
Use case: illustration-story
Asset type: square transparent PNG decorative border for a kindergarten growth journal
Primary request: Create one original 1:1 decorative border with a friendly “Dinosaur Forest” theme; this theme name is conceptual only and must never be rendered as text.
Scene/backdrop: No scene background and no ground plane. The entire unused canvas must be genuinely transparent via a true alpha channel. Do not use white, cream, watercolor paper, a colored wash, a solid panel, or a checkerboard to represent transparency.
Subject: Several small, friendly baby dinosaurs of varied simple silhouettes, modest fern fronds and little forest leaves, plus sparse fossil and tiny dinosaur-footprint accents. Keep all characters cute, calm, rounded, and non-threatening.
Style/medium: tender hand-painted children’s picture-book watercolor, tactile pigment variation within each object, soft organic cutout edges, charming and preschool-appropriate.
Composition/framing: precise square 1:1 canvas. Create an organic, asymmetrical border using separated corner vignettes and tiny perimeter accents, visually distinct from ocean or rainbow framing. Keep one continuous centered window covering at least 72% of the total canvas area entirely empty and fully alpha-transparent. Confine every dinosaur, fern, leaf, fossil, footprint, pebble, and paint fleck to the extreme outer border and corner zones. Nothing may protrude into, overlap, or cross the central transparent window. Leave abundant transparent gaps; avoid a dense jungle wall.
Lighting/mood: gentle outdoor warmth, curious, playful, safe.
Color palette: mint green, muted mustard yellow, warm terracotta, sage, and small pale cream accents; soft natural pastel saturation.
Text: none.
Constraints: true transparent PNG output with preserved alpha; no opaque or semi-opaque background sheet; fully transparent central opening; original illustration; clean web-overlay asset.
Avoid: any letters, words, numbers, logo, signature, watermark, labels, UI, mockup, paper rectangle, white background, scenery filling the canvas, large dinosaur in the center, fierce teeth, predators attacking, scary expressions, realistic reptile rendering, dense clutter, or any object entering the central window.
```
