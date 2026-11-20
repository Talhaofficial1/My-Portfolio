import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  MessageCircle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { LAPTOP_TOTAL_FRAMES, PROFILE } from '../data/portfolioData';
import { SOCIAL_LINKS } from '../data/social';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { InquiryPayload } from '../types/portfolio';
import { SocialBrandIcon } from './SocialIcons';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = LAPTOP_TOTAL_FRAMES;

// Toggle to false if source footage already has a pure black screen
const USE_SCREEN_MASK = true;

// Normalized 0..1 corner coordinates of the inner laptop screen in source frame space (640x360).
// Verified against the inner dark bezel edge of the foreground open laptop (frames 095..120) so
// 100% of wallpaper, desktop icons, and taskbar are covered without touching bezel or keyboard deck.
interface Point2D {
  x: number;
  y: number;
}

interface ScreenQuad {
  tl: Point2D;
  tr: Point2D;
  br: Point2D;
  bl: Point2D;
}

const SCREEN_CORNERS: ScreenQuad = {
  tl: { x: 0.315, y: 0.222 },
  tr: { x: 0.678, y: 0.222 },
  br: { x: 0.678, y: 0.595 },
  bl: { x: 0.315, y: 0.595 },
};

// Tracked inner-screen keyframes while the lid opens (~60% at frame-050) and rises toward SCREEN_CORNERS
const APPROACH_KEYFRAMES: Array<{ t: number; quad: ScreenQuad }> = [
  {
    t: 0.412,
    quad: {
      tl: { x: 0.352, y: 0.65 },
      tr: { x: 0.652, y: 0.65 },
      br: { x: 0.648, y: 0.836 },
      bl: { x: 0.358, y: 0.836 },
    },
  },
  {
    t: 0.454,
    quad: {
      tl: { x: 0.359, y: 0.568 },
      tr: { x: 0.649, y: 0.568 },
      br: { x: 0.648, y: 0.822 },
      bl: { x: 0.36, y: 0.822 },
    },
  },
  {
    t: 0.513,
    quad: {
      tl: { x: 0.356, y: 0.464 },
      tr: { x: 0.646, y: 0.464 },
      br: { x: 0.646, y: 0.774 },
      bl: { x: 0.357, y: 0.774 },
    },
  },
  {
    t: 0.58,
    quad: {
      tl: { x: 0.342, y: 0.388 },
      tr: { x: 0.648, y: 0.388 },
      br: { x: 0.648, y: 0.692 },
      bl: { x: 0.344, y: 0.692 },
    },
  },
  {
    t: 0.664,
    quad: {
      tl: { x: 0.33, y: 0.285 },
      tr: { x: 0.656, y: 0.285 },
      br: { x: 0.656, y: 0.622 },
      bl: { x: 0.332, y: 0.622 },
    },
  },
  {
    t: 0.748,
    quad: {
      tl: { x: 0.319, y: 0.242 },
      tr: { x: 0.665, y: 0.242 },
      br: { x: 0.665, y: 0.592 },
      bl: { x: 0.32, y: 0.592 },
    },
  },
];

const DEFAULT_OVERSCAN = 0.01;
const DEFAULT_OPEN_AT = 0.45;
const DEFAULT_MAX_ZOOM_FACTOR = 1.08;
const FIT_SCALE = 1.0;
const FIT_OFFSET_Y = 0;

const FRAME_EDGE_MASK_IMAGE =
  'linear-gradient(to right, transparent 0, #000 12%, #000 88%, transparent 100%), linear-gradient(to bottom, transparent 0, #000 8%, #000 92%, transparent 100%)';

const FRAME_EDGE_MASK_STYLE: React.CSSProperties = {
  maskImage: FRAME_EDGE_MASK_IMAGE,
  WebkitMaskImage: FRAME_EDGE_MASK_IMAGE,
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
};

function getLaptopFrameSrc(oneBasedIndex: number): string {
  const padded = String(oneBasedIndex).padStart(3, '0');
  return `${PROFILE.assets.laptopSeqDir}/frame-${padded}.webp?${PROFILE.assets.laptopSeqVersion}`;
}

const POSTER_FRAME_SRC = getLaptopFrameSrc(1);

const DEFAULT_FORMSPREE_URL = 'https://formspree.io/f/xppddyje';
const FORMSPREE_URL = (
  import.meta.env.VITE_FORMSPREE_URL?.trim() || DEFAULT_FORMSPREE_URL
).trim();

const INITIAL_FORM: InquiryPayload = {
  name: '',
  email: '',
  projectType: 'Web Development',
  budget: '$500 – $1,500',
  message: '',
  website: '',
};

interface FormspreeErrorItem {
  field?: string;
  message?: string;
  code?: string;
}

interface FormspreeResponse {
  ok?: boolean;
  next?: string;
  error?: string;
  errors?: FormspreeErrorItem[];
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPoint(a: Point2D, b: Point2D, t: number): Point2D {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function lerpQuad(a: ScreenQuad, b: ScreenQuad, t: number): ScreenQuad {
  return {
    tl: lerpPoint(a.tl, b.tl, t),
    tr: lerpPoint(a.tr, b.tr, t),
    br: lerpPoint(a.br, b.br, t),
    bl: lerpPoint(a.bl, b.bl, t),
  };
}

function applyQuadOverscan(quad: ScreenQuad, overscan: number): ScreenQuad {
  const cx = (quad.tl.x + quad.tr.x + quad.br.x + quad.bl.x) * 0.25;
  const cy = (quad.tl.y + quad.tr.y + quad.br.y + quad.bl.y) * 0.25;
  const scale = 1 + overscan * 2;
  const expand = (pt: Point2D): Point2D => ({
    x: clamp(cx + (pt.x - cx) * scale, 0, 1),
    y: clamp(cy + (pt.y - cy) * scale, 0, 1),
  });
  return {
    tl: expand(quad.tl),
    tr: expand(quad.tr),
    br: expand(quad.br),
    bl: expand(quad.bl),
  };
}

function resolveQuadAtFootageProgress(
  footageProgress: number,
  restingQuad: ScreenQuad
): ScreenQuad {
  if (footageProgress >= 0.79) {
    return restingQuad;
  }
  if (footageProgress <= APPROACH_KEYFRAMES[0].t) {
    return APPROACH_KEYFRAMES[0].quad;
  }
  for (let i = 0; i < APPROACH_KEYFRAMES.length - 1; i++) {
    const curr = APPROACH_KEYFRAMES[i];
    const next = APPROACH_KEYFRAMES[i + 1];
    if (footageProgress <= next.t) {
      const localT = clamp((footageProgress - curr.t) / Math.max(0.001, next.t - curr.t), 0, 1);
      return lerpQuad(curr.quad, next.quad, localT);
    }
  }
  const last = APPROACH_KEYFRAMES[APPROACH_KEYFRAMES.length - 1];
  const tailT = clamp((footageProgress - last.t) / Math.max(0.001, 0.79 - last.t), 0, 1);
  return lerpQuad(last.quad, restingQuad, tailT);
}

interface ContainFitRect {
  drawW: number;
  drawH: number;
  offsetX: number;
  offsetY: number;
}

function computeContainFit(
  containerW: number,
  containerH: number,
  sourceW: number,
  sourceH: number,
  fitScale = FIT_SCALE,
  fitOffsetY = FIT_OFFSET_Y
): ContainFitRect {
  const imgRatio = sourceW / Math.max(1, sourceH);
  const isPortrait = containerH > containerW;
  // Landscape: height = min(92svh, vw * 9/16); Portrait: width = 100% of viewport, vertically centered
  const baseH = isPortrait
    ? containerW / imgRatio
    : Math.min(containerH * 0.92, containerW / imgRatio);
  // Short viewports (< 480px, e.g. landscape phones 844x390) multiply frame size by 0.9
  const shortViewportMul = containerH < 480 ? 0.9 : 1;
  const drawH = baseH * shortViewportMul * fitScale;
  const drawW = drawH * imgRatio;
  const offsetX = (containerW - drawW) * 0.5;
  const offsetY = (containerH - drawH) * 0.5 + fitOffsetY * containerH;

  return { drawW, drawH, offsetX, offsetY };
}

function solveLinear8(matrix: number[][], rhs: number[]): number[] | null {
  const n = 8;
  const a = matrix.map((row, idx) => [...row, rhs[idx]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxVal = Math.abs(a[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(a[row][col]);
      if (val > maxVal) {
        maxVal = val;
        pivotRow = row;
      }
    }
    if (maxVal < 1e-9) return null;

    if (pivotRow !== col) {
      const tmp = a[col];
      a[col] = a[pivotRow];
      a[pivotRow] = tmp;
    }

    const pivot = a[col][col];
    for (let j = col; j <= n; j++) {
      a[col][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col];
      if (Math.abs(factor) < 1e-12) continue;
      for (let j = col; j <= n; j++) {
        a[row][j] -= factor * a[col][j];
      }
    }
  }

  return a.map((row) => row[n]);
}

function computeQuadMatrix3d(
  w: number,
  h: number,
  tl: Point2D,
  tr: Point2D,
  br: Point2D,
  bl: Point2D
): string {
  const src: Array<[number, number]> = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const dst: Array<[number, number]> = [
    [tl.x, tl.y],
    [tr.x, tr.y],
    [br.x, br.y],
    [bl.x, bl.y],
  ];

  const rows: number[][] = [];
  const rhs: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [X, Y] = dst[i];
    rows.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    rhs.push(X);
    rows.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    rhs.push(Y);
  }

  const s = solveLinear8(rows, rhs);
  if (!s) return 'none';

  const [m0, m1, m2, m3, m4, m5, m6, m7] = s;
  // Column-major 4x4 CSS matrix3d
  return `matrix3d(${m0.toFixed(6)}, ${m3.toFixed(6)}, 0, ${m6.toFixed(7)}, ${m1.toFixed(
    6
  )}, ${m4.toFixed(6)}, 0, ${m7.toFixed(7)}, 0, 0, 1, 0, ${m2.toFixed(3)}, ${m5.toFixed(
    3
  )}, 0, 1)`;
}

type CornerKey = keyof ScreenQuad;

const CORNER_KEYS: CornerKey[] = ['tl', 'tr', 'br', 'bl'];

export function FinalCtaSection() {
  const reducedMotion = usePrefersReducedMotion();

  // Preferred canvas image-sequence mode with automatic fallback to scrubbed MP4 video
  const [useVideoFallback, setUseVideoFallback] = useState(false);
  const [posterReady, setPosterReady] = useState(false);

  // ?debug=1 mask alignment state (handles appear on first load only when URL contains ?debug=1)
  const [debugMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === '1';
  });
  const [debugOpen, setDebugOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [corners, setCorners] = useState<ScreenQuad>(SCREEN_CORNERS);
  const [overscan, setOverscan] = useState(DEFAULT_OVERSCAN);
  const [openAt, setOpenAt] = useState(DEFAULT_OPEN_AT);
  const [maxZoomFactor, setMaxZoomFactor] = useState(DEFAULT_MAX_ZOOM_FACTOR);
  const [fitScale, setFitScale] = useState(FIT_SCALE);
  const [fitOffsetY, setFitOffsetY] = useState(FIT_OFFSET_Y);

  // Refs synced synchronously inside imperative ScrollTrigger applySequenceState
  const cornersRef = useRef<ScreenQuad>(SCREEN_CORNERS);
  const overscanRef = useRef(DEFAULT_OVERSCAN);
  const openAtRef = useRef(DEFAULT_OPEN_AT);
  const maxZoomFactorRef = useRef(DEFAULT_MAX_ZOOM_FACTOR);
  const fitScaleRef = useRef(FIT_SCALE);
  const fitOffsetYRef = useRef(FIT_OFFSET_Y);
  const progressRef = useRef(0);
  const currentScaleRef = useRef(1);
  const zoomOriginRef = useRef<Point2D>({ x: 0, y: 0 });
  const sourceDimsRef = useRef<{ w: number; h: number }>({ w: 640, h: 360 });
  const draggingCornerRef = useRef<CornerKey | null>(null);

  // Pinned sequence refs
  const sectionRef = useRef<HTMLElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);
  const zoomGroupRef = useRef<HTMLDivElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const frameGlowRef = useRef<HTMLDivElement>(null);
  const posterImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const framesCacheRef = useRef<Array<HTMLImageElement | null>>([]);
  const currentFrameIdxRef = useRef(0);

  const screenMaskRef = useRef<HTMLDivElement>(null);
  const headlineStageRef = useRef<HTMLDivElement>(null);
  const headlineTextRef = useRef<HTMLHeadingElement>(null);
  const storyIntroRef = useRef<HTMLDivElement>(null);
  const contactWrapRef = useRef<HTMLDivElement>(null);

  // Debug SVG overlay & corner handles
  const debugPolyRef = useRef<SVGPolygonElement>(null);
  const debugHandleRefs = useRef<Record<CornerKey, HTMLButtonElement | null>>({
    tl: null,
    tr: null,
    br: null,
    bl: null,
  });

  // Contact form state & refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<InquiryPayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirectFallback, setShowDirectFallback] = useState(false);

  useEffect(() => {
    cornersRef.current = corners;
  }, [corners]);

  useEffect(() => {
    overscanRef.current = overscan;
  }, [overscan]);

  useEffect(() => {
    openAtRef.current = openAt;
  }, [openAt]);

  useEffect(() => {
    maxZoomFactorRef.current = maxZoomFactor;
  }, [maxZoomFactor]);

  useEffect(() => {
    fitScaleRef.current = fitScale;
  }, [fitScale]);

  useEffect(() => {
    fitOffsetYRef.current = fitOffsetY;
  }, [fitOffsetY]);

  // Draw a specific frame onto the DPR-aware contain-fit <canvas>
  const drawFrameToCanvas = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clampedIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIdx));
    currentFrameIdxRef.current = clampedIdx;

    const cache = framesCacheRef.current;
    let img = cache[clampedIdx];
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const earlier = clampedIdx - offset;
        if (earlier >= 0 && cache[earlier]?.complete && (cache[earlier]?.naturalWidth ?? 0) > 0) {
          img = cache[earlier];
          break;
        }
        const later = clampedIdx + offset;
        if (
          later < TOTAL_FRAMES &&
          cache[later]?.complete &&
          (cache[later]?.naturalWidth ?? 0) > 0
        ) {
          img = cache[later];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    sourceDimsRef.current = { w: img.naturalWidth, h: img.naturalHeight };

    const stage = pinStageRef.current;
    const rect = stage
      ? stage.getBoundingClientRect()
      : canvas.parentElement?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const { drawW, drawH, offsetX, offsetY } = computeContainFit(
      rect.width,
      rect.height,
      img.naturalWidth,
      img.naturalHeight,
      fitScaleRef.current,
      fitOffsetYRef.current
    );

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.round(drawW * dpr));
    const targetH = Math.max(1, Math.round(drawH * dpr));

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    canvas.style.left = `${offsetX.toFixed(2)}px`;
    canvas.style.top = `${offsetY.toFixed(2)}px`;
    canvas.style.width = `${drawW.toFixed(2)}px`;
    canvas.style.height = `${drawH.toFixed(2)}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }, []);

  // Imperative updater for mask polygon, sharp pixel text, zoom, and seamless dark handoff
  const applySequenceState = useCallback((progress: number) => {
    const pinStage = pinStageRef.current;
    const zoomGroup = zoomGroupRef.current;
    const mediaWrap = mediaWrapRef.current;
    const screenMask = screenMaskRef.current;
    const headlineStage = headlineStageRef.current;
    const headlineText = headlineTextRef.current;
    const storyIntro = storyIntroRef.current;

    if (!pinStage || !storyIntro) {
      return;
    }

    if (reducedMotion) {
      storyIntro.style.opacity = '1';
      storyIntro.style.transform = 'none';
      return;
    }

    if (
      !zoomGroup ||
      !mediaWrap ||
      !screenMask ||
      !headlineStage ||
      !headlineText
    ) {
      return;
    }

    const p = clamp(progress, 0, 1);
    progressRef.current = p;

    const rect = pinStage.getBoundingClientRect();
    const viewW =
      rect.width || document.documentElement.clientWidth || window.innerWidth || 1440;
    const viewH = rect.height || window.innerHeight || 900;

    // Contain-fit geometry matching the <canvas> / <video> element inside pinStage
    const targetW = viewW;
    const targetH = viewH;
    const srcW = sourceDimsRef.current.w || 640;
    const srcH = sourceDimsRef.current.h || 360;
    const { drawW, drawH, offsetX, offsetY } = computeContainFit(
      targetW,
      targetH,
      srcW,
      srcH,
      fitScaleRef.current,
      fitOffsetYRef.current
    );

    const frameBoxStyleTargets = [canvasRef.current, videoRef.current, posterImgRef.current];
    frameBoxStyleTargets.forEach((el) => {
      if (!el) return;
      el.style.left = `${offsetX.toFixed(2)}px`;
      el.style.top = `${offsetY.toFixed(2)}px`;
      el.style.width = `${drawW.toFixed(2)}px`;
      el.style.height = `${drawH.toFixed(2)}px`;
    });

    if (frameGlowRef.current) {
      frameGlowRef.current.style.left = `${(offsetX + drawW * 0.5).toFixed(2)}px`;
      frameGlowRef.current.style.top = `${(offsetY + drawH * 0.5).toFixed(2)}px`;
      frameGlowRef.current.style.width = `${(drawW * 1.18).toFixed(2)}px`;
      frameGlowRef.current.style.height = `${(drawH * 1.18).toFixed(2)}px`;
    }

    const openAtNow = clamp(openAtRef.current, 0.2, 0.7);
    const footageProgress = clamp(p / Math.max(0.05, openAtNow), 0, 1);

    const activeBaseQuad = resolveQuadAtFootageProgress(footageProgress, cornersRef.current);
    const activeQuad = applyQuadOverscan(activeBaseQuad, overscanRef.current);
    const restingQuad = applyQuadOverscan(cornersRef.current, overscanRef.current);

    const mapPt = (pt: Point2D): Point2D => ({
      x: offsetX + pt.x * drawW,
      y: offsetY + pt.y * drawH,
    });

    const tl = mapPt(activeQuad.tl);
    const tr = mapPt(activeQuad.tr);
    const br = mapPt(activeQuad.br);
    const bl = mapPt(activeQuad.bl);

    const minX = Math.min(tl.x, bl.x);
    const maxX = Math.max(tr.x, br.x);
    const minY = Math.min(tl.y, tr.y);
    const maxY = Math.max(bl.y, br.y);

    const polyW = Math.max(40, maxX - minX);
    const polyH = Math.max(30, maxY - minY);
    const cx = (tl.x + tr.x + br.x + bl.x) * 0.25;
    const cy = (tl.y + tr.y + br.y + bl.y) * 0.25;

    // Keep zoom origin anchored to resting SCREEN_CORNERS center once open/zooming
    const rTL = mapPt(restingQuad.tl);
    const rTR = mapPt(restingQuad.tr);
    const rBR = mapPt(restingQuad.br);
    const rBL = mapPt(restingQuad.bl);
    const rMinX = Math.min(rTL.x, rBL.x);
    const rMaxX = Math.max(rTR.x, rBR.x);
    const rMinY = Math.min(rTL.y, rTR.y);
    const rMaxY = Math.max(rBL.y, rBR.y);
    const rCx = (rTL.x + rTR.x + rBR.x + rBL.x) * 0.25;
    const rCy = (rTL.y + rTR.y + rBR.y + rBL.y) * 0.25;
    zoomOriginRef.current = { x: rCx, y: rCy };

    // Apply homography matrix3d to glossy black #020103 rounded-corner mask
    const maskBaseW = Math.max(100, Math.round(polyW));
    const maskBaseH = Math.max(60, Math.round(polyH));
    screenMask.style.width = `${maskBaseW}px`;
    screenMask.style.height = `${maskBaseH}px`;
    screenMask.style.transformOrigin = '0 0';
    screenMask.style.transform = computeQuadMatrix3d(maskBaseW, maskBaseH, tl, tr, br, bl);

    // 1. Progress 0..openAt (0-45%): footage plays (laptop opens)
    if (useVideoFallback) {
      const video = videoRef.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        const targetTime = Math.min(video.duration, Math.max(0, footageProgress * video.duration));
        if (Math.abs(video.currentTime - targetTime) > 0.015) {
          video.currentTime = targetTime;
        }
      }
    } else {
      const targetIdx = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(footageProgress * (TOTAL_FRAMES - 1)))
      );
      if (targetIdx !== currentFrameIdxRef.current) {
        drawFrameToCanvas(targetIdx);
      }
    }

    // 2. Mask turns fully ON (opacity 1) from ~60% lid open (footageProgress >= 0.41) through end of zoom
    const maskOnT = smoothstep(0.35, 0.41, footageProgress);
    screenMask.style.opacity = USE_SCREEN_MASK ? String(maskOnT) : '0';

    // 3. Progress 45-55%: Headline fades in centered inside the black screen
    const headlineStart = openAtNow;
    const headlineEnd = Math.min(0.6, openAtNow + 0.1);
    const headlineFadeT = smoothstep(headlineStart, headlineEnd, p);

    // 4. Progress 55-90%: Zoom into the black screen until it fills the viewport edge-to-edge
    const zoomStart = headlineEnd;
    const zoomEnd = 0.9;
    const rawZoomT = clamp((p - zoomStart) / Math.max(0.05, zoomEnd - zoomStart), 0, 1);
    const zoomEaseIn = Math.pow(rawZoomT, 2.05);

    const rPolyW = Math.max(40, rMaxX - rMinX);
    const rPolyH = Math.max(30, rMaxY - rMinY);
    const coverScaleX = Math.max(
      rCx / Math.max(8, rCx - rMinX),
      (viewW - rCx) / Math.max(8, rMaxX - rCx)
    );
    const coverScaleY = Math.max(
      rCy / Math.max(8, rCy - rMinY),
      (viewH - rCy) / Math.max(8, rMaxY - rCy)
    );
    const coverRatio = Math.max(viewW / rPolyW, viewH / rPolyH);
    const maxScale =
      Math.max(coverRatio, coverScaleX, coverScaleY) * maxZoomFactorRef.current;

    const currentScale = lerp(1, maxScale, zoomEaseIn);
    currentScaleRef.current = currentScale;

    // 5. Progress 90-100%: Seamless fade out from #020103 black screen straight into #07050d (~8% of scroll)
    const handoffFadeOut = 1 - smoothstep(0.91, 0.99, p);

    zoomGroup.style.transformOrigin = `${rCx.toFixed(1)}px ${rCy.toFixed(1)}px`;
    zoomGroup.style.transform = `scale(${currentScale.toFixed(4)})`;
    zoomGroup.style.opacity = String(handoffFadeOut);

    // 6. Crisp un-scaled headline centered inside screen polygon, max-width 68% of polygon width
    const scaledMinY = rCy + (minY - rCy) * currentScale;
    const scaledMaxY = rCy + (maxY - rCy) * currentScale;
    const livePolyW = polyW * currentScale;
    const livePolyH = Math.max(24, scaledMaxY - scaledMinY);
    const visibleScreenW = Math.min(livePolyW, viewW * currentScale * 0.85);
    const maxHeadlineW = Math.min(livePolyW * 0.68, viewW * 0.86);
    const liveFontPx = Math.max(
      9.5,
      Math.min(visibleScreenW * 0.056, livePolyH * 0.24, viewW * 0.088, viewH * 0.16)
    );
    const headlineRisePx = Math.round(lerp(12, 0, headlineFadeT));

    const liveCx = rCx + (cx - rCx) * currentScale;
    const liveCy = rCy + (cy - rCy) * currentScale;
    headlineStage.style.left = `${liveCx.toFixed(1)}px`;
    headlineStage.style.top = `${liveCy.toFixed(1)}px`;
    headlineStage.style.width = `${Math.max(40, Math.round(maxHeadlineW))}px`;
    headlineStage.style.maxWidth = `${Math.max(40, Math.round(maxHeadlineW))}px`;
    headlineStage.style.overflow = rawZoomT >= 0.995 ? 'visible' : 'hidden';
    headlineStage.style.transform = `translate3d(-50%, -50%, 0) translate3d(0, ${headlineRisePx}px, 0)`;
    headlineStage.style.opacity = String(headlineFadeT * handoffFadeOut);
    headlineStage.style.maxHeight = `${Math.max(40, livePolyH * 0.88).toFixed(1)}px`;
    headlineText.style.fontSize = `${liveFontPx.toFixed(2)}px`;

    // 7. Progress 90-100%: Next section fades in and slides up (translateY 40px -> 0) simultaneously
    const storyT = smoothstep(0.91, 0.99, p);
    const storyY = Math.round(lerp(40, 0, storyT));
    storyIntro.style.opacity = String(storyT);
    storyIntro.style.transform = `translate3d(0, ${storyY}px, 0)`;

    // Update debug overlay handles (mapped to resting SCREEN_CORNERS + overscan and scaled with live zoom)
    const mapScaledPt = (pt: Point2D): Point2D => ({
      x: rCx + (pt.x - rCx) * currentScale,
      y: rCy + (pt.y - rCy) * currentScale,
    });
    const dTL = mapScaledPt(rTL);
    const dTR = mapScaledPt(rTR);
    const dBR = mapScaledPt(rBR);
    const dBL = mapScaledPt(rBL);

    if (debugPolyRef.current) {
      debugPolyRef.current.setAttribute(
        'points',
        `${dTL.x.toFixed(1)},${dTL.y.toFixed(1)} ${dTR.x.toFixed(1)},${dTR.y.toFixed(
          1
        )} ${dBR.x.toFixed(1)},${dBR.y.toFixed(1)} ${dBL.x.toFixed(1)},${dBL.y.toFixed(1)}`
      );
    }

    const mappedCorners: Record<CornerKey, Point2D> = { tl: dTL, tr: dTR, br: dBR, bl: dBL };
    CORNER_KEYS.forEach((key) => {
      const btn = debugHandleRefs.current[key];
      if (!btn) return;
      const pt = mappedCorners[key];
      btn.style.left = `${pt.x.toFixed(1)}px`;
      btn.style.top = `${pt.y.toFixed(1)}px`;
    });
  }, [drawFrameToCanvas, reducedMotion, useVideoFallback]);

  // Preload all TOTAL_FRAMES sequence images; fall back to MP4 if frame-001 cannot load
  useEffect(() => {
    if (reducedMotion || useVideoFallback) return;

    let cancelled = false;
    const cache: Array<HTMLImageElement | null> = new Array(TOTAL_FRAMES).fill(null);
    framesCacheRef.current = cache;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new window.Image();
      img.decoding = 'async';
      img.onload = () => {
        if (cancelled) return;
        if (i === 0) {
          sourceDimsRef.current = { w: img.naturalWidth, h: img.naturalHeight };
          setPosterReady(true);
          drawFrameToCanvas(0);
          applySequenceState(progressRef.current);
          window.dispatchEvent(new CustomEvent('portfolio:media-ready'));
        } else if (i === currentFrameIdxRef.current) {
          drawFrameToCanvas(i);
          applySequenceState(progressRef.current);
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        if (i === 0) {
          setUseVideoFallback(true);
          window.dispatchEvent(new CustomEvent('portfolio:media-ready'));
        }
      };
      img.src = getLaptopFrameSrc(i + 1);
      cache[i] = img;
    }

    const handleResize = () => {
      drawFrameToCanvas(currentFrameIdxRef.current);
      applySequenceState(progressRef.current);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    window.visualViewport?.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion, useVideoFallback, drawFrameToCanvas, applySequenceState]);

  // Re-apply layout when debug sliders or dragged corners change
  useLayoutEffect(() => {
    fitScaleRef.current = fitScale;
    fitOffsetYRef.current = fitOffsetY;
    if (!useVideoFallback) {
      drawFrameToCanvas(currentFrameIdxRef.current);
    }
    applySequenceState(progressRef.current);
  }, [
    applySequenceState,
    drawFrameToCanvas,
    useVideoFallback,
    corners,
    overscan,
    openAt,
    maxZoomFactor,
    fitScale,
    fitOffsetY,
    debugMode,
  ]);

  // GSAP ScrollTrigger cinematic timeline (pinned 450vh desktop, 320vh mobile, scrub: 1)
  useEffect(() => {
    const pinStage = pinStageRef.current;
    const contactWrap = contactWrapRef.current;

    if (!pinStage || !contactWrap) return;

    if (reducedMotion) {
      applySequenceState(1);
      gsap.set(contactWrap, { opacity: 1, y: 0 });
      return;
    }

    const mm = gsap.matchMedia(pinStage);

    const buildTimeline = (isMobile: boolean) => {
      const pinDistance = isMobile ? '+=320%' : '+=450%';

      if (!useVideoFallback) {
        drawFrameToCanvas(0);
      }
      applySequenceState(0);

      const scrubProxy = { p: 0 };
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pinStage,
          start: 'top top',
          end: pinDistance,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            if (!useVideoFallback) {
              drawFrameToCanvas(currentFrameIdxRef.current);
            }
            applySequenceState(progressRef.current);
          },
        },
        onUpdate: () => {
          applySequenceState(scrubProxy.p);
        },
      });

      tl.to(scrubProxy, { p: 1, duration: 1, ease: 'none' }, 0);

      // Final glass contact panel fades up directly beneath as it enters the viewport
      gsap.fromTo(
        contactWrap,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contactWrap,
            start: 'top 92%',
            end: 'top 62%',
            scrub: 1,
            invalidateOnRefresh: true,
          },
        }
      );
    };

    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      buildTimeline(false);
    });

    mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
      buildTimeline(true);
    });

    return () => {
      mm.revert();
    };
  }, [reducedMotion, useVideoFallback, drawFrameToCanvas, applySequenceState]);

  // ?debug=1 gutter & horizontal overflow audit for the "This one's yours." section
  useEffect(() => {
    if (!debugMode) return;

    const auditGutters = () => {
      const section = sectionRef.current;
      const pinStage = pinStageRef.current;
      if (!section) return;
      const vw = document.documentElement.clientWidth || window.innerWidth;

      const checkFullBleed = (el: HTMLElement | null, label: string) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width > vw + 0.5 || r.left < -0.5 || r.right > vw + 0.5) {
          console.warn(`[FinalCtaSection ?debug=1 overflow] ${label}`, {
            rect: r,
            viewportWidth: vw,
          });
        }
        if (Math.abs(r.left) > 0.5 || Math.abs(r.right - vw) > 0.5) {
          console.warn(`[FinalCtaSection ?debug=1 side-gutter] ${label}`, {
            left: r.left,
            right: r.right,
            viewportWidth: vw,
          });
        }
      };

      checkFullBleed(section, 'section');
      checkFullBleed(pinStage, 'pinStage');
      if (pinStage?.parentElement?.classList.contains('pin-spacer')) {
        checkFullBleed(pinStage.parentElement, 'pin-spacer');
      }
      section.querySelectorAll<HTMLElement>('[data-fullbleed="true"]').forEach((el, idx) => {
        checkFullBleed(el, `fullbleed[${idx}]`);
      });

      section.querySelectorAll<HTMLElement>('*').forEach((el) => {
        if (el.closest('[data-zoom-scaled="true"]')) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (r.width > vw + 0.5 || r.left < -0.5 || r.right > vw + 0.5) {
          console.warn('[FinalCtaSection ?debug=1 child-overflow]', el.tagName, el.className, {
            left: r.left,
            right: r.right,
            width: r.width,
            viewportWidth: vw,
          });
        }
      });
    };

    const timer = window.setTimeout(auditGutters, 250);
    window.addEventListener('resize', auditGutters, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', auditGutters);
    };
  }, [debugMode]);

  // Debug handle pointer drag (maps pointer back through current zoom & contain-fit -> normalized 0..1 frame coords)
  const updateCornerFromPointer = useCallback((cornerKey: CornerKey, clientX: number, clientY: number) => {
    const pinStage = pinStageRef.current;
    if (!pinStage) return;

    const rect = pinStage.getBoundingClientRect();
    const fitTarget = reducedMotion ? mediaWrapRef.current?.getBoundingClientRect() || rect : rect;
    const { drawW, drawH, offsetX, offsetY } = computeContainFit(
      fitTarget.width || rect.width,
      fitTarget.height || rect.height,
      sourceDimsRef.current.w || 640,
      sourceDimsRef.current.h || 360,
      fitScaleRef.current,
      fitOffsetYRef.current
    );

    const localX = clientX - fitTarget.left;
    const localY = clientY - fitTarget.top;

    // Invert active zoom scale around zoomOriginRef
    const s = currentScaleRef.current || 1;
    const ox = zoomOriginRef.current.x;
    const oy = zoomOriginRef.current.y;
    const unzoomedX = ox + (localX - ox) / s;
    const unzoomedY = oy + (localY - oy) / s;

    const normX = clamp((unzoomedX - offsetX) / drawW, 0, 1);
    const normY = clamp((unzoomedY - offsetY) / drawH, 0, 1);

    // Invert overscan around current quad centroid so the handle stays locked to pointer
    setCorners((prev) => {
      const cxN = (prev.tl.x + prev.tr.x + prev.br.x + prev.bl.x) * 0.25;
      const cyN = (prev.tl.y + prev.tr.y + prev.br.y + prev.bl.y) * 0.25;
      const osScale = 1 + overscanRef.current * 2;
      const baseX = clamp(cxN + (normX - cxN) / Math.max(0.1, osScale), 0, 1);
      const baseY = clamp(cyN + (normY - cyN) / Math.max(0.1, osScale), 0, 1);
      return {
        ...prev,
        [cornerKey]: {
          x: Number(baseX.toFixed(4)),
          y: Number(baseY.toFixed(4)),
        },
      };
    });
  }, [reducedMotion]);

  const handleCornerPointerDown =
    (cornerKey: CornerKey) => (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      draggingCornerRef.current = cornerKey;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateCornerFromPointer(cornerKey, e.clientX, e.clientY);
    };

  const handleCornerPointerMove =
    (cornerKey: CornerKey) => (e: React.PointerEvent<HTMLButtonElement>) => {
      if (draggingCornerRef.current !== cornerKey) return;
      e.preventDefault();
      updateCornerFromPointer(cornerKey, e.clientX, e.clientY);
    };

  const handleCornerPointerUp =
    (cornerKey: CornerKey) => (e: React.PointerEvent<HTMLButtonElement>) => {
      if (draggingCornerRef.current !== cornerKey) return;
      draggingCornerRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    };

  const effectiveCorners = applyQuadOverscan(corners, overscan);
  const roundedEffectiveCorners: ScreenQuad = {
    tl: { x: Number(effectiveCorners.tl.x.toFixed(4)), y: Number(effectiveCorners.tl.y.toFixed(4)) },
    tr: { x: Number(effectiveCorners.tr.x.toFixed(4)), y: Number(effectiveCorners.tr.y.toFixed(4)) },
    br: { x: Number(effectiveCorners.br.x.toFixed(4)), y: Number(effectiveCorners.br.y.toFixed(4)) },
    bl: { x: Number(effectiveCorners.bl.x.toFixed(4)), y: Number(effectiveCorners.bl.y.toFixed(4)) },
  };

  const handleCopyDebugValues = async () => {
    const payload = JSON.stringify(
      {
        SCREEN_CORNERS: roundedEffectiveCorners,
        BASE_CORNERS: corners,
        OVERSCAN: Number(overscan.toFixed(4)),
        OPEN_AT: Number(openAt.toFixed(2)),
        MAX_ZOOM_FACTOR: Number(maxZoomFactor.toFixed(2)),
        FIT_SCALE: Number(fitScale.toFixed(3)),
        FIT_OFFSET_Y: Number(fitOffsetY.toFixed(4)),
      },
      null,
      2
    );
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const focusForm = () => {
    nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => nameInputRef.current?.focus(), 350);
  };

  const buildDirectMailto = () => {
    const subject = encodeURIComponent(
      form.name.trim()
        ? `Portfolio inquiry from ${form.name.trim()} (${form.projectType})`
        : `Portfolio inquiry (${form.projectType})`
    );
    const body = encodeURIComponent(
      [
        `Hi Muhammad Talha,`,
        ``,
        `Name: ${form.name.trim() || 'N/A'}`,
        `Email: ${form.email.trim() || 'N/A'}`,
        `Project Type: ${form.projectType}`,
        `Estimated Budget: ${form.budget}`,
        ``,
        `Message:`,
        form.message.trim() || '(Write your message here)',
      ].join('\n')
    );
    return `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;
  };

  const buildDirectWhatsApp = () => {
    const text = encodeURIComponent(
      form.message.trim()
        ? `Assalamu Alaikum Talha, I'm ${form.name.trim() || 'a visitor'} (${form.projectType}, ${form.budget}). ${form.message.trim()}`
        : `Assalamu Alaikum Talha, I would like to discuss a ${form.projectType} project.`
    );
    return `https://wa.me/${PROFILE.whatsappNumber}?text=${text}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowDirectFallback(false);

    // Honeypot anti-spam check: silently ignore automated bot submissions
    if ((form.website || '').trim().length > 0) {
      setForm(INITIAL_FORM);
      setSubmitted(true);
      return;
    }

    const cleanName = form.name.trim();
    const cleanEmail = form.email.trim();
    const cleanMessage = form.message.trim();

    if (cleanName.length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanMessage.length < 10) {
      setError('Please write a message of at least 10 characters so I can reply accurately.');
      return;
    }

    if (!FORMSPREE_URL) {
      const configError = 'Formspree endpoint URL is empty.';
      console.error('Contact form submission failed:', configError);
      setShowDirectFallback(true);
      setError(
        'The contact form endpoint is empty. Please click "Email me directly" or WhatsApp below so your message still reaches me right away.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          _replyto: cleanEmail,
          _subject: `New message from ${cleanName} via portfolio`,
          projectType: form.projectType,
          budget: form.budget,
          message: cleanMessage,
          _gotcha: form.website || '',
        }),
      });

      let body: FormspreeResponse | null = null;
      try {
        body = (await response.json()) as FormspreeResponse;
      } catch {
        body = null;
      }

      if (!response.ok) {
        const realError =
          body?.errors
            ?.map((item) => item.message)
            .filter(Boolean)
            .join(', ') ||
          body?.error ||
          `HTTP ${response.status} ${response.statusText}`.trim();

        console.error('Formspree contact form submission failed:', {
          status: response.status,
          endpoint: FORMSPREE_URL,
          message: realError,
          responseBody: body,
        });

        setShowDirectFallback(true);
        setError(
          `Could not send your message (${realError}). Please use "Email me directly" or WhatsApp below so your message is not lost.`
        );
        return;
      }

      setForm(INITIAL_FORM);
      setSubmitted(true);
    } catch (err) {
      const realError = err instanceof Error ? err.message : String(err);
      console.error('Formspree contact form request error:', realError, err);
      setShowDirectFallback(true);
      setError(
        `Unable to submit right now (${realError}). Use "Email me directly" or WhatsApp below so your message still reaches me immediately.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} className="relative z-10 w-full bg-[#07050d]">
      {/* Pinned Full-Viewport Footage Sequence (450vh desktop, 320vh mobile, no pin on reduced motion) */}
      <div
        ref={pinStageRef}
        data-fullbleed="true"
        className={`relative w-full overflow-hidden bg-[#07050d] ${
          reducedMotion ? 'pt-16 pb-10' : 'h-pin-stage'
        }`}
      >
        {/* 90-100%: "Your story deserves a website this good." fades & slides up directly on #07050d */}
        <div
          ref={storyIntroRef}
          data-fullbleed="true"
          className={`pointer-events-none flex flex-col items-center justify-center px-5 text-center will-change-transform ${
            reducedMotion ? 'relative z-10 w-full' : 'absolute inset-0 z-10'
          }`}
          style={{
            opacity: reducedMotion ? 1 : 0,
            transform: reducedMotion ? 'none' : 'translate3d(0, 40px, 0)',
          }}
        >
          <p className="font-mono-label text-[11px] text-[#A78BFA]">NEXT CHAPTER</p>
          <h2
            className="font-display mt-4 max-w-[min(100%,22ch)] text-balance font-extrabold leading-[1.03] tracking-tight text-white"
            style={{ fontSize: 'clamp(1.75rem, min(5.2vw, 8svh), 4.5rem)' }}
          >
            Your story deserves a website <span className="text-[#A78BFA]">this good.</span>
          </h2>
        </div>

        {/* Zoomable Stage: Footage Canvas/Video + Glossy Black #020103 Screen Mask scaled together */}
        {!reducedMotion && (
          <div
            ref={zoomGroupRef}
            data-fullbleed="true"
            data-zoom-scaled="true"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full will-change-transform"
          >
            {/* Footage Canvas / Fallback Video Layer (contain-fit + soft edge masks + violet ambient glow behind frame) */}
            <div ref={mediaWrapRef} className="relative z-0 h-full w-full">
              {/* Soft violet radial glow behind the contained frame so edges melt seamlessly into #07050d */}
              <div
                ref={frameGlowRef}
                aria-hidden="true"
                className="pointer-events-none absolute z-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.14) 44%, transparent 72%)',
                  filter: 'blur(56px)',
                }}
              />

              {useVideoFallback ? (
                <video
                  ref={videoRef}
                  src={PROFILE.assets.laptopVideo}
                  poster={POSTER_FRAME_SRC}
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoWidth > 0) {
                      sourceDimsRef.current = { w: v.videoWidth, h: v.videoHeight };
                    }
                    applySequenceState(progressRef.current);
                    ScrollTrigger.refresh();
                  }}
                  style={FRAME_EDGE_MASK_STYLE}
                  className="pointer-events-none absolute z-10 object-contain"
                />
              ) : (
                <>
                  {/* Instant frame-001 poster shown while sequence frames finish preloading */}
                  {!posterReady && (
                    <img
                      ref={posterImgRef}
                      src={POSTER_FRAME_SRC}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      style={FRAME_EDGE_MASK_STYLE}
                      className="pointer-events-none absolute z-10 object-contain"
                    />
                  )}
                  <canvas
                    ref={canvasRef}
                    aria-label="Scroll-driven sequence of Muhammad Talha opening his laptop toward the camera"
                    style={FRAME_EDGE_MASK_STYLE}
                    className="pointer-events-none absolute z-10 block"
                  />
                </>
              )}
            </div>

            {/* Glossy Black (#020103) 4-Corner Screen Mask mapped through contain-fit homography (ABOVE canvas/poster, BELOW headline) */}
            <div
              ref={screenMaskRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-20 overflow-hidden"
              style={{
                opacity: 0,
                borderRadius: '10px',
                backgroundColor: '#020103',
                boxShadow:
                  'inset 0 0 28px rgba(139, 92, 246, 0.24), inset 0 0 0 1px rgba(139, 92, 246, 0.2)',
              }}
            >
              {/* Faint diagonal glass glare (white max 5% opacity) */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(122deg, transparent 22%, rgba(255, 255, 255, 0.048) 47%, rgba(167, 139, 250, 0.045) 52%, transparent 74%)',
                }}
              />
            </div>
          </div>
        )}

        {/* Crisp Un-scaled "This one's yours." Text Overlay on HIGHEST z-index above canvas & mask */}
        {!reducedMotion && (
          <div
            ref={headlineStageRef}
            className="pointer-events-none absolute z-40 flex items-center justify-center text-center"
            style={{ opacity: 0 }}
          >
            <h2
              ref={headlineTextRef}
              className="font-display font-extrabold leading-[1.06] tracking-tight text-white"
              style={{
                textRendering: 'geometricPrecision',
                WebkitFontSmoothing: 'antialiased',
                textShadow:
                  '0 0 28px rgba(139, 92, 246, 0.48), 0 0 10px rgba(167, 139, 250, 0.35)',
              }}
            >
              <span className="inline-block whitespace-nowrap">This one&apos;s</span>
              <br />
              <span className="inline-block whitespace-nowrap text-[#A78BFA]">yours.</span>
            </h2>
          </div>
        )}

        {/* ?debug=1 Interactive Mask Corner Handles & Polyline Overlay */}
        {debugMode && !reducedMotion && (
          <div className="pointer-events-none absolute inset-0 z-50">
            <svg className="h-full w-full overflow-visible">
              <polygon
                ref={debugPolyRef}
                fill="rgba(139, 92, 246, 0.1)"
                stroke="#A78BFA"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
            </svg>

            {CORNER_KEYS.map((key) => (
              <button
                key={key}
                ref={(el) => {
                  debugHandleRefs.current[key] = el;
                }}
                type="button"
                aria-label={`Drag ${key.toUpperCase()} screen mask corner`}
                onPointerDown={handleCornerPointerDown(key)}
                onPointerMove={handleCornerPointerMove(key)}
                onPointerUp={handleCornerPointerUp(key)}
                onPointerCancel={handleCornerPointerUp(key)}
                className="pointer-events-auto absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-none cursor-grab items-center justify-center rounded-full border-2 border-white bg-[#8B5CF6]/90 font-mono text-[10px] font-bold text-white uppercase shadow-[0_0_16px_rgba(139,92,246,0.95)] ring-4 ring-violet-400/25 active:scale-110 active:cursor-grabbing"
              >
                {key}
              </button>
            ))}
          </div>
        )}

        {/* ?debug=1 Tuning Panel for Final CTA Screen Mask */}
        {debugMode && !reducedMotion && (
          <div className="fixed bottom-4 left-4 z-50 w-72 max-w-[calc(100%-2rem)] rounded-2xl border border-violet-400/30 bg-[#0d0a17]/95 p-4 text-xs text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDebugOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-violet-300 uppercase"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Screen Mask</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCorners(SCREEN_CORNERS);
                    setOverscan(DEFAULT_OVERSCAN);
                    setOpenAt(DEFAULT_OPEN_AT);
                    setMaxZoomFactor(DEFAULT_MAX_ZOOM_FACTOR);
                    setFitScale(FIT_SCALE);
                    setFitOffsetY(FIT_OFFSET_Y);
                  }}
                  title="Reset defaults"
                  className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/80 hover:border-violet-400/60 hover:bg-violet-500/20"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyDebugValues}
                  className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/90 hover:border-violet-400/60 hover:bg-violet-500/20"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy values</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {debugOpen && (
              <div className="mt-3 space-y-2.5">
                <label className="block">
                  <div className="mb-1 flex justify-between text-[11px] text-white/75">
                    <span>FIT_SCALE</span>
                    <span className="font-mono text-violet-300">{fitScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={1.35}
                    step={0.01}
                    value={fitScale}
                    onChange={(e) => setFitScale(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex justify-between text-[11px] text-white/75">
                    <span>FIT_OFFSET_Y</span>
                    <span className="font-mono text-violet-300">
                      {fitOffsetY >= 0 ? `+${(fitOffsetY * 100).toFixed(1)}%` : `${(fitOffsetY * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-0.15}
                    max={0.15}
                    step={0.005}
                    value={fitOffsetY}
                    onChange={(e) => setFitOffsetY(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex justify-between text-[11px] text-white/75">
                    <span>overscan</span>
                    <span className="font-mono text-violet-300">
                      {(overscan * 100).toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-0.02}
                    max={0.05}
                    step={0.002}
                    value={overscan}
                    onChange={(e) => setOverscan(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex justify-between text-[11px] text-white/75">
                    <span>OPEN_AT</span>
                    <span className="font-mono text-violet-300">{openAt.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={0.7}
                    step={0.01}
                    value={openAt}
                    onChange={(e) => setOpenAt(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex justify-between text-[11px] text-white/75">
                    <span>maxZoom</span>
                    <span className="font-mono text-violet-300">{maxZoomFactor.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.9}
                    max={1.5}
                    step={0.02}
                    value={maxZoomFactor}
                    onChange={(e) => setMaxZoomFactor(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </label>

                <div className="rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[10px] leading-relaxed text-white/70">
                  {CORNER_KEYS.map((k) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-violet-300 uppercase">{k}</span>
                      <span>
                        ({roundedEffectiveCorners[k].x.toFixed(4)},{' '}
                        {roundedEffectiveCorners[k].y.toFixed(4)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unified Final Glass Contact Panel (2 columns >=1024px, 1 column below; touch-safe >=16px inputs) */}
      <div
        id="contact"
        ref={contactWrapRef}
        className="site-container relative z-20 pb-[var(--section-py)] pt-4 will-change-transform will-change-opacity"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Left Column >=1024px: Action Strip + 3 Social Cards */}
          <div className="space-y-5 lg:col-span-5">
            {/* Action Strip */}
            <div className="rounded-[22px] border border-white/10 bg-[#0a0712]/90 p-[clamp(1.25rem,3vw,2rem)] shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
              <div>
                <p className="font-mono-label text-[10px] text-[#A78BFA]">DIRECT ACCESS</p>
                <p className="mt-2 text-lg font-semibold text-white sm:text-xl">
                  Let&apos;s build your brand&apos;s website.
                </p>
                <p className="mt-1.5 text-sm text-white/60">
                  Based in {PROFILE.location} — collaborating with clients worldwide.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={focusForm}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_26px_rgba(139,92,246,0.45)] transition-colors hover:bg-[#A78BFA] active:scale-[0.99] sm:flex-initial"
                >
                  <span>Get a Quote</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <a
                  href={PROFILE.socials.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-violet-400/50 hover:bg-white/[0.08] active:scale-[0.99] sm:flex-initial"
                >
                  <MessageCircle className="h-4 w-4 text-[#A78BFA]" />
                  <span>WhatsApp Me</span>
                </a>
              </div>
            </div>

            {/* 3 Glass Social Cards */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:grid-cols-1">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  className="hover-card-lift group flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 backdrop-blur-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-[0.99]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-[#0c0816] text-[#A78BFA] transition-colors group-hover:border-violet-400/55 group-hover:text-white">
                      <SocialBrandIcon id={item.id} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">{item.ctaLabel}</p>
                      <p className="truncate font-mono text-[10px] text-white/50">{item.handle}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#A78BFA]" />
                </a>
              ))}
            </div>
          </div>

          {/* Right Column >=1024px: Glass Contact Form */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-[clamp(1.25rem,3vw,2.25rem)] backdrop-blur-xl lg:col-span-7">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.08] pb-4">
              <div>
                <p className="font-mono-label text-[10px] text-[#A78BFA]">START A PROJECT</p>
                <h3 className="mt-1.5 text-xl font-bold text-white">Send a quick brief</h3>
              </div>
              <a
                href={`mailto:${PROFILE.email}`}
                className="wrap-anywhere font-mono text-xs text-white/55 transition-colors hover:text-[#A78BFA]"
              >
                {PROFILE.email}
              </a>
            </div>

            {submitted ? (
              <div
                role="status"
                className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-6 py-10 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <h4 className="mt-4 text-xl font-bold text-emerald-200">Message sent!</h4>
                <p className="mt-2 max-w-md text-sm font-medium text-emerald-300">
                  Thanks! Your message was sent. I will reply soon.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setError(null);
                    setShowDirectFallback(false);
                    setForm(INITIAL_FORM);
                  }}
                  className="mt-6 min-h-[44px] rounded-full border border-emerald-400/35 bg-emerald-500/15 px-5 py-2 text-xs font-medium text-emerald-100 transition-colors hover:border-emerald-300/60 hover:bg-emerald-500/25"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="relative space-y-5">
                {/* Honeypot anti-spam trap (hidden from humans & screen readers) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
                >
                  <label htmlFor="contact-website">Leave this field blank</label>
                  <input
                    id="contact-website"
                    name="_gotcha"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website || ''}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-medium text-white/75">
                      Your Name
                    </label>
                    <input
                      ref={nameInputRef}
                      id="contact-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ahmed Khan"
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-2.5 text-base text-white placeholder:text-white/30 focus:border-violet-400 focus:outline-none sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-medium text-white/75">
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="ahmed@company.com"
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-2.5 text-base text-white placeholder:text-white/30 focus:border-violet-400 focus:outline-none sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-type" className="block text-xs font-medium text-white/75">
                      Project Type
                    </label>
                    <select
                      id="contact-type"
                      value={form.projectType}
                      onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-2.5 text-base text-white focus:border-violet-400 focus:outline-none sm:text-sm"
                    >
                      <option value="Web Development">Web Development</option>
                      <option value="Video Editing">Video Editing</option>
                      <option value="Graphic / UI Design">Graphic / UI Design</option>
                      <option value="Full Brand + Website">Full Brand + Website</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-budget" className="block text-xs font-medium text-white/75">
                      Estimated Budget
                    </label>
                    <select
                      id="contact-budget"
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-2.5 text-base text-white focus:border-violet-400 focus:outline-none sm:text-sm"
                    >
                      <option value="Under $500">Under $500</option>
                      <option value="$500 – $1,500">$500 – $1,500</option>
                      <option value="$1,500 – $3,500">$1,500 – $3,500</option>
                      <option value="$3,500+">$3,500+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-medium text-white/75">
                    Project Details
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell me about your timeline, goals, and what you want to launch..."
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-violet-400 focus:outline-none sm:text-sm"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-4 text-xs text-rose-200"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                      <p className="wrap-anywhere leading-relaxed font-medium">{error}</p>
                    </div>

                    {showDirectFallback && (
                      <div className="mt-3.5 flex flex-wrap items-center gap-2.5 pl-6">
                        <a
                          href={buildDirectMailto()}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-colors hover:bg-[#A78BFA]"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email me directly</span>
                        </a>

                        <a
                          href={buildDirectWhatsApp()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white transition-colors hover:border-violet-400/60 hover:bg-white/[0.12]"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#A78BFA]" />
                          <span>WhatsApp ({PROFILE.whatsappDisplay})</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#8B5CF6] px-7 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all hover:bg-[#A78BFA] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Project Brief</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
