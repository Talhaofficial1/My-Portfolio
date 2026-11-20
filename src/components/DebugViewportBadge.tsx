import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function getBreakpointLabel(w: number): string {
  if (w < 360) return '<360';
  if (w < 480) return '360';
  if (w < 640) return '480';
  if (w < 768) return '640';
  if (w < 1024) return '768';
  if (w < 1280) return '1024';
  if (w < 1536) return '1280';
  if (w < 1920) return '1536';
  if (w < 2560) return '1920';
  return '2560+';
}

function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const classes =
    typeof el.className === 'string' && el.className.trim()
      ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}`
      : '';
  return `${tag}${id}${classes}`;
}

interface HeroMetricsSnapshot {
  innerW?: number;
  innerH?: number;
  H: number;
  navH: number;
  horizonY: number;
  laptopW: number;
  openRatio: number;
  laptopTop: number | null;
  laptopBottom: number | null;
  progress?: number;
}

export function DebugViewportBadge() {
  const location = useLocation();
  const [active, setActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === '1';
  });

  const [metrics, setMetrics] = useState<{
    innerW: number;
    innerH: number;
    H: number;
    navH: number;
    horizonY: string;
    laptopW: string;
    openRatio: string;
    laptopTop: number | null;
    laptopBottom: number | null;
    dpr: number;
    bp: string;
    scrollOverflowPx: number;
  }>({
    innerW: 0,
    innerH: 0,
    H: 0,
    navH: 64,
    horizonY: '0px',
    laptopW: '0px',
    openRatio: '0.72',
    laptopTop: null,
    laptopBottom: null,
    dpr: 1,
    bp: '1280',
    scrollOverflowPx: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setActive(new URLSearchParams(window.location.search).get('debug') === '1');
  }, [location.search]);

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    let timer = 0;

    const audit = (customDetail?: HeroMetricsSnapshot) => {
      const innerW = window.innerWidth;
      const innerH = window.innerHeight;
      const vw = document.documentElement.clientWidth || innerW;
      const sw = document.documentElement.scrollWidth;
      const overflowPx = Math.max(0, Math.round(sw - vw));

      const stageEl = document.querySelector<HTMLElement>('[data-hero-stage="true"]');
      const navEl = document.querySelector<HTMLElement>('header.site-header');
      let parsed: HeroMetricsSnapshot | null = customDetail || null;
      if (!parsed && stageEl?.dataset.heroMetrics) {
        try {
          parsed = JSON.parse(stageEl.dataset.heroMetrics) as HeroMetricsSnapshot;
        } catch {
          parsed = null;
        }
      }

      const stageComputed = stageEl ? window.getComputedStyle(stageEl) : null;
      const stageH = parsed?.H ?? (stageEl ? Math.round(stageEl.getBoundingClientRect().height) : innerH);
      const navH = parsed?.navH ?? (navEl ? Math.round(navEl.getBoundingClientRect().height) : 64);
      const horizonY =
        parsed?.horizonY !== undefined
          ? `${parsed.horizonY.toFixed(1)}px`
          : stageComputed?.getPropertyValue('--horizon-y').trim() || '0px';
      const laptopW =
        parsed?.laptopW !== undefined
          ? `${parsed.laptopW.toFixed(1)}px`
          : stageComputed?.getPropertyValue('--laptop-w').trim() || '0px';
      const openRatio = parsed?.openRatio !== undefined ? parsed.openRatio.toFixed(2) : '0.72';

      setMetrics({
        innerW,
        innerH,
        H: stageH,
        navH,
        horizonY,
        laptopW,
        openRatio,
        laptopTop: parsed?.laptopTop ?? null,
        laptopBottom: parsed?.laptopBottom ?? null,
        dpr: Number((window.devicePixelRatio || 1).toFixed(2)),
        bp: getBreakpointLabel(innerW),
        scrollOverflowPx: overflowPx,
      });

      const offenders: Array<{ selector: string; left: number; right: number; width: number }> = [];
      document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        if (
          el.closest('[data-zoom-scaled="true"]') ||
          el.closest('[data-laptop-stage="true"]') ||
          el.closest('[data-debug-badge="true"]')
        ) {
          return;
        }
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') {
          return;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        if (rect.right > vw + 0.5 || rect.left < -0.5) {
          offenders.push({
            selector: describeElement(el),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          });
        }
      });

      if (overflowPx > 0 || offenders.length > 0) {
        console.warn(`[?debug=1 overflow audit] vw=${vw} scrollWidth=${sw}`, offenders);
      }
    };

    const scheduleAudit = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => audit(), 100);
    };

    const handleHeroMetrics = (e: Event) => {
      const detail = (e as CustomEvent<HeroMetricsSnapshot>).detail;
      audit(detail);
    };

    audit();
    window.addEventListener('resize', scheduleAudit, { passive: true });
    window.addEventListener('orientationchange', scheduleAudit, { passive: true });
    window.addEventListener('scroll', scheduleAudit, { passive: true });
    window.addEventListener('hero:metrics-updated', handleHeroMetrics);
    window.visualViewport?.addEventListener('resize', scheduleAudit, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', scheduleAudit);
      window.removeEventListener('orientationchange', scheduleAudit);
      window.removeEventListener('scroll', scheduleAudit);
      window.removeEventListener('hero:metrics-updated', handleHeroMetrics);
      window.visualViewport?.removeEventListener('resize', scheduleAudit);
    };
  }, [active, location.pathname]);

  if (!active) return null;

  const hasOverflow = metrics.scrollOverflowPx > 0;

  return (
    <div
      data-debug-badge="true"
      className="pointer-events-none fixed top-16 right-3 z-[98] flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-1"
    >
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-violet-400/35 bg-[#0b0814]/90 px-3 py-1 font-mono text-[10px] text-white/90 shadow-lg backdrop-blur-md">
        <span>
          {metrics.innerW}×{metrics.innerH}
        </span>
        <span className="text-white/40">|</span>
        <span>H:{metrics.H}px</span>
        <span className="text-white/40">|</span>
        <span>navH:{metrics.navH}px</span>
        <span className="text-white/40">|</span>
        <span className="text-[#A78BFA]">bp:{metrics.bp}</span>
        <span className="text-white/40">|</span>
        <span>DPR {metrics.dpr}</span>
        <span className="text-white/40">|</span>
        <span className={hasOverflow ? 'font-bold text-rose-400' : 'text-emerald-400'}>
          {hasOverflow ? `OVERFLOW +${metrics.scrollOverflowPx}px` : 'OK'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-400/25 bg-[#0b0814]/88 px-2.5 py-1 font-mono text-[9.5px] text-white/80 shadow-md backdrop-blur-md">
        <span>--horizon-y:{metrics.horizonY}</span>
        <span className="text-white/35">|</span>
        <span>--laptop-w:{metrics.laptopW}</span>
        <span className="text-white/35">|</span>
        <span>OPEN_RATIO:{metrics.openRatio}</span>
        {metrics.laptopTop !== null && metrics.laptopBottom !== null && (
          <>
            <span className="text-white/35">|</span>
            <span>
              laptop top:{metrics.laptopTop}px bottom:{metrics.laptopBottom}px
            </span>
          </>
        )}
      </div>
    </div>
  );
}
