import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PROFILE } from '../data/portfolioData';
import { SOCIAL_LINKS } from '../data/social';
import { SocialBrandIcon } from './SocialIcons';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
}

const NAV_LINKS = [
  { label: 'Work', target: '#work' },
  { label: 'About', target: '#mission' },
  { label: 'Services', target: '#services' },
  { label: 'Contact', target: '#contact' },
];

export function Navbar({ onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (target: string) => {
    setDrawerOpen(false);
    onNavigate(target);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/[0.08] bg-[#07050d]/80 py-3 backdrop-blur-xl'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-5 sm:px-8">
          {/* Zone 1: Brand mark */}
          <button
            type="button"
            onClick={() => handleLinkClick('#hero')}
            className="group flex shrink-0 items-center gap-3 whitespace-nowrap text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-violet-400/35 bg-[#0e0a19] p-1 shadow-[0_0_20px_rgba(139,92,246,0.28)] transition-transform duration-200 group-hover:scale-105">
              <img
                src={PROFILE.assets.logo}
                alt="Muhammad Talha TS Logo"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white/95">
              {PROFILE.name}
            </span>
          </button>

          {/* Zone 2: Center mono nav links */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
            {NAV_LINKS.map((item) => (
              <button
                key={item.target}
                type="button"
                onClick={() => handleLinkClick(item.target)}
                className="font-mono-label relative shrink-0 whitespace-nowrap py-1 text-[11px] font-medium text-white/65 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Social icons + Primary CTA + Mobile drawer toggle */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="hidden items-center gap-1.5 lg:flex">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_18px_rgba(139,92,246,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <SocialBrandIcon id={item.id} className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleLinkClick('#contact')}
              className="hidden shrink-0 whitespace-nowrap rounded-full bg-[#8B5CF6] px-5 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all duration-200 hover:bg-[#A78BFA] hover:shadow-[0_0_32px_rgba(167,139,250,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:inline-flex"
            >
              Hire Me
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/85 transition-colors hover:border-violet-400/50 hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-in drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md md:hidden"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="ml-auto flex h-full w-72 flex-col justify-between border-l border-white/10 bg-[#0b0814] p-6"
              aria-label="Mobile navigation drawer"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={PROFILE.assets.logo}
                      alt="TS logo"
                      className="h-8 w-8 rounded-md object-contain"
                    />
                    <span className="text-sm font-semibold text-white">{PROFILE.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close navigation menu"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/75 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-8 flex flex-col gap-3">
                  {NAV_LINKS.map((item) => (
                    <button
                      key={item.target}
                      type="button"
                      onClick={() => handleLinkClick(item.target)}
                      className="flex min-h-[44px] items-center justify-between rounded-lg px-3 text-left text-base font-medium text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-violet-400">↗</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  {SOCIAL_LINKS.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.45)]"
                    >
                      <SocialBrandIcon id={item.id} className="h-4 w-4" />
                    </a>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleLinkClick('#contact')}
                  className="w-full rounded-full bg-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.4)] hover:bg-[#A78BFA]"
                >
                  Hire Me
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
