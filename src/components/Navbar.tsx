import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PROFILE } from '../data/portfolioData';
import { SOCIAL_LINKS } from '../data/social';
import { SocialBrandIcon } from './SocialIcons';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
}

const NAV_LINKS = [
  { label: 'WORK', target: '#work' },
  { label: 'ABOUT', target: '#mission' },
  { label: 'SERVICES', target: '#services' },
  { label: 'CONTACT', target: '#contact' },
] as const;

export function Navbar({ onNavigate }: NavbarProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/admin';

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [hideBrandName, setHideBrandName] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftGroupRef = useRef<HTMLButtonElement>(null);
  const nameSpanRef = useRef<HTMLSpanElement>(null);
  const centerNavRef = useRef<HTMLElement>(null);
  const rightGroupRef = useRef<HTMLDivElement>(null);
  const lastMeasuredNameWRef = useRef(136);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Expose live header height as --nav-h via ResizeObserver
  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl || typeof window === 'undefined') return;

    const syncNavHeight = () => {
      const h = headerEl.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty('--nav-h', `${Math.round(h)}px`);
      }
    };

    syncNavHeight();

    const ro = new ResizeObserver(() => {
      syncNavHeight();
    });
    ro.observe(headerEl);
    window.addEventListener('resize', syncNavHeight, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncNavHeight);
    };
  }, []);

  // Scroll threshold (20px) + Scroll Spy for WORK, ABOUT, SERVICES, CONTACT
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId = 0;

    const updateScrollAndSpy = () => {
      rafId = 0;
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      if (!isHomePage) {
        setActiveTarget(null);
        return;
      }

      const navH = headerRef.current?.getBoundingClientRect().height || 68;
      const vh = window.innerHeight || 900;
      const triggerLine = Math.max(navH + 64, vh * 0.36);

      const candidates = NAV_LINKS.map((item) => {
        const el = document.querySelector<HTMLElement>(item.target);
        if (!el) return null;
        return {
          target: item.target as string,
          top: el.getBoundingClientRect().top,
        };
      })
        .filter((item): item is { target: string; top: number } => item !== null)
        .sort((a, b) => a.top - b.top);

      if (candidates.length === 0) {
        setActiveTarget(null);
        return;
      }

      const nearBottom =
        window.innerHeight + scrollY >= document.documentElement.scrollHeight - 72;
      const contactCandidate = candidates.find((c) => c.target === '#contact');
      if (nearBottom && contactCandidate && contactCandidate.top <= vh * 0.9) {
        setActiveTarget('#contact');
        return;
      }

      let currentActive: string | null = null;
      for (const item of candidates) {
        if (item.top <= triggerLine) {
          currentActive = item.target;
        }
      }
      setActiveTarget(currentActive);
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateScrollAndSpy);
    };

    updateScrollAndSpy();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [isHomePage]);

  // Collision check for 768-1099px (and extreme narrow widths): hide "Muhammad Talha" text ONLY if it collides
  const checkBrandCollision = useCallback(() => {
    const container = containerRef.current;
    const centerNav = centerNavRef.current;
    const rightGroup = rightGroupRef.current;
    if (!container || !rightGroup) return;

    const vw = window.innerWidth;
    if (vw >= 1100) {
      setHideBrandName(false);
      return;
    }

    if (vw >= 768 && drawerOpen) {
      setDrawerOpen(false);
    }

    const containerW = container.getBoundingClientRect().width;
    const centerVisible = centerNav && centerNav.offsetParent !== null;
    const centerW = centerVisible ? centerNav.getBoundingClientRect().width : 0;
    const rightW = rightGroup.getBoundingClientRect().width;

    if (nameSpanRef.current && nameSpanRef.current.offsetParent !== null) {
      const w = nameSpanRef.current.getBoundingClientRect().width;
      if (w > 0) {
        lastMeasuredNameWRef.current = w + 12;
      }
    }

    const logoBoxW = 48;
    const safetyGap = vw >= 768 ? 28 : 16;
    const neededW = logoBoxW + lastMeasuredNameWRef.current + centerW + rightW + safetyGap;

    setHideBrandName(neededW > containerW + 1);
  }, [drawerOpen]);

  useLayoutEffect(() => {
    checkBrandCollision();
  }, [checkBrandCollision]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const ro = new ResizeObserver(() => {
      checkBrandCollision();
    });
    ro.observe(container);
    window.addEventListener('resize', checkBrandCollision, { passive: true });
    document.fonts?.ready.then(() => {
      checkBrandCollision();
    });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', checkBrandCollision);
    };
  }, [checkBrandCollision]);

  // Lock body scroll & handle Escape key when mobile drawer is open
  useEffect(() => {
    if (!drawerOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  const handleLinkClick = (target: string) => {
    setDrawerOpen(false);
    onNavigate(target);
  };

  return (
    <>
      <header
        ref={headerRef}
        className="site-header fixed top-0 left-0 right-0 z-[9999] flex w-full items-center transition-[background-color,backdrop-filter,border-color] duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(7, 5, 13, 0.72)' : 'transparent',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
          borderBottom: scrolled
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid transparent',
        }}
      >
        <div
          ref={containerRef}
          className="site-container flex h-full items-center justify-between gap-2 min-[1100px]:gap-6"
        >
          {/* Left: 48px rounded-square logo box (/images/logo.png) + bold white Muhammad Talha */}
          <button
            ref={leftGroupRef}
            type="button"
            onClick={() => handleLinkClick('#hero')}
            aria-label="Muhammad Talha — Home"
            className="group flex min-h-[48px] shrink-0 items-center gap-2.5 whitespace-nowrap text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 min-[1100px]:gap-3"
          >
            <span className="relative flex h-[48px] w-[48px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-400/35 bg-[#0e0a19] p-1.5 shadow-[0_0_20px_rgba(139,92,246,0.28)] transition-transform duration-200 group-hover:scale-105">
              <img
                src="/images/logo.png"
                alt="Muhammad Talha Logo"
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </span>
            {!hideBrandName && (
              <span
                ref={nameSpanRef}
                className="text-sm font-bold tracking-tight text-white min-[1100px]:text-[15px]"
              >
                {PROFILE.name}
              </span>
            )}
          </button>

          {/* Center: WORK, ABOUT, SERVICES, CONTACT (>=768px) */}
          <nav
            ref={centerNavRef}
            className="hidden items-center gap-3.5 md:flex lg:gap-5 min-[1100px]:gap-7"
            aria-label="Primary navigation"
          >
            {NAV_LINKS.map((item) => {
              const isActive = activeTarget === item.target;
              return (
                <button
                  key={item.target}
                  type="button"
                  onClick={() => handleLinkClick(item.target)}
                  aria-current={isActive ? 'location' : undefined}
                  className={`group relative flex min-h-[44px] shrink-0 items-center whitespace-nowrap px-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 min-[1100px]:text-[11px] ${
                    isActive ? 'text-white' : 'text-white/65 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute right-1 bottom-2 left-1 h-[2px] origin-center rounded-full bg-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.85)] transition-all duration-200 ${
                      isActive
                        ? 'scale-x-100 opacity-100'
                        : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Right: 36px Social Icon Buttons + Hire Me Pill (>=768px) + Hamburger (<768px) */}
          <div
            ref={rightGroupRef}
            className="flex shrink-0 items-center gap-2 min-[1100px]:gap-3"
          >
            <div className="hidden items-center gap-1.5 md:flex min-[1100px]:gap-2">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  className="hover-icon-float flex h-[36px] w-[36px] items-center justify-center rounded-full border border-white/15 bg-[#0e0a19] text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <SocialBrandIcon id={item.id} className="h-4 w-4" />
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleLinkClick('#contact')}
              className="hidden min-h-[40px] shrink-0 items-center whitespace-nowrap rounded-full bg-[#8B5CF6] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.38)] transition-all duration-200 hover:bg-[#A78BFA] hover:shadow-[0_0_32px_rgba(167,139,250,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 md:inline-flex min-[1100px]:min-h-[42px] min-[1100px]:px-5 min-[1100px]:text-xs"
            >
              Hire Me
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#0e0a19] text-white/85 transition-colors hover:border-violet-400/50 hover:text-white active:scale-95 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-in drawer (<768px) */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md md:hidden"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
                paddingLeft: '1.5rem',
                paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
              }}
              className="ml-auto flex h-full w-[min(86vw,20rem)] flex-col justify-between overflow-y-auto border-l border-white/15 bg-[#090712]/90 shadow-2xl backdrop-blur-2xl"
              aria-label="Mobile navigation drawer"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <button
                    type="button"
                    onClick={() => handleLinkClick('#hero')}
                    className="flex min-h-[48px] items-center gap-3 text-left"
                  >
                    <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-400/35 bg-[#0e0a19] p-1.5">
                      <img
                        src="/images/logo.png"
                        alt="Muhammad Talha Logo"
                        width={48}
                        height={48}
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span className="text-sm font-bold text-white">{PROFILE.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close navigation menu"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/75 hover:text-white active:scale-95"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-7 flex flex-col gap-2" aria-label="Mobile navigation">
                  {NAV_LINKS.map((item) => {
                    const isActive = activeTarget === item.target;
                    return (
                      <button
                        key={item.target}
                        type="button"
                        onClick={() => handleLinkClick(item.target)}
                        aria-current={isActive ? 'location' : undefined}
                        className={`flex min-h-[48px] items-center justify-between rounded-xl px-4 text-left font-mono text-xs font-medium uppercase tracking-[0.18em] transition-colors active:bg-white/[0.08] ${
                          isActive
                            ? 'border-l-2 border-[#8B5CF6] bg-violet-500/10 text-white'
                            : 'text-white/75 hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-[#A78BFA]">↗</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-4 pt-6">
                <div className="flex items-center justify-center gap-3">
                  {SOCIAL_LINKS.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-white/15 bg-[#0e0a19] text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] active:scale-95"
                    >
                      <SocialBrandIcon id={item.id} className="h-4 w-4" />
                    </a>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleLinkClick('#contact')}
                  className="min-h-[48px] w-full rounded-full bg-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.4)] hover:bg-[#A78BFA] active:scale-[0.99]"
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
