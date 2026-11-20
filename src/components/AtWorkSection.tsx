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

    const mm = gsap.matchMedia(section);

    const buildTimeline = (isMobile: boolean) => {
      gsap.set(img, { scale: 1, yPercent: 0 });
      gsap.set(glassUi, { opacity: 0, y: 32 });
      gsap.set(headline, { opacity: 0.78, y: 16 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: isMobile ? '+=650' : '+=950',
          pin: true,
          scrub: 0.9,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        img,
        {
          scale: 1.12,
          yPercent: -2.5,
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
    };

    mm.add('(min-width: 768px)', () => buildTimeline(false));
    mm.add('(max-width: 767px)', () => buildTimeline(true));

    return () => mm.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      aria-label="Late-night creative workflow"
      className="h-pin-stage relative flex w-full max-w-full items-stretch justify-start overflow-hidden bg-[#07050d]"
    >
      {/* Full-bleed workspace photography anchored toward top-right so portrait head & eyes never crop off */}
      <img
        ref={imageRef}
        src={PROFILE.assets.sceneDesk}
        alt="Muhammad Talha working late at night at a minimalist desk setup"
        loading="eager"
        width={1920}
        height={1080}
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover object-[70%_18%] will-change-transform md:object-[64%_22%]"
      />

      {/* Left-focused dark gradient scrim so left editorial typography stays legible while keeping right portrait clear */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(7, 5, 13, 0.86) 0%, rgba(7, 5, 13, 0.58) 46%, rgba(7, 5, 13, 0.28) 76%, rgba(7, 5, 13, 0.52) 100%)',
        }}
      />

      {/* Subtle ambient radial vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 55% 45%, transparent 32%, rgba(7, 5, 13, 0.65) 85%, #07050d 100%)',
        }}
      />

      {/* Top & bottom seamless fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07050d] to-transparent sm:h-32"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#07050d] via-[#07050d]/85 to-transparent sm:h-44"
      />

      <div
        className="site-container relative z-10 flex h-full flex-col justify-between gap-4 [@media(max-height:520px)]:flex-row [@media(max-height:520px)]:items-center"
        style={{
          paddingTop: 'calc(var(--nav-h) + clamp(0.75rem, 3svh, 2.25rem))',
          paddingBottom: 'clamp(1rem, 4svh, 3.25rem)',
        }}
      >
        {/* Top-Left Editorial Overlay Text (kept strictly left so head/shoulder area on the right stays visible) */}
        <div
          ref={headlineRef}
          className="max-w-[88%] sm:max-w-lg lg:max-w-xl [@media(max-height:520px)]:max-w-[46%]"
        >
          <p className="font-mono-label text-[10px] text-white/65 sm:text-[11px]">
            CRAFT IN PROGRESS • LAHORE
          </p>
          <h2
            className="font-display mt-3 text-balance font-extrabold leading-[0.98] tracking-tight text-white drop-shadow-[0_12px_32px_rgba(0,0,0,0.65)] sm:mt-4"
            style={{ fontSize: 'clamp(1.75rem, min(5.2vw, 7svh), 4.75rem)' }}
          >
            Built at night.
            <br />
            <span className="text-[#A78BFA]">Live by morning.</span>
          </h2>
        </div>

        {/* Floating Glass UI Browser Mockup tucked bottom-left (or side-by-side on ultra-short landscape phones) */}
        <div
          ref={glassUiRef}
          className="w-full max-w-md [@media(max-height:520px)]:max-w-[46%]"
        >
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0c0916]/80 shadow-[0_24px_70px_rgba(0,0,0,0.7),0_0_40px_rgba(139,92,246,0.18)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 sm:py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="font-mono text-[11px] text-white/55">build.talha.dev</span>
              <span className="font-mono text-[10px] text-[#A78BFA]">v2.6</span>
            </div>

            <div className="space-y-2.5 p-3.5 sm:space-y-3.5 sm:p-5 [@media(max-height:640px)]:space-y-2 [@media(max-height:640px)]:p-3">
              <div className="flex items-baseline justify-between border-b border-white/10 pb-2 sm:pb-3">
                <span className="text-xs font-semibold text-white sm:text-sm">
                  Client Launch Checklist
                </span>
                <span className="font-mono text-[10px] text-white/50 sm:text-[11px]">
                  02:40 AM PKT
                </span>
              </div>

              <div className="space-y-2 text-[11px] text-white/80 sm:space-y-2.5 sm:text-xs">
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5 sm:py-2">
                  <span>Responsive Grid &amp; Motion</span>
                  <span className="font-mono text-[10px] text-[#A78BFA] sm:text-[11px]">Ready</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5 sm:py-2">
                  <span>Brand Typography &amp; Assets</span>
                  <span className="font-mono text-[10px] text-[#A78BFA] sm:text-[11px]">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5 sm:py-2 [@media(max-height:460px)]:hidden">
                  <span>Production Deployment</span>
                  <span className="font-mono text-[10px] text-[#D4AF37] sm:text-[11px]">
                    Scheduled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
