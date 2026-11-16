import { ArrowUp, Mail, MessageCircle } from 'lucide-react';
import { PROFILE } from '../data/portfolioData';
import { SOCIAL_LINKS } from '../data/social';
import { SocialBrandIcon } from './SocialIcons';

interface FooterProps {
  onBackToTop: () => void;
  onOpenAdmin: () => void;
}

export function Footer({ onBackToTop, onOpenAdmin }: FooterProps) {
  const rawDirectLinks: Array<{ label: string; href: string; Icon: typeof Mail }> = [
    { label: 'Email', href: PROFILE.socials.email, Icon: Mail },
    { label: 'WhatsApp', href: PROFILE.socials.whatsapp, Icon: MessageCircle },
  ];
  const directLinks = rawDirectLinks.filter((item) => Boolean(item.href && item.href !== '#'));

  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-[#07050d] px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 sm:flex-row">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-[#0d0917] p-1">
            <img
              src={PROFILE.assets.logo}
              alt="TS Gold Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{PROFILE.name}</p>
            <p className="text-xs text-white/50">
              {PROFILE.location} · © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              title={item.label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <SocialBrandIcon id={item.id} className="h-4 w-4" />
            </a>
          ))}

          {directLinks.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        {/* Utility Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="font-mono text-[11px] text-white/40 transition-colors hover:text-[#A78BFA]"
          >
            Manage Work
          </button>

          <button
            type="button"
            onClick={onBackToTop}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:border-violet-400/50 hover:text-white"
          >
            <span>Top</span>
            <ArrowUp className="h-3.5 w-3.5 text-[#A78BFA]" />
          </button>
        </div>
      </div>
    </footer>
  );
}
