import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { PROFILE } from '../data/portfolioData';
import { SOCIAL_LINKS } from '../data/social';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { SocialBrandIcon } from './SocialIcons';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  onNavigate: (sectionId: string) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const lidRef = useRef<HTMLDivElement>(null);
  const screenGlowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closedBadgeRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const horizonGlowRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const lid = lidRef.current;
    const screenGlow = screenGlowRef.current;
    const content = contentRef.current;
    const closedBadge = closedBadgeRef.current;
    const scrollHint = scrollHintRef.current;
    const horizonGlow = horizonGlowRef.current;

    if (!section || !lid || !screenGlow || !content) return;

    if (reducedMotion) {
      gsap.set(lid, { rotateX: 0 });
      gsap.set(screenGlow, { opacity: 1 });
      gsap.set(content, { opacity: 1, y: 0, scale: 1 });
      if (closedBadge) gsap.set(closedBadge, { opacity: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;

      gsap.set(lid, { rotateX: -84, transformPerspective: 1600 });
      gsap.set(screenGlow, { opacity: 0.08 });
      gsap.set(content, { opacity: 0, y: 26, scale: 0.96 });
      if (closedBadge) gsap.set(closedBadge, { opacity: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: isMobile ? '+=750' : '+=1150',
          pin: true,
          scrub: 0.9,
          anticipatePin: 1,
        },
      });

      if (closedBadge) {
        tl.to(closedBadge, { opacity: 0, duration: 0.2, ease: 'power2.out' }, 0);
      }

      if (scrollHint) {
        tl.to(scrollHint, { opacity: 0, y: 10, duration: 0.25, ease: 'power2.out' }, 0.05);
      }

      tl.to(
        lid,
        {
          rotateX: 0,
          duration: 0.75,
          ease: 'power2.inOut',
        },
        0
      );

      if (horizonGlow) {
        tl.to(
          horizonGlow,
          {
            opacity: 1,
            scaleX: 1.15,
            duration: 0.7,
            ease: 'power2.out',
          },
          0.15
        );
      }

      tl.to(
        screenGlow,
        {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
        },
        0.32
      );

      tl.to(
        content,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: 'power3.out',
        },
        0.42
      );
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#07050d] px-4 pt-20 pb-10"
    >
      {/* Ambient radial deep violet backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 72% 48% at 50% 48%, rgba(139, 92, 246, 0.16) 0%, rgba(56, 28, 114, 0.08) 45%, transparent 75%)',
        }}
      />

      {/* Glowing purple horizon line across the middle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[62%] left-0 right-0 z-0 -translate-y-1/2 sm:top-[64%]"
      >
        <div
          ref={horizonGlowRef}
          className="mx-auto h-28 w-[92%] max-w-6xl opacity-75 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.45) 0%, rgba(139, 92, 246, 0.2) 45%, transparent 75%)',
          }}
        />
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#A78BFA]/80 to-transparent shadow-[0_0_24px_rgba(139,92,246,0.9)]" />
      </div>

      {/* Reflective dark floor beneath the horizon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[62%] right-0 bottom-0 left-0 z-0 sm:top-[64%]"
        style={{
          background:
            'linear-gradient(180deg, rgba(19, 12, 34, 0.55) 0%, rgba(7, 5, 13, 0.96) 55%, #07050d 100%)',
        }}
      />

      {/* 3D Aluminum Laptop Assembly */}
      <div className="laptop-perspective relative z-10 flex w-full max-w-5xl flex-col items-center justify-center">
        {/* Hinged Screen Lid */}
        <div
          ref={lidRef}
          className="preserve-3d relative w-[92vw] max-w-[920px] origin-bottom rounded-t-[20px] border border-white/15 bg-gradient-to-b from-[#231f2e] via-[#15121d] to-[#0e0b14] p-2.5 shadow-[0_28px_80px_rgba(0,0,0,0.85)] sm:rounded-t-[26px] sm:p-3.5"
          style={{ willChange: 'transform' }}
        >
          {/* Webcam notch */}
          <div
            aria-hidden="true"
            className="mx-auto mb-2 flex h-1.5 w-16 items-center justify-center rounded-full bg-black/70"
          >
            <span className="h-1 w-1 rounded-full bg-violet-400/50" />
          </div>

          {/* Closed Lid Hint (visible before scroll opens the lid) */}
          <div
            ref={closedBadgeRef}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-t-[20px] bg-[#0d0a15]/85 backdrop-blur-sm sm:rounded-t-[26px]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#07050d] p-2 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              <img
                src={PROFILE.assets.logo}
                alt="TS Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <p className="font-mono-label mt-3 text-[10px] text-white/55">
              Scroll to open workspace
            </p>
          </div>

          {/* Active Display Screen */}
          <div className="relative flex min-h-[370px] w-full flex-col items-center justify-center overflow-hidden rounded-[12px] border border-white/[0.08] bg-[#080610] px-5 py-9 text-center sm:min-h-[470px] sm:rounded-[16px] sm:px-10 sm:py-12">
            {/* Screen inner illumination */}
            <div
              ref={screenGlowRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.22) 0%, rgba(18, 12, 34, 0.65) 55%, rgba(7, 5, 13, 0.98) 100%)',
              }}
            />

            {/* Screen Hero Typography & CTAs */}
            <div ref={contentRef} className="relative z-10 mx-auto max-w-3xl">
              <p className="font-mono-label text-[10px] font-medium text-[#A78BFA] sm:text-xs">
                WEB DEVELOPER • EDITOR • DESIGNER
              </p>

              <h1
                className="font-display mt-4 text-balance font-extrabold tracking-tight text-white"
                style={{ fontSize: 'clamp(2.15rem, 6.2vw, 5.2rem)', lineHeight: 0.98 }}
              >
                I build websites
                <br />
                that build <span className="text-[#A78BFA]">brands.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                Incredible-looking sites, videos and designs that tell your story, match your brand
                and grow your audience.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
                <button
                  type="button"
                  onClick={() => onNavigate('#contact')}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#8B5CF6] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.45)] transition-all duration-200 hover:bg-[#A78BFA] hover:shadow-[0_0_36px_rgba(167,139,250,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  <span>Get a Quote</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('#work')}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-white/90 transition-colors duration-200 hover:border-violet-400/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <span>See the work</span>
                  <ArrowDown className="h-4 w-4 text-[#A78BFA]" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                {SOCIAL_LINKS.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    title={item.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    <SocialBrandIcon id={item.id} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Aluminum Laptop Base Chassis */}
        <div
          aria-hidden="true"
          className="relative h-5 w-[96vw] max-w-[980px] rounded-b-2xl border-x border-b border-white/15 bg-gradient-to-b from-[#2a2538] via-[#171321] to-[#0a080f] shadow-[0_20px_50px_rgba(0,0,0,0.9)] sm:h-6"
        >
          {/* Thumb lip recess */}
          <div className="mx-auto h-1.5 w-24 rounded-b-md bg-black/55" />
        </div>

        {/* Floor Reflection */}
        <div
          aria-hidden="true"
          className="pointer-events-none mt-1 h-16 w-[88vw] max-w-[880px] opacity-35 blur-md"
          style={{
            background:
              'linear-gradient(180deg, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.06) 55%, transparent 100%)',
          }}
        />
      </div>

      {/* Bottom SCROLL indicator */}
      <div
        ref={scrollHintRef}
        className="pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono-label text-[10px] text-white/50">SCROLL</span>
        <div className="h-7 w-[1px] bg-gradient-to-b from-[#A78BFA] to-transparent" />
      </div>
    </section>
  );
}
