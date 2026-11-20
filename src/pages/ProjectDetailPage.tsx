import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Code2,
  Film,
  Layers,
  Play,
  Wrench,
  Youtube,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Footer } from '../components/Footer';
import { SocialBrandIcon } from '../components/SocialIcons';
import { PROFILE, resolveProjectPreview, resolveProjectThumbnail } from '../data/portfolioData';
import { SOCIAL_LINKS, SOCIAL_URLS } from '../data/social';
import type { ProjectCategory, ProjectItem } from '../types/portfolio';
import {
  findProjectByParam,
  getDisplayHost,
  isValidExternalUrl,
} from '../utils/projectHelpers';

interface ProjectDetailPageProps {
  projects: ProjectItem[];
  onOpenAdmin: () => void;
}

function CategoryIcon({
  category,
  color,
  sizeClass = 'h-3.5 w-3.5',
}: {
  category: ProjectCategory;
  color: string;
  sizeClass?: string;
}) {
  const style = { color };
  if (category === 'Editing') return <Film className={sizeClass} style={style} />;
  if (category === 'Design') return <Layers className={sizeClass} style={style} />;
  return <Code2 className={sizeClass} style={style} />;
}

function splitHeadlineAccent(title: string): { lead: string; accent: string } {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) return { lead: '', accent: title };
  return {
    lead: words.slice(0, -1).join(' '),
    accent: words[words.length - 1],
  };
}

export function ProjectDetailPage({ projects, onOpenAdmin }: ProjectDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const project = useMemo(() => findProjectByParam(id, projects), [id, projects]);
  const currentIndex = useMemo(
    () => (project ? projects.findIndex((p) => p.id === project.id) : -1),
    [project, projects]
  );

  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoPosterLoaded, setVideoPosterLoaded] = useState(false);
  const [moreImgErrors, setMoreImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setPreviewLoaded(false);
    setPreviewError(false);
    setActiveVideoIndex(0);
    setVideoPosterLoaded(false);

    if (project) {
      document.title = `${project.title} — ${PROFILE.name}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', project.tagline);
      }
    } else {
      document.title = `Project Not Found — ${PROFILE.name}`;
    }

    return () => {
      document.title = `${PROFILE.name} — Web Developer, Video Editor & UI Designer`;
    };
  }, [project]);

  const handleBackToPortfolio = () => {
    navigate('/');
    window.setTimeout(() => {
      document.querySelector('#work')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  if (!project) {
    return (
      <div
        style={{ paddingTop: 'var(--nav-h, 68px)' }}
        className="flex min-h-[100svh] w-full max-w-full flex-col justify-between overflow-x-clip bg-[#07050d] text-white"
      >
        <main className="site-container flex max-w-xl flex-col items-center py-[clamp(4rem,10svh,7rem)] text-center">
          <p className="font-mono-label text-[11px] text-[#A78BFA]">404 · PROJECT</p>
          <h1
            className="font-display mt-4 font-extrabold text-white"
            style={{ fontSize: 'clamp(1.85rem, 5vw, 3.25rem)' }}
          >
            Project not <span className="text-[#A78BFA]">found.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            The project you are looking for may have been moved or removed. Explore the live
            portfolio to view current work.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#8B5CF6] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] hover:bg-[#A78BFA]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to portfolio</span>
          </Link>
        </main>

        <Footer
          onBackToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onOpenAdmin={onOpenAdmin}
        />
      </div>
    );
  }

  const { lead, accent } = splitHeadlineAccent(project.title);
  const previewSrc = resolveProjectPreview(project);
  const validLiveUrl = isValidExternalUrl(project.liveUrl) ? project.liveUrl : undefined;
  const activeVideoId = project.videoIds[activeVideoIndex] || project.videoIds[0] || '';
  const prevProject =
    projects.length > 1
      ? projects[(currentIndex - 1 + projects.length) % projects.length]
      : null;
  const nextProject =
    projects.length > 1 ? projects[(currentIndex + 1) % projects.length] : null;
  const moreProjects = projects.filter((p) => p.id !== project.id).slice(0, 3);
  const accentColor = project.accentColor || '#8B5CF6';

  return (
    <div
      style={{ paddingTop: 'var(--nav-h, 68px)' }}
      className="relative min-h-[100svh] w-full max-w-full overflow-x-clip bg-[#07050d] text-white"
    >
      <main className="relative overflow-x-clip">
        {/* Project-Specific Gradient Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-[480px] w-[min(960px,100%)] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${accentColor}38 0%, ${accentColor}14 45%, transparent 72%)`,
          }}
        />

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="site-container relative z-10 pb-[clamp(2rem,5svh,3rem)] pt-[clamp(1.75rem,5svh,3.5rem)] text-center"
        >
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={handleBackToPortfolio}
              className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/85 transition-colors hover:border-white/35 hover:text-white active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span>Back to Portfolio</span>
            </button>
          </div>

          <p className="font-mono-label text-[11px] font-medium" style={{ color: accentColor }}>
            {project.category} · {project.year || '2026'}
          </p>

          <h1
            className="font-display wrap-anywhere mx-auto mt-4 max-w-[min(100%,22ch)] text-balance font-extrabold leading-[1.02] tracking-tight text-white"
            style={{ fontSize: 'clamp(1.85rem, min(5.5vw, 8svh), 4.75rem)' }}
          >
            {lead ? `${lead} ` : ''}
            <span style={{ color: accentColor }}>{accent}</span>
          </h1>

          <p className="mx-auto mt-4 max-w-[60ch] text-base leading-relaxed text-white/75 sm:mt-5 sm:text-lg">
            {project.tagline}
          </p>

          {project.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="wrap-anywhere rounded-full border bg-white/[0.04] px-3.5 py-1 font-mono text-[11px] text-white/85 backdrop-blur-md"
                  style={{ borderColor: `${accentColor}40` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.section>

        {/* Big Preview Inside Browser-Window Frame (16:9 full container width) */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="site-container relative z-10 pb-[clamp(2.5rem,6svh,3.75rem)]"
        >
          <div
            className="overflow-hidden rounded-[22px] border bg-[#0b0814]"
            style={{
              borderColor: `${accentColor}55`,
              boxShadow: `0 0 80px ${accentColor}30, 0 30px 90px rgba(0,0,0,0.85)`,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#100c1c] px-4 py-3 sm:px-6">
              <div className="flex shrink-0 items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>

              <div className="mx-auto min-w-0 max-w-sm flex-1 truncate rounded-lg border border-white/[0.08] bg-[#07050d]/85 px-4 py-1 text-center font-mono text-xs text-white/65">
                {getDisplayHost(validLiveUrl, project.title)}
              </div>

              <span
                className="hidden shrink-0 font-mono text-[10px] sm:inline"
                style={{ color: accentColor }}
              >
                {project.category}
              </span>
            </div>

            <div
              className="relative aspect-[16/9] w-full overflow-hidden bg-[#120d20]"
              style={{ background: project.gradient }}
            >
              {!previewError && !previewLoaded && !project.hasPerson && (
                <div
                  className="absolute inset-0 animate-pulse"
                  style={{ background: project.gradient }}
                />
              )}

              {!previewError ? (
                <img
                  src={previewSrc}
                  alt={`${project.title} full preview`}
                  referrerPolicy="no-referrer"
                  onLoad={() => setPreviewLoaded(true)}
                  onError={() => setPreviewError(true)}
                  className={`h-full w-full object-cover ${
                    project.hasPerson
                      ? 'object-top opacity-100'
                      : `object-center transition-opacity duration-300 ${
                          previewLoaded ? 'opacity-100' : 'opacity-0'
                        }`
                  }`}
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center p-6 text-center sm:p-8"
                  style={{ background: project.gradient }}
                >
                  <CategoryIcon
                    category={project.category}
                    color={accentColor}
                    sizeClass="h-12 w-12"
                  />
                  <p className="font-display mt-4 text-xl font-bold text-white sm:text-2xl">
                    {project.title}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-white/70">{project.tagline}</p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Dedicated Video Section (shown when project has videoIds) */}
        {project.videoIds.length > 0 && activeVideoId && (
          <section className="site-container relative z-10 pb-[clamp(2.5rem,6svh,3.75rem)]">
            <div
              className="rounded-[22px] border bg-white/[0.03] p-5 backdrop-blur-xl sm:p-7"
              style={{ borderColor: `${accentColor}38` }}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p
                    className="font-mono-label text-[10px]"
                    style={{ color: accentColor }}
                  >
                    VIDEO SHOWCASE
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-white">
                    {project.videoIds.length > 1
                      ? `Video ${activeVideoIndex + 1} of ${project.videoIds.length}`
                      : 'Featured Video'}
                  </h2>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-1.5 font-mono text-xs hover:text-white"
                  style={{ color: accentColor }}
                >
                  <span>Open on YouTube</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0814]">
                <img
                  src={`https://img.youtube.com/vi/${activeVideoId}/hqdefault.jpg`}
                  alt={`${project.title} video poster`}
                  referrerPolicy="no-referrer"
                  onLoad={() => setVideoPosterLoaded(true)}
                  className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity ${
                    videoPosterLoaded ? 'opacity-40' : 'opacity-0'
                  }`}
                />
                <iframe
                  key={activeVideoId}
                  src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?rel=0`}
                  title={`${project.title} video player`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="relative z-10 h-full w-full border-0"
                />
              </div>

              {project.videoIds.length > 1 && (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {project.videoIds.map((vid, idx) => {
                    const isActive = idx === activeVideoIndex;
                    return (
                      <button
                        key={vid}
                        type="button"
                        onClick={() => setActiveVideoIndex(idx)}
                        style={
                          isActive
                            ? { borderColor: accentColor, boxShadow: `0 0 20px ${accentColor}40` }
                            : undefined
                        }
                        className={`group relative aspect-video min-h-[44px] overflow-hidden rounded-xl border text-left transition-all ${
                          isActive
                            ? 'opacity-100'
                            : 'border-white/10 opacity-75 hover:border-white/35 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`}
                          alt={`Video ${idx + 1} thumbnail`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#07050d]/85 text-white">
                            <Play className="ml-0.5 h-4 w-4 fill-white" />
                          </span>
                        </div>
                        <span className="absolute bottom-1.5 left-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-white">
                          Video {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Details, Role, Tools, Stats & Action Buttons */}
        <section className="site-container relative z-10 pb-[clamp(2.5rem,7svh,4.5rem)]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div
              className="space-y-6 rounded-2xl border border-white/10 p-6 backdrop-blur-xl sm:p-8 lg:col-span-7"
              style={{ background: project.gradient }}
            >
              <div>
                <p className="font-mono-label text-[10px]" style={{ color: accentColor }}>
                  OVERVIEW
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">About this project</h2>
                <p className="wrap-anywhere mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
                  {project.description}
                </p>
              </div>

              <div className="border-t border-white/[0.1] pt-5">
                <p className="font-mono-label text-[10px]" style={{ color: accentColor }}>
                  WHAT I DID
                </p>
                <p className="wrap-anywhere mt-2 text-sm leading-relaxed text-white/85">
                  {project.role}
                </p>
              </div>

              {project.stats && project.stats.length > 0 && (
                <div className="grid grid-cols-1 gap-3 border-t border-white/[0.1] pt-5 sm:grid-cols-3">
                  {project.stats.slice(0, 3).map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/10 bg-[#07050d]/80 p-3 text-center"
                    >
                      <p
                        className="font-display tabular-nums text-lg font-bold sm:text-xl"
                        style={{ color: accentColor }}
                      >
                        {stat.value}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-white/60">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8 lg:col-span-5">
              <div>
                <p className="font-mono-label text-[10px]" style={{ color: accentColor }}>
                  TOOLS &amp; STACK
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0b0814] px-3 py-2 text-xs font-medium text-white/85"
                    >
                      <CategoryIcon category={project.category} color={accentColor} />
                      <span>{tool}</span>
                    </span>
                  ))}
                  {project.tools.length === 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
                      <Wrench className="h-3.5 w-3.5" style={{ color: accentColor }} />
                      <span>Custom Workflow</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons (>=44px tap targets) */}
              <div className="space-y-3 border-t border-white/[0.08] pt-5">
                {validLiveUrl && (
                  <a
                    href={validLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 24px ${accentColor}55`,
                    }}
                  >
                    <span>Visit Live Site</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}

                {activeVideoId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                    style={{ borderColor: `${accentColor}55` }}
                  >
                    <Play className="h-4 w-4" style={{ color: accentColor }} />
                    <span>Watch on YouTube ↗</span>
                  </a>
                )}

                <a
                  href={SOCIAL_URLS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  title="YouTube"
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/90 transition-all duration-200 hover:border-violet-400/60 hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                >
                  <Youtube className="h-4 w-4" style={{ color: accentColor }} />
                  <span>My YouTube Channel</span>
                </a>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  {SOCIAL_LINKS.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="hover-icon-float flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/75 transition-all duration-200"
                    >
                      <SocialBrandIcon id={item.id} className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Previous / Next Navigation + More Projects Row */}
        <section className="site-container relative z-10 border-t border-white/[0.08] py-[clamp(2.5rem,6svh,3.75rem)]">
          {(prevProject || nextProject) && (
            <div className="flex flex-col items-stretch justify-between gap-4 pb-12 sm:flex-row sm:flex-wrap sm:items-center">
              {prevProject ? (
                <Link
                  to={`/project/${prevProject.id}`}
                  className="group inline-flex min-h-[56px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/35"
                >
                  <ArrowLeft
                    className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5"
                    style={{ color: prevProject.accentColor }}
                  />
                  <div className="min-w-0 text-left">
                    <p className="font-mono text-[10px] uppercase text-white/45">
                      Previous project
                    </p>
                    <p className="wrap-anywhere text-sm font-semibold text-white">
                      {prevProject.title}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextProject && (
                <Link
                  to={`/project/${nextProject.id}`}
                  className="group inline-flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-right transition-colors hover:border-white/35 sm:ml-auto"
                >
                  <div className="min-w-0 flex-1 text-left sm:text-right">
                    <p className="font-mono text-[10px] uppercase text-white/45">Next project</p>
                    <p className="wrap-anywhere text-sm font-semibold text-white">
                      {nextProject.title}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{ color: nextProject.accentColor }}
                  />
                </Link>
              )}
            </div>
          )}

          {moreProjects.length > 0 && (
            <div>
              <p className="font-mono-label text-[10px]" style={{ color: accentColor }}>
                MORE PROJECTS
              </p>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {moreProjects.map((item) => {
                  const thumb = resolveProjectThumbnail(item);
                  const hasErr = moreImgErrors[item.id];
                  return (
                    <a
                      key={item.id}
                      href={`/project/${encodeURIComponent(item.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover-card-lift group overflow-hidden rounded-2xl border bg-[#0d0917] transition-all duration-200"
                      style={{
                        borderColor: `${item.accentColor}40`,
                        backgroundImage: item.gradient,
                      }}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#140f24]">
                        {!hasErr ? (
                          <img
                            src={thumb}
                            alt={item.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setMoreImgErrors((prev) => ({ ...prev, [item.id]: true }))
                            }
                            className={`h-full w-full object-cover ${
                              item.hasPerson
                                ? 'object-top'
                                : 'object-center transition-transform duration-300 group-hover:scale-105'
                            }`}
                          />
                        ) : (
                          <div
                            className="flex h-full w-full flex-col items-center justify-center p-4 text-center"
                            style={{ background: item.gradient }}
                          >
                            <CategoryIcon category={item.category} color={item.accentColor} />
                            <span className="mt-2 text-sm font-semibold text-white/90">
                              {item.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="bg-[#0b0814]/90 p-4">
                        <p
                          className="font-mono text-[10px] uppercase tracking-wider"
                          style={{ color: item.accentColor }}
                        >
                          {item.category}
                          {item.tags[0] ? ` · ${item.tags[0]}` : ''}
                        </p>
                        <h3 className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-white">
                          <span className="truncate">{item.title}</span>
                          <ArrowUpRight
                            className="h-4 w-4 shrink-0"
                            style={{ color: item.accentColor }}
                          />
                        </h3>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer
        onBackToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenAdmin={onOpenAdmin}
      />
    </div>
  );
}
