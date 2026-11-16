import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROFILE } from '../data/portfolioData';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function AtWorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const glassUiRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const img = imageRef.current;
    const glassUi = glassUiRef.current;
    const headline = headlineRef.current;
    if (!section || !img || !glassUi || !headline) return;

    if (reducedMotion) {
      gsap.set(img, { scale: 1.04 });
      gsap.set(glassUi, { opacity: 1, y: 0 });
      gsap.set(headline, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;

      gsap.set(img, { scale: 1, yPercent: 0 });
      gsap.set(glassUi, { opacity: 0, y: 36 });
      gsap.set(headline, { opacity: 0.75, y: 18 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: isMobile ? '+=650' : '+=950',
          pin: true,
          scrub: 0.9,
          anticipatePin: 1,
        },
      });

      tl.to(
        img,
        {
          scale: 1.14,
          yPercent: -3,
          duration: 1,
          ease: 'none',
        },
        0
      );

      tl.to(
        headline,
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power2.out',
        },
        0.1
      );

      tl.to(
        glassUi,
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power3.out',
        },
        0.25
      );
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      aria-label="Late-night creative workflow"
      className="relative flex min-h-screen w-full items-start justify-start overflow-hidden bg-[#07050d]"
    >
      {/* Full-bleed workspace photography */}
      <img
        ref={imageRef}
        src={PROFILE.assets.sceneDesk}
        alt="Muhammad Talha working late at night at a minimalist desk setup"
        loading="eager"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover object-center will-change-transform"
      />

      {/* Dark vignette & legibility scrim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(7, 5, 13, 0.35) 0%, rgba(7, 5, 13, 0.78) 70%, #07050d 100%)',
        }}
      />

      {/* Top & bottom seamless fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07050d] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#07050d] via-[#07050d]/85 to-transparent"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-5 pt-24 pb-14 sm:px-8 sm:pt-28 sm:pb-16">
        {/* Top-Left Editorial Overlay Text (kept strictly left so head/shoulder area on the right remains visible) */}
        <div ref={headlineRef} className="max-w-[78%] sm:max-w-lg lg:max-w-xl">
          <p className="font-mono-label text-[11px] text-white/65">
            CRAFT IN PROGRESS • LAHORE
          </p>
          <h2
            className="font-display mt-4 text-balance font-extrabold leading-[0.98] tracking-tight text-white drop-shadow-[0_12px_32px_rgba(0,0,0,0.65)]"
            style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4.75rem)' }}
          >
            Built at night.
            <br />
            <span className="text-[#A78BFA]">Live by morning.</span>
          </h2>
        </div>

        {/* Floating Glass UI Browser Mockup tucked bottom-left so right-side portrait stays clear */}
        <div ref={glassUiRef} className="mt-10 w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0c0916]/75 shadow-[0_24px_70px_rgba(0,0,0,0.7),0_0_40px_rgba(139,92,246,0.18)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="font-mono text-[11px] text-white/55">build.talha.dev</span>
              <span className="font-mono text-[10px] text-[#A78BFA]">v2.6</span>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                <span className="text-sm font-semibold text-white">Client Launch Checklist</span>
                <span className="font-mono text-[11px] text-white/50">02:40 AM PKT</span>
              </div>

              <div className="space-y-2.5 text-xs text-white/80">
                <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                  <span>Responsive Grid &amp; Motion</span>
                  <span className="font-mono text-[11px] text-[#A78BFA]">Ready</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                  <span>Brand Typography &amp; Assets</span>
                  <span className="font-mono text-[11px] text-[#A78BFA]">Verified</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                  <span>Production Deployment</span>
                  <span className="font-mono text-[11px] text-[#D4AF37]">Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
