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
    if (reducedMotion || e.pointerType !== 'mouse') return;
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
      className="group relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition-transform duration-200 ease-out will-change-transform hover:border-violet-400/40 hover:bg-white/[0.05]"
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
      className="relative z-10 bg-[#07050d] px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="font-mono-label text-[11px] font-medium text-[#A78BFA]">
            SERVICES
          </p>
          <h2
            className="font-display mt-4 text-balance font-extrabold leading-[1.02] tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)' }}
          >
            Everything your brand needs{' '}
            <span className="text-[#A78BFA]">to launch.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SERVICES.map((service) => (
            <TiltServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
