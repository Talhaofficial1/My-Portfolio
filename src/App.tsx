import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AtWorkSection } from './components/AtWorkSection';
import { CursorGlow } from './components/CursorGlow';
import { DebugViewportBadge } from './components/DebugViewportBadge';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FeaturedWorkSection } from './components/FeaturedWorkSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { MissionSection } from './components/MissionSection';
import { Navbar } from './components/Navbar';
import { PageLoader } from './components/PageLoader';
import { ScrollProgress } from './components/ScrollProgress';
import { ServicesSection } from './components/ServicesSection';
import { StatsSection } from './components/StatsSection';
import { DEFAULT_PROJECTS } from './data/portfolioData';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import type { ProjectItem } from './types/portfolio';
import { normalizeProject } from './utils/projectHelpers';

gsap.registerPlugin(ScrollTrigger);

function syncViewportHeightVar(): number {
  const vh = Math.round(window.visualViewport?.height || window.innerHeight || 900);
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  return vh;
}

if (typeof window !== 'undefined') {
  syncViewportHeightVar();
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
}

function PortfolioHomePage({
  projects,
  onOpenAdmin,
  pendingTargetRef,
  onRegisterScroller,
}: {
  projects: ProjectItem[];
  onOpenAdmin: () => void;
  pendingTargetRef: React.MutableRefObject<string | null>;
  onRegisterScroller: (fn: (target: string) => void) => void;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    syncViewportHeightVar();
    if (!pendingTargetRef.current) {
      window.scrollTo(0, 0);
    }

    let userInteractedScroll = false;
    const markUserScroll = () => {
      if (window.scrollY > 8) {
        userInteractedScroll = true;
      }
    };
    window.addEventListener('wheel', () => {
      userInteractedScroll = true;
    }, { passive: true, once: true });
    window.addEventListener('touchmove', () => {
      userInteractedScroll = true;
    }, { passive: true, once: true });
    window.addEventListener('scroll', markUserScroll, { passive: true });

    let refreshTimer: number | null = null;
    let secondaryRefreshTimer: number | null = null;
    let fallbackReadyTimer: number | null = null;
    let mediaReady = false;
    let fontsReady = false;
    let didInitialRefresh = false;

    const runRefreshCycle = () => {
      syncViewportHeightVar();
      ScrollTrigger.refresh();
      if (!userInteractedScroll && !pendingTargetRef.current) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(0, { immediate: true });
        }
        window.scrollTo(0, 0);
      }
      if (secondaryRefreshTimer !== null) {
        window.clearTimeout(secondaryRefreshTimer);
      }
      secondaryRefreshTimer = window.setTimeout(() => {
        syncViewportHeightVar();
        ScrollTrigger.refresh();
        if (!userInteractedScroll && !pendingTargetRef.current) {
          if (lenisRef.current) {
            lenisRef.current.scrollTo(0, { immediate: true });
          }
          window.scrollTo(0, 0);
        }
      }, 300);
    };

    const tryInitialRefresh = () => {
      if (didInitialRefresh || !fontsReady || !mediaReady) return;
      didInitialRefresh = true;
      runRefreshCycle();
    };

    const onMediaReady = () => {
      mediaReady = true;
      tryInitialRefresh();
    };
    window.addEventListener('portfolio:media-ready', onMediaReady);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fontsReady = true;
        tryInitialRefresh();
      });
    } else {
      fontsReady = true;
    }

    fallbackReadyTimer = window.setTimeout(() => {
      fontsReady = true;
      mediaReady = true;
      tryInitialRefresh();
    }, 900);

    const scheduleResizeRefresh = () => {
      syncViewportHeightVar();
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }
      refreshTimer = window.setTimeout(() => {
        syncViewportHeightVar();
        ScrollTrigger.refresh();
      }, 150);
    };

    window.addEventListener('resize', scheduleResizeRefresh, { passive: true });
    window.addEventListener('orientationchange', scheduleResizeRefresh, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleResizeRefresh, { passive: true });

    if (reducedMotion) {
      return () => {
        if (refreshTimer !== null) window.clearTimeout(refreshTimer);
        if (secondaryRefreshTimer !== null) window.clearTimeout(secondaryRefreshTimer);
        if (fallbackReadyTimer !== null) window.clearTimeout(fallbackReadyTimer);
        window.removeEventListener('scroll', markUserScroll);
        window.removeEventListener('portfolio:media-ready', onMediaReady);
        window.removeEventListener('resize', scheduleResizeRefresh);
        window.removeEventListener('orientationchange', scheduleResizeRefresh);
        window.visualViewport?.removeEventListener('resize', scheduleResizeRefresh);
      };
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.scrollTo(0, { immediate: true });

    lenis.on('scroll', ScrollTrigger.update);

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      if (secondaryRefreshTimer !== null) window.clearTimeout(secondaryRefreshTimer);
      if (fallbackReadyTimer !== null) window.clearTimeout(fallbackReadyTimer);
      window.removeEventListener('scroll', markUserScroll);
      window.removeEventListener('portfolio:media-ready', onMediaReady);
      window.removeEventListener('resize', scheduleResizeRefresh);
      window.removeEventListener('orientationchange', scheduleResizeRefresh);
      window.visualViewport?.removeEventListener('resize', scheduleResizeRefresh);
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  const scrollToTarget = useCallback(
    (target: string) => {
      if (target === '#hero') {
        if (lenisRef.current && !reducedMotion) {
          lenisRef.current.scrollTo(0);
        } else {
          window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        }
        return;
      }
      const el = document.querySelector(target);
      if (!el) return;
      const headerEl = document.querySelector<HTMLElement>('header.site-header');
      const navH = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 68;
      if (lenisRef.current && !reducedMotion) {
        lenisRef.current.scrollTo(el as HTMLElement, { offset: -navH });
      } else {
        const top = Math.max(0, window.scrollY + el.getBoundingClientRect().top - navH);
        window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    },
    [reducedMotion]
  );

  useEffect(() => {
    onRegisterScroller(scrollToTarget);
  }, [onRegisterScroller, scrollToTarget]);

  useEffect(() => {
    const pending = pendingTargetRef.current;
    if (!pending) return;

    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
      scrollToTarget(pending);
      pendingTargetRef.current = null;
    }, 120);

    return () => window.clearTimeout(timer);
  }, [pendingTargetRef, scrollToTarget]);

  return (
    <div className="relative bg-[#07050d] text-white">
      <div
        aria-hidden="true"
        className="film-grain pointer-events-none fixed inset-0 z-[60] opacity-60"
      />

      <PageLoader />
      <ScrollProgress />
      <CursorGlow />

      <main>
        <HeroSection onNavigate={scrollToTarget} />
        <StatsSection />
        <MissionSection />
        <AtWorkSection />
        <ErrorBoundary fallbackMessage="This project is unavailable right now.">
          <FeaturedWorkSection projects={projects} />
        </ErrorBoundary>
        <ServicesSection />
        <FinalCtaSection />
      </main>

      <Footer
        onBackToTop={() => scrollToTarget('#hero')}
        onOpenAdmin={onOpenAdmin}
      />
    </div>
  );
}

function AppContent({
  projects,
  adminOpen,
  onOpenAdmin,
  onCloseAdmin,
  onProjectsChange,
}: {
  projects: ProjectItem[];
  adminOpen: boolean;
  onOpenAdmin: () => void;
  onCloseAdmin: () => void;
  onProjectsChange: (nextProjects: ProjectItem[]) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingTargetRef = useRef<string | null>(null);
  const homeScrollerRef = useRef<(target: string) => void>(() => {});

  const handleRegisterScroller = useCallback((fn: (target: string) => void) => {
    homeScrollerRef.current = fn;
  }, []);

  const handleRootNavigate = useCallback(
    (target: string) => {
      const isHome = location.pathname === '/' || location.pathname === '/admin';
      if (isHome) {
        homeScrollerRef.current(target);
        return;
      }

      if (target === '#hero') {
        pendingTargetRef.current = null;
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      pendingTargetRef.current = target;
      navigate('/');
    },
    [location.pathname, navigate]
  );

  return (
    <>
      <Navbar onNavigate={handleRootNavigate} />

      <Routes>
        <Route
          path="/"
          element={
            <PortfolioHomePage
              projects={projects}
              onOpenAdmin={onOpenAdmin}
              pendingTargetRef={pendingTargetRef}
              onRegisterScroller={handleRegisterScroller}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <PortfolioHomePage
              projects={projects}
              onOpenAdmin={onOpenAdmin}
              pendingTargetRef={pendingTargetRef}
              onRegisterScroller={handleRegisterScroller}
            />
          }
        />
        <Route
          path="/project/:id"
          element={
            <ErrorBoundary fallbackMessage="This project is unavailable right now.">
              <ProjectDetailPage
                projects={projects}
                onOpenAdmin={onOpenAdmin}
              />
            </ErrorBoundary>
          }
        />
        <Route
          path="*"
          element={
            <ErrorBoundary fallbackMessage="This project is unavailable right now.">
              <ProjectDetailPage
                projects={projects}
                onOpenAdmin={onOpenAdmin}
              />
            </ErrorBoundary>
          }
        />
      </Routes>

      <DebugViewportBadge />

      <AdminPanelModal
        open={adminOpen}
        projects={projects}
        onClose={onCloseAdmin}
        onProjectsChange={onProjectsChange}
      />
    </>
  );
}

export default function App() {
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const cached = localStorage.getItem('talha_local_projects');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p, idx) => normalizeProject(p, idx));
        }
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_PROJECTS;
  });

  const [adminOpen, setAdminOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.location.pathname === '/admin'
  );

  // Sync projects from backend API when available, gracefully keeping fallback data if offline
  useEffect(() => {
    let active = true;
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('offline'))))
      .then((data: { projects?: Array<Partial<ProjectItem>> }) => {
        if (active && Array.isArray(data.projects) && data.projects.length > 0) {
          const normalized = data.projects.map((p, idx) => normalizeProject(p, idx));
          setProjects(normalized);
        }
      })
      .catch(() => {
        // Offline / static deployment fallback already loaded
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCloseAdmin = () => {
    setAdminOpen(false);
    if (window.location.pathname === '/admin') {
      window.history.replaceState(null, '', '/');
    }
  };

  return (
    <BrowserRouter>
      <AppContent
        projects={projects}
        adminOpen={adminOpen}
        onOpenAdmin={() => setAdminOpen(true)}
        onCloseAdmin={handleCloseAdmin}
        onProjectsChange={(nextProjects) =>
          setProjects(nextProjects.length > 0 ? nextProjects : DEFAULT_PROJECTS)
        }
      />
    </BrowserRouter>
  );
}
