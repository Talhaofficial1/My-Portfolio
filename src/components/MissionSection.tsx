import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MISSION_WORDS } from '../data/portfolioData';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function MissionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const wordEls = wordsRef.current.filter((el): el is HTMLSpanElement => el !== null);
    if (!section || wordEls.length === 0) return;

    if (reducedMotion) {
      wordEls.forEach((el) => {
        const isViolet = el.dataset.highlight === 'true';
        el.style.color = isViolet ? '#A78BFA' : '#FFFFFF';
        el.style.opacity = '1';
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(wordEls, { opacity: 0.22 });

      gsap.to(wordEls, {
        opacity: 1,
        color: (_idx, target) =>
          (target as HTMLElement).dataset.highlight === 'true' ? '#A78BFA' : '#FFFFFF',
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top 72%',
          end: 'bottom 58%',
          scrub: 0.8,
        },
      });
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      id="mission"
      ref={sectionRef}
      className="relative z-10 bg-[#07050d] px-5 py-28 sm:px-8 sm:py-36"
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-mono-label text-[11px] font-medium text-[#A78BFA]">
          THE MISSION
        </p>

        <h2 className="mt-7 text-balance text-2xl font-semibold leading-[1.35] tracking-tight text-white/25 sm:text-4xl sm:leading-[1.3] md:text-[2.75rem]">
          {MISSION_WORDS.map((word, idx) => (
            <span
              key={`${word.text}-${idx}`}
              ref={(el) => {
                wordsRef.current[idx] = el;
              }}
              data-highlight={word.highlight ? 'true' : 'false'}
              className="inline-block transition-colors duration-150"
            >
              {word.text}
              {idx < MISSION_WORDS.length - 1 ? '\u00A0' : ''}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
