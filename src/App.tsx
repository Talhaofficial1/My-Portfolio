import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AtWorkSection } from './components/AtWorkSection';
import { CursorGlow } from './components/CursorGlow';
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

function PortfolioHomePage({
  projects,
  onOpenAdmin,
}: {
  projects: ProjectItem[];
  onOpenAdmin: () => void;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
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
      if (lenisRef.current && !reducedMotion) {
        lenisRef.current.scrollTo(el as HTMLElement, { offset: -12 });
      } else {
        el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    },
    [reducedMotion]
  );

  return (
    <div className="relative min-h-screen bg-[#07050d] text-white">
      <div
        aria-hidden="true"
        className="film-grain pointer-events-none fixed inset-0 z-[60] opacity-60"
      />

      <PageLoader />
      <ScrollProgress />
      <CursorGlow />
      <Navbar onNavigate={scrollToTarget} />

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
      <Routes>
        <Route
          path="/"
          element={
            <PortfolioHomePage
              projects={projects}
              onOpenAdmin={() => setAdminOpen(true)}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <PortfolioHomePage
              projects={projects}
              onOpenAdmin={() => setAdminOpen(true)}
            />
          }
        />
        <Route
          path="/project/:id"
          element={
            <ErrorBoundary fallbackMessage="This project is unavailable right now.">
              <ProjectDetailPage
                projects={projects}
                onOpenAdmin={() => setAdminOpen(true)}
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
                onOpenAdmin={() => setAdminOpen(true)}
              />
            </ErrorBoundary>
          }
        />
      </Routes>

      <AdminPanelModal
        open={adminOpen}
        projects={projects}
        onClose={handleCloseAdmin}
        onProjectsChange={(nextProjects) =>
          setProjects(nextProjects.length > 0 ? nextProjects : DEFAULT_PROJECTS)
        }
      />
    </BrowserRouter>
  );
}
