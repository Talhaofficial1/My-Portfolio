import { useState } from 'react';
import { Code2, Film, Layers } from 'lucide-react';
import { SERVICES } from '../data/portfolioData';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { ServiceItem } from '../types/portfolio';

function ServiceIcon({ name }: { name: ServiceItem['iconName'] }) {
  if (name === 'code') return <Code2 className="h-5 w-5 text-[#A78BFA]" />;
  if (name === 'film') return <Film className="h-5 w-5 text-[#A78BFA]" />;
  return <Layers className="h-5 w-5 text-[#A78BFA]" />;
}

function TiltServiceCard({ service }: { service: ServiceItem }) {
  const reducedMotion = usePrefersReducedMotion();
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      reducedMotion ||
      e.pointerType !== 'mouse' ||
      (typeof window !== 'undefined' && !window.matchMedia('(hover: hover) and (pointer: fine)').matches)
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-py * 8).toFixed(2)),
      ry: Number((px * 8).toFixed(2)),
    });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div
      onPointerMove={handleMove}
      onPointerLeave={resetTilt}
      className="hover-card-lift group relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-[clamp(1.25rem,2.5vw,1.75rem)] backdrop-blur-xl transition-transform duration-200 ease-out will-change-transform active:scale-[0.99]"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
    >
      <div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
          <ServiceIcon name={service.iconName} />
        </div>

        <h3 className="mt-6 text-xl font-bold tracking-tight text-white">
          {service.title}
        </h3>

        <p className="mt-2.5 text-sm leading-relaxed text-white/65">
          {service.description}
        </p>
      </div>

      <ul className="mt-6 space-y-2.5 border-t border-white/[0.08] pt-5 text-xs text-white/80">
        {service.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServicesSection() {
  return (
    <section
      id="services"
      className="section-pad relative z-10 bg-[#07050d]"
    >
      <div className="site-container">
        <div className="max-w-2xl">
          <p className="font-mono-label text-[11px] font-medium text-[#A78BFA]">
            SERVICES
          </p>
          <h2
            className="font-display mt-4 text-balance font-extrabold leading-[1.02] tracking-tight text-white"
            style={{ fontSize: 'clamp(1.85rem, 4.5vw, 3.75rem)' }}
          >
            Everything your brand needs{' '}
            <span className="text-[#A78BFA]">to launch.</span>
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <TiltServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
