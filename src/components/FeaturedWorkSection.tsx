import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Matter from 'matter-js';
import { ArrowUpRight, Code2, Film, Layers, Play, RotateCcw } from 'lucide-react';
import { resolveProjectThumbnail } from '../data/portfolioData';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { CardHoverEffect, CardLayout, ProjectCategory, ProjectItem } from '../types/portfolio';

interface FeaturedWorkSectionProps {
  projects: ProjectItem[];
}

function getCardDimensions(layout: CardLayout, isMobile: boolean): { w: number; h: number } {
  if (isMobile) {
    if (layout === 'tall') return { w: 152, h: 204 };
    if (layout === 'wide') return { w: 198, h: 146 };
    return { w: 168, h: 168 };
  }
  if (layout === 'tall') return { w: 196, h: 256 };
  if (layout === 'wide') return { w: 274, h: 188 };
  return { w: 218, h: 218 };
}

function getHoverClasses(effect: CardHoverEffect): string {
  switch (effect) {
    case 'zoom-pan':
      return 'hover:-translate-y-0.5 [&:hover_img]:scale-105 [&:hover_img]:translate-x-1';
    case 'tilt-shine':
      return 'hover:scale-[1.02]';
    case 'border-pulse':
      return 'hover:brightness-110';
    case 'slide-reveal':
      return 'hover:-translate-y-1';
    case 'lift-glow':
    default:
      return 'hover:-translate-y-1';
  }
}

function CategoryFallbackIcon({
  category,
  color,
}: {
  category: ProjectCategory;
  color: string;
}) {
  const style = { color };
  if (category === 'Editing') return <Film className="h-7 w-7" style={style} />;
  if (category === 'Design') return <Layers className="h-7 w-7" style={style} />;
  return <Code2 className="h-7 w-7" style={style} />;
}

export function FeaturedWorkSection({ projects }: FeaturedWorkSectionProps) {
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const dimsRef = useRef<Array<{ w: number; h: number }>>([]);
  const rafIdRef = useRef<number>(0);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const reducedMotion = usePrefersReducedMotion();

  const displayedProjects = useMemo(() => projects.slice(0, 5), [projects]);
  const layoutSignature = displayedProjects
    .map((p) => `${p.id}:${p.cardLayout}:${p.accentColor}`)
    .join('|');

  const openProjectPage = useCallback(
    (project: ProjectItem) => {
      const targetUrl = `/project/${encodeURIComponent(project.id)}`;
      const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      if (!win) {
        navigate(targetUrl);
      }
    },
    [navigate]
  );

  const syncDomOnce = useCallback(() => {
    bodiesRef.current.forEach((body, idx) => {
      const el = cardRefs.current[idx];
      const dims = dimsRef.current[idx];
      if (!el || !dims) return;
      const x = body.position.x - dims.w / 2;
      const y = body.position.y - dims.h / 2;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${body.angle.toFixed(4)}rad)`;
    });
  }, []);

  const resetPositions = useCallback(() => {
    const stage = stageRef.current;
    const bodies = bodiesRef.current;
    if (!stage || bodies.length === 0) return;

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const cols = width < 640 ? 2 : 3;

    bodies.forEach((body, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cellW = width / cols;
      const dims = dimsRef.current[idx] || { w: 210, h: 210 };
      const x = Math.max(
        dims.w / 2 + 12,
        Math.min(width - dims.w / 2 - 12, cellW * (col + 0.5) + (idx % 2 === 0 ? -10 : 10))
      );
      const y = Math.max(
        dims.h / 2 + 16,
        Math.min(height - dims.h / 2 - 16, 130 + row * 225)
      );
      Matter.Body.setPosition(body, { x, y });
      Matter.Body.setVelocity(body, { x: (idx - 2) * 0.55, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
      Matter.Body.setAngle(body, ((idx % 2 === 0 ? -1 : 1) * (2.5 + idx * 1.6) * Math.PI) / 180);
    });
    syncDomOnce();
  }, [syncDomOnce]);

  useEffect(() => {
    if (reducedMotion) return;
    const stage = stageRef.current;
    if (!stage) return;

    const width = stage.clientWidth || 960;
    const height = stage.clientHeight || 580;
    const isMobile = width < 640;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.24, scale: 0.001 },
    });
    engineRef.current = engine;

    const wallThickness = 120;
    const createWalls = (w: number, h: number) => [
      Matter.Bodies.rectangle(w / 2, -wallThickness / 2, w + 240, wallThickness, {
        isStatic: true,
        restitution: 0.65,
      }),
      Matter.Bodies.rectangle(w / 2, h + wallThickness / 2, w + 240, wallThickness, {
        isStatic: true,
        restitution: 0.65,
      }),
      Matter.Bodies.rectangle(-wallThickness / 2, h / 2, wallThickness, h + 240, {
        isStatic: true,
        restitution: 0.65,
      }),
      Matter.Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h + 240, {
        isStatic: true,
        restitution: 0.65,
      }),
    ];

    let walls = createWalls(width, height);
    const cols = isMobile ? 2 : 3;

    const dimsList = displayedProjects.map((p) => getCardDimensions(p.cardLayout, isMobile));
    dimsRef.current = dimsList;

    const bodies = displayedProjects.map((_, idx) => {
      const { w: cardW, h: cardH } = dimsList[idx];
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cellW = width / cols;
      const startX = Math.max(
        cardW / 2 + 16,
        Math.min(width - cardW / 2 - 16, cellW * (col + 0.5))
      );
      const startY = Math.max(
        cardH / 2 + 16,
        Math.min(height - cardH / 2 - 16, 130 + row * 225)
      );
      const initialAngle = ((idx % 2 === 0 ? -1 : 1) * (2.5 + idx * 1.6) * Math.PI) / 180;

      return Matter.Bodies.rectangle(startX, startY, cardW, cardH, {
        restitution: 0.65,
        friction: 0.08,
        frictionAir: 0.018,
        density: 0.002,
        angle: initialAngle,
        chamfer: { radius: 14 },
      });
    });

    bodiesRef.current = bodies;
    Matter.Composite.add(engine.world, [...walls, ...bodies]);

    const mouse = Matter.Mouse.create(stage);
    const mouseAny = mouse as unknown as {
      mousewheel?: EventListener;
      element: HTMLElement;
    };
    if (mouseAny.mousewheel) {
      mouse.element.removeEventListener('wheel', mouseAny.mousewheel);
      mouse.element.removeEventListener('DOMMouseScroll', mouseAny.mousewheel);
    }

    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.22,
        damping: 0.12,
        render: { visible: false },
      },
    });
    Matter.Composite.add(engine.world, mouseConstraint);

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    const loop = () => {
      syncDomOnce();
      rafIdRef.current = requestAnimationFrame(loop);
    };
    syncDomOnce();
    rafIdRef.current = requestAnimationFrame(loop);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextW = entry.contentRect.width;
      const nextH = entry.contentRect.height;
      if (!nextW || !nextH) return;

      Matter.Composite.remove(engine.world, walls);
      walls = createWalls(nextW, nextH);
      Matter.Composite.add(engine.world, walls);

      bodies.forEach((body, idx) => {
        const dims = dimsRef.current[idx] || { w: 210, h: 210 };
        const clampedX = Math.max(
          dims.w / 2 + 12,
          Math.min(nextW - dims.w / 2 - 12, body.position.x)
        );
        const clampedY = Math.max(
          dims.h / 2 + 12,
          Math.min(nextH - dims.h / 2 - 12, body.position.y)
        );
        Matter.Body.setPosition(body, { x: clampedX, y: clampedY });
      });
      syncDomOnce();
    });

    resizeObserver.observe(stage);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      resizeObserver.disconnect();
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      runnerRef.current = null;
      engineRef.current = null;
      bodiesRef.current = [];
    };
  }, [layoutSignature, displayedProjects, reducedMotion, syncDomOnce]);

  const handleCardPointerDown = (projectId: string, e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    setDraggingId(projectId);
  };

  const handleCardPointerUp = (project: ProjectItem, e: React.PointerEvent) => {
    setDraggingId(null);
    if (!pointerDownPos.current) return;
    const dist = Math.hypot(
      e.clientX - pointerDownPos.current.x,
      e.clientY - pointerDownPos.current.y
    );
    pointerDownPos.current = null;
    if (dist < 5) {
      openProjectPage(project);
    }
  };

  return (
    <section
      id="work"
      className="relative z-10 bg-[#07050d] px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="font-mono-label text-[11px] font-medium text-[#A78BFA]">
            FEATURED WORK
          </p>
          <h2
            className="font-display mt-4 text-balance font-extrabold leading-[0.98] tracking-tight text-white"
            style={{ fontSize: 'clamp(2.25rem, 6vw, 4.75rem)' }}
          >
            Five live sites.
            <br />
            <span className="text-[#A78BFA]">Go play.</span>
          </h2>
          <p className="font-mono-label mt-5 text-[10px] text-white/55 sm:text-xs">
            GRAB THEM. THROW THEM. CLICK ONE TO OPEN ITS PAGE.
          </p>
        </div>

        {/* Browser Window Frame */}
        <div className="mt-12 overflow-hidden rounded-[22px] border border-violet-500/30 bg-[#0b0814] shadow-[0_0_80px_rgba(139,92,246,0.18),0_28px_80px_rgba(0,0,0,0.8)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#100c1c] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-xs truncate rounded-lg border border-white/[0.08] bg-[#07050d]/80 px-4 py-1 text-center font-mono text-xs text-white/65">
                talha.dev/work
              </div>
            </div>

            {!reducedMotion && (
              <button
                type="button"
                onClick={resetPositions}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/75 transition-colors hover:border-violet-400/40 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#A78BFA]" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {reducedMotion ? (
            <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedProjects.map((project) => {
                const thumb = resolveProjectThumbnail(project);
                const hasError = imageErrors[project.id];
                const isLoaded = imageLoaded[project.id];
                const layoutSpan =
                  project.cardLayout === 'wide' ? 'sm:col-span-2 lg:col-span-2' : '';

                return (
                  <a
                    key={project.id}
                    href={`/project/${encodeURIComponent(project.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group overflow-hidden rounded-2xl border bg-[#120e1e] text-left transition-all duration-200 ${layoutSpan} ${
                      project.hasPerson ? 'hover:-translate-y-0.5' : getHoverClasses(project.hoverEffect)
                    }`}
                    style={{
                      borderColor: `${project.accentColor}40`,
                      backgroundImage: project.gradient,
                    }}
                  >
                    <div
                      className={`relative w-full overflow-hidden bg-[#171226] ${
                        project.cardLayout === 'tall'
                          ? 'aspect-[3/4]'
                          : project.cardLayout === 'wide'
                            ? 'aspect-[16/9]'
                            : 'aspect-square'
                      }`}
                    >
                      {!hasError && !isLoaded && !project.hasPerson && (
                        <div
                          className="absolute inset-0 animate-pulse"
                          style={{ background: project.gradient }}
                        />
                      )}
                      {!hasError ? (
                        <img
                          src={thumb}
                          alt={project.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onLoad={() =>
                            setImageLoaded((prev) => ({ ...prev, [project.id]: true }))
                          }
                          onError={() =>
                            setImageErrors((prev) => ({ ...prev, [project.id]: true }))
                          }
                          className={`h-full w-full object-cover ${
                            project.hasPerson
                              ? 'object-top opacity-100'
                              : `object-center transition-transform duration-300 ${
                                  isLoaded ? 'opacity-100' : 'opacity-0'
                                }`
                          }`}
                        />
                      ) : (
                        <div
                          className="flex h-full w-full flex-col items-center justify-center p-4 text-center"
                          style={{ background: project.gradient }}
                        >
                          <CategoryFallbackIcon
                            category={project.category}
                            color={project.accentColor}
                          />
                          <span className="mt-2 text-xs font-medium text-white/90">
                            {project.title}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p
                        className="font-mono text-[10px] uppercase tracking-wider"
                        style={{ color: project.accentColor }}
                      >
                        {project.category}
                        {project.tags[0] ? ` · ${project.tags[0]}` : ''}
                      </p>
                      <h3 className="mt-1.5 text-base font-semibold text-white">
                        {project.title}
                      </h3>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div
              ref={stageRef}
              className="relative h-[540px] w-full select-none overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.1)_0%,rgba(7,5,13,0.98)_75%)] sm:h-[600px]"
              style={{ touchAction: 'pan-y' }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(167, 139, 250, 0.35) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              />

              {displayedProjects.map((project, idx) => {
                const thumb = resolveProjectThumbnail(project);
                const hasError = imageErrors[project.id];
                const isLoaded = imageLoaded[project.id];
                const isVideo =
                  project.category === 'Editing' || project.videoIds.length > 0;
                const isDragging = draggingId === project.id;
                const isHovered = hoveredId === project.id;
                const desktopDims = getCardDimensions(project.cardLayout, false);
                const mobileDims = getCardDimensions(project.cardLayout, true);

                return (
                  <div
                    key={project.id}
                    ref={(el) => {
                      cardRefs.current[idx] = el;
                    }}
                    onPointerDown={(e) => handleCardPointerDown(project.id, e)}
                    onPointerUp={(e) => handleCardPointerUp(project, e)}
                    onPointerEnter={() => setHoveredId(project.id)}
                    onPointerLeave={() => setHoveredId(null)}
                    onPointerCancel={() => setDraggingId(null)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openProjectPage(project);
                      }
                    }}
                    aria-label={`Open ${project.title} project page in new tab`}
                    style={
                      {
                        touchAction: 'none',
                        '--card-w-mobile': `${mobileDims.w}px`,
                        '--card-h-mobile': `${mobileDims.h}px`,
                        '--card-w-desktop': `${desktopDims.w}px`,
                        '--card-h-desktop': `${desktopDims.h}px`,
                        borderColor: isDragging || isHovered
                          ? project.accentColor
                          : `${project.accentColor}45`,
                        boxShadow: isDragging
                          ? `0 24px 60px ${project.accentColor}55`
                          : isHovered
                            ? `0 20px 48px ${project.accentColor}38`
                            : '0 18px 40px rgba(0,0,0,0.65)',
                        background: project.gradient,
                      } as React.CSSProperties
                    }
                    className={`physics-card group absolute top-0 left-0 flex h-[var(--card-h-mobile)] w-[var(--card-w-mobile)] flex-col overflow-hidden rounded-[16px] border transition-[border-color,box-shadow] duration-200 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:h-[var(--card-h-desktop)] sm:w-[var(--card-w-desktop)] ${
                      isDragging ? 'z-30 cursor-grabbing' : 'z-10 cursor-grab'
                    }`}
                  >
                    {/* Distinct top accent hairline */}
                    <div
                      aria-hidden="true"
                      className="h-[2px] w-full shrink-0"
                      style={{ backgroundColor: project.accentColor }}
                    />

                    {/* Media Frame: preserves person crop/focus with object-top and zero stretching */}
                    <div className="relative min-h-0 flex-1 w-full overflow-hidden bg-[#120e1e]">
                      {!hasError && !isLoaded && !project.hasPerson && (
                        <div
                          className="absolute inset-0 animate-pulse"
                          style={{ background: project.gradient }}
                        />
                      )}

                      {!hasError ? (
                        <img
                          src={thumb}
                          alt={project.title}
                          loading="lazy"
                          draggable={false}
                          referrerPolicy="no-referrer"
                          onLoad={() =>
                            setImageLoaded((prev) => ({ ...prev, [project.id]: true }))
                          }
                          onError={() =>
                            setImageErrors((prev) => ({ ...prev, [project.id]: true }))
                          }
                          className={`pointer-events-none h-full w-full object-cover ${
                            project.hasPerson
                              ? 'object-top opacity-100'
                              : `object-center transition-transform duration-300 ${
                                  project.hoverEffect === 'zoom-pan'
                                    ? 'group-hover:scale-105'
                                    : project.hoverEffect === 'tilt-shine'
                                      ? 'group-hover:scale-[1.03]'
                                      : ''
                                } ${isLoaded ? 'opacity-100' : 'opacity-0'}`
                          }`}
                        />
                      ) : (
                        <div
                          className="flex h-full w-full flex-col items-center justify-center p-3 text-center"
                          style={{ background: project.gradient }}
                        >
                          <CategoryFallbackIcon
                            category={project.category}
                            color={project.accentColor}
                          />
                          <span className="mt-1.5 text-xs font-semibold text-white/90">
                            {project.title}
                          </span>
                        </div>
                      )}

                      {isVideo && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                          <span
                            className="flex h-10 w-10 items-center justify-center rounded-full border bg-[#07050d]/85 text-white shadow-lg backdrop-blur-sm"
                            style={{ borderColor: `${project.accentColor}88` }}
                          >
                            <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-2 bg-[#0b0814]/90 p-3 backdrop-blur-md sm:p-3.5">
                      <div className="min-w-0">
                        <p
                          className="truncate font-mono text-[9px] uppercase tracking-wider sm:text-[10px]"
                          style={{ color: project.accentColor }}
                        >
                          {project.category}
                          {project.tags[0] ? ` · ${project.tags[0]}` : ''}
                        </p>
                        <h3 className="mt-0.5 truncate text-xs font-semibold text-white sm:text-sm">
                          {project.title}
                        </h3>
                      </div>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 opacity-80 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                        style={{ color: project.accentColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
