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
  type WheelEvent,
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
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toaster } from "@/components/ui/sonner";

const CANVAS_SIZE = 1200;
const EXPORT_SIZE = 2048;
const MAX_PHOTOS = 4;
const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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

const TEMPLATES: TemplateSpec[] = [
  {
    id: "sunny-hero",
    name: "今日主角",
    note: "1 張・橫式 4:3",
    layout: "single",
    sample: 1,
    min: 1,
    max: 1,
    background: "#fff8d8",
    panel: "#ffffff",
    accent: "#f5b942",
    ink: "#60411c",
    pattern: "dots",
    overlay: `${ASSET_BASE}/decor-seasons.png`,
  },
  {
    id: "peach-pair",
    name: "左右小日子",
    note: "2 張・正方形",
    layout: "split-v",
    sample: 2,
    min: 2,
    max: 2,
    background: "#fff0e9",
    panel: "#ffffff",
    accent: "#ef8f72",
    ink: "#69382c",
    pattern: "confetti",
    overlay: `${ASSET_BASE}/decor-spring.png`,
  },
  {
    id: "sky-story",
    name: "上下故事",
    note: "2 張・橫式 4:3",
    layout: "split-h",
    sample: 2,
    min: 2,
    max: 2,
    background: "#e9f6ff",
    panel: "#ffffff",
    accent: "#62a8d8",
    ink: "#244c68",
    pattern: "waves",
    overlay: `${ASSET_BASE}/decor-seasons.png`,
  },
  {
    id: "spring-garden",
    name: "春日花園",
    note: "3 張・混合比例",
    layout: "hero-side",
    sample: 3,
    min: 3,
    max: 3,
    background: "#fff9ef",
    panel: "#fffefb",
    accent: "#ef8fa0",
    ink: "#574237",
    pattern: "plain",
    overlay: `${ASSET_BASE}/decor-spring.png`,
  },
  {
    id: "woodland-friends",
    name: "森林好朋友",
    note: "3 張・混合比例",
    layout: "hero-side",
    sample: 3,
    min: 3,
    max: 3,
    background: "#f4f6e8",
    panel: "#fffdf7",
    accent: "#769553",
    ink: "#34452c",
    pattern: "dots",
    overlay: `${ASSET_BASE}/decor-woodland.png`,
  },
  {
    id: "summer-bubbles",
    name: "夏日泡泡",
    note: "3 張・混合比例",
    layout: "hero-bottom",
    sample: 3,
    min: 3,
    max: 3,
    background: "#e7fbfb",
    panel: "#ffffff",
    accent: "#35aaa5",
    ink: "#205d5b",
    pattern: "dots",
    overlay: `${ASSET_BASE}/decor-seasons.png`,
  },
  {
    id: "green-adventure",
    name: "四格探險",
    note: "4 張・正方形",
    layout: "grid",
    sample: 4,
    min: 4,
    max: 4,
    background: "#edf8e7",
    panel: "#ffffff",
    accent: "#75a95c",
    ink: "#34512b",
    pattern: "grid",
    overlay: `${ASSET_BASE}/decor-woodland.png`,
  },
  {
    id: "candy-grid",
    name: "糖果四格",
    note: "4 張・正方形",
    layout: "grid",
    sample: 4,
    min: 4,
    max: 4,
    background: "#fff0f7",
    panel: "#ffffff",
    accent: "#e77eae",
    ink: "#6e3150",
    pattern: "confetti",
    overlay: `${ASSET_BASE}/decor-spring.png`,
  },
  {
    id: "growth-window",
    name: "成長四扇窗",
    note: "4 張・橫式 4:3",
    layout: "cross",
    sample: 4,
    min: 4,
    max: 4,
    background: "#eef3ff",
    panel: "#ffffff",
    accent: "#7089d6",
    ink: "#34446c",
    pattern: "dots",
    overlay: `${ASSET_BASE}/decor-seasons.png`,
  },
  {
    id: "autumn-collage",
    name: "秋葉拼貼",
    note: "4 張・混合比例",
    layout: "masonry",
    sample: 4,
    min: 4,
    max: 4,
    background: "#fff4df",
    panel: "#fffcf5",
    accent: "#d67b3f",
    ink: "#633c25",
    pattern: "plain",
    overlay: `${ASSET_BASE}/decor-seasons.png`,
  },
  {
    id: "observation-six",
    name: "粉綠四格",
    note: "4 張・正方形",
    layout: "grid",
    sample: 4,
    min: 4,
    max: 4,
    background: "#ecf8f4",
    panel: "#ffffff",
    accent: "#50a386",
    ink: "#285447",
    pattern: "stripes",
    overlay: `${ASSET_BASE}/decor-spring.png`,
  },
  {
    id: "weekly-cluster",
    name: "三張小日子",
    note: "3 張・正方形",
    layout: "cluster",
    sample: 3,
    min: 3,
    max: 3,
    background: "#fff4d9",
    panel: "#ffffff",
    accent: "#dd9b34",
    ink: "#5e431f",
    pattern: "confetti",
    overlay: `${ASSET_BASE}/decor-woodland.png`,
  },
  {
    id: "nine-memories",
    name: "薰衣草四格",
    note: "4 張・正方形",
    layout: "grid",
    sample: 4,
    min: 4,
    max: 4,
    background: "#f2efff",
    panel: "#ffffff",
    accent: "#8874c9",
    ink: "#473d6b",
    pattern: "grid",
    overlay: `${ASSET_BASE}/decor-spring.png`,
  },
  {
    id: "timeline",
    name: "四連拍",
    note: "4 張・正方形",
    layout: "timeline",
    sample: 4,
    min: 4,
    max: 4,
    background: "#eaf7ff",
    panel: "#ffffff",
    accent: "#4d9fce",
    ink: "#28536c",
    pattern: "waves",
    overlay: `${ASSET_BASE}/decor-seasons.png`,
  },
  {
    id: "polaroid-book",
    name: "拍立得手帳",
    note: "3–4 張・正方形",
    layout: "polaroid",
    sample: 4,
    min: 3,
    max: 4,
    background: "#f8f0e4",
    panel: "#fffdf9",
    accent: "#bd765b",
    ink: "#5c4035",
    pattern: "stripes",
    overlay: `${ASSET_BASE}/decor-woodland.png`,
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
    overlay: `${ASSET_BASE}/decor-seasons.png`,
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function gridSlots(count: number, columns?: number): SlotRect[] {
  const safeCount = Math.max(1, count);
  const cols = columns ?? (safeCount <= 2 ? safeCount : 2);
  const rows = Math.ceil(safeCount / cols);
  const gap = 0.018;
  const area = { x: 0.09, y: 0.09, w: 0.82, h: 0.82 };
  const cell = Math.min(
    (area.w - gap * (cols - 1)) / cols,
    (area.h - gap * (rows - 1)) / rows,
  );
  const totalHeight = rows * cell + gap * (rows - 1);
  const startY = area.y + (area.h - totalHeight) / 2;

  return Array.from({ length: safeCount }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const itemsInRow = Math.min(cols, safeCount - row * cols);
    const rowWidth = itemsInRow * cell + Math.max(0, itemsInRow - 1) * gap;
    const rowStart = area.x + (area.w - rowWidth) / 2;
    return {
      x: rowStart + col * (cell + gap),
      y: startY + row * (cell + gap),
      w: cell,
      h: cell,
      radius: 0.022,
    };
  });
}

function getSlots(layout: LayoutKind, count: number): SlotRect[] {
  const n = Math.max(1, count);
  if (layout === "single" || n === 1) {
    return [{ x: 0.09, y: 0.1925, w: 0.82, h: 0.615, radius: 0.035 }];
  }
  if (layout === "split-v" && n === 2) {
    return gridSlots(2, 2);
  }
  if (layout === "split-h" && n === 2) {
    return [
      { x: 0.3, y: 0.18, w: 0.4, h: 0.3, radius: 0.025 },
      { x: 0.3, y: 0.52, w: 0.4, h: 0.3, radius: 0.025 },
    ];
  }
  if (layout === "hero-side" && n === 3) {
    return [
      { x: 0.22, y: 0.09, w: 0.56, h: 0.42, radius: 0.026 },
      { x: 0.19, y: 0.57, w: 0.3, h: 0.3, radius: 0.022 },
      { x: 0.51, y: 0.57, w: 0.3, h: 0.3, radius: 0.022 },
    ];
  }
  if (layout === "hero-bottom" && n === 3) {
    return [
      { x: 0.19, y: 0.13, w: 0.3, h: 0.3, radius: 0.022 },
      { x: 0.51, y: 0.13, w: 0.3, h: 0.3, radius: 0.022 },
      { x: 0.22, y: 0.48, w: 0.56, h: 0.42, radius: 0.026 },
    ];
  }
  if (layout === "cross" && n === 4) {
    return [
      { x: 0.1, y: 0.17, w: 0.39, h: 0.2925, radius: 0.022 },
      { x: 0.51, y: 0.17, w: 0.39, h: 0.2925, radius: 0.022 },
      { x: 0.1, y: 0.5375, w: 0.39, h: 0.2925, radius: 0.022 },
      { x: 0.51, y: 0.5375, w: 0.39, h: 0.2925, radius: 0.022 },
    ];
  }
  if (layout === "masonry" && n === 4) {
    return [
      { x: 0.22, y: 0.08, w: 0.56, h: 0.42, radius: 0.024 },
      { x: 0.105, y: 0.57, w: 0.25, h: 0.25, radius: 0.022 },
      { x: 0.375, y: 0.57, w: 0.25, h: 0.25, radius: 0.022 },
      { x: 0.645, y: 0.57, w: 0.25, h: 0.25, radius: 0.022 },
    ];
  }
  if (layout === "cluster" && n === 3) {
    return [
      { x: 0.08, y: 0.29, w: 0.31, h: 0.31, radius: 0.02, angle: -0.045 },
      { x: 0.345, y: 0.41, w: 0.31, h: 0.31, radius: 0.02, angle: 0.025 },
      { x: 0.61, y: 0.27, w: 0.31, h: 0.31, radius: 0.02, angle: -0.02 },
    ];
  }
  if (layout === "timeline" && n === 4) {
    return Array.from({ length: n }, (_, index) => ({
      x: 0.08 + index * 0.21,
      y: index % 2 === 0 ? 0.29 : 0.5,
      w: 0.19,
      h: 0.19,
      radius: 0.018,
    }));
  }
  if (layout === "polaroid" && n <= 4) {
    const base = gridSlots(n, n <= 2 ? n : 2);
    return base.map((slot, index) => ({
      ...slot,
      x: slot.x + 0.016,
      y: slot.y + 0.016,
      w: slot.w - 0.032,
      h: slot.h - 0.032,
      radius: 0.008,
      angle: [-0.045, 0.035, 0.04, -0.035][index],
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

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  photo: PhotoItem,
  width: number,
  height: number,
) {
  const image = photo.image;
  if (!image.complete || image.naturalWidth === 0) return;
  const rotated = Math.abs(photo.rotation % 180) === 90;
  const effectiveWidth = rotated ? image.naturalHeight : image.naturalWidth;
  const effectiveHeight = rotated ? image.naturalWidth : image.naturalHeight;
  const scale = Math.max(width / effectiveWidth, height / effectiveHeight) * photo.zoom;
  const drawnWidth = effectiveWidth * scale;
  const drawnHeight = effectiveHeight * scale;
  const maxShiftX = Math.max(0, (drawnWidth - width) / 2);
  const maxShiftY = Math.max(0, (drawnHeight - height) / 2);
  const shiftX = (0.5 - photo.focusX) * maxShiftX * 2;
  const shiftY = (0.5 - photo.focusY) * maxShiftY * 2;

  ctx.save();
  ctx.translate(shiftX, shiftY);
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

  ctx.save();
  ctx.shadowColor = "rgba(66, 48, 37, 0.14)";
  ctx.shadowBlur = size * 0.018;
  ctx.shadowOffsetY = size * 0.008;
  ctx.fillStyle = template.panel;
  // Standard layouts are true full-bleed: the photo reaches the slot edge.
  // The polaroid layout keeps an outer paper border as part of its decoration.
  const frame = isPolaroid ? size * 0.014 : 0;
  const bottomFrame = isPolaroid ? size * 0.035 : frame;
  roundedPath(ctx, -w / 2 - frame, -h / 2 - frame, w + frame * 2, h + frame + bottomFrame, r + frame);
  ctx.fill();
  ctx.restore();

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
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(slot.angle ?? 0);
  ctx.strokeStyle = "#236bfe";
  ctx.lineWidth = Math.max(4, size * 0.005);
  ctx.setLineDash([size * 0.012, size * 0.007]);
  roundedPath(ctx, -w / 2 - size * 0.006, -h / 2 - size * 0.006, w + size * 0.012, h + size * 0.012, r);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#236bfe";
  ctx.beginPath();
  ctx.arc(w / 2 + size * 0.008, h / 2 + size * 0.008, size * 0.012, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

type DrawOptions = {
  template: TemplateSpec;
  photos: PhotoItem[];
  selectedId: string | null;
  overlayImages: Record<string, HTMLImageElement>;
  forExport?: boolean;
};

function drawComposition(ctx: CanvasRenderingContext2D, size: number, options: DrawOptions) {
  const { template, photos, selectedId, overlayImages, forExport } = options;
  ctx.canvas.width = size;
  ctx.canvas.height = size;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = template.background;
  ctx.fillRect(0, 0, size, size);
  drawPattern(ctx, size, template);

  const slotCount = photos.length || template.sample;
  const slots = getSlots(template.layout, slotCount);
  slots.forEach((slot, index) => drawSlot(ctx, size, slot, photos[index], template, index));

  if (template.overlay) {
    const overlay = overlayImages[template.overlay];
    if (overlay?.complete && overlay.naturalWidth > 0) ctx.drawImage(overlay, 0, 0, size, size);
  }

  if (!forExport && selectedId) {
    const selectedIndex = photos.findIndex((photo) => photo.id === selectedId);
    if (selectedIndex >= 0 && slots[selectedIndex]) strokeSelection(ctx, size, slots[selectedIndex]);
  }
}

function pointInSlot(pointX: number, pointY: number, slot: SlotRect) {
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h / 2;
  const angle = -(slot.angle ?? 0);
  const dx = pointX - cx;
  const dy = pointY - cy;
  const x = dx * Math.cos(angle) - dy * Math.sin(angle);
  const y = dx * Math.sin(angle) + dy * Math.cos(angle);
  return Math.abs(x) <= slot.w / 2 && Math.abs(y) <= slot.h / 2;
}

function TemplateMini({ template, active }: { template: TemplateSpec; active: boolean }) {
  const slots = getSlots(template.layout, template.sample);
  return (
    <span
      className="template-mini"
      style={{ background: template.background, color: template.ink }}
      aria-hidden="true"
    >
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
      {template.overlay ? (
        <span className="template-mini-overlay" style={{ backgroundImage: `url(${template.overlay})` }} />
      ) : null}
    </span>
  );
}

async function fileToPhoto(file: File): Promise<PhotoItem> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  try {
    await image.decode();
  } catch {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`無法讀取 ${file.name}`));
    });
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
  const overlayImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const objectUrlsRef = useRef<string[]>([]);
  const dragPhotoIdRef = useRef<string | null>(null);
  const pointerDragRef = useRef<{ id: string; x: number; y: number } | null>(null);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("spring-garden");
  const [dropActive, setDropActive] = useState(false);
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
    const overlays = [...new Set(TEMPLATES.map((item) => item.overlay).filter(Boolean))] as string[];
    overlays.forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        overlayImagesRef.current[src] = image;
        setAssetVersion((version) => version + 1);
      };
      image.src = src;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    drawComposition(ctx, CANVAS_SIZE, {
      template,
      photos,
      selectedId: selectedPhotoId,
      overlayImages: overlayImagesRef.current,
    });
  }, [template, photos, selectedPhotoId, assetVersion]);

  useEffect(() => {
    return () => objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
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
      const imageFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
      if (!imageFiles.length) {
        toast.error("請選擇 JPG、PNG 或其他照片檔案");
        return;
      }
      const available = MAX_PHOTOS - photos.length;
      if (available <= 0) {
        toast.error(`一張成品最多放 ${MAX_PHOTOS} 張照片`);
        return;
      }
      const accepted = imageFiles.slice(0, available);
      try {
        const loaded = await Promise.all(accepted.map(fileToPhoto));
        loaded.forEach((photo) => objectUrlsRef.current.push(photo.url));
        setPhotos((current) => [...current, ...loaded]);
        setSelectedPhotoId((current) => current ?? loaded[0]?.id ?? null);
        if (photos.length === 0) {
          const recommended = TEMPLATES.find(
            (item) => loaded.length >= item.min && loaded.length <= item.max,
          );
          if (recommended) setTemplateId(recommended.id);
        }
        if (accepted.length < imageFiles.length) {
          toast.warning(`已加入 ${accepted.length} 張；單張成品上限為 ${MAX_PHOTOS} 張`);
        } else {
          toast.success(`已加入 ${loaded.length} 張照片`);
        }
      } catch {
        toast.error("有照片無法讀取，請換一個檔案再試");
      }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) await addFiles(event.target.files);
    event.target.value = "";
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
    setPhotos((current) => {
      const index = current.findIndex((photo) => photo.id === id);
      const removed = current[index];
      if (removed) {
        URL.revokeObjectURL(removed.url);
        objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== removed.url);
      }
      const next = current.filter((photo) => photo.id !== id);
      if (id === selectedPhotoId) setSelectedPhotoId(next[Math.min(index, next.length - 1)]?.id ?? null);
      return next;
    });
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

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = canvasPoint(event.clientX, event.clientY);
    const index = slots.findIndex((slot) => pointInSlot(point.x, point.y, slot));
    const photo = photos[index];
    if (!photo) return;
    setSelectedPhotoId(photo.id);
    pointerDragRef.current = { id: photo.id, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const dragging = pointerDragRef.current;
    if (!dragging) return;
    const index = photos.findIndex((photo) => photo.id === dragging.id);
    const slot = slots[index];
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!slot || !canvasRect) return;
    const dx = (event.clientX - dragging.x) / canvasRect.width;
    const dy = (event.clientY - dragging.y) / canvasRect.height;
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === dragging.id
          ? {
              ...photo,
              focusX: clamp(photo.focusX - dx / Math.max(slot.w, 0.1), 0, 1),
              focusY: clamp(photo.focusY - dy / Math.max(slot.h, 0.1), 0, 1),
            }
          : photo,
      ),
    );
    pointerDragRef.current = { ...dragging, x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    pointerDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    const point = canvasPoint(event.clientX, event.clientY);
    const index = slots.findIndex((slot) => pointInSlot(point.x, point.y, slot));
    const photo = photos[index];
    if (!photo) return;
    event.preventDefault();
    setSelectedPhotoId(photo.id);
    setPhotos((current) =>
      current.map((item) =>
        item.id === photo.id
          ? { ...item, zoom: clamp(item.zoom + (event.deltaY > 0 ? -0.08 : 0.08), 1, 3) }
          : item,
      ),
    );
  };

  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (!selectedPhoto) return;
    const step = event.shiftKey ? 0.08 : 0.025;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-"].includes(event.key)) {
      event.preventDefault();
    }
    if (event.key === "ArrowLeft") updateSelected({ focusX: clamp(selectedPhoto.focusX + step, 0, 1) });
    if (event.key === "ArrowRight") updateSelected({ focusX: clamp(selectedPhoto.focusX - step, 0, 1) });
    if (event.key === "ArrowUp") updateSelected({ focusY: clamp(selectedPhoto.focusY + step, 0, 1) });
    if (event.key === "ArrowDown") updateSelected({ focusY: clamp(selectedPhoto.focusY - step, 0, 1) });
    if (event.key === "+" || event.key === "=") updateSelected({ zoom: clamp(selectedPhoto.zoom + 0.08, 1, 3) });
    if (event.key === "-") updateSelected({ zoom: clamp(selectedPhoto.zoom - 0.08, 1, 3) });
  };

  const downloadImage = async () => {
    if (!photos.length) {
      toast.error("請先加入至少一張照片");
      return;
    }
    await document.fonts?.ready;
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;
    drawComposition(ctx, EXPORT_SIZE, {
      template,
      photos,
      selectedId: null,
      overlayImages: overlayImagesRef.current,
      forExport: true,
    });
    exportCanvas.toBlob((blob) => {
      if (!blob) {
        toast.error("匯出失敗，請再試一次");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `芽芽成長誌-${template.name}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("已下載 2048 × 2048 PNG");
    }, "image/png");
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
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">
            <Sprout />
          </span>
          <div>
            <p className="brand-name">芽芽成長誌</p>
            <p className="brand-meta">每一個小進步，都值得被收藏</p>
          </div>
        </div>
        <div className="privacy-chip">
          <ShieldCheck aria-hidden="true" />
          照片只留在這台裝置
        </div>
        <Button className="export-button" onClick={downloadImage} disabled={!photos.length}>
          <Download aria-hidden="true" />
          下載成品
        </Button>
      </header>

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
        </aside>

        <section className="stage-column" aria-label="1 比 1 成品預覽">
          <div className="stage-toolbar">
            <div>
              <p className="eyebrow">步驟 2</p>
              <h1>調整你的成長日誌</h1>
            </div>
            <div className="stage-hint">
              <Move aria-hidden="true" />
              拖曳照片調位置・滾輪縮放
            </div>
          </div>

          <div className={`canvas-wrap${dropActive ? " is-drop-active" : ""}`}>
            <canvas
              ref={canvasRef}
              className="journal-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              onKeyDown={handleCanvasKeyDown}
              tabIndex={0}
              role="img"
              aria-label={`正方形成長日誌預覽，目前使用${template.name}。選取照片後可用方向鍵移動，加減鍵縮放。`}
            />
            {!photos.length ? (
              <div className="canvas-empty-action">
                <span className="empty-sparkle" aria-hidden="true">
                  <Sparkles />
                </span>
                <strong>從今天的照片開始</strong>
                <p>每張成品最多 4 張，照片框只用 1:1 或橫式 4:3。</p>
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
            <span className="count-badge">16 款</span>
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

          <div className="adjust-card">
            <div className="adjust-heading">
              <div>
                <p className="eyebrow">照片調整</p>
                <h3>{selectedPhoto ? `第 ${selectedIndex + 1} 張` : "先選一張照片"}</h3>
              </div>
              {selectedPhoto ? <span>{Math.round(selectedPhoto.zoom * 100)}%</span> : null}
            </div>
            {selectedPhoto ? (
              <>
                <div className="zoom-row">
                  <ZoomOut aria-hidden="true" />
                  <Slider
                    value={[selectedPhoto.zoom]}
                    min={1}
                    max={3}
                    step={0.01}
                    onValueChange={(value) => updateSelected({ zoom: value[0] })}
                    aria-label="照片縮放"
                  />
                  <ZoomIn aria-hidden="true" />
                </div>
                <p className="adjust-help">在畫布上拖曳照片即可改變焦點位置。</p>
                <div className="adjust-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSelected({ rotation: (selectedPhoto.rotation + 90) % 360 })}
                  >
                    <RotateCw aria-hidden="true" />
                    旋轉
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSelected({ zoom: 1, focusX: 0.5, focusY: 0.5, rotation: 0 })}
                  >
                    重設裁切
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removePhoto(selectedPhoto.id)}>
                    <Trash2 aria-hidden="true" />
                    移除
                  </Button>
                </div>
              </>
            ) : (
              <p className="adjust-empty">加入照片後，點一下畫布中的照片就能微調。</p>
            )}
          </div>

          <Button className="mobile-export-button" onClick={downloadImage} disabled={!photos.length}>
            <Download aria-hidden="true" />
            下載 2048 × 2048 PNG
          </Button>
        </aside>
      </section>
      <Toaster position="bottom-center" richColors />
    </main>
  );
}
