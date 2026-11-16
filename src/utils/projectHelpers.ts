import type {
  CardHoverEffect,
  CardLayout,
  ProjectCategory,
  ProjectItem,
  ProjectStat,
} from '../types/portfolio';
import { SOCIAL_URLS } from '../data/social';

const DEFAULT_PALETTES: Array<{
  accentColor: string;
  gradient: string;
  cardLayout: CardLayout;
  hoverEffect: CardHoverEffect;
}> = [
  {
    accentColor: '#8B5CF6',
    gradient:
      'linear-gradient(135deg, rgba(139, 92, 246, 0.36) 0%, rgba(28, 16, 56, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'tall',
    hoverEffect: 'lift-glow',
  },
  {
    accentColor: '#38BDF8',
    gradient:
      'linear-gradient(135deg, rgba(56, 189, 248, 0.28) 0%, rgba(12, 30, 52, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'wide',
    hoverEffect: 'zoom-pan',
  },
  {
    accentColor: '#D4AF37',
    gradient:
      'linear-gradient(135deg, rgba(212, 175, 55, 0.32) 0%, rgba(44, 30, 12, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'square',
    hoverEffect: 'tilt-shine',
  },
  {
    accentColor: '#34D399',
    gradient:
      'linear-gradient(135deg, rgba(52, 211, 153, 0.30) 0%, rgba(10, 42, 34, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'wide',
    hoverEffect: 'border-pulse',
  },
  {
    accentColor: '#F472B6',
    gradient:
      'linear-gradient(135deg, rgba(244, 114, 182, 0.30) 0%, rgba(48, 16, 40, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'square',
    hoverEffect: 'slide-reveal',
  },
];

export function buildGradientFromAccent(accentColor: string): string {
  const safeHex = isValidHexColor(accentColor) ? accentColor : '#8B5CF6';
  return `linear-gradient(135deg, ${safeHex}4D 0%, #120d22 58%, #07050d 100%)`;
}

export function isValidHexColor(value?: string | null): value is string {
  if (!value || typeof value !== 'string') return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

/**
 * Validates that a URL is an explicit http(s) URL (never "#", empty, or javascript:).
 */
export function isValidExternalUrl(value?: string | null): value is string {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '#') return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates an image source (relative "/...", data:image/..., or valid http(s) URL).
 */
export function isValidImageSrc(value?: string | null): value is string {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '#') return false;
  if (trimmed.startsWith('/')) return true;
  if (trimmed.startsWith('data:image/')) return true;
  return isValidExternalUrl(trimmed);
}

/**
 * Extracts an 11-character YouTube VIDEO_ID from any watch/shorts/youtu.be/embed link or raw ID.
 */
export function extractYoutubeVideoId(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const candidate = url.pathname.split('/').filter(Boolean)[0] || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : '';
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const vParam = url.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live');
      if (idx !== -1 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
        return parts[idx + 1];
      }
    }
  } catch {
    // Invalid URL; skip silently
  }
  return '';
}

export function extractYoutubeVideoIds(input: unknown): string[] {
  const rawList: string[] = Array.isArray(input)
    ? input.map((v) => String(v))
    : typeof input === 'string'
      ? input.split(/[\s,]+/)
      : [];

  const seen = new Set<string>();
  rawList.forEach((item) => {
    const id = extractYoutubeVideoId(item);
    if (id) seen.add(id);
  });
  return Array.from(seen);
}

export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project'
  );
}

export function normalizeCategory(raw?: string): ProjectCategory {
  if (!raw) return 'Development';
  const lower = raw.toLowerCase();
  if (lower.includes('edit') || lower.includes('video')) return 'Editing';
  if (lower.includes('design') || lower.includes('ui') || lower.includes('brand')) return 'Design';
  return 'Development';
}

export function normalizeCardLayout(raw?: string, fallback: CardLayout = 'square'): CardLayout {
  if (raw === 'tall' || raw === 'wide' || raw === 'square') return raw;
  return fallback;
}

export function normalizeHoverEffect(
  raw?: string,
  fallback: CardHoverEffect = 'lift-glow'
): CardHoverEffect {
  if (
    raw === 'lift-glow' ||
    raw === 'zoom-pan' ||
    raw === 'tilt-shine' ||
    raw === 'border-pulse' ||
    raw === 'slide-reveal'
  ) {
    return raw;
  }
  return fallback;
}

export function normalizeProject(
  raw: Partial<ProjectItem> & {
    url?: string;
    youtubeId?: string;
    videoId?: string;
    image?: string;
    accent?: string;
  },
  index = 0
): ProjectItem {
  const palette = DEFAULT_PALETTES[index % DEFAULT_PALETTES.length];
  const collectedVideoIds = extractYoutubeVideoIds([
    ...(Array.isArray(raw.videoIds) ? raw.videoIds : []),
    raw.videoId || '',
    raw.youtubeId || '',
  ]);

  const rawLive =
    (typeof raw.liveUrl === 'string' ? raw.liveUrl : '') ||
    (typeof raw.url === 'string' ? raw.url : '');
  const trimmedLive = rawLive.trim();
  const normalizedLive =
    trimmedLive === 'https://www.youtube.com/@Quran.Translators'
      ? SOCIAL_URLS.youtube
      : trimmedLive;
  const liveUrl = isValidExternalUrl(normalizedLive) ? normalizedLive : undefined;

  const fallbackNum = (index % 5) + 1;
  const fallbackImg =
    fallbackNum === 2
      ? '/images/projects/project-2.png?v=2'
      : `/images/projects/project-${fallbackNum}.png`;
  const rawThumb =
    (typeof raw.thumbnail === 'string' ? raw.thumbnail : '') ||
    (typeof raw.image === 'string' ? raw.image : '');
  const rawPreview =
    (typeof raw.previewImage === 'string' ? raw.previewImage : '') ||
    rawThumb;

  const withVersion = (src: string) =>
    src === '/images/projects/project-2.png'
      ? '/images/projects/project-2.png?v=2'
      : src;

  const thumbnail = isValidImageSrc(rawThumb)
    ? withVersion(rawThumb.trim())
    : collectedVideoIds[0]
      ? `https://img.youtube.com/vi/${collectedVideoIds[0]}/hqdefault.jpg`
      : fallbackImg;

  const previewImage = isValidImageSrc(rawPreview)
    ? withVersion(rawPreview.trim())
    : thumbnail;

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const tools = Array.isArray(raw.tools)
    ? raw.tools.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const stats: ProjectStat[] | undefined = Array.isArray(raw.stats)
    ? raw.stats
        .filter((s) => s && typeof s.label === 'string' && typeof s.value === 'string')
        .slice(0, 3)
    : undefined;

  const title =
    typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Untitled Project';
  const id =
    typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `project-${index + 1}`;
  const slug =
    typeof raw.slug === 'string' && raw.slug.trim() ? raw.slug.trim() : slugifyTitle(title);

  const accentColor = isValidHexColor(raw.accentColor)
    ? raw.accentColor.trim()
    : isValidHexColor(raw.accent)
      ? raw.accent.trim()
      : palette.accentColor;

  const gradient =
    typeof raw.gradient === 'string' && raw.gradient.trim()
      ? raw.gradient.trim()
      : palette.gradient;

  return {
    id,
    slug,
    title,
    tagline:
      typeof raw.tagline === 'string' && raw.tagline.trim()
        ? raw.tagline.trim()
        : 'Custom digital experience crafted by Muhammad Talha.',
    category: normalizeCategory(typeof raw.category === 'string' ? raw.category : undefined),
    tags: tags.length > 0 ? tags : ['Portfolio', 'Craft'],
    thumbnail,
    previewImage,
    videoIds: collectedVideoIds,
    liveUrl,
    description:
      typeof raw.description === 'string' && raw.description.trim()
        ? raw.description.trim()
        : typeof raw.tagline === 'string' && raw.tagline.trim()
          ? raw.tagline.trim()
          : 'Designed and engineered with performance, clarity, and responsive typography.',
    role:
      typeof raw.role === 'string' && raw.role.trim()
        ? raw.role.trim()
        : 'End-to-end Architecture, Visual Design & Implementation',
    tools: tools.length > 0 ? tools : ['React', 'TypeScript', 'Tailwind CSS'],
    accentColor,
    gradient,
    cardLayout: normalizeCardLayout(raw.cardLayout, palette.cardLayout),
    hoverEffect: normalizeHoverEffect(raw.hoverEffect, palette.hoverEffect),
    hasPerson: Boolean(raw.hasPerson) || id === 'project-2',
    stats,
    year: typeof raw.year === 'string' && raw.year.trim() ? raw.year.trim() : '2026',
  };
}

export function getDisplayHost(url?: string, fallbackLabel?: string): string {
  if (!isValidExternalUrl(url)) {
    return fallbackLabel ? `talha.dev/project/${slugifyTitle(fallbackLabel)}` : 'talha.dev/preview';
  }
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return 'talha.dev/preview';
  }
}

export function findProjectByParam(param: string | undefined, projects: ProjectItem[]): ProjectItem | null {
  if (!param) return null;
  const decoded = decodeURIComponent(param).trim().toLowerCase();
  return (
    projects.find(
      (p) => p.id.toLowerCase() === decoded || p.slug.toLowerCase() === decoded
    ) || null
  );
}
