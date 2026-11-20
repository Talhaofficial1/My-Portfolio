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
    <footer
      className="relative z-10 border-t border-white/[0.08] bg-[#07050d] py-[clamp(2.5rem,5svh,3.5rem)]"
      style={{ paddingBottom: 'max(clamp(2.5rem, 5svh, 3.5rem), env(safe-area-inset-bottom))' }}
    >
      <div className="site-container flex flex-col items-center justify-between gap-7 text-center lg:flex-row lg:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-[#0d0917] p-1">
            <img
              src={PROFILE.assets.logo}
              alt="TS Gold Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{PROFILE.name}</p>
            <p className="wrap-anywhere text-xs text-white/50">
              {PROFILE.location} · © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>

        {/* Social Links (>=44x44px touch targets) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              title={item.label}
              className="hover-icon-float flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/75 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95"
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
              className="hover-icon-float flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/75 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        {/* Utility Actions (>=44px touch targets) */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex min-h-[44px] items-center rounded-full px-3 font-mono text-[11px] text-white/45 transition-colors hover:text-[#A78BFA]"
          >
            Manage Work
          </button>

          <button
            type="button"
            onClick={onBackToTop}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-5 py-2 text-xs font-medium text-white/80 transition-colors hover:border-violet-400/50 hover:text-white active:scale-95"
          >
            <span>Top</span>
            <ArrowUp className="h-3.5 w-3.5 text-[#A78BFA]" />
          </button>
        </div>
      </div>
    </footer>
  );
}
