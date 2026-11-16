import type { ProjectItem, ServiceItem, StatItem } from '../types/portfolio';
import { isValidImageSrc } from '../utils/projectHelpers';
import { SOCIAL_URLS } from './social';

/**
 * Edit this file to customize Muhammad Talha's profile details,
 * stats, social links, and featured projects.
 *
 * - Project preview screenshots: /public/images/projects/project-1.png .. project-5.png
 *   (Note: project-2.png preserves your custom portrait/desk photo untouched.)
 * - YouTube videos: paste 11-character IDs (or full YouTube links) into `videoIds: ['...']`
 */
export const PROFILE = {
  name: 'Muhammad Talha',
  brandShort: 'TS',
  rolesLine: 'Web Developer · Video Editor · Designer',
  location: 'Lahore, Pakistan',
  email: 'talha8786815@gmail.com',
  whatsappNumber: '923221408422',
  whatsappDisplay: '0322-1408422',
  assets: {
    logo: '/assets/aistudio/TS_Monogram_dark_neon_6d9e9b3b.png',
    portrait: '/images/me.png',
    sceneDesk: '/images/scene-desk.png?v=2',
    sceneLaptop: '/images/scene-laptop.png',
  },
  socials: {
    youtube: SOCIAL_URLS.youtube,
    linkedin: SOCIAL_URLS.linkedin,
    instagram: SOCIAL_URLS.instagram,
    email: 'mailto:talha8786815@gmail.com',
    whatsapp:
      'https://wa.me/923221408422?text=Assalamu%20Alaikum%20Talha%2C%20I%20would%20like%20to%20discuss%20a%20project.',
  },
} as const;

export const STATS: StatItem[] = [
  {
    id: 'experience',
    value: 4,
    suffix: '+',
    label: 'Years Online Experience',
  },
  {
    id: 'projects',
    value: 38,
    suffix: '',
    label: 'Live Projects & Identities',
  },
  {
    id: 'satisfaction',
    value: 100,
    suffix: '%',
    label: 'Client Satisfaction',
  },
  {
    id: 'chai',
    value: null,
    suffix: '',
    displayFallback: '∞',
    label: 'Cups of Chai & Ideas',
  },
];

export const MISSION_WORDS: Array<{ text: string; highlight?: boolean }> = [
  { text: 'Everyone' },
  { text: 'deserves' },
  { text: 'to' },
  { text: 'be' },
  { text: 'seen' },
  { text: 'online.' },
  { text: 'My' },
  { text: 'mission' },
  { text: 'is' },
  { text: 'to' },
  { text: 'get' },
  { text: 'people' },
  { text: 'on' },
  { text: 'the' },
  { text: 'web' },
  { text: 'with' },
  { text: 'a' },
  { text: 'site' },
  { text: 'that' },
  { text: 'looks' },
  { text: 'professional,' },
  { text: 'matches' },
  { text: 'their' },
  { text: 'brand,' },
  { text: 'and' },
  { text: 'works', highlight: true },
  { text: 'as', highlight: true },
  { text: 'hard', highlight: true },
  { text: 'as', highlight: true },
  { text: 'they', highlight: true },
  { text: 'do.', highlight: true },
];

export const SERVICES: ServiceItem[] = [
  {
    id: 'web-development',
    title: 'Web Development',
    description: 'Fast, responsive React & Next.js sites engineered to convert visitors into clients.',
    bullets: [
      'Custom motion & scroll choreography',
      'Clean full-stack APIs & CMS control',
      'Technical SEO & sub-second load speeds',
    ],
    iconName: 'code',
  },
  {
    id: 'video-editing',
    title: 'Video Editing',
    description: 'Story-first documentary & YouTube editing crafted for clarity and high retention.',
    bullets: [
      'Kinetic bilingual typography & captions',
      'Clean color grading & serene pacing',
      'YouTube long-form & vertical reels',
    ],
    iconName: 'film',
  },
  {
    id: 'ui-design',
    title: 'Graphic & UI Design',
    description: 'Cohesive brand identities and interface systems built around unmistakable craft.',
    bullets: [
      'Figma design systems & wireframes',
      'Logo marks, monograms & brand guides',
      'High-contrast editorial web typography',
    ],
    iconName: 'layers',
  },
];

export const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'project-1',
    slug: 'al-bayan-digital',
    title: 'Al-Bayan Digital',
    tagline:
      'Bilingual Quranic reflection & translation reading experience built for calm daily study.',
    category: 'Development',
    tags: ['React', 'Tailwind CSS', 'Typography'],
    thumbnail: '/images/projects/project-1.png',
    previewImage: '/images/projects/project-1.png',
    videoIds: [],
    liveUrl: SOCIAL_URLS.youtube,
    description:
      'Designed and built a distraction-free bilingual reading interface with responsive Arabic-English typography, instant verse navigation, and sub-second page delivery.',
    role: 'Lead Full-Stack Developer & UI Architect — built the React front-end, responsive typography scale, and dark-mode reading layout.',
    tools: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    accentColor: '#8B5CF6',
    gradient:
      'linear-gradient(135deg, rgba(139, 92, 246, 0.36) 0%, rgba(28, 16, 56, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'tall',
    hoverEffect: 'lift-glow',
    stats: [
      { label: 'Lighthouse Score', value: '99/100' },
      { label: 'Load Time', value: '0.6s' },
      { label: 'Reading Modes', value: '3' },
    ],
    year: '2026',
  },
  {
    id: 'project-2',
    slug: 'architectura-studio',
    title: 'Architectura Studio',
    tagline: 'Editorial dark-mode showcase & project inquiry platform for a Lahore architecture firm.',
    category: 'Development',
    tags: ['Next.js', 'GSAP', 'Brand Web'],
    thumbnail: '/images/projects/project-2.png?v=2',
    previewImage: '/images/projects/project-2.png?v=2',
    videoIds: [],
    description:
      'Editorial architectural showcase engineered for crisp structural photography, scroll-paced case studies, and structured client consultation requests.',
    role: 'Web Developer & Motion Designer — implemented scroll choreography, responsive grid architecture, and inquiry API.',
    tools: ['React', 'GSAP', 'Tailwind CSS', 'Node.js'],
    accentColor: '#38BDF8',
    gradient:
      'linear-gradient(135deg, rgba(56, 189, 248, 0.28) 0%, rgba(12, 30, 52, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'wide',
    hoverEffect: 'zoom-pan',
    hasPerson: true,
    stats: [
      { label: 'Client Inquiries', value: '+140%' },
      { label: 'Mobile Speed', value: '97/100' },
      { label: 'Case Studies', value: '12' },
    ],
    year: '2026',
  },
  {
    id: 'project-3',
    slug: 'khyber-roast-commerce',
    title: 'Khyber Roast Co.',
    tagline: 'Specialty coffee & artisanal chai storefront with instant cart choreography.',
    category: 'Development',
    tags: ['E-Commerce', 'UI Engineering', 'Responsive'],
    thumbnail: '/images/projects/project-3.png',
    previewImage: '/images/projects/project-3.png',
    videoIds: [],
    description:
      'Clean product catalog and direct ordering experience crafted for fast checkout on mobile connections while preserving warm editorial packaging aesthetics.',
    role: 'Frontend Engineer & Storefront Designer — crafted product cards, cart interactions, and mobile checkout flow.',
    tools: ['React', 'TypeScript', 'Tailwind CSS', 'Express'],
    accentColor: '#D4AF37',
    gradient:
      'linear-gradient(135deg, rgba(212, 175, 55, 0.32) 0%, rgba(44, 30, 12, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'square',
    hoverEffect: 'tilt-shine',
    stats: [
      { label: 'Checkout Steps', value: '2' },
      { label: 'Avg Session', value: '3m 40s' },
      { label: 'Mobile Traffic', value: '78%' },
    ],
    year: '2025',
  },
  {
    id: 'project-4',
    slug: 'quran-translators-series',
    title: 'Quran Translators Series',
    tagline: 'Kinetic typography, clean documentary pacing, and serene nature visuals for YouTube.',
    category: 'Editing',
    tags: ['Premiere Pro', 'After Effects', 'YouTube'],
    thumbnail: '/images/projects/project-4.png',
    previewImage: '/images/projects/project-4.png',
    videoIds: [],
    liveUrl: SOCIAL_URLS.youtube,
    description:
      'Full documentary-style video editing pipeline pairing serene mountain and dawn landscapes with synchronized Arabic-English kinetic subtitles for calm reflection.',
    role: 'Senior Video Editor & Motion Typographer — handled color grading, subtitle timing, and custom animated title cards.',
    tools: ['Premiere Pro', 'After Effects', 'DaVinci Resolve'],
    accentColor: '#34D399',
    gradient:
      'linear-gradient(135deg, rgba(52, 211, 153, 0.30) 0%, rgba(10, 42, 34, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'wide',
    hoverEffect: 'border-pulse',
    stats: [
      { label: 'Avg Retention', value: '68%' },
      { label: 'Resolution', value: '4K HDR' },
      { label: 'Turnaround', value: '48 hrs' },
    ],
    year: '2026',
  },
  {
    id: 'project-5',
    slug: 'aether-brand-system',
    title: 'Aether Brand System',
    tagline: 'Complete modular UI design system, monogram identity, and responsive product guidelines.',
    category: 'Design',
    tags: ['Brand Identity', 'Design System', 'Figma'],
    thumbnail: '/images/projects/project-5.png',
    previewImage: '/images/projects/project-5.png',
    videoIds: [],
    description:
      'Comprehensive visual identity and Figma component library spanning custom geometric monogram construction, typographic scale tokens, and dark-mode dashboard templates.',
    role: 'Brand & UI/UX Designer — designed the monogram mark, token architecture, and multi-device design system.',
    tools: ['Figma', 'Illustrator', 'Photoshop'],
    accentColor: '#F472B6',
    gradient:
      'linear-gradient(135deg, rgba(244, 114, 182, 0.30) 0%, rgba(48, 16, 40, 0.88) 58%, rgba(7, 5, 13, 0.98) 100%)',
    cardLayout: 'tall',
    hoverEffect: 'slide-reveal',
    stats: [
      { label: 'UI Components', value: '85+' },
      { label: 'Color Tokens', value: '32' },
      { label: 'Breakpoints', value: '4' },
    ],
    year: '2025',
  },
];

export function resolveProjectThumbnail(project: ProjectItem): string {
  if (isValidImageSrc(project.thumbnail)) {
    return project.thumbnail;
  }
  if (project.videoIds && project.videoIds.length > 0) {
    return `https://img.youtube.com/vi/${project.videoIds[0]}/hqdefault.jpg`;
  }
  if (isValidImageSrc(project.previewImage)) {
    return project.previewImage;
  }
  return '/images/projects/project-1.png';
}

export function resolveProjectPreview(project: ProjectItem): string {
  if (isValidImageSrc(project.previewImage)) {
    return project.previewImage;
  }
  if (project.videoIds && project.videoIds.length > 0) {
    return `https://img.youtube.com/vi/${project.videoIds[0]}/hqdefault.jpg`;
  }
  return resolveProjectThumbnail(project);
}
