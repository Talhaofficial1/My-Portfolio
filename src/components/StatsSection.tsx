import { useEffect, useRef, useState } from 'react';
import { STATS } from '../data/portfolioData';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    STATS.forEach((s) => {
      if (s.value !== null) initial[s.id] = reducedMotion ? s.value : 0;
    });
    return initial;
  });

  useEffect(() => {
    if (reducedMotion) {
      const done: Record<string, number> = {};
      STATS.forEach((s) => {
        if (s.value !== null) done[s.id] = s.value;
      });
      setCounts(done);
      return;
    }

    const el = sectionRef.current;
    if (!el) return;

    let started = false;
    let rafId = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          const startTime = performance.now();
          const duration = 1200;

          const tick = (now: number) => {
            const elapsed = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - elapsed, 3);
            const next: Record<string, number> = {};
            STATS.forEach((s) => {
              if (s.value !== null) {
                next[s.id] = Math.round(s.value * eased);
              }
            });
            setCounts(next);
            if (elapsed < 1) {
              rafId = requestAnimationFrame(tick);
            }
          };

          rafId = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      aria-label="Key milestones"
      className="relative z-10 border-y border-white/[0.07] bg-[#07050d] py-[clamp(2.75rem,6svh,5rem)]"
    >
      <div className="site-container grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.id} className="flex flex-col items-center text-center">
            <div
              className="font-display tabular-nums bg-gradient-to-b from-white via-white to-[#A78BFA] bg-clip-text font-extrabold text-transparent"
              style={{ fontSize: 'clamp(1.85rem, 1rem + 3vw, 3.75rem)' }}
            >
              {stat.value !== null
                ? `${counts[stat.id] ?? 0}${stat.suffix}`
                : stat.displayFallback}
            </div>
            <p className="font-mono-label mt-3 max-w-[18ch] text-[10px] leading-relaxed text-white/55 sm:text-[11px]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
