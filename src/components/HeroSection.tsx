import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight, Check, Copy, SlidersHorizontal } from 'lucide-react';
import { SOCIAL_LINKS } from '../data/social';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { SocialBrandIcon } from './SocialIcons';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  onNavigate: (sectionId: string) => void;
}

const DEFAULT_OPEN_RATIO = 0.72;
const DEFAULT_MIN_HORIZON = 0.45;
const DEFAULT_MAX_HORIZON = 0.68;

interface HeroTuning {
  openRatio: number; // OPEN_RATIO (default 0.72)
  minHorizon: number; // minimum horizon fraction of H (default 0.45)
  maxHorizon: number; // maximum horizon fraction of H (default 0.68)
  viewElevation: number; // closed camera elevation in deg (default 7)
  glowIntensity: number; // multiplier (default 1.0)
  maxZoom: number; // multiplier (default 1.0)
}

const DEFAULT_TUNING: HeroTuning = {
  openRatio: DEFAULT_OPEN_RATIO,
  minHorizon: DEFAULT_MIN_HORIZON,
  maxHorizon: DEFAULT_MAX_HORIZON,
  viewElevation: 7,
  glowIntensity: 1.0,
  maxZoom: 1.0,
};

interface HeroLayoutState {
  H: number;
  vw: number;
  navH: number;
  horizonY: number;
  laptopW: number;
  openRatio: number;
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

function getWidthByViewport(vw: number): number {
  if (vw >= 1100) return vw * 0.22;
  if (vw >= 640) return vw * 0.46;
  return vw * 0.78;
}

function getRealNavHeightPx(): number {
  if (typeof document === 'undefined') return 64;
  const header = document.querySelector<HTMLElement>('header.site-header');
  if (header) {
    const h = header.getBoundingClientRect().height;
    if (h > 0) return Math.round(h);
  }
  return 64;
}

function computeHeroLayoutMetrics(
  vw: number,
  H: number,
  navH: number,
  openRatio: number,
  minHorizon: number,
  maxHorizon: number
): { horizonY: number; laptopW: number } {
  const safeVw = Math.max(1, vw);
  const safeH = Math.max(1, H);
  const safeNavH = Math.max(0, navH);
  const ratio = clamp(openRatio, 0.5, 0.95);
  const minFrac = clamp(minHorizon, 0.3, 0.65);
  const maxFrac = clamp(Math.max(minFrac, maxHorizon), 0.45, 0.85);

  const widthByViewport = getWidthByViewport(safeVw);
  let horizonY = minFrac * safeH;
  const wOpenFit = (horizonY - safeNavH - 16) / ratio;

  let W = widthByViewport;
  if (widthByViewport > wOpenFit) {
    horizonY = Math.min(maxFrac * safeH, safeNavH + 16 + ratio * widthByViewport);
    const wOpenFitAfter = (horizonY - safeNavH - 16) / ratio;
    if (widthByViewport > wOpenFitAfter) {
      W = wOpenFitAfter;
    }
  }

  W = clamp(W, 140, 520);
  return { horizonY, laptopW: W };
}

interface KeySpec {
  id: string;
  units: number; // 1 unit = 4 columns on 60-col CSS grid (0.25u = 1 col)
  kind?: 'normal' | 'arrows';
}

// Accurate 6-row laptop keyboard specification (exact 15.0 units = 60 grid columns per row)
const KEYBOARD_ROWS: Array<{ heightFactor: number; keys: KeySpec[] }> = [
  {
    heightFactor: 0.6,
    keys: [
      { id: 'r1-esc', units: 1.5 },
      ...Array.from({ length: 12 }, (_, i) => ({ id: `r1-f${i + 1}`, units: 1 })),
      { id: 'r1-pwr', units: 1.5 },
    ],
  },
  {
    heightFactor: 1,
    keys: [
      ...Array.from({ length: 13 }, (_, i) => ({ id: `r2-k${i}`, units: 1 })),
      { id: 'r2-bksp', units: 2 },
    ],
  },
  {
    heightFactor: 1,
    keys: [
      { id: 'r3-tab', units: 1.5 },
      ...Array.from({ length: 12 }, (_, i) => ({ id: `r3-k${i}`, units: 1 })),
      { id: 'r3-bslash', units: 1.5 },
    ],
  },
  {
    heightFactor: 1,
    keys: [
      { id: 'r4-caps', units: 1.75 },
      ...Array.from({ length: 11 }, (_, i) => ({ id: `r4-k${i}`, units: 1 })),
      { id: 'r4-enter', units: 2.25 },
    ],
  },
  {
    heightFactor: 1,
    keys: [
      { id: 'r5-lshift', units: 2.25 },
      ...Array.from({ length: 10 }, (_, i) => ({ id: `r5-k${i}`, units: 1 })),
      { id: 'r5-rshift', units: 2.75 },
    ],
  },
  {
    heightFactor: 1,
    keys: [
      { id: 'r6-lctrl', units: 1.25 },
      { id: 'r6-win', units: 1.25 },
      { id: 'r6-lalt', units: 1.25 },
      { id: 'r6-space', units: 5.75 },
      { id: 'r6-ralt', units: 1.25 },
      { id: 'r6-rctrl', units: 1.25 },
      { id: 'r6-arrows', units: 3, kind: 'arrows' },
    ],
  },
];

function LaptopDeckSurface() {
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between px-[3.8%] pt-[6%] pb-[3.2%]"
      style={{
        borderRadius: 'calc(var(--lw) * 0.012)',
        border: '1px solid rgba(167, 139, 250, 0.2)',
        background: 'linear-gradient(180deg, #161321 0%, #0f0c17 52%, #08070d 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Upper Keyboard Zone with Left/Right Speaker Grilles */}
      <div className="flex w-full items-stretch gap-[2.2%]">
        {/* Left Speaker Grille Dots */}
        <div
          aria-hidden="true"
          className="w-[5%] shrink-0 rounded-[3px] opacity-65"
          style={{
            backgroundImage: 'radial-gradient(rgba(196,181,253,0.34) 0.85px, transparent 1px)',
            backgroundSize: '3.5px 3.5px',
          }}
        />

        {/* Recessed Darker Keyboard Well */}
        <div
          className="flex flex-1 flex-col gap-[2px] rounded-[5px] border border-white/[0.06] bg-[#06050b] p-[1.8%]"
          style={{
            boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.92), 0 0 14px rgba(139, 92, 246, 0.08)',
          }}
        >
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div
              key={`kb-row-${rowIdx}`}
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: 'repeat(60, minmax(0, 1fr))',
                height: `calc(var(--lw, 320px) * ${0.03 * row.heightFactor})`,
              }}
            >
              {row.keys.map((keySpec) => {
                const colSpan = Math.round(keySpec.units * 4);
                if (keySpec.kind === 'arrows') {
                  return (
                    <div
                      key={keySpec.id}
                      style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
                      className="grid h-full grid-cols-3 gap-[2px]"
                    >
                      <span
                        className="h-full rounded-[2px] border-t border-white/[0.12] bg-[#14111c]"
                        style={{
                          boxShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 4px rgba(139,92,246,0.12)',
                        }}
                      />
                      <div className="grid h-full grid-rows-2 gap-[1px]">
                        <span
                          className="h-full rounded-[1.5px] border-t border-white/[0.12] bg-[#14111c]"
                          style={{ boxShadow: '0 0 3px rgba(139,92,246,0.12)' }}
                        />
                        <span
                          className="h-full rounded-[1.5px] border-t border-white/[0.12] bg-[#14111c]"
                          style={{ boxShadow: '0 0 3px rgba(139,92,246,0.12)' }}
                        />
                      </div>
                      <span
                        className="h-full rounded-[2px] border-t border-white/[0.12] bg-[#14111c]"
                        style={{
                          boxShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 4px rgba(139,92,246,0.12)',
                        }}
                      />
                    </div>
                  );
                }

                return (
                  <span
                    key={keySpec.id}
                    style={{
                      gridColumn: `span ${colSpan} / span ${colSpan}`,
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.85), 0 0 4px rgba(139, 92, 246, 0.13)',
                    }}
                    className="h-full rounded-[2px] border-t border-white/[0.12] bg-[#14111c]"
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Right Speaker Grille Dots */}
        <div
          aria-hidden="true"
          className="w-[5%] shrink-0 rounded-[3px] opacity-65"
          style={{
            backgroundImage: 'radial-gradient(rgba(196,181,253,0.34) 0.85px, transparent 1px)',
            backgroundSize: '3.5px 3.5px',
          }}
        />
      </div>

      {/* Centered Glass Trackpad (~38% deck width) */}
      <div
        className="mx-auto mt-[4.2%] h-[33%] w-[38%] rounded-[6px] border border-violet-300/15 bg-[#120f1c]"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -2px 6px rgba(0, 0, 0, 0.65)',
        }}
      />
    </div>
  );
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const backdropGlowRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const horizonWrapRef = useRef<HTMLDivElement>(null);
  const horizonPulseRef = useRef<HTMLDivElement>(null);
  const horizonGlowRef = useRef<HTMLDivElement>(null);
  const horizonLineRef = useRef<HTMLDivElement>(null);

  const laptopGroupRef = useRef<HTMLDivElement>(null);
  const tablePlaneRef = useRef<HTMLDivElement>(null);
  const baseGroupRef = useRef<HTMLDivElement>(null);
  const deckDetailsRef = useRef<HTMLDivElement>(null);
  const gapGlowRef = useRef<HTMLDivElement>(null);

  const lidRef = useRef<HTMLDivElement>(null);
  const lidOuterRef = useRef<HTMLDivElement>(null);
  const lidFrontEdgeRef = useRef<HTMLDivElement>(null);
  const lidLeftEdgeRef = useRef<HTMLDivElement>(null);
  const lidRightEdgeRef = useRef<HTMLDivElement>(null);
  const lidScreenFaceRef = useRef<HTMLDivElement>(null);
  const lidFrameRef = useRef<HTMLDivElement>(null);
  const screenClipRef = useRef<HTMLDivElement>(null);
  const notchRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const virtualHeroRef = useRef<HTMLDivElement>(null);
  const realHeroRef = useRef<HTMLDivElement>(null);

  const slabShadowRef = useRef<HTMLDivElement>(null);
  const slabReflectRef = useRef<HTMLDivElement>(null);
  const screenGlowReflectRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  const progressRef = useRef(0);
  const prevScrollProgressRef = useRef(0);
  const introLaptopOpacityRef = useRef(0);
  const tuningRef = useRef<HeroTuning>({ ...DEFAULT_TUNING });
  const heroLayoutRef = useRef<HeroLayoutState>({
    H: typeof window !== 'undefined' ? Math.round(window.visualViewport?.height || window.innerHeight || 900) : 900,
    vw: typeof window !== 'undefined' ? document.documentElement.clientWidth || window.innerWidth || 1440 : 1440,
    navH: 64,
    horizonY: 405,
    laptopW: 316.8,
    openRatio: DEFAULT_OPEN_RATIO,
  });

  const reducedMotion = usePrefersReducedMotion();

  const [viewport, setViewport] = useState(() => ({
    w:
      typeof window !== 'undefined'
        ? document.documentElement.clientWidth || window.innerWidth
        : 1440,
    h:
      typeof window !== 'undefined'
        ? Math.round(window.visualViewport?.height || window.innerHeight)
        : 900,
  }));
  const [debugMode, setDebugMode] = useState(false);
  const [debugOpen, setDebugOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tuning, setTuning] = useState<HeroTuning>(DEFAULT_TUNING);

  const aspectRatio = viewport.w / Math.max(1, viewport.h);
  const isPortraitAspect = aspectRatio < 1.3;
  const isCompactWidth = viewport.w <= 1024;
  const isShortViewport = viewport.h < 480;

  useEffect(() => {
    const updateSize = () => {
      const w =
        document.documentElement.clientWidth ||
        window.innerWidth ||
        1440;
      const h = Math.round(window.visualViewport?.height || window.innerHeight || 900);
      document.documentElement.style.setProperty('--vh', `${h}px`);
      setViewport({ w, h });
    };
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    window.addEventListener('orientationchange', updateSize, { passive: true });
    window.visualViewport?.addEventListener('resize', updateSize, { passive: true });
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
      window.visualViewport?.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setDebugMode(params.get('debug') === '1');
    }
  }, []);

  useEffect(() => {
    tuningRef.current = tuning;
  }, [tuning]);

  const measureRealLaptopBounds = useCallback((): { top: number; bottom: number } | null => {
    const stage = stageRef.current;
    const lid = lidRef.current;
    const lidFrame = lidFrameRef.current;
    const lidOuter = lidOuterRef.current;
    const baseGroup = baseGroupRef.current;
    if (!stage || !lid) return null;

    const stageRect = stage.getBoundingClientRect();
    const lidDegVal = parseFloat(laptopGroupRef.current?.style.getPropertyValue('--lid') || '0');
    const candidates: DOMRect[] = [];

    if (lidDegVal > 2) {
      candidates.push(lid.getBoundingClientRect());
      if (lidFrame) candidates.push(lidFrame.getBoundingClientRect());
      if (baseGroup) candidates.push(baseGroup.getBoundingClientRect());
    } else {
      if (lidOuter) candidates.push(lidOuter.getBoundingClientRect());
      if (baseGroup) candidates.push(baseGroup.getBoundingClientRect());
      if (candidates.length === 0) candidates.push(lid.getBoundingClientRect());
    }

    const valid = candidates.filter((r) => r.width > 0 || r.height > 0);
    if (valid.length === 0) return null;

    const minTop = Math.min(...valid.map((r) => r.top)) - stageRect.top;
    const maxBottom = Math.max(...valid.map((r) => r.bottom)) - stageRect.top;
    return { top: Math.round(minTop), bottom: Math.round(maxBottom) };
  }, []);

  const publishHeroMetrics = useCallback(
    (bounds?: { top: number; bottom: number } | null) => {
      const stage = stageRef.current;
      if (!stage) return;
      const layout = heroLayoutRef.current;
      const resolvedBounds = bounds ?? measureRealLaptopBounds();
      const payload = {
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        H: layout.H,
        navH: layout.navH,
        horizonY: Number(layout.horizonY.toFixed(1)),
        laptopW: Number(layout.laptopW.toFixed(1)),
        openRatio: Number(layout.openRatio.toFixed(2)),
        laptopTop: resolvedBounds ? resolvedBounds.top : null,
        laptopBottom: resolvedBounds ? resolvedBounds.bottom : null,
        progress: Number(progressRef.current.toFixed(3)),
      };
      stage.dataset.heroMetrics = JSON.stringify(payload);
      window.dispatchEvent(new CustomEvent('hero:metrics-updated', { detail: payload }));
    },
    [measureRealLaptopBounds]
  );

  const applySequenceState = useCallback(
    (progress: number, introLaptopOpacity: number) => {
      const stage = stageRef.current;
      const laptopGroup = laptopGroupRef.current;
      const tablePlane = tablePlaneRef.current;
      const baseGroup = baseGroupRef.current;
      const deckDetails = deckDetailsRef.current;
      const gapGlow = gapGlowRef.current;

      const lid = lidRef.current;
      const lidOuter = lidOuterRef.current;
      const lidFrontEdge = lidFrontEdgeRef.current;
      const lidLeftEdge = lidLeftEdgeRef.current;
      const lidRightEdge = lidRightEdgeRef.current;
      const lidScreenFace = lidScreenFaceRef.current;
      const lidFrame = lidFrameRef.current;
      const screenClip = screenClipRef.current;
      const notch = notchRef.current;
      const glare = glareRef.current;
      const virtualHero = virtualHeroRef.current;

      const realHero = realHeroRef.current;

      const slabShadow = slabShadowRef.current;
      const slabReflect = slabReflectRef.current;
      const screenGlowReflect = screenGlowReflectRef.current;
      const horizonWrap = horizonWrapRef.current;
      const floor = floorRef.current;

      if (!laptopGroup || !tablePlane || !lid || !lidScreenFace || !screenClip || !virtualHero) {
        return;
      }

      const t = tuningRef.current;
      const layout = heroLayoutRef.current;
      const vw =
        stage?.clientWidth || document.documentElement.clientWidth || window.innerWidth || layout.vw || 1440;
      const liveVh = Math.round(window.visualViewport?.height || window.innerHeight || 900);
      const vh = stage?.clientHeight && stage.clientHeight > 0 ? stage.clientHeight : layout.H || liveVh;
      const portraitAspectNow = vw / Math.max(1, vh) < 1.3;

      const startW = layout.laptopW > 0 ? layout.laptopW : clamp(getWidthByViewport(vw), 140, 520);
      const horizonY = layout.horizonY > 0 ? layout.horizonY : DEFAULT_MIN_HORIZON * vh;

      const p = clamp(progress, 0, 1);

      // Phase progression (preserved timeline):
      // 0-22%: lid lifts from closed flat slab (0deg) around back hinge to open upright (100deg)
      // 22-38%: hold miniature open laptop on floor
      // 38-88%: zoom smoothly into full viewport by growing real --lw / --lh while flattening elevation -> 0
      const openT = smoothstep(0, 0.22, p);
      const zoomT = smoothstep(0.38, 0.88, p);
      const flatT = smoothstep(0.38, 0.82, p);

      const bezelRatio = 0.026;
      const maxZoomMul = clamp(t.maxZoom, 0.75, 1.4);
      const aspectTargetW = portraitAspectNow
        ? vw / (1 - bezelRatio * 2)
        : Math.max(vw, vh / 0.66) / (1 - bezelRatio * 2);
      const finalW = aspectTargetW * maxZoomMul + 4;

      const currentW = lerp(startW, finalW, zoomT);
      const lidH = currentW * 0.66;
      const fullHeightAtEnd = Math.max(lidH, vh + currentW * (bezelRatio * 2) + 4);
      const currentLidH = lerp(lidH, fullHeightAtEnd, zoomT);

      // Camera low elevation above the table:
      // default 7deg when closed -> eases slightly to 10deg as lid opens -> 0deg during zoom
      const elevStart = clamp(t.viewElevation, 2, 16);
      const elevOpen = Math.max(elevStart, Math.min(16, elevStart + 3));
      const currentElev = p <= 0.38 ? lerp(elevStart, elevOpen, openT) : lerp(elevOpen, 0, flatT);

      // Lid angle (--lid):
      // 0deg = closed flat on top of base, outer face up
      // 100deg = open facing viewer
      const lidDeg = p <= 0.38 ? lerp(0, 100, openT) : lerp(100, 90, flatT);

      // Anchored at (left: 50%, top: var(--horizon-y)) with -100% Y so the back hinge rests
      // directly on the horizon line at progress 0, then centers cleanly onto 50vh during zoom.
      const endDeltaY = vh * 0.5 + currentLidH * 0.5 - horizonY;
      const zoomOffsetY = Math.round(lerp(0, endDeltaY, zoomT));

      // Apply real layout dimensions (--lw, --lh, --lid) so text rasterizes sharply at live pixel size
      laptopGroup.style.setProperty('--lw', `${currentW.toFixed(1)}px`);
      laptopGroup.style.setProperty('--lh', `${currentLidH.toFixed(1)}px`);
      laptopGroup.style.setProperty('--lid', `${lidDeg.toFixed(2)}deg`);
      laptopGroup.style.opacity = String(clamp(introLaptopOpacity, 0, 1));
      laptopGroup.style.transform = `translate3d(-50%, calc(-100% + ${zoomOffsetY}px), 0)`;
      laptopGroup.style.willChange = p >= 0.88 ? 'auto' : 'transform, opacity';

      const perspPx = Math.round(lerp(1600, 16000, flatT));
      const tableRotateX = 90 - currentElev;
      const isNativeFlat = p >= 0.85;

      // Lid sits 1.5px above the base top face (z = 0.022*W + 1.5px) to prevent any z-fighting when closed,
      // then eases smoothly to 0 as flatT -> 1 so collapsing to 2D at p >= 0.85 has 0.0px shift.
      const lidLiftZ = (currentW * 0.022 + 1.5) * (1 - flatT);

      if (isNativeFlat) {
        tablePlane.style.top = '0px';
        tablePlane.style.height = '100%';
        tablePlane.style.transformStyle = 'flat';
        tablePlane.style.transform = 'none';

        lid.style.transformStyle = 'flat';
        lid.style.transform = 'none';

        lidScreenFace.style.transform = 'none';
        lidScreenFace.style.backfaceVisibility = 'visible';
      } else {
        tablePlane.style.top = '100%';
        tablePlane.style.height = 'calc(var(--lw) * 0.66)';
        tablePlane.style.transformStyle = 'preserve-3d';
        tablePlane.style.transform = `perspective(${perspPx}px) rotateX(${tableRotateX.toFixed(2)}deg)`;

        lid.style.transformStyle = 'preserve-3d';
        lid.style.transform = `translateZ(${lidLiftZ.toFixed(2)}px) rotateX(${lidDeg.toFixed(2)}deg)`;

        lidScreenFace.style.transform = 'rotateX(180deg)';
        lidScreenFace.style.backfaceVisibility = 'hidden';
      }

      // Outer lid shell & front/side thicknesses fade out cleanly when zoomed or past flat handoff
      if (lidOuter) {
        lidOuter.style.opacity = !isNativeFlat && lidDeg < 60 ? '1' : '0';
        lidOuter.style.visibility = isNativeFlat ? 'hidden' : 'visible';
      }
      const edgeAlpha = isNativeFlat ? 0 : 1 - smoothstep(0.66, 0.84, p);
      if (lidFrontEdge) {
        lidFrontEdge.style.opacity = String(edgeAlpha);
        lidFrontEdge.style.visibility = isNativeFlat ? 'hidden' : 'visible';
      }
      if (lidLeftEdge) {
        lidLeftEdge.style.opacity = String(edgeAlpha);
        lidLeftEdge.style.visibility = isNativeFlat ? 'hidden' : 'visible';
      }
      if (lidRightEdge) {
        lidRightEdge.style.opacity = String(edgeAlpha);
        lidRightEdge.style.visibility = isNativeFlat ? 'hidden' : 'visible';
      }

      // Inner screen face stays strictly hidden while closed (<= 2deg); backface-visibility culls until facing viewer
      const screenOpenVisible = lidDeg > 2;
      lidScreenFace.style.visibility = screenOpenVisible ? 'visible' : 'hidden';

      // Base & keyboard deck:
      // Keyboard/trackpad/speaker details ONLY appear as lid lifts (0 at <= 6deg, 1 at >= 25deg),
      // and whole base fades out smoothly during zoom (38-64%).
      const deckDetailsAlpha = smoothstep(6, 25, lidDeg);
      if (deckDetails) {
        deckDetails.style.opacity = String(deckDetailsAlpha);
      }

      // Faint violet spill light out of the front opening wedge during 0-10% scroll (lid 0.5..32deg)
      if (gapGlow) {
        const spillBell =
          lidDeg > 0.4 && lidDeg < 34
            ? smoothstep(0.4, 8, lidDeg) * (1 - smoothstep(14, 34, lidDeg))
            : 0;
        gapGlow.style.opacity = String((spillBell * 0.92).toFixed(3));
      }

      const baseFadeOut = 1 - smoothstep(0.38, 0.64, p);
      if (baseGroup) {
        baseGroup.style.opacity = String(baseFadeOut);
        baseGroup.style.visibility = baseFadeOut <= 0.005 ? 'hidden' : 'visible';
      }

      // Bezel frame & notch fade near zoom completion
      const frameFadeOut = 1 - smoothstep(0.7, 0.88, p);
      if (lidFrame) {
        lidFrame.style.opacity = String(frameFadeOut);
      }
      if (notch) {
        notch.style.opacity = String(1 - smoothstep(0.38, 0.64, p));
      }

      const cornerPx = lerp(8, 0, smoothstep(0.76, 0.88, p));
      screenClip.style.borderRadius = `${cornerPx.toFixed(1)}px`;

      // Screen hero content stays pure glossy #020103 black until lid approaches upright (~14%),
      // then fades cleanly to opacity 1 by 22% scroll.
      // On portrait tablets & phones (aspectRatio < 1.3), crossfade in the LAST 8% of the zoom (0.80 -> 0.88)
      // from the virtual laptop screen to the identical full-viewport realHero overlay.
      const contentAlpha = !screenOpenVisible ? 0 : smoothstep(0.14, 0.22, p);
      const portraitCrossfade = portraitAspectNow ? smoothstep(0.8, 0.88, p) : 0;

      virtualHero.style.opacity = String(contentAlpha * (1 - portraitCrossfade));
      virtualHero.style.pointerEvents = !portraitAspectNow && p >= 0.85 ? 'auto' : 'none';

      if (realHero) {
        realHero.style.opacity = portraitAspectNow ? String(portraitCrossfade) : '0';
        realHero.style.pointerEvents = portraitAspectNow && p >= 0.84 ? 'auto' : 'none';
      }

      // Faint diagonal glass glare sweep (max 5.5% white, 11%-28%)
      if (glare) {
        const glareProgress = clamp((p - 0.11) / 0.17, 0, 1);
        const glareBell = Math.sin(glareProgress * Math.PI);
        const glareX = Math.round(lerp(-68, 68, glareProgress));
        glare.style.opacity = p >= 0.11 && p <= 0.28 ? String(glareBell) : '0';
        glare.style.transform = `translate3d(${glareX}%, 0, 0) rotate(22deg)`;
      }

      // Contact shadow & thin closed-slab floor reflection aligned directly beneath front base edge
      const depthProjPx = currentW * 0.66 * Math.sin((currentElev * Math.PI) / 180);
      const reflectFade = 1 - smoothstep(0.38, 0.56, p);

      if (slabShadow) {
        slabShadow.style.transform = `translate3d(0, ${Math.round(depthProjPx - 2)}px, 0)`;
        slabShadow.style.opacity = String(0.95 * reflectFade);
      }
      if (slabReflect) {
        slabReflect.style.transform = `translate3d(0, ${Math.round(depthProjPx + 3)}px, 0)`;
        slabReflect.style.opacity = String(0.85 * reflectFade);
      }
      if (screenGlowReflect) {
        const openReflectAlpha = smoothstep(0.14, 0.24, p) * reflectFade;
        screenGlowReflect.style.opacity = String(openReflectAlpha);
      }

      // Horizon line & glossy floor fade out smoothly during zoom
      const horizonFade = 1 - smoothstep(0.38, 0.72, p);
      const horizonSlideY = Math.round(lerp(0, 120, smoothstep(0.38, 0.76, p)));
      if (horizonWrap) {
        horizonWrap.style.opacity = String(horizonFade);
        horizonWrap.style.transform = `translate3d(0, -50%, 0) translate3d(0, ${horizonSlideY}px, 0)`;
      }
      if (floor) {
        floor.style.opacity = String(1 - smoothstep(0.38, 0.68, p));
      }

      publishHeroMetrics();
    },
    [publishHeroMetrics]
  );

  // Hard guard: measures the REAL open laptop's top & bottom edges and shrinks --laptop-w (max 5 iterations)
  // if any part of the open lid overlaps navH + 8 or exceeds the viewport bottom.
  const runOpenLaptopGuard = useCallback(
    (measureInPlace: boolean) => {
      const stage = stageRef.current;
      const section = sectionRef.current;
      const laptopGroup = laptopGroupRef.current;
      if (!stage || !laptopGroup) return;

      const layout = heroLayoutRef.current;
      const { H, navH, openRatio } = layout;
      if (H <= 0) return;

      const minTopAllowed = navH + 8;
      const maxBottomAllowed = H - 4;
      const savedProgress = progressRef.current;
      const savedOpacity = introLaptopOpacityRef.current;

      let resized = false;
      let nextW = layout.laptopW;

      for (let iter = 0; iter < 5; iter++) {
        heroLayoutRef.current.laptopW = nextW;
        stage.style.setProperty('--laptop-w', `${nextW.toFixed(1)}px`);
        section?.style.setProperty('--laptop-w', `${nextW.toFixed(1)}px`);

        if (measureInPlace) {
          applySequenceState(savedProgress, savedOpacity);
        } else {
          // Temporarily pose at open hold (lid = 100deg, zoomT = 0) synchronously before paint
          applySequenceState(0.22, savedOpacity);
        }

        const bounds = measureRealLaptopBounds();
        if (!bounds) break;

        let adjusted = false;
        if (bounds.top < minTopAllowed) {
          const deltaW = (minTopAllowed - bounds.top) / Math.max(0.5, openRatio);
          const candidateW = Math.max(96, nextW - Math.max(2, deltaW));
          if (candidateW < nextW - 0.5) {
            nextW = candidateW;
            adjusted = true;
          }
        } else if (bounds.bottom > maxBottomAllowed) {
          const availBelow = Math.max(24, maxBottomAllowed - layout.horizonY);
          const actualBelow = Math.max(1, bounds.bottom - layout.horizonY);
          const candidateW = Math.max(96, nextW * (availBelow / actualBelow) - 2);
          if (candidateW < nextW - 0.5) {
            nextW = candidateW;
            adjusted = true;
          }
        }

        if (!adjusted) break;
        resized = true;
      }

      heroLayoutRef.current.laptopW = nextW;
      stage.style.setProperty('--laptop-w', `${nextW.toFixed(1)}px`);
      section?.style.setProperty('--laptop-w', `${nextW.toFixed(1)}px`);

      if (!measureInPlace) {
        applySequenceState(savedProgress, savedOpacity);
      } else {
        publishHeroMetrics();
      }

      if (resized) {
        console.warn('hero guard: laptop resized', {
          laptopW: Number(nextW.toFixed(1)),
          horizonY: Number(layout.horizonY.toFixed(1)),
          navH,
          H,
          bounds: measureRealLaptopBounds(),
        });
      }
    },
    [applySequenceState, measureRealLaptopBounds, publishHeroMetrics]
  );

  // Sizes laptop from available height above horizon, writes --horizon-y & --laptop-w (px), then verifies open guard
  const layoutHero = useCallback(() => {
    const stage = stageRef.current;
    const section = sectionRef.current;
    const liveVh = Math.round(window.visualViewport?.height || window.innerHeight || 900);
    document.documentElement.style.setProperty('--vh', `${liveVh}px`);

    const H = stage && stage.clientHeight > 0 ? Math.round(stage.clientHeight) : liveVh;
    const vw =
      (stage && stage.clientWidth > 0 ? stage.clientWidth : 0) ||
      document.documentElement.clientWidth ||
      window.innerWidth ||
      1440;
    const navH = getRealNavHeightPx();
    const t = tuningRef.current;

    const { horizonY, laptopW } = computeHeroLayoutMetrics(
      vw,
      H,
      navH,
      t.openRatio,
      t.minHorizon,
      t.maxHorizon
    );

    heroLayoutRef.current = {
      H,
      vw,
      navH,
      horizonY,
      laptopW,
      openRatio: t.openRatio,
    };

    if (stage) {
      stage.style.setProperty('--horizon-y', `${horizonY.toFixed(1)}px`);
      stage.style.setProperty('--laptop-w', `${laptopW.toFixed(1)}px`);
    }
    if (section) {
      section.style.setProperty('--horizon-y', `${horizonY.toFixed(1)}px`);
      section.style.setProperty('--laptop-w', `${laptopW.toFixed(1)}px`);
    }

    if (scrollHintRef.current) {
      scrollHintRef.current.style.display = H < 420 ? 'none' : 'flex';
    }

    applySequenceState(progressRef.current, introLaptopOpacityRef.current);

    if (progressRef.current <= 0.38) {
      runOpenLaptopGuard(progressRef.current >= 0.2);
    }
  }, [applySequenceState, runOpenLaptopGuard]);

  // Sync layout cleanly on viewport resize or ?debug=1 slider changes
  useLayoutEffect(() => {
    if (reducedMotion) return;
    layoutHero();
  }, [layoutHero, reducedMotion, tuning, viewport]);

  useEffect(() => {
    if (reducedMotion) return;

    const section = sectionRef.current;
    const backdropGlow = backdropGlowRef.current;
    const horizonLine = horizonLineRef.current;
    const horizonGlow = horizonGlowRef.current;
    const horizonPulse = horizonPulseRef.current;
    const floor = floorRef.current;
    const scrollHint = scrollHintRef.current;

    if (!section) return;

    const ctx = gsap.context(() => {
      progressRef.current = 0;
      prevScrollProgressRef.current = 0;
      introLaptopOpacityRef.current = 0;

      if (backdropGlow) gsap.set(backdropGlow, { opacity: 0.22 });
      if (horizonLine) {
        gsap.set(horizonLine, { scaleX: 0, opacity: 0.25, transformOrigin: 'center center' });
      }
      if (horizonGlow) {
        gsap.set(horizonGlow, { scaleX: 0.35, opacity: 0, transformOrigin: 'center center' });
      }
      if (horizonPulse) gsap.set(horizonPulse, { opacity: 0.74 });
      if (floor) gsap.set(floor, { opacity: 0 });
      if (scrollHint) gsap.set(scrollHint, { opacity: 0, y: 8 });

      layoutHero();

      // 0. Intro (~1.6s auto-play on mount)
      const introProxy = { laptopAlpha: 0 };
      let pulseTween: gsap.core.Tween | null = null;

      const introTl = gsap.timeline({
        onComplete: () => {
          introLaptopOpacityRef.current = 1;
          applySequenceState(progressRef.current, 1);
        },
      });

      if (backdropGlow) {
        introTl.to(backdropGlow, { opacity: 1, duration: 1.1, ease: 'power2.out' }, 0);
      }
      if (horizonLine) {
        introTl.to(
          horizonLine,
          { scaleX: 1, opacity: 1, duration: 0.95, ease: 'power3.inOut' },
          0.08
        );
      }
      if (horizonGlow) {
        introTl.to(
          horizonGlow,
          { scaleX: 1, opacity: 1, duration: 1.15, ease: 'power2.out' },
          0.12
        );
      }
      if (floor) {
        introTl.to(floor, { opacity: 1, duration: 1.0, ease: 'power2.out' }, 0.32);
      }

      introTl.to(
        introProxy,
        {
          laptopAlpha: 1,
          duration: 0.9,
          ease: 'power2.out',
          onUpdate: () => {
            introLaptopOpacityRef.current = Math.max(
              introLaptopOpacityRef.current,
              introProxy.laptopAlpha
            );
            applySequenceState(progressRef.current, introLaptopOpacityRef.current);
          },
        },
        0.55
      );

      if (scrollHint) {
        introTl.to(
          scrollHint,
          { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' },
          1.05
        );
      }

      if (horizonPulse) {
        introTl.add(() => {
          pulseTween = gsap.to(horizonPulse, {
            opacity: 1,
            duration: 2.6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }, 1.55);
      }

      // 1-4. Pinned ScrollTrigger sequence (450vh desktop, 320vh mobile, scrub: 1)
      const scrollProxy = { progress: 0 };

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () =>
            (document.documentElement.clientWidth || window.innerWidth) < 768
              ? '+=320%'
              : '+=450%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            layoutHero();
          },
          onUpdate: (self) => {
            if (self.progress > 0.02 && introLaptopOpacityRef.current < 1) {
              introTl.progress(1);
              introLaptopOpacityRef.current = 1;
            }
            if (self.progress > 0.36 && pulseTween) {
              pulseTween.pause();
            } else if (self.progress <= 0.36 && pulseTween && pulseTween.paused()) {
              pulseTween.play();
            }
          },
        },
        onUpdate: () => {
          const prevP = prevScrollProgressRef.current;
          const nextP = scrollProxy.progress;
          progressRef.current = nextP;
          applySequenceState(nextP, introLaptopOpacityRef.current);

          // Check real open lid bounds whenever crossing 100% lid open (~0.22) or scrolling back into hold (<= 0.38)
          const crossedOpenForward = prevP < 0.215 && nextP >= 0.215;
          const scrolledBackToOpen = prevP > 0.36 && nextP <= 0.36 && nextP >= 0.18;
          const nearOpenPeak = nextP >= 0.2 && nextP <= 0.26;
          if (crossedOpenForward || scrolledBackToOpen || nearOpenPeak) {
            runOpenLaptopGuard(true);
          }
          prevScrollProgressRef.current = nextP;
        },
      });

      scrollTl.to(scrollProxy, { progress: 1, duration: 1, ease: 'none' }, 0);

      if (scrollHint) {
        scrollTl.to(scrollHint, { opacity: 0, y: 10, duration: 0.08, ease: 'power2.out' }, 0);
      }
    }, section);

    // Run layoutHero on fonts ready, media ready, and debounced 120ms on resize/orientation/visualViewport
    let resizeDebounceTimer = 0;
    const handleDebouncedResize = () => {
      window.clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = window.setTimeout(() => {
        layoutHero();
        ScrollTrigger.refresh();
      }, 120);
    };

    const handleReadyRelayout = () => {
      layoutHero();
      ScrollTrigger.refresh();
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        handleReadyRelayout();
      });
    }

    window.addEventListener('portfolio:media-ready', handleReadyRelayout);
    window.addEventListener('resize', handleDebouncedResize, { passive: true });
    window.addEventListener('orientationchange', handleDebouncedResize, { passive: true });
    window.visualViewport?.addEventListener('resize', handleDebouncedResize, { passive: true });

    return () => {
      window.clearTimeout(resizeDebounceTimer);
      window.removeEventListener('portfolio:media-ready', handleReadyRelayout);
      window.removeEventListener('resize', handleDebouncedResize);
      window.removeEventListener('orientationchange', handleDebouncedResize);
      window.visualViewport?.removeEventListener('resize', handleDebouncedResize);
      ctx.revert();
    };
  }, [applySequenceState, layoutHero, reducedMotion, runOpenLaptopGuard]);

  // ?debug=1 gutter & horizontal overflow audit for the Hero section
  useEffect(() => {
    if (!debugMode) return;

    const auditGutters = () => {
      const section = sectionRef.current;
      if (!section) return;
      const vw = document.documentElement.clientWidth || window.innerWidth;

      const checkFullBleed = (el: HTMLElement | null, label: string) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width > vw + 0.5 || r.left < -0.5 || r.right > vw + 0.5) {
          console.warn(`[HeroSection ?debug=1 overflow] ${label}`, {
            rect: r,
            viewportWidth: vw,
          });
        }
        if (Math.abs(r.left) > 0.5 || Math.abs(r.right - vw) > 0.5) {
          console.warn(`[HeroSection ?debug=1 side-gutter] ${label}`, {
            left: r.left,
            right: r.right,
            viewportWidth: vw,
          });
        }
      };

      checkFullBleed(section, 'section');
      checkFullBleed(stageRef.current, 'stage');
      if (section.parentElement?.classList.contains('pin-spacer')) {
        checkFullBleed(section.parentElement, 'pin-spacer');
      }
      section.querySelectorAll<HTMLElement>('[data-fullbleed="true"]').forEach((el, idx) => {
        checkFullBleed(el, `fullbleed[${idx}]`);
      });

      section.querySelectorAll<HTMLElement>('*').forEach((el) => {
        if (el.closest('[data-laptop-group="true"]')) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (r.width > vw + 0.5 || r.left < -0.5 || r.right > vw + 0.5) {
          console.warn('[HeroSection ?debug=1 child-overflow]', el.tagName, el.className, {
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

  const handleCopyTuning = async () => {
    const layout = heroLayoutRef.current;
    const payload = JSON.stringify(
      {
        OPEN_RATIO: tuning.openRatio,
        MIN_HORIZON: tuning.minHorizon,
        MAX_HORIZON: tuning.maxHorizon,
        viewElevation: tuning.viewElevation,
        glowIntensity: tuning.glowIntensity,
        maxZoom: tuning.maxZoom,
        computed: {
          H: layout.H,
          navH: layout.navH,
          horizonY: Number(layout.horizonY.toFixed(1)),
          laptopW: Number(layout.laptopW.toFixed(1)),
        },
      },
      null,
      2
    );
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const initialNavH = getRealNavHeightPx();
  const initialMetrics = computeHeroLayoutMetrics(
    viewport.w,
    viewport.h,
    initialNavH,
    tuning.openRatio,
    tuning.minHorizon,
    tuning.maxHorizon
  );

  const realHeroHeadlineFont = isCompactWidth
    ? 'clamp(1.38rem, min(7.2vw, 11svh), 5.2rem)'
    : 'clamp(2.35rem, min(5.8vw, 11.5svh), 5.2rem)';

  const isCompactHeight = viewport.h < 700;

  const renderRealHeroContent = (interactive: boolean) => (
    <div
      className={`mx-auto flex h-full w-full flex-col items-center justify-center text-center ${
        interactive ? 'pointer-events-auto' : ''
      }`}
      style={{
        paddingTop: isShortViewport ? '56px' : isCompactHeight || viewport.w < 768 ? '68px' : '84px',
        paddingBottom: isShortViewport ? '16px' : '40px',
        paddingLeft: viewport.w <= 400 ? '14px' : '24px',
        paddingRight: viewport.w <= 400 ? '14px' : '24px',
      }}
    >
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <p className="font-mono-label text-[10px] font-medium text-[#A78BFA] sm:text-xs">
          WEB DEVELOPER • EDITOR • DESIGNER
        </p>

        <h1
          className={`font-display font-extrabold tracking-tight text-white ${
            isShortViewport ? 'mt-2' : 'mt-3.5 sm:mt-4'
          }`}
          style={{ fontSize: realHeroHeadlineFont, lineHeight: 0.98 }}
        >
          <span className="inline-block whitespace-nowrap">I build websites</span>
          <br />
          <span className="inline-block whitespace-nowrap">
            that build <span className="text-[#A78BFA]">brands.</span>
          </span>
        </h1>

        <p
          className={`mx-auto leading-relaxed text-white/70 ${
            isShortViewport ? 'mt-2.5 text-xs' : 'mt-4 text-sm sm:mt-5 sm:text-base'
          } ${isCompactWidth ? 'max-w-[34ch]' : 'max-w-xl'}`}
        >
          Incredible-looking sites, videos and designs that tell your story, match your brand and
          grow your audience.
        </p>

        <div
          className={`flex flex-wrap items-center justify-center gap-3 ${
            isShortViewport ? 'mt-3.5' : 'mt-6 sm:mt-7 sm:gap-3.5'
          }`}
        >
          <button
            type="button"
            onClick={() => onNavigate('#contact')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.45)] transition-all duration-200 hover:bg-[#A78BFA] hover:shadow-[0_0_36px_rgba(167,139,250,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:px-6"
          >
            <span>Get a Quote</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('#work')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/90 transition-colors duration-200 hover:border-violet-400/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:px-6"
          >
            <span>See the work</span>
            <ArrowDown className="h-4 w-4 text-[#A78BFA]" />
          </button>
        </div>

        <div
          className={`flex items-center justify-center gap-3 ${
            isShortViewport ? 'mt-3' : 'mt-5 sm:mt-6'
          }`}
        >
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              title={item.label}
              className="hover-icon-float flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/75 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <SocialBrandIcon id={item.id} className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  // prefers-reduced-motion: show final full hero directly without laptop or pin
  if (reducedMotion) {
    return (
      <section
        id="hero"
        style={{ height: 'var(--vh, 100svh)' }}
        className="h-pin-stage flex flex-col items-center justify-center bg-[#07050d]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 55% at 50% 48%, rgba(139, 92, 246, 0.2) 0%, rgba(56, 28, 114, 0.08) 46%, #07050d 78%)',
          }}
        />
        {renderRealHeroContent(true)}
      </section>
    );
  }

  return (
    <section
      id="hero"
      ref={sectionRef}
      style={
        {
          height: 'var(--vh, 100svh)',
          '--horizon-y': `${initialMetrics.horizonY.toFixed(1)}px`,
          '--laptop-w': `${initialMetrics.laptopW.toFixed(1)}px`,
          '--view-elevation': `${tuning.viewElevation}deg`,
          '--glow-intensity': tuning.glowIntensity,
          '--max-zoom': tuning.maxZoom,
        } as React.CSSProperties
      }
      className="h-pin-stage bg-[#07050d]"
    >
      {/* Explicit --vh Stage: all stage children use absolute positioning relative ONLY to this stage */}
      <div
        ref={stageRef}
        data-fullbleed="true"
        data-hero-stage="true"
        data-laptop-stage="true"
        className="h-pin-stage"
        style={
          {
            height: 'var(--vh, 100svh)',
            '--horizon-y': `${initialMetrics.horizonY.toFixed(1)}px`,
            '--laptop-w': `${initialMetrics.laptopW.toFixed(1)}px`,
          } as React.CSSProperties
        }
      >
        {/* Deep Violet Radial Backdrop */}
        <div
          ref={backdropGlowRef}
          data-fullbleed="true"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 56% at 50% var(--horizon-y, 45%), rgba(139, 92, 246, 0.22) 0%, rgba(56, 28, 114, 0.09) 45%, #07050d 78%)',
          }}
        />

        {/* Darker Glossy Floor Beneath Horizon */}
        <div
          ref={floorRef}
          data-fullbleed="true"
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 left-0 z-0"
          style={{
            top: 'var(--horizon-y, 45%)',
            background:
              'linear-gradient(180deg, rgba(20, 12, 38, 0.56) 0%, rgba(10, 7, 18, 0.94) 38%, #07050d 100%)',
          }}
        />

        {/* Razor-Thin Glowing Horizon Line */}
        <div
          ref={horizonWrapRef}
          data-horizon="true"
          data-fullbleed="true"
          aria-hidden="true"
          className="pointer-events-none absolute right-0 left-0 z-10"
          style={{
            top: 'var(--horizon-y, 45%)',
            transform: 'translate3d(0, -50%, 0)',
          }}
        >
          <div
            ref={horizonPulseRef}
            style={{ opacity: 0.74 }}
            className="relative flex w-full items-center justify-center"
          >
            {/* Wide soft vertical violet glow above & below horizon */}
            <div
              ref={horizonGlowRef}
              className="pointer-events-none absolute h-36 w-full blur-2xl sm:h-44"
              style={{
                opacity: Math.min(1.5, tuning.glowIntensity),
                background:
                  'radial-gradient(ellipse 75% 50% at 50% 50%, rgba(139, 92, 246, 0.52) 0%, rgba(139, 92, 246, 0.16) 45%, transparent 78%)',
              }}
            />

            {/* Razor-thin lavender-violet core line */}
            <div
              ref={horizonLineRef}
              className="relative h-[1px] w-full"
              style={{
                background:
                  'linear-gradient(90deg, rgba(139,92,246,0.06) 0%, rgba(167,139,250,0.6) 22%, #ede9fe 50%, rgba(167,139,250,0.6) 78%, rgba(139,92,246,0.06) 100%)',
                boxShadow: `0 0 ${Math.round(14 * tuning.glowIntensity)}px rgba(196, 181, 253, 0.72), 0 0 ${Math.round(
                  34 * tuning.glowIntensity
                )}px rgba(139, 92, 246, 0.62)`,
              }}
            />
          </div>
        </div>

        {/* Subtle Vignette */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'radial-gradient(circle at 50% 48%, transparent 52%, rgba(7, 5, 13, 0.5) 84%, rgba(7, 5, 13, 0.88) 100%)',
          }}
        />

        {/* CSS 3D Laptop Group: anchored at left: 50%, top: var(--horizon-y), translate(-50%, -100%) so base rests on horizon */}
        <div
          ref={laptopGroupRef}
          data-laptop-group="true"
          className="pointer-events-none absolute left-1/2 z-20 origin-center"
          style={
            {
              top: 'var(--horizon-y, 45%)',
              '--lw': 'var(--laptop-w, 280px)',
              '--lh': 'calc(var(--lw) * 0.66)',
              '--lid': '0deg',
              width: 'var(--lw)',
              height: 'var(--lh)',
              transform: 'translate3d(-50%, -100%, 0)',
              opacity: 0,
            } as React.CSSProperties
          }
        >
          {/* Thin Contact Shadow Ellipse & Mirrored Closed-Slab Floor Reflection */}
          <div
            ref={slabShadowRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-full -left-[4%] w-[108%] rounded-full"
            style={{
              height: 'calc(var(--lw) * 0.044)',
              background:
                'radial-gradient(ellipse 52% 48% at 50% 50%, rgba(0, 0, 0, 0.96) 0%, rgba(10, 7, 18, 0.72) 48%, transparent 78%)',
              filter: 'blur(2px)',
            }}
          />

          <div
            ref={slabReflectRef}
            aria-hidden="true"
            className="hide-coarse pointer-events-none absolute top-full left-0 w-full"
            style={{
              height: 'calc(var(--lw) * 0.075)',
              maskImage:
                'linear-gradient(to bottom, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.12) 48%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.12) 48%, transparent 100%)',
            }}
          >
            {/* Mirrored slim aluminum front edge & faint violet sheen */}
            <div
              className="mx-auto w-[99%]"
              style={{
                height: 'calc(var(--lw) * 0.022)',
                borderRadius: 'calc(var(--lw) * 0.01)',
                background:
                  'linear-gradient(180deg, rgba(167, 139, 250, 0.18) 0%, rgba(18, 15, 28, 0.65) 35%, rgba(7, 5, 13, 0.2) 100%)',
              }}
            />
            {/* Subtle floor screen glow reflection once open */}
            <div
              ref={screenGlowReflectRef}
              className="mx-auto -mt-[2px] w-[96%]"
              style={{
                opacity: 0,
                height: 'calc(var(--lw) * 0.055)',
                background:
                  'radial-gradient(ellipse 58% 70% at 50% 0%, rgba(139, 92, 246, 0.24) 0%, rgba(139, 92, 246, 0.06) 55%, transparent 100%)',
                filter: 'blur(4px)',
              }}
            />
          </div>

          {/* 3D Table Surface Plane: hinged at back edge (y=0 at top:100%), pitched to viewing elevation */}
          <div
            ref={tablePlaneRef}
            className="absolute top-full left-0 w-full"
            style={{
              height: 'calc(var(--lw) * 0.66)',
              transformOrigin: '50% 0% 0',
              transformStyle: 'preserve-3d',
              transform: 'perspective(1600px) rotateX(83deg)',
            }}
          >
            {/* Base Assembly: width W, depth D=0.66*W, thickness T_base=0.022*W, matte-black aluminum */}
            <div
              ref={baseGroupRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Base Bottom Plate (z = 0) */}
              <div
                className="absolute inset-0 bg-[#050408]"
                style={{ borderRadius: 'calc(var(--lw) * 0.012)' }}
              />

              {/* Base Left Side Aluminum Wall */}
              <div
                className="absolute top-[1.8%] bottom-[1.8%] left-0 bg-gradient-to-r from-[#09070f] to-[#171422]"
                style={{
                  width: 'calc(var(--lw) * 0.022)',
                  transformOrigin: 'left center',
                  transform: 'rotateY(-90deg)',
                }}
              />

              {/* Base Right Side Aluminum Wall */}
              <div
                className="absolute top-[1.8%] right-0 bottom-[1.8%] bg-gradient-to-l from-[#09070f] to-[#171422]"
                style={{
                  width: 'calc(var(--lw) * 0.022)',
                  transformOrigin: 'right center',
                  transform: 'rotateY(90deg)',
                }}
              />

              {/* Base Front Thickness Edge (z = 0..0.022*W) with dark top seam & bottom thumb notch */}
              <div
                className="absolute right-[0.6%] bottom-0 left-[0.6%] flex flex-col justify-between"
                style={{
                  height: 'calc(var(--lw) * 0.022)',
                  borderBottomLeftRadius: 'calc(var(--lw) * 0.008)',
                  borderBottomRightRadius: 'calc(var(--lw) * 0.008)',
                  background:
                    'linear-gradient(180deg, #1b1729 0%, #120f1c 58%, #08070d 100%)',
                  borderLeft: '1px solid rgba(167, 139, 250, 0.14)',
                  borderRight: '1px solid rgba(167, 139, 250, 0.14)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  transformOrigin: '50% 100% 0',
                  transform: 'rotateX(-90deg)',
                }}
              >
                {/* Thin dark seam line between closed lid & base */}
                <div className="h-[1.5px] w-full bg-[#020104]" />
                {/* Lower half of centered thumb opening notch */}
                <div className="mx-auto mb-auto h-[48%] w-[15%] rounded-b-full border-x border-b border-white/[0.06] bg-[#040308]" />
              </div>

              {/* Back Hinge Barrel */}
              <div
                className="absolute top-0 left-[10%] right-[10%] rounded-full border border-white/[0.06] bg-gradient-to-b from-[#1e1a2d] to-[#08070d]"
                style={{
                  height: 'calc(var(--lw) * 0.016)',
                  transform: 'translate3d(0, calc(var(--lw) * -0.004), calc(var(--lw) * 0.015))',
                }}
              />

              {/* Base Top Surface (z = 0.022*W) */}
              <div
                className="absolute inset-0 overflow-hidden bg-[#0b0912]"
                style={{
                  borderRadius: 'calc(var(--lw) * 0.012)',
                  transform: 'translateZ(calc(var(--lw) * 0.022))',
                }}
              >
                {/* Keyboard, Trackpad & Speaker Grilles — fade in only as lid lifts (6deg -> 25deg) */}
                <div
                  ref={deckDetailsRef}
                  className="h-full w-full"
                  style={{ opacity: 0 }}
                >
                  <LaptopDeckSurface />
                </div>

                {/* Faint Violet Light Spilling Out of Front Opening Wedge (0-10% scroll) */}
                <div
                  ref={gapGlowRef}
                  className="pointer-events-none absolute right-[6%] bottom-0 left-[6%] h-[42%]"
                  style={{
                    opacity: 0,
                    background:
                      'radial-gradient(ellipse 75% 90% at 50% 100%, rgba(139, 92, 246, 0.72) 0%, rgba(167, 139, 250, 0.28) 42%, transparent 80%)',
                  }}
                />
              </div>
            </div>

            {/* Hinged Lid Assembly: width W, depth/height D (--lh), thickness 0.014*W, hinged at back top edge */}
            <div
              ref={lidRef}
              className="absolute top-0 left-0 w-full"
              style={{
                height: 'var(--lh)',
                transformOrigin: '50% 0% 0',
                transformStyle: 'preserve-3d',
                transform: 'translateZ(calc(var(--lw) * 0.022 + 1.5px)) rotateX(0deg)',
              }}
            >
              {/* 1. Outer Lid Shell (pointing UP when closed at --lid = 0deg, resting flat on top of base) */}
              <div
                ref={lidOuterRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{
                  borderRadius: 'calc(var(--lw) * 0.012)',
                  border: '1px solid rgba(167, 139, 250, 0.22)',
                  background:
                    'linear-gradient(155deg, #1b1728 0%, #100d18 46%, #07050c 100%)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 rgba(139, 92, 246, 0.14)',
                  transform: 'translateZ(calc(var(--lw) * 0.014))',
                  backfaceVisibility: 'hidden',
                }}
              >
                {/* Subtle Brushed Aluminum Grain */}
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, rgba(255,255,255,0.016) 0px, rgba(255,255,255,0.016) 1px, transparent 1px, transparent 3px)',
                  }}
                />

                {/* Faint Violet Top Edge Highlight */}
                <div className="mx-auto mt-[1px] h-[1px] w-[92%] bg-gradient-to-r from-transparent via-[#A78BFA]/45 to-transparent" />

                {/* Thin Diagonal Glass Glare on Outer Glossy Lid */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(116deg, transparent 22%, rgba(255, 255, 255, 0.048) 47%, rgba(167, 139, 250, 0.05) 52%, transparent 72%)',
                  }}
                />

                {/* Small Centered Logo-less Recessed Dimple */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06] bg-[#09070f]"
                  style={{
                    width: '8.5%',
                    height: '5.5%',
                    boxShadow:
                      'inset 0 1px 2px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(167, 139, 250, 0.14)',
                  }}
                />
              </div>

              {/* 2. Lid Front Thickness Edge (z_lid = 0..0.014*W) */}
              <div
                ref={lidFrontEdgeRef}
                aria-hidden="true"
                className="pointer-events-none absolute right-[0.6%] bottom-0 left-[0.6%]"
                style={{
                  height: 'calc(var(--lw) * 0.014)',
                  borderTopLeftRadius: 'calc(var(--lw) * 0.008)',
                  borderTopRightRadius: 'calc(var(--lw) * 0.008)',
                  background:
                    'linear-gradient(180deg, #27223a 0%, #151220 55%, #09070f 100%)',
                  borderTop: '1px solid rgba(196, 181, 253, 0.22)',
                  borderLeft: '1px solid rgba(167, 139, 250, 0.15)',
                  borderRight: '1px solid rgba(167, 139, 250, 0.15)',
                  transformOrigin: '50% 100% 0',
                  transform: 'rotateX(-90deg)',
                }}
              >
                {/* Upper rim of centered thumb notch */}
                <div className="mx-auto mt-auto h-[38%] w-[15%] rounded-t-full bg-[#050409]" />
              </div>

              {/* 3. Lid Left & Right Side Edges */}
              <div
                ref={lidLeftEdgeRef}
                aria-hidden="true"
                className="pointer-events-none absolute top-[1.8%] bottom-[1.8%] left-0 bg-gradient-to-r from-[#0b0912] to-[#1d192b]"
                style={{
                  width: 'calc(var(--lw) * 0.014)',
                  transformOrigin: 'left center',
                  transform: 'rotateY(-90deg)',
                }}
              />
              <div
                ref={lidRightEdgeRef}
                aria-hidden="true"
                className="pointer-events-none absolute top-[1.8%] right-0 bottom-[1.8%] bg-gradient-to-l from-[#0b0912] to-[#1d192b]"
                style={{
                  width: 'calc(var(--lw) * 0.014)',
                  transformOrigin: 'right center',
                  transform: 'rotateY(90deg)',
                }}
              />

              {/* 4. Inner Screen Face (pointing DOWN against keyboard at --lid = 0deg; facing viewer upright at 100deg) */}
              <div
                ref={lidScreenFaceRef}
                className="absolute inset-0"
                style={{
                  transform: 'rotateX(180deg)',
                  backfaceVisibility: 'hidden',
                  visibility: 'hidden',
                }}
              >
                {/* Matte-Black Bezel Frame (fades out cleanly as screen covers viewport) */}
                <div
                  ref={lidFrameRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 border border-violet-400/25 bg-gradient-to-b from-[#161321] via-[#0e0c16] to-[#08070d] shadow-[0_24px_65px_rgba(0,0,0,0.9),0_0_28px_rgba(139,92,246,0.22)]"
                  style={{ borderRadius: 'calc(var(--lw) * 0.012)' }}
                />

                {/* Glossy Pure BLACK Screen Container (#020103) — CSS inline-size container for crisp real-pixel cqw layout */}
                <div
                  className="relative h-full w-full"
                  style={{ padding: 'calc(var(--lw) * 0.026)' }}
                >
                  <div
                    ref={screenClipRef}
                    className="relative h-full w-full overflow-hidden rounded-[8px] bg-[#020103]"
                    style={{ containerType: isPortraitAspect ? 'size' : 'inline-size' }}
                  >
                    {/* Top Center Camera Notch */}
                    <div
                      ref={notchRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 left-1/2 z-30 flex h-[3.4%] w-[10.5%] -translate-x-1/2 items-center justify-center rounded-b-md bg-[#050408]"
                    >
                      <span className="aspect-square h-[38%] rounded-full bg-[#1f1b33]" />
                    </div>

                    {/* Faint Diagonal Glass Glare Streak (max 5.5% white, sweeps once, no screen blend mode) */}
                    <div
                      ref={glareRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-1/2 -bottom-1/2 left-0 z-20 w-[65%]"
                      style={{
                        opacity: 0,
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.055) 50%, transparent 100%)',
                      }}
                    />

                    {/* Virtual Hero Page — Uses cqw/cqh capped against svh so text is crisp while miniature AND never overflows on short/ultrawide screens */}
                    <div
                      ref={virtualHeroRef}
                      className="pointer-events-none relative flex h-full w-full flex-col items-center justify-center text-center"
                      style={{
                        backgroundColor: '#07050d',
                        backgroundImage:
                          'radial-gradient(ellipse 75% 55% at 50% 48%, rgba(139, 92, 246, 0.2) 0%, rgba(56, 28, 114, 0.08) 46%, #07050d 78%)',
                        paddingTop: isPortraitAspect
                          ? '8cqh'
                          : isShortViewport
                            ? '5cqw'
                            : isCompactHeight
                              ? '4.6cqw'
                              : isCompactWidth
                                ? '4.4cqw'
                                : 'min(2.8cqw, 6svh)',
                        paddingBottom: isPortraitAspect
                          ? '4cqh'
                          : isShortViewport
                            ? '2cqw'
                            : isCompactWidth
                              ? '2.8cqw'
                              : 'min(1.6cqw, 3.5svh)',
                        paddingLeft: isPortraitAspect ? '4cqw' : '3.5cqw',
                        paddingRight: isPortraitAspect ? '4cqw' : '3.5cqw',
                        textRendering: 'geometricPrecision',
                        WebkitFontSmoothing: 'antialiased',
                        opacity: 0,
                      }}
                    >
                      <div
                        className="relative z-10 mx-auto w-full"
                        style={{ maxWidth: isPortraitAspect ? '94cqw' : '90cqw' }}
                      >
                        <p
                          className="font-mono-label font-medium text-[#A78BFA]"
                          style={{
                            fontSize: isPortraitAspect
                              ? 'min(2.1cqw, 3.1cqh)'
                              : isShortViewport
                                ? 'min(1.05cqw, 2.3svh)'
                                : isCompactWidth
                                  ? 'min(0.95cqw, 1.8svh)'
                                  : 'min(0.84cqw, 1.7svh)',
                          }}
                        >
                          WEB DEVELOPER • EDITOR • DESIGNER
                        </p>

                        <h1
                          className="font-display font-extrabold tracking-tight text-white"
                          style={{
                            marginTop: isPortraitAspect
                              ? 'min(2cqw, 2.8cqh)'
                              : isShortViewport
                                ? '0.9cqw'
                                : 'min(1.12cqw, 2.1svh)',
                            fontSize: isPortraitAspect
                              ? 'min(7.2cqw, 10.6cqh)'
                              : isShortViewport
                                ? 'min(5.2cqw, 10.8svh)'
                                : isCompactWidth
                                  ? 'min(7.05cqw, 7.2vw, 11.2svh)'
                                  : 'min(5.78cqw, 11.2svh)',
                            lineHeight: 0.98,
                          }}
                        >
                          <span className="inline-block whitespace-nowrap">I build websites</span>
                          <br />
                          <span className="inline-block whitespace-nowrap">
                            that build <span className="text-[#A78BFA]">brands.</span>
                          </span>
                        </h1>

                        <p
                          className="mx-auto leading-relaxed text-white/70"
                          style={{
                            marginTop: isPortraitAspect
                              ? 'min(2.4cqw, 3.2cqh)'
                              : isShortViewport
                                ? '1.1cqw'
                                : 'min(1.4cqw, 2.6svh)',
                            maxWidth: isPortraitAspect
                              ? '34ch'
                              : isCompactWidth
                                ? '34ch'
                                : 'min(40cqw, 58ch)',
                            fontSize: isPortraitAspect
                              ? 'min(2.85cqw, 4.1cqh)'
                              : isShortViewport
                                ? 'min(1.5cqw, 3.3svh)'
                                : isCompactWidth
                                  ? 'min(1.38cqw, 2.4svh)'
                                  : 'min(1.12cqw, 2.2svh)',
                          }}
                        >
                          Incredible-looking sites, videos and designs that tell your story, match
                          your brand and grow your audience.
                        </p>

                        <div
                          className="flex flex-wrap items-center justify-center"
                          style={{
                            marginTop: isPortraitAspect
                              ? 'min(3cqw, 4.2cqh)'
                              : isShortViewport
                                ? '1.4cqw'
                                : 'min(1.95cqw, 3.6svh)',
                            gap: isPortraitAspect ? '2.2cqw' : 'min(0.98cqw, 1.8svh)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => onNavigate('#contact')}
                            className="inline-flex items-center rounded-full bg-[#8B5CF6] font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.45)] transition-colors duration-200 hover:bg-[#A78BFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                            style={{
                              minHeight: isPortraitAspect
                                ? 'min(7.8cqw, 10.8cqh)'
                                : isShortViewport
                                  ? 'min(3.2cqw, 7svh)'
                                  : 'min(3.06cqw, 5.8svh)',
                              padding: isPortraitAspect
                                ? 'min(1.6cqw, 2.2cqh) min(4cqw, 5.8cqh)'
                                : 'min(0.7cqw, 1.3svh) min(1.67cqw, 3.2svh)',
                              gap: isPortraitAspect ? '1.2cqw' : 'min(0.56cqw, 1svh)',
                              fontSize: isPortraitAspect
                                ? 'min(2.7cqw, 3.8cqh)'
                                : isShortViewport
                                  ? 'min(1.3cqw, 3svh)'
                                  : isCompactWidth
                                    ? 'min(1.22cqw, 2.2svh)'
                                    : 'min(0.98cqw, 1.9svh)',
                            }}
                          >
                            <span>Get a Quote</span>
                            <ArrowRight
                              style={{
                                width: isPortraitAspect ? 'min(2.9cqw, 4cqh)' : 'min(1.12cqw, 2.2svh)',
                                height: isPortraitAspect ? 'min(2.9cqw, 4cqh)' : 'min(1.12cqw, 2.2svh)',
                              }}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigate('#work')}
                            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] font-medium text-white/90 transition-colors duration-200 hover:border-violet-400/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                            style={{
                              minHeight: isPortraitAspect
                                ? 'min(7.8cqw, 10.8cqh)'
                                : isShortViewport
                                  ? 'min(3.2cqw, 7svh)'
                                  : 'min(3.06cqw, 5.8svh)',
                              padding: isPortraitAspect
                                ? 'min(1.6cqw, 2.2cqh) min(4cqw, 5.8cqh)'
                                : 'min(0.7cqw, 1.3svh) min(1.67cqw, 3.2svh)',
                              gap: isPortraitAspect ? '1.2cqw' : 'min(0.56cqw, 1svh)',
                              fontSize: isPortraitAspect
                                ? 'min(2.7cqw, 3.8cqh)'
                                : isShortViewport
                                  ? 'min(1.3cqw, 3svh)'
                                  : isCompactWidth
                                    ? 'min(1.22cqw, 2.2svh)'
                                    : 'min(0.98cqw, 1.9svh)',
                            }}
                          >
                            <span>See the work</span>
                            <ArrowDown
                              className="text-[#A78BFA]"
                              style={{
                                width: isPortraitAspect ? 'min(2.9cqw, 4cqh)' : 'min(1.12cqw, 2.2svh)',
                                height: isPortraitAspect ? 'min(2.9cqw, 4cqh)' : 'min(1.12cqw, 2.2svh)',
                              }}
                            />
                          </button>
                        </div>

                        <div
                          className="flex items-center justify-center"
                          style={{
                            marginTop: isPortraitAspect
                              ? 'min(2.6cqw, 3.6cqh)'
                              : isShortViewport
                                ? '1.2cqw'
                                : 'min(1.68cqw, 3.2svh)',
                            gap: isPortraitAspect ? '2cqw' : 'min(0.84cqw, 1.6svh)',
                          }}
                        >
                          {SOCIAL_LINKS.map((item) => (
                            <a
                              key={item.id}
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={item.label}
                              title={item.label}
                              className="hover-icon-float flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/75 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                              style={{
                                width: isPortraitAspect
                                  ? 'min(7.2cqw, 10cqh)'
                                  : isShortViewport
                                    ? 'min(3.2cqw, 6.8svh)'
                                    : isCompactWidth
                                      ? 'min(3.1cqw, 5.6svh)'
                                      : 'min(2.78cqw, 5.2svh)',
                                height: isPortraitAspect
                                  ? 'min(7.2cqw, 10cqh)'
                                  : isShortViewport
                                    ? 'min(3.2cqw, 6.8svh)'
                                    : isCompactWidth
                                      ? 'min(3.1cqw, 5.6svh)'
                                      : 'min(2.78cqw, 5.2svh)',
                              }}
                            >
                              <span
                                style={{
                                  width: isPortraitAspect ? 'min(3.1cqw, 4.4cqh)' : 'min(1.12cqw, 2.2svh)',
                                  height: isPortraitAspect ? 'min(3.1cqw, 4.4cqh)' : 'min(1.12cqw, 2.2svh)',
                                  display: 'inline-flex',
                                }}
                              >
                                <SocialBrandIcon id={item.id} className="h-full w-full" />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real Full-Viewport Hero Overlay — crossfades in during the LAST 8% of zoom on portrait tablets & phones (aspectRatio < 1.3) */}
        <div
          ref={realHeroRef}
          data-fullbleed="true"
          aria-hidden={!isPortraitAspect}
          className="pointer-events-none absolute inset-0 z-[25]"
          style={{
            opacity: 0,
            backgroundColor: '#07050d',
            backgroundImage:
              'radial-gradient(ellipse 75% 55% at 50% 48%, rgba(139, 92, 246, 0.2) 0%, rgba(56, 28, 114, 0.08) 46%, #07050d 78%)',
          }}
        >
          {renderRealHeroContent(false)}
        </div>

        {/* Bottom SCROLL indicator (hidden if H < 420px) */}
        <div
          ref={scrollHintRef}
          style={{ display: viewport.h < 420 ? 'none' : 'flex' }}
          className={`pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 flex-col items-center gap-1.5 ${
            isShortViewport ? 'bottom-3' : 'bottom-6 gap-2'
          }`}
        >
          <span className="font-mono-label text-[10px] text-white/50">SCROLL</span>
          <div
            className={`w-[1px] bg-gradient-to-b from-[#A78BFA] to-transparent ${
              isShortViewport ? 'h-4' : 'h-7'
            }`}
          />
        </div>
      </div>

      {/* Hidden Tuning Panel (Only visible when URL contains ?debug=1) */}
      {debugMode && (
        <div className="fixed right-4 bottom-4 z-50 w-72 max-w-[calc(100%-2rem)] rounded-2xl border border-violet-400/30 bg-[#0d0a17]/95 p-4 text-xs text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setDebugOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-violet-300 uppercase"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Hero Tuning</span>
            </button>
            <button
              type="button"
              onClick={handleCopyTuning}
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

          {debugOpen && (
            <div className="mt-3 space-y-2.5">
              <label className="block">
                <div className="mb-1 flex justify-between text-[11px] text-white/75">
                  <span>OPEN_RATIO</span>
                  <span className="font-mono text-violet-300">{tuning.openRatio.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={0.95}
                  step={0.01}
                  value={tuning.openRatio}
                  onChange={(e) =>
                    setTuning((prev) => ({
                      ...prev,
                      openRatio: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-violet-500"
                />
              </label>

              <label className="block">
                <div className="mb-1 flex justify-between text-[11px] text-white/75">
                  <span>minHorizon</span>
                  <span className="font-mono text-violet-300">{tuning.minHorizon.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={0.6}
                  step={0.01}
                  value={tuning.minHorizon}
                  onChange={(e) =>
                    setTuning((prev) => ({
                      ...prev,
                      minHorizon: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-violet-500"
                />
              </label>

              <label className="block">
                <div className="mb-1 flex justify-between text-[11px] text-white/75">
                  <span>maxHorizon</span>
                  <span className="font-mono text-violet-300">{tuning.maxHorizon.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.45}
                  max={0.85}
                  step={0.01}
                  value={tuning.maxHorizon}
                  onChange={(e) =>
                    setTuning((prev) => ({
                      ...prev,
                      maxHorizon: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-violet-500"
                />
              </label>

              <label className="block">
                <div className="mb-1 flex justify-between text-[11px] text-white/75">
                  <span>viewElevation</span>
                  <span className="font-mono text-violet-300">{tuning.viewElevation}deg</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={16}
                  step={0.5}
                  value={tuning.viewElevation}
                  onChange={(e) =>
                    setTuning((prev) => ({
                      ...prev,
                      viewElevation: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-violet-500"
                />
              </label>

              <label className="block">
                <div className="mb-1 flex justify-between text-[11px] text-white/75">
                  <span>glowIntensity</span>
                  <span className="font-mono text-violet-300">
                    {tuning.glowIntensity.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={2.0}
                  step={0.05}
                  value={tuning.glowIntensity}
                  onChange={(e) =>
                    setTuning((prev) => ({
                      ...prev,
                      glowIntensity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-violet-500"
                />
              </label>

              <label className="block">
                <div className="mb-1 flex justify-between text-[11px] text-white/75">
                  <span>maxZoom</span>
                  <span className="font-mono text-violet-300">{tuning.maxZoom.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={1.4}
                  step={0.05}
                  value={tuning.maxZoom}
                  onChange={(e) =>
                    setTuning((prev) => ({
                      ...prev,
                      maxZoom: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-violet-500"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
