"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ImagePlus,
  Images,
  LayoutGrid,
  Move,
  RotateCw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const CANVAS_SIZE = 1200;
const EXPORT_SIZE = 2048;
const MAX_PHOTOS = 4;
const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PREVIEW_MAX_SIZE = 1600;

// Decorations ship as WebP: one full-size sheet per decoration for the canvas and
// a 240 px thumbnail for the 16 template cards, so the picker never pulls a 300 KB
// sheet just to paint a swatch.
const overlayUrl = (decoration: string) => `${ASSET_BASE}/${decoration}.webp`;
const overlayThumbUrl = (decoration: string) => `${ASSET_BASE}/${decoration}-thumb.webp`;

// Each sheet is drawn larger than the canvas so its decorated ring is pushed
// outward and the excess bleeds off the edges, leaving the photos clearer.
// The woodland animals sit on the bottom edge rather than in the corners, so
// that sheet is also nudged down to tuck them further off-canvas.
type DecorationSpec = { scale: number; offsetY: number };

const DECORATIONS: Record<string, DecorationSpec> = {
  "decor-spring": { scale: 1.24, offsetY: 0 },
  "decor-seasons": { scale: 1.2, offsetY: 0 },
  "decor-woodland": { scale: 1.18, offsetY: 0.05 },
};

const NO_DECORATION_TRANSFORM: DecorationSpec = { scale: 1, offsetY: 0 };

const decorationSpec = (decoration: string) =>
  DECORATIONS[decoration] ?? NO_DECORATION_TRANSFORM;

const overlayCache = new Map<string, HTMLImageElement>();
const overlayRequests = new Map<string, Promise<HTMLImageElement | null>>();

// Decorations load on demand and stay cached, so the first paint only fetches the
// sheet the selected template actually needs.
function loadOverlay(decoration: string): Promise<HTMLImageElement | null> {
  const cached = overlayCache.get(decoration);
  if (cached) return Promise.resolve(cached);

  let pending = overlayRequests.get(decoration);
  if (!pending) {
    pending = new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        overlayCache.set(decoration, image);
        resolve(image);
      };
      image.onerror = () => {
        // Drop the failed attempt so picking this template again retries.
        overlayRequests.delete(decoration);
        resolve(null);
      };
      image.src = overlayUrl(decoration);
    });
    overlayRequests.set(decoration, pending);
  }
  return pending;
}

type LayoutKind =
  | "single"
  | "split-v"
  | "split-h"
  | "hero-side"
  | "hero-bottom"
  | "grid"
  | "cross"
  | "masonry"
  | "cluster"
  | "timeline"
  | "polaroid"
  | "adaptive";

type PatternKind = "dots" | "stripes" | "confetti" | "waves" | "grid" | "plain";

type TemplateSpec = {
  id: string;
  name: string;
  note: string;
  layout: LayoutKind;
  sample: number;
  min: number;
  max: number;
  background: string;
  panel: string;
  accent: string;
  ink: string;
  pattern: PatternKind;
  overlay?: string;
};

type SlotRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  angle?: number;
};

type PhotoItem = {
  id: string;
  name: string;
  url: string;
  image: HTMLImageElement;
  zoom: number;
  focusX: number;
  focusY: number;
  rotation: number;
};

type CanvasGesture =
  | { mode: "pan"; id: string; pointerId: number; x: number; y: number }
  | {
      mode: "resize";
      id: string;
      pointerId: number;
      centerX: number;
      centerY: number;
      startDistance: number;
      startZoom: number;
    }
  | { mode: "pinch"; id: string; startDistance: number; startZoom: number };

const TEMPLATES: TemplateSpec[] = [
  {
    id: "plain-collage",
    name: "純組圖",
    note: "1–4 張・無裝飾",
    layout: "adaptive",
    sample: 4,
    min: 1,
    max: 4,
    background: "#ffffff",
    panel: "#ffffff",
    accent: "#9bb0a9",
    ink: "#44514d",
    pattern: "plain",
  },
  {
    id: "sunny-hero",
    name: "今日主角",
    note: "1 張・滿版",
    layout: "single",
    sample: 1,
    min: 1,
    max: 1,
    background: "#fff8d8",
    panel: "#ffffff",
    accent: "#f5b942",
    ink: "#60411c",
    pattern: "dots",
    overlay: "decor-seasons",
  },
  {
    id: "peach-pair",
    name: "左右小日子",
    note: "2 張・左右滿版",
    layout: "split-v",
    sample: 2,
    min: 2,
    max: 2,
    background: "#fff0e9",
    panel: "#ffffff",
    accent: "#ef8f72",
    ink: "#69382c",
    pattern: "confetti",
    overlay: "decor-spring",
  },
  {
    id: "sky-story",
    name: "上下故事",
    note: "2 張・上下滿版",
    layout: "split-h",
    sample: 2,
    min: 2,
    max: 2,
    background: "#e9f6ff",
    panel: "#ffffff",
    accent: "#62a8d8",
    ink: "#244c68",
    pattern: "waves",
    overlay: "decor-seasons",
  },
  {
    id: "spring-garden",
    name: "春日花園",
    note: "3 張・上大下二",
    layout: "hero-side",
    sample: 3,
    min: 3,
    max: 3,
    background: "#fff9ef",
    panel: "#fffefb",
    accent: "#ef8fa0",
    ink: "#574237",
    pattern: "plain",
    overlay: "decor-spring",
  },
  {
    id: "woodland-friends",
    name: "森林好朋友",
    note: "3 張・上大下二",
    layout: "hero-side",
    sample: 3,
    min: 3,
    max: 3,
    background: "#f4f6e8",
    panel: "#fffdf7",
    accent: "#769553",
    ink: "#34452c",
    pattern: "dots",
    overlay: "decor-woodland",
  },
  {
    id: "summer-bubbles",
    name: "夏日泡泡",
    note: "3 張・上二下大",
    layout: "hero-bottom",
    sample: 3,
    min: 3,
    max: 3,
    background: "#e7fbfb",
    panel: "#ffffff",
    accent: "#35aaa5",
    ink: "#205d5b",
    pattern: "dots",
    overlay: "decor-seasons",
  },
  {
    id: "green-adventure",
    name: "四格探險",
    note: "4 張・滿版四宮格",
    layout: "grid",
    sample: 4,
    min: 4,
    max: 4,
    background: "#edf8e7",
    panel: "#ffffff",
    accent: "#75a95c",
    ink: "#34512b",
    pattern: "grid",
    overlay: "decor-woodland",
  },
  {
    id: "candy-grid",
    name: "糖果四格",
    note: "4 張・滿版四宮格",
    layout: "grid",
    sample: 4,
    min: 4,
    max: 4,
    background: "#fff0f7",
    panel: "#ffffff",
    accent: "#e77eae",
    ink: "#6e3150",
    pattern: "confetti",
    overlay: "decor-spring",
  },
  {
    id: "growth-window",
    name: "成長四扇窗",
    note: "4 張・寬窄四格",
    layout: "cross",
    sample: 4,
    min: 4,
    max: 4,
    background: "#eef3ff",
    panel: "#ffffff",
    accent: "#7089d6",
    ink: "#34446c",
    pattern: "dots",
    overlay: "decor-seasons",
  },
  {
    id: "autumn-collage",
    name: "秋葉拼貼",
    note: "4 張・上大下三",
    layout: "masonry",
    sample: 4,
    min: 4,
    max: 4,
    background: "#fff4df",
    panel: "#fffcf5",
    accent: "#d67b3f",
    ink: "#633c25",
    pattern: "plain",
    overlay: "decor-seasons",
  },
  {
    id: "observation-six",
    name: "粉綠四格",
    note: "4 張・滿版四宮格",
    layout: "grid",
    sample: 4,
    min: 4,
    max: 4,
    background: "#ecf8f4",
    panel: "#ffffff",
    accent: "#50a386",
    ink: "#285447",
    pattern: "stripes",
    overlay: "decor-spring",
  },
  {
    id: "weekly-cluster",
    name: "三張小日子",
    note: "3 張・左大右二",
    layout: "cluster",
    sample: 3,
    min: 3,
    max: 3,
    background: "#fff4d9",
    panel: "#ffffff",
    accent: "#dd9b34",
    ink: "#5e431f",
    pattern: "confetti",
    overlay: "decor-woodland",
  },
  {
    id: "nine-memories",
    name: "薰衣草四格",
    note: "4 張・滿版四宮格",
    layout: "grid",
    sample: 4,
    min: 4,
    max: 4,
    background: "#f2efff",
    panel: "#ffffff",
    accent: "#8874c9",
    ink: "#473d6b",
    pattern: "grid",
    overlay: "decor-spring",
  },
  {
    id: "timeline",
    name: "四連拍",
    note: "4 張・錯落四連",
    layout: "timeline",
    sample: 4,
    min: 4,
    max: 4,
    background: "#eaf7ff",
    panel: "#ffffff",
    accent: "#4d9fce",
    ink: "#28536c",
    pattern: "waves",
    overlay: "decor-seasons",
  },
  {
    id: "polaroid-book",
    name: "拍立得手帳",
    note: "3–4 張・微斜拍立得",
    layout: "polaroid",
    sample: 4,
    min: 3,
    max: 4,
    background: "#f8f0e4",
    panel: "#fffdf9",
    accent: "#bd765b",
    ink: "#5c4035",
    pattern: "stripes",
    overlay: "decor-woodland",
  },
  {
    id: "adaptive",
    name: "自動排版",
    note: "1–4 張・自動適配",
    layout: "adaptive",
    sample: 4,
    min: 1,
    max: 4,
    background: "#edf7ff",
    panel: "#ffffff",
    accent: "#4689bd",
    ink: "#284b64",
    pattern: "plain",
    overlay: "decor-seasons",
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Photos tile the whole 1:1 canvas. The decorative frame is drawn on top of them,
// so a background margin would only shrink the photos without being seen.
// Without a frame around each photo this gap is the whole separation, so it is
// narrower than it was: ~18 px in a 2048 px export.
const SLOT_GAP = 0.009;
const SLOT_RADIUS = 0.012;
// Resize handles live just inside the slot's corners, all four of them.
const HANDLE_INSET = 0.026;
const HANDLE_HIT_RADIUS = 0.042;
const HANDLE_CORNERS = [
  { sx: -1, sy: -1, cursor: "nwse-resize" },
  { sx: 1, sy: -1, cursor: "nesw-resize" },
  { sx: -1, sy: 1, cursor: "nesw-resize" },
  { sx: 1, sy: 1, cursor: "nwse-resize" },
] as const;

// A photo can never zoom below cover, or the frame would show gaps.
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
// Half / third of the canvas once the gaps between cells are taken out.
const HALF = (1 - SLOT_GAP) / 2;
const THIRD = (1 - SLOT_GAP * 2) / 3;
// The uneven split used by the layouts that mix a large cell with smaller ones.
const WIDE = 0.56;
const NARROW = 1 - SLOT_GAP - WIDE;
const HERO = 0.62;
const MINOR = 1 - SLOT_GAP - HERO;

function gridSlots(count: number, columns?: number): SlotRect[] {
  const safeCount = Math.max(1, count);
  const cols = columns ?? (safeCount <= 2 ? safeCount : 2);
  const rows = Math.ceil(safeCount / cols);
  const cellWidth = (1 - SLOT_GAP * (cols - 1)) / cols;
  const cellHeight = (1 - SLOT_GAP * (rows - 1)) / rows;

  return Array.from({ length: safeCount }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const itemsInRow = Math.min(cols, safeCount - row * cols);
    // Centre a short final row so three photos in a 2-column grid stay balanced.
    const rowWidth = itemsInRow * cellWidth + Math.max(0, itemsInRow - 1) * SLOT_GAP;
    const rowStart = (1 - rowWidth) / 2;
    return {
      x: rowStart + col * (cellWidth + SLOT_GAP),
      y: row * (cellHeight + SLOT_GAP),
      w: cellWidth,
      h: cellHeight,
      radius: SLOT_RADIUS,
    };
  });
}

function getSlots(layout: LayoutKind, count: number): SlotRect[] {
  const n = Math.max(1, count);
  if (n === 1) {
    return [{ x: 0, y: 0, w: 1, h: 1, radius: SLOT_RADIUS }];
  }
  if (layout === "split-v" && n === 2) {
    return [
      { x: 0, y: 0, w: HALF, h: 1, radius: SLOT_RADIUS },
      { x: HALF + SLOT_GAP, y: 0, w: HALF, h: 1, radius: SLOT_RADIUS },
    ];
  }
  if (layout === "split-h" && n === 2) {
    return [
      { x: 0, y: 0, w: 1, h: HALF, radius: SLOT_RADIUS },
      { x: 0, y: HALF + SLOT_GAP, w: 1, h: HALF, radius: SLOT_RADIUS },
    ];
  }
  if (layout === "hero-side" && n === 3) {
    return [
      { x: 0, y: 0, w: 1, h: HERO, radius: SLOT_RADIUS },
      { x: 0, y: HERO + SLOT_GAP, w: HALF, h: MINOR, radius: SLOT_RADIUS },
      { x: HALF + SLOT_GAP, y: HERO + SLOT_GAP, w: HALF, h: MINOR, radius: SLOT_RADIUS },
    ];
  }
  if (layout === "hero-bottom" && n === 3) {
    return [
      { x: 0, y: 0, w: HALF, h: MINOR, radius: SLOT_RADIUS },
      { x: HALF + SLOT_GAP, y: 0, w: HALF, h: MINOR, radius: SLOT_RADIUS },
      { x: 0, y: MINOR + SLOT_GAP, w: 1, h: HERO, radius: SLOT_RADIUS },
    ];
  }
  if (layout === "cluster" && n === 3) {
    // One tall photo on the left, two stacked beside it.
    return [
      { x: 0, y: 0, w: WIDE, h: 1, radius: SLOT_RADIUS },
      { x: WIDE + SLOT_GAP, y: 0, w: NARROW, h: HALF, radius: SLOT_RADIUS },
      { x: WIDE + SLOT_GAP, y: HALF + SLOT_GAP, w: NARROW, h: HALF, radius: SLOT_RADIUS },
    ];
  }
  if (layout === "cross" && n === 4) {
    // A 2x2 with one wide column, so the four "windows" are not all identical.
    return [
      { x: 0, y: 0, w: WIDE, h: HALF, radius: SLOT_RADIUS },
      { x: WIDE + SLOT_GAP, y: 0, w: NARROW, h: HALF, radius: SLOT_RADIUS },
      { x: 0, y: HALF + SLOT_GAP, w: WIDE, h: HALF, radius: SLOT_RADIUS },
      { x: WIDE + SLOT_GAP, y: HALF + SLOT_GAP, w: NARROW, h: HALF, radius: SLOT_RADIUS },
    ];
  }
  if (layout === "masonry" && n === 4) {
    const strip = 1 - SLOT_GAP - 0.6;
    return [
      { x: 0, y: 0, w: 1, h: 0.6, radius: SLOT_RADIUS },
      { x: 0, y: 0.6 + SLOT_GAP, w: THIRD, h: strip, radius: SLOT_RADIUS },
      { x: THIRD + SLOT_GAP, y: 0.6 + SLOT_GAP, w: THIRD, h: strip, radius: SLOT_RADIUS },
      { x: (THIRD + SLOT_GAP) * 2, y: 0.6 + SLOT_GAP, w: THIRD, h: strip, radius: SLOT_RADIUS },
    ];
  }
  if (layout === "timeline" && n === 4) {
    // Alternating heights keep the zig-zag rhythm the strip is named for.
    return [
      { x: 0, y: 0, w: HALF, h: WIDE, radius: SLOT_RADIUS },
      { x: HALF + SLOT_GAP, y: 0, w: HALF, h: NARROW, radius: SLOT_RADIUS },
      { x: 0, y: WIDE + SLOT_GAP, w: HALF, h: NARROW, radius: SLOT_RADIUS },
      { x: HALF + SLOT_GAP, y: NARROW + SLOT_GAP, w: HALF, h: WIDE, radius: SLOT_RADIUS },
    ];
  }
  if (layout === "polaroid" && n <= 4) {
    // Keep the tilt, so inset just enough that the rotated corners stay tidy.
    const inset = 0.014;
    return gridSlots(n, n <= 2 ? n : 2).map((slot, index) => ({
      ...slot,
      x: slot.x + inset,
      y: slot.y + inset,
      w: slot.w - inset * 2,
      h: slot.h - inset * 2,
      radius: 0.006,
      angle: [-0.03, 0.024, 0.026, -0.022][index],
    }));
  }
  return gridSlots(n);
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPattern(ctx: CanvasRenderingContext2D, size: number, template: TemplateSpec) {
  if (template.pattern === "plain") return;
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = template.accent;
  ctx.fillStyle = template.accent;
  ctx.lineWidth = size * 0.003;

  if (template.pattern === "dots" || template.pattern === "confetti") {
    const step = template.pattern === "dots" ? size * 0.075 : size * 0.095;
    for (let y = step * 0.55; y < size; y += step) {
      for (let x = step * 0.55; x < size; x += step) {
        if (template.pattern === "dots") {
          ctx.beginPath();
          ctx.arc(x, y, size * 0.0045, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(((x + y) / step) % 2 ? 0.5 : -0.5);
          ctx.fillRect(-size * 0.008, -size * 0.002, size * 0.016, size * 0.004);
          ctx.restore();
        }
      }
    }
  }

  if (template.pattern === "stripes") {
    for (let x = -size; x < size * 2; x += size * 0.085) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + size, size);
      ctx.stroke();
    }
  }

  if (template.pattern === "grid") {
    for (let pos = size * 0.04; pos < size; pos += size * 0.06) {
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }
  }

  if (template.pattern === "waves") {
    for (let y = size * 0.05; y < size; y += size * 0.095) {
      ctx.beginPath();
      for (let x = 0; x <= size; x += size * 0.015) {
        const py = y + Math.sin((x / size) * Math.PI * 8) * size * 0.006;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

// How far the photo can travel inside its frame at a given zoom, in the same
// pixel space the frame is measured in. Drawing and every gesture read their
// numbers from here, so a drag can track the pointer exactly.
function photoShiftRange(photo: PhotoItem, zoom: number, width: number, height: number) {
  const image = photo.image;
  if (!image.naturalWidth || !image.naturalHeight) return { x: 0, y: 0, scale: 0 };
  const rotated = Math.abs(photo.rotation % 180) === 90;
  const effectiveWidth = rotated ? image.naturalHeight : image.naturalWidth;
  const effectiveHeight = rotated ? image.naturalWidth : image.naturalHeight;
  const scale = Math.max(width / effectiveWidth, height / effectiveHeight) * zoom;
  return {
    x: Math.max(0, (effectiveWidth * scale - width) / 2),
    y: Math.max(0, (effectiveHeight * scale - height) / 2),
    scale,
  };
}

const shiftFromFocus = (focus: number, range: number) => (0.5 - focus) * range * 2;

const focusFromShift = (shift: number, range: number) =>
  range > 0 ? clamp(0.5 - shift / (range * 2), 0, 1) : 0.5;

// Canva pins whatever sits under the cursor (or the pinch midpoint) while it
// zooms, instead of scaling about the frame centre and letting the picture slide
// away. anchorX/anchorY are measured from the frame centre, in frame pixels.
function zoomAroundPoint(
  photo: PhotoItem,
  width: number,
  height: number,
  requestedZoom: number,
  anchorX: number,
  anchorY: number,
) {
  const zoom = clamp(requestedZoom, MIN_ZOOM, MAX_ZOOM);
  const before = photoShiftRange(photo, photo.zoom, width, height);
  const after = photoShiftRange(photo, zoom, width, height);
  const ratio = photo.zoom > 0 ? zoom / photo.zoom : 1;
  const shiftX = shiftFromFocus(photo.focusX, before.x) * ratio + anchorX * (1 - ratio);
  const shiftY = shiftFromFocus(photo.focusY, before.y) * ratio + anchorY * (1 - ratio);
  return {
    zoom,
    focusX: focusFromShift(shiftX, after.x),
    focusY: focusFromShift(shiftY, after.y),
  };
}

// Rotates a screen-space delta into the slot's own space, so tilted polaroid
// frames still drag along the pointer rather than at an angle to it.
function toSlotSpace(dx: number, dy: number, slot: SlotRect) {
  const angle = -(slot.angle ?? 0);
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle),
    y: dx * Math.sin(angle) + dy * Math.cos(angle),
  };
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  photo: PhotoItem,
  width: number,
  height: number,
) {
  const image = photo.image;
  if (!image.complete || image.naturalWidth === 0) return;
  const { x: rangeX, y: rangeY, scale } = photoShiftRange(photo, photo.zoom, width, height);

  ctx.save();
  ctx.translate(shiftFromFocus(photo.focusX, rangeX), shiftFromFocus(photo.focusY, rangeY));
  ctx.rotate((photo.rotation * Math.PI) / 180);
  ctx.drawImage(
    image,
    (-image.naturalWidth * scale) / 2,
    (-image.naturalHeight * scale) / 2,
    image.naturalWidth * scale,
    image.naturalHeight * scale,
  );
  ctx.restore();
}

function drawSlot(
  ctx: CanvasRenderingContext2D,
  size: number,
  slot: SlotRect,
  photo: PhotoItem | undefined,
  template: TemplateSpec,
  index: number,
) {
  const x = slot.x * size;
  const y = slot.y * size;
  const w = slot.w * size;
  const h = slot.h * size;
  const r = (slot.radius ?? 0.02) * size;
  const isPolaroid = template.layout === "polaroid";

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(slot.angle ?? 0);

  // Only the polaroid layout wears a frame; that white border with its shadow is
  // the whole point of the look. Everywhere else the photos are full-bleed, so a
  // frame would sit a second, lighter tone next to the background showing through
  // the gaps, doubling every seam. The gap alone separates the photos.
  if (isPolaroid) {
    ctx.save();
    ctx.shadowColor = "rgba(66, 48, 37, 0.14)";
    ctx.shadowBlur = size * 0.018;
    ctx.shadowOffsetY = size * 0.008;
    ctx.fillStyle = template.panel;
    const frame = size * 0.014;
    const bottomFrame = size * 0.035;
    roundedPath(ctx, -w / 2 - frame, -h / 2 - frame, w + frame * 2, h + frame + bottomFrame, r + frame);
    ctx.fill();
    ctx.restore();
  }

  roundedPath(ctx, -w / 2, -h / 2, w, h, r);
  ctx.save();
  ctx.clip();
  if (photo) {
    drawPhoto(ctx, photo, w, h);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = template.accent;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = size * 0.003;
    ctx.setLineDash([size * 0.012, size * 0.01]);
    roundedPath(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, Math.max(2, r - 2));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = template.ink;
    ctx.font = `600 ${Math.max(18, size * 0.024)}px "Microsoft JhengHei", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${index + 1}`, 0, 0);
  }
  ctx.restore();
  ctx.restore();
}

function strokeSelection(
  ctx: CanvasRenderingContext2D,
  size: number,
  slot: SlotRect,
) {
  const x = slot.x * size;
  const y = slot.y * size;
  const w = slot.w * size;
  const h = slot.h * size;
  const r = (slot.radius ?? 0.02) * size;
  // Photos are full-bleed, so both the ring and the handles have to sit inside the
  // slot; drawn outside they would be clipped away at the canvas edge.
  const ringInset = size * 0.005;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(slot.angle ?? 0);
  ctx.strokeStyle = "#236bfe";
  ctx.lineWidth = Math.max(4, size * 0.005);
  ctx.setLineDash([size * 0.012, size * 0.007]);
  roundedPath(
    ctx,
    -w / 2 + ringInset,
    -h / 2 + ringInset,
    w - ringInset * 2,
    h - ringInset * 2,
    Math.max(0, r - ringInset),
  );
  ctx.stroke();
  ctx.setLineDash([]);

  // All four corners, the way Canva shows them.
  for (const corner of HANDLE_CORNERS) {
    const handleX = corner.sx * Math.max(0, w / 2 - HANDLE_INSET * size);
    const handleY = corner.sy * Math.max(0, h / 2 - HANDLE_INSET * size);
    ctx.beginPath();
    ctx.arc(handleX, handleY, size * 0.016, 0, Math.PI * 2);
    ctx.fillStyle = "#236bfe";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, size * 0.003);
    ctx.stroke();
  }
  ctx.restore();
}

// While a photo is being dragged or zoomed, Canva keeps the part that falls
// outside the frame visible but dimmed, so you can see what is being cut off.
function drawCropGhost(
  ctx: CanvasRenderingContext2D,
  size: number,
  slot: SlotRect,
  photo: PhotoItem,
  template: TemplateSpec,
) {
  const w = slot.w * size;
  const h = slot.h * size;
  const r = (slot.radius ?? 0.02) * size;

  ctx.save();
  ctx.translate((slot.x + slot.w / 2) * size, (slot.y + slot.h / 2) * size);
  ctx.rotate(slot.angle ?? 0);

  ctx.save();
  ctx.globalAlpha = 0.28;
  drawPhoto(ctx, photo, w, h);
  ctx.restore();

  // Repaint the part inside the frame at full strength.
  ctx.save();
  roundedPath(ctx, -w / 2, -h / 2, w, h, r);
  ctx.clip();
  ctx.fillStyle = template.panel;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  drawPhoto(ctx, photo, w, h);
  ctx.restore();

  ctx.restore();
}

type DrawOptions = {
  template: TemplateSpec;
  photos: PhotoItem[];
  selectedId: string | null;
  ghostId?: string | null;
  forExport?: boolean;
};

function drawComposition(ctx: CanvasRenderingContext2D, size: number, options: DrawOptions) {
  const { template, photos, selectedId, ghostId, forExport } = options;
  ctx.canvas.width = size;
  ctx.canvas.height = size;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = template.background;
  ctx.fillRect(0, 0, size, size);
  drawPattern(ctx, size, template);

  const slotCount = photos.length || template.sample;
  const slots = getSlots(template.layout, slotCount);
  slots.forEach((slot, index) => drawSlot(ctx, size, slot, photos[index], template, index));

  // Layer order is background -> photos -> decorative frame, so the flowers, animals
  // and seasonal corners overlap the photo edges instead of hiding behind them.
  if (template.overlay) {
    const overlay = overlayCache.get(template.overlay);
    if (overlay?.complete && overlay.naturalWidth > 0) {
      const { scale, offsetY } = decorationSpec(template.overlay);
      const drawn = size * scale;
      const inset = (size - drawn) / 2;
      ctx.drawImage(overlay, inset, inset + offsetY * size, drawn, drawn);
    }
  }

  // Editing affordances stay above everything and never reach the export.
  if (!forExport && ghostId) {
    const ghostIndex = photos.findIndex((photo) => photo.id === ghostId);
    const ghostPhoto = photos[ghostIndex];
    if (ghostPhoto && slots[ghostIndex]) {
      drawCropGhost(ctx, size, slots[ghostIndex], ghostPhoto, template);
    }
  }

  if (!forExport && selectedId) {
    const selectedIndex = photos.findIndex((photo) => photo.id === selectedId);
    if (selectedIndex >= 0 && slots[selectedIndex]) strokeSelection(ctx, size, slots[selectedIndex]);
  }
}

function pointInSlotSpace(pointX: number, pointY: number, slot: SlotRect) {
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h / 2;
  const angle = -(slot.angle ?? 0);
  const dx = pointX - cx;
  const dy = pointY - cy;
  const x = dx * Math.cos(angle) - dy * Math.sin(angle);
  const y = dx * Math.sin(angle) + dy * Math.cos(angle);
  return { x, y };
}

function pointInSlot(pointX: number, pointY: number, slot: SlotRect) {
  const { x, y } = pointInSlotSpace(pointX, pointY, slot);
  return Math.abs(x) <= slot.w / 2 && Math.abs(y) <= slot.h / 2;
}

// Returns the corner being grabbed, so the cursor can match its diagonal.
function zoomHandleAt(pointX: number, pointY: number, slot: SlotRect) {
  const point = pointInSlotSpace(pointX, pointY, slot);
  for (const corner of HANDLE_CORNERS) {
    const handleX = corner.sx * Math.max(0, slot.w / 2 - HANDLE_INSET);
    const handleY = corner.sy * Math.max(0, slot.h / 2 - HANDLE_INSET);
    if (Math.hypot(point.x - handleX, point.y - handleY) <= HANDLE_HIT_RADIUS) return corner;
  }
  return null;
}

function TemplateMini({ template, active }: { template: TemplateSpec; active: boolean }) {
  const slots = getSlots(template.layout, template.sample);
  const decoration = template.overlay ? decorationSpec(template.overlay) : null;
  return (
    <span
      className="template-mini"
      style={{ background: template.background, color: template.ink }}
      aria-hidden="true"
    >
      {template.overlay && decoration ? (
        <span
          className="template-mini-overlay"
          style={{
            backgroundImage: `url(${overlayThumbUrl(template.overlay)})`,
            // Mirrors the canvas transform: scale about the centre, then nudge down.
            transform: `translateY(${decoration.offsetY * 100}%) scale(${decoration.scale})`,
          }}
        />
      ) : null}
      {slots.map((slot, index) => (
        <span
          key={index}
          className="template-mini-slot"
          style={{
            left: `${slot.x * 100}%`,
            top: `${slot.y * 100}%`,
            width: `${slot.w * 100}%`,
            height: `${slot.h * 100}%`,
            transform: `rotate(${slot.angle ?? 0}rad)`,
            background: template.panel,
            borderColor: active ? template.accent : "rgba(70,55,45,.13)",
          }}
        />
      ))}
    </span>
  );
}

async function fileToPhoto(file: File): Promise<PhotoItem> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";

  try {
    // The handlers must be attached before src is assigned. Waiting on decode()
    // first and only then listening loses the load/error event for a format the
    // browser cannot read (HEIC, most often), and the promise never settles.
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`無法讀取 ${file.name}`));
      image.src = url;
    });
    // Decoding up front keeps the first draw from stalling on a large photo, but
    // the image is already usable if it fails.
    await image.decode().catch(() => undefined);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    url,
    image,
    zoom: 1,
    focusX: 0.5,
    focusY: 0.5,
    rotation: 0,
  };
}

// On a phone an <a download> lands in Files/Downloads, not the photo album. The
// native share sheet is the only route into 相簿, so offer it on touch devices
// and keep the plain download for desktop.
const prefersShareSheet = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

const canShareFile = (file: File) =>
  typeof navigator !== "undefined" &&
  typeof navigator.canShare === "function" &&
  typeof navigator.share === "function" &&
  navigator.canShare({ files: [file] });

function saveWithLink(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif)$/i;

// Windows often hands over HEIC files with an empty MIME type, so fall back to the
// extension; they then fail with a message that says what to do about it.
const isImageFile = (file: File) =>
  file.type.startsWith("image/") || IMAGE_EXTENSIONS.test(file.name);

const isUnsupportedAppleFormat = (file: File) =>
  /\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type);

type ModelContextLike = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const dragPhotoIdRef = useRef<string | null>(null);
  const pointerGestureRef = useRef<CanvasGesture | null>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const reservedPhotoCountRef = useRef(0);
  const exportingRef = useRef(false);
  const interactionRef = useRef<{ slots: SlotRect[]; photos: PhotoItem[] }>({
    slots: [],
    photos: [],
  });

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("spring-garden");
  const [dropActive, setDropActive] = useState(false);
  // Which photo is mid-gesture, so the canvas can ghost what falls outside it.
  const [gesturePhotoId, setGesturePhotoId] = useState<string | null>(null);
  const [assetVersion, setAssetVersion] = useState(0);

  const template = useMemo(
    () => TEMPLATES.find((item) => item.id === templateId) ?? TEMPLATES[0],
    [templateId],
  );
  const selectedIndex = photos.findIndex((photo) => photo.id === selectedPhotoId);
  const selectedPhoto = selectedIndex >= 0 ? photos[selectedIndex] : undefined;
  const slotCount = photos.length || template.sample;
  const slots = useMemo(() => getSlots(template.layout, slotCount), [template.layout, slotCount]);
  const templateIsAdapted =
    photos.length > 0 && (photos.length < template.min || photos.length > template.max);

  useEffect(() => {
    const decoration = template.overlay;
    if (!decoration || overlayCache.has(decoration)) return;
    let active = true;
    void loadOverlay(decoration).then((image) => {
      if (active && image) setAssetVersion((version) => version + 1);
    });
    return () => {
      active = false;
    };
  }, [template.overlay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    // Match the backing store to the device pixel ratio so the preview stays sharp
    // on retina screens. The export always renders at EXPORT_SIZE regardless.
    const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const previewSize = Math.min(PREVIEW_MAX_SIZE, Math.round(CANVAS_SIZE * Math.min(ratio, 2)));
    drawComposition(ctx, previewSize, {
      template,
      photos,
      selectedId: selectedPhotoId,
      ghostId: gesturePhotoId,
    });
  }, [template, photos, selectedPhotoId, gesturePhotoId, assetVersion]);

  useEffect(() => {
    return () => objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    interactionRef.current = { slots, photos };
  }, [slots, photos]);

  // React registers `wheel` as a passive listener, so an onWheel handler cannot call
  // preventDefault and the page scrolls out from under the zoom. Bind it natively
  // once instead, reading the latest slots/photos from the mirror ref.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (event: globalThis.WheelEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const { slots: currentSlots, photos: currentPhotos } = interactionRef.current;
      const index = currentSlots.findIndex((slot) => pointInSlot(x, y, slot));
      const slot = currentSlots[index];
      const photo = currentPhotos[index];
      if (!slot || !photo) return;
      event.preventDefault();

      // Multiplicative, so one notch feels the same at every zoom level, and
      // driven by the raw delta so a trackpad glides where a wheel steps.
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
      const factor = clamp(Math.exp(-event.deltaY * unit * 0.002), 0.5, 2);
      const width = slot.w * rect.width;
      const height = slot.h * rect.height;
      // Keep whatever is under the cursor pinned while the zoom changes.
      const anchor = toSlotSpace(
        event.clientX - (rect.left + (slot.x + slot.w / 2) * rect.width),
        event.clientY - (rect.top + (slot.y + slot.h / 2) * rect.height),
        slot,
      );

      setSelectedPhotoId(photo.id);
      setPhotos((current) =>
        current.map((item) =>
          item.id === photo.id
            ? {
                ...item,
                ...zoomAroundPoint(item, width, height, item.zoom * factor, anchor.x, anchor.y),
              }
            : item,
        ),
      );
    };

    canvas.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleNativeWheel);
  }, []);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContextLike }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(
      modelContext.registerTool(
        {
          name: "select_growth_journal_template",
          title: "選擇成長日誌版型",
          description: "依版型 ID 切換目前的 1:1 純照片成長日誌版型，保留照片與裁切位置。",
          inputSchema: {
            type: "object",
            properties: { templateId: { type: "string", enum: TEMPLATES.map((item) => item.id) } },
            required: ["templateId"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const value = input as { templateId?: string };
            const next = TEMPLATES.find((item) => item.id === value.templateId);
            if (!next) throw new Error("找不到指定版型");
            setTemplateId(next.id);
            return { templateId: next.id, templateName: next.name };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  const addFiles = async (fileList: FileList | File[]) => {
    const imageFiles = Array.from(fileList).filter(isImageFile);
    if (!imageFiles.length) {
      toast.error("請選擇 JPG、PNG 或其他照片檔案");
      return;
    }
    const startingCount = reservedPhotoCountRef.current;
    const available = MAX_PHOTOS - startingCount;
    if (available <= 0) {
      toast.error(`一張成品最多放 ${MAX_PHOTOS} 張照片`);
      return;
    }

    const accepted = imageFiles.slice(0, available);
    reservedPhotoCountRef.current += accepted.length;

    let loaded: PhotoItem[] = [];
    try {
      const results = await Promise.allSettled(accepted.map(fileToPhoto));
      loaded = results
        .filter((result): result is PromiseFulfilledResult<PhotoItem> => result.status === "fulfilled")
        .map((result) => result.value);
    } finally {
      // Always settle the reservation, so a failed batch cannot leave the counter
      // inflated and permanently block adding photos.
      reservedPhotoCountRef.current = Math.max(
        0,
        reservedPhotoCountRef.current - (accepted.length - loaded.length),
      );
    }

    const failedCount = accepted.length - loaded.length;
    if (!loaded.length) {
      toast.error(
        accepted.some(isUnsupportedAppleFormat)
          ? "瀏覽器讀不到 HEIC 照片，請先轉成 JPG 再上傳"
          : "有照片無法讀取，請換一個檔案再試",
      );
      return;
    }

    loaded.forEach((photo) => objectUrlsRef.current.push(photo.url));
    setPhotos((current) => [...current, ...loaded]);
    setSelectedPhotoId((current) => current ?? loaded[0]?.id ?? null);
    if (startingCount === 0) {
      // Prefer a template built for exactly this many photos, so the catch-all
      // ranges (純組圖, 自動排版) stay opt-in rather than winning by list order.
      const fits = (item: TemplateSpec) =>
        loaded.length >= item.min && loaded.length <= item.max;
      const recommended =
        TEMPLATES.find((item) => item.min === item.max && fits(item)) ??
        TEMPLATES.find(fits);
      if (recommended) setTemplateId(recommended.id);
    }

    if (failedCount > 0) {
      toast.warning(`已加入 ${loaded.length} 張，${failedCount} 張無法讀取`);
    } else if (accepted.length < imageFiles.length) {
      toast.warning(`已加入 ${accepted.length} 張；單張成品上限為 ${MAX_PHOTOS} 張`);
    } else {
      toast.success(`已加入 ${loaded.length} 張照片`);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    try {
      if (input.files) await addFiles(input.files);
    } finally {
      // Reset regardless, so picking the same file twice in a row still fires.
      input.value = "";
    }
  };

  const updateSelected = useCallback(
    (changes: Partial<Pick<PhotoItem, "zoom" | "focusX" | "focusY" | "rotation">>) => {
      if (!selectedPhotoId) return;
      setPhotos((current) =>
        current.map((photo) => (photo.id === selectedPhotoId ? { ...photo, ...changes } : photo)),
      );
    },
    [selectedPhotoId],
  );

  const removePhoto = (id: string) => {
    const index = photos.findIndex((photo) => photo.id === id);
    if (index < 0) return;
    const removed = photos[index];
    const next = photos.filter((photo) => photo.id !== id);

    setPhotos(next);
    if (id === selectedPhotoId) {
      setSelectedPhotoId(next[Math.min(index, next.length - 1)]?.id ?? null);
    }

    reservedPhotoCountRef.current = Math.max(0, reservedPhotoCountRef.current - 1);
    URL.revokeObjectURL(removed.url);
    objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== removed.url);
    toast.info("照片已移除");
  };

  const movePhoto = useCallback((id: string, direction: -1 | 1) => {
    setPhotos((current) => {
      const from = current.findIndex((photo) => photo.id === id);
      const to = clamp(from + direction, 0, current.length - 1);
      if (from < 0 || from === to) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const reorderPhoto = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setPhotos((current) => {
      const sourceIndex = current.findIndex((photo) => photo.id === sourceId);
      const targetIndex = current.findIndex((photo) => photo.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    toast.success("照片順序已更新");
  };

  const canvasPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  };

  const slotFramePixels = (slot: SlotRect, rect: DOMRect) => ({
    width: slot.w * rect.width,
    height: slot.h * rect.height,
  });

  // Where a client point sits relative to the frame centre, in frame pixels.
  const slotAnchor = (slot: SlotRect, clientX: number, clientY: number, rect: DOMRect) =>
    toSlotSpace(
      clientX - (rect.left + (slot.x + slot.w / 2) * rect.width),
      clientY - (rect.top + (slot.y + slot.h / 2) * rect.height),
      slot,
    );

  // Moves the photo by a screen-space delta, one-to-one with the pointer.
  const panPhoto = (id: string, slot: SlotRect, dxPx: number, dyPx: number, rect: DOMRect) => {
    const local = toSlotSpace(dxPx, dyPx, slot);
    const { width, height } = slotFramePixels(slot, rect);
    setPhotos((current) =>
      current.map((photo) => {
        if (photo.id !== id) return photo;
        const range = photoShiftRange(photo, photo.zoom, width, height);
        return {
          ...photo,
          focusX: focusFromShift(shiftFromFocus(photo.focusX, range.x) + local.x, range.x),
          focusY: focusFromShift(shiftFromFocus(photo.focusY, range.y) + local.y, range.y),
        };
      }),
    );
  };

  const zoomPhotoAt = (
    id: string,
    slot: SlotRect,
    rect: DOMRect,
    nextZoomFor: (zoom: number) => number,
    anchorX: number,
    anchorY: number,
  ) => {
    const { width, height } = slotFramePixels(slot, rect);
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === id
          ? {
              ...photo,
              ...zoomAroundPoint(photo, width, height, nextZoomFor(photo.zoom), anchorX, anchorY),
            }
          : photo,
      ),
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const point = canvasPoint(event.clientX, event.clientY);
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);

    const pointers = [...activePointersRef.current.values()];
    if (pointers.length >= 2) {
      const [first, second] = pointers;
      const midpoint = canvasPoint((first.x + second.x) / 2, (first.y + second.y) / 2);
      const pinchIndex =
        selectedIndex >= 0 && pointInSlot(midpoint.x, midpoint.y, slots[selectedIndex])
          ? selectedIndex
          : slots.findIndex((slot) => pointInSlot(midpoint.x, midpoint.y, slot));
      const pinchPhoto = photos[pinchIndex];
      if (pinchPhoto) {
        setSelectedPhotoId(pinchPhoto.id);
        setGesturePhotoId(pinchPhoto.id);
        pointerGestureRef.current = {
          mode: "pinch",
          id: pinchPhoto.id,
          startDistance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
          startZoom: pinchPhoto.zoom,
        };
      }
      return;
    }

    const handle =
      selectedPhoto && selectedIndex >= 0
        ? zoomHandleAt(point.x, point.y, slots[selectedIndex])
        : null;
    if (selectedPhoto && selectedIndex >= 0 && handle) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + (slots[selectedIndex].x + slots[selectedIndex].w / 2) * rect.width;
      const centerY = rect.top + (slots[selectedIndex].y + slots[selectedIndex].h / 2) * rect.height;
      setGesturePhotoId(selectedPhoto.id);
      event.currentTarget.style.cursor = handle.cursor;
      pointerGestureRef.current = {
        mode: "resize",
        id: selectedPhoto.id,
        pointerId: event.pointerId,
        centerX,
        centerY,
        startDistance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
        startZoom: selectedPhoto.zoom,
      };
      return;
    }

    const index = slots.findIndex((slot) => pointInSlot(point.x, point.y, slot));
    const photo = photos[index];
    if (!photo) {
      activePointersRef.current.delete(event.pointerId);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }
    setSelectedPhotoId(photo.id);
    setGesturePhotoId(photo.id);
    pointerGestureRef.current = {
      mode: "pan",
      id: photo.id,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    const gesture = pointerGestureRef.current;
    const canvasRect = canvasRef.current?.getBoundingClientRect();

    if (!gesture) {
      const point = canvasPoint(event.clientX, event.clientY);
      const handle =
        selectedIndex >= 0 ? zoomHandleAt(point.x, point.y, slots[selectedIndex]) : null;
      const overPhoto = slots.some((slot, index) => photos[index] && pointInSlot(point.x, point.y, slot));
      event.currentTarget.style.cursor = handle ? handle.cursor : overPhoto ? "grab" : "default";
      return;
    }

    const gestureIndex = photos.findIndex((photo) => photo.id === gesture.id);
    const slot = slots[gestureIndex];
    if (!slot || !canvasRect) return;

    if (gesture.mode === "pinch") {
      const pointers = [...activePointersRef.current.values()];
      if (pointers.length < 2) return;
      const [first, second] = pointers;
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const factor = distance / gesture.startDistance;
      // Zoom about the midpoint between the fingers, so the picture stays put
      // under them instead of sliding out from under the pinch.
      const anchor = slotAnchor(slot, (first.x + second.x) / 2, (first.y + second.y) / 2, canvasRect);
      zoomPhotoAt(gesture.id, slot, canvasRect, () => gesture.startZoom * factor, anchor.x, anchor.y);
      return;
    }

    if (event.pointerId !== gesture.pointerId) return;

    if (gesture.mode === "resize") {
      const distance = Math.hypot(event.clientX - gesture.centerX, event.clientY - gesture.centerY);
      const factor = distance / gesture.startDistance;
      // A corner handle scales about the frame centre, like resizing an element.
      zoomPhotoAt(gesture.id, slot, canvasRect, () => gesture.startZoom * factor, 0, 0);
      return;
    }

    panPhoto(
      gesture.id,
      slot,
      event.clientX - gesture.x,
      event.clientY - gesture.y,
      canvasRect,
    );
    pointerGestureRef.current = { ...gesture, x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(event.pointerId);
    const gesture = pointerGestureRef.current;
    if (gesture?.mode === "pinch" || (gesture && gesture.pointerId === event.pointerId)) {
      pointerGestureRef.current = null;
      setGesturePhotoId(null);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const slot = selectedIndex >= 0 ? slots[selectedIndex] : undefined;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!selectedPhoto || !slot || !rect) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "_"].includes(event.key)) {
      return;
    }
    event.preventDefault();

    // Arrows nudge by a fixed on-screen distance, so they match dragging.
    const step = event.shiftKey ? 24 : 8;
    if (event.key === "ArrowLeft") panPhoto(selectedPhoto.id, slot, -step, 0, rect);
    if (event.key === "ArrowRight") panPhoto(selectedPhoto.id, slot, step, 0, rect);
    if (event.key === "ArrowUp") panPhoto(selectedPhoto.id, slot, 0, -step, rect);
    if (event.key === "ArrowDown") panPhoto(selectedPhoto.id, slot, 0, step, rect);

    const zoomStep = event.shiftKey ? 1.25 : 1.1;
    if (event.key === "+" || event.key === "=") {
      zoomPhotoAt(selectedPhoto.id, slot, rect, (zoom) => zoom * zoomStep, 0, 0);
    }
    if (event.key === "-" || event.key === "_") {
      zoomPhotoAt(selectedPhoto.id, slot, rect, (zoom) => zoom / zoomStep, 0, 0);
    }
  };

  const downloadImage = async () => {
    if (!photos.length) {
      toast.error("請先加入至少一張照片");
      return;
    }
    // Guards the await window below; a double click would otherwise hand the
    // browser two identical downloads.
    if (exportingRef.current) return;
    exportingRef.current = true;

    try {
      // Keep the awaits before navigator.share() to a minimum: Safari only allows
      // the share sheet while the click's user activation is still valid. No text
      // is drawn into an export, so there is no need to wait on document.fonts.
      // Never export a half-loaded sheet: wait for the decoration before drawing.
      if (template.overlay) await loadOverlay(template.overlay);

      const exportCanvas = document.createElement("canvas");
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) {
        toast.error("匯出失敗，請再試一次");
        return;
      }

      drawComposition(ctx, EXPORT_SIZE, {
        template,
        photos,
        selectedId: null,
        forExport: true,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, "image/png");
      });
      if (!blob) {
        toast.error("匯出失敗，請再試一次");
        return;
      }

      const fileName = `成長日誌-${template.name}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (prefersShareSheet() && canShareFile(file)) {
        try {
          await navigator.share({ files: [file] });
          toast.success("選「儲存影像」就會存進相簿");
          return;
        } catch (error) {
          // Dismissing the sheet is a normal outcome, not a failure.
          if (error instanceof Error && error.name === "AbortError") return;
          // Anything else (no permission, share unavailable) falls back below.
        }
      }

      saveWithLink(blob, fileName);
      toast.success("已下載 2048 × 2048 PNG");
    } finally {
      exportingRef.current = false;
    }
  };

  const handleDrop = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDropActive(false);
    if (event.dataTransfer.files?.length) await addFiles(event.dataTransfer.files);
  };

  return (
    <main
      className="app-shell"
      onDragEnter={(event) => {
        if (event.dataTransfer.types.includes("Files")) setDropActive(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDropActive(false);
      }}
      onDrop={handleDrop}
    >
      <section className="workspace" aria-label="成長日誌編輯器">
        <aside className="panel photo-panel" aria-label="照片管理">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">步驟 1</p>
              <h2>加入照片</h2>
            </div>
            <span className="count-badge">{photos.length}/{MAX_PHOTOS}</span>
          </div>

          <label className="upload-card" htmlFor="photo-upload">
            <span className="upload-icon" aria-hidden="true">
              <ImagePlus />
            </span>
            <strong>{photos.length ? "繼續加入照片" : "選擇多張照片"}</strong>
            <span>會自動滿版裁切，也可直接拖曳</span>
          </label>
          <input
            ref={fileInputRef}
            id="photo-upload"
            className="visually-hidden"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />

          {photos.length ? (
            <div className="photo-list" role="list" aria-label={`已加入 ${photos.length} 張照片`}>
              {photos.map((photo, index) => {
                const selected = photo.id === selectedPhotoId;
                return (
                  <div
                    key={photo.id}
                    className={`photo-row${selected ? " is-selected" : ""}`}
                    role="listitem"
                    draggable
                    onDragStart={() => {
                      dragPhotoIdRef.current = photo.id;
                    }}
                    onDragEnd={() => {
                      dragPhotoIdRef.current = null;
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (dragPhotoIdRef.current) reorderPhoto(dragPhotoIdRef.current, photo.id);
                      dragPhotoIdRef.current = null;
                    }}
                  >
                    <button
                      className="photo-select"
                      type="button"
                      onClick={() => setSelectedPhotoId(photo.id)}
                      aria-pressed={selected}
                      aria-label={`選取照片 ${index + 1}，${photo.name}`}
                    >
                      <span className="photo-number">{index + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="" />
                      <span className="photo-name">{photo.name}</span>
                      {selected ? <Check className="photo-check" aria-hidden="true" /> : null}
                    </button>
                    <div className="photo-order-actions" aria-label={`照片 ${index + 1} 排序`}>
                      <button
                        type="button"
                        onClick={() => movePhoto(photo.id, -1)}
                        disabled={index === 0}
                        aria-label="往前移一格"
                      >
                        <ChevronLeft />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhoto(photo.id, 1)}
                        disabled={index === photos.length - 1}
                        aria-label="往後移一格"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-photo-note">
              <Images aria-hidden="true" />
              <p>照片會鋪滿每個框，加入後仍可自由移動與縮放。</p>
            </div>
          )}

          <div className="panel-footer">
            <Button className="export-button" onClick={downloadImage} disabled={!photos.length}>
              <Download aria-hidden="true" />
              {/* Touch devices get the share sheet, which is the only way into 相簿.
                  Swapped with CSS so the label is right without client detection. */}
              <span className="label-pointer-fine">下載成品</span>
              <span className="label-pointer-coarse">儲存到相簿</span>
            </Button>
          </div>
        </aside>

        <section className="stage-column" aria-label="1 比 1 成品預覽">
          <div className="stage-toolbar">
            <div>
              <p className="eyebrow">步驟 2</p>
              <h1>調整你的成長日誌</h1>
            </div>
            <div className="stage-toolbar-actions">
              <div className="stage-hint">
                <Move aria-hidden="true" />
                直接拖曳移動・拖角落縮放
              </div>
              {selectedPhoto ? (
                <div className="stage-photo-actions" role="toolbar" aria-label={`調整第 ${selectedIndex + 1} 張照片`}>
                  <span className="stage-photo-label">
                    照片 {selectedIndex + 1}
                    <output aria-live="polite">{Math.round(selectedPhoto.zoom * 100)}%</output>
                  </span>
                  <button
                    type="button"
                    onClick={() => updateSelected({ rotation: (selectedPhoto.rotation + 90) % 360 })}
                    aria-label="旋轉照片 90 度"
                    title="旋轉"
                  >
                    <RotateCw aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelected({ zoom: MIN_ZOOM, focusX: 0.5, focusY: 0.5, rotation: 0 })
                    }
                    aria-label="重設照片位置與縮放"
                    title="重設"
                  >
                    <Sparkles aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="stage-delete-action"
                    onClick={() => removePhoto(selectedPhoto.id)}
                    aria-label="移除這張照片"
                    title="移除"
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`canvas-wrap${dropActive ? " is-drop-active" : ""}`}>
            <canvas
              ref={canvasRef}
              className="journal-canvas"
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={handleCanvasKeyDown}
              tabIndex={0}
              role="img"
              aria-label={`正方形成長日誌預覽，目前使用${template.name}。點選照片後可直接拖曳移動，使用滾輪、雙指或四角藍點縮放，方向鍵可微調。`}
            />
            {!photos.length ? (
              <div className="canvas-empty-action">
                <span className="empty-sparkle" aria-hidden="true">
                  <Sparkles />
                </span>
                <strong>從今天的照片開始</strong>
                <p>每張成品最多 4 張，照片會滿版鋪滿整個畫布。</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload aria-hidden="true" />
                  選擇照片
                </Button>
              </div>
            ) : null}
            {dropActive ? (
              <div className="drop-overlay" aria-hidden="true">
                <Upload />
                放開就加入照片
              </div>
            ) : null}
          </div>

          <div className="canvas-status" aria-live="polite">
            <span>
              <span className="status-dot" />
              {template.name}
            </span>
            <span>{photos.length ? `${photos.length} 張照片` : "等待照片"}</span>
            <span>1:1・2048 px</span>
          </div>
        </section>

        <aside className="panel design-panel" aria-label="版型與照片設定">
          <div className="design-heading-row">
            <span className="design-heading-icon" aria-hidden="true">
              <LayoutGrid />
            </span>
            <div>
              <p className="eyebrow">步驟 3</p>
              <h2>挑一個版型</h2>
            </div>
            <span className="count-badge">{TEMPLATES.length} 款</span>
          </div>
          {templateIsAdapted ? (
            <p className="adapt-note">已依目前照片數自動調整版型排列。</p>
          ) : null}
          <div className="template-grid tab-scroll-area" aria-label="版型清單">
            {TEMPLATES.map((item) => {
              const active = item.id === template.id;
              const recommended =
                photos.length > 0 && photos.length >= item.min && photos.length <= item.max;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`template-card${active ? " is-active" : ""}`}
                  onClick={() => setTemplateId(item.id)}
                  aria-pressed={active}
                >
                  <TemplateMini template={item} active={active} />
                  <span className="template-copy">
                    <strong>{item.name}</strong>
                    <small>{recommended ? "最適合目前照片" : item.note}</small>
                  </span>
                  {active ? <Check className="template-check" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </aside>
      </section>
      <Toaster position="bottom-center" richColors />
    </main>
  );
}
