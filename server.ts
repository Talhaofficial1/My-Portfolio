import express from 'express';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

dotenv.config();

type ProjectCategory = 'Development' | 'Editing' | 'Design';
type CardLayout = 'tall' | 'wide' | 'square';
type CardHoverEffect =
  | 'lift-glow'
  | 'zoom-pan'
  | 'tilt-shine'
  | 'border-pulse'
  | 'slide-reveal';

interface ProjectStat {
  label: string;
  value: string;
}

interface ProjectRecord {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: ProjectCategory;
  tags: string[];
  thumbnail: string;
  previewImage: string;
  videoIds: string[];
  liveUrl?: string;
  description: string;
  role: string;
  tools: string[];
  accentColor: string;
  gradient: string;
  cardLayout: CardLayout;
  hoverEffect: CardHoverEffect;
  hasPerson?: boolean;
  stats?: ProjectStat[];
  year?: string;
}

interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
  createdAt: string;
}

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'talha-portfolio-dev-secret-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'talha-admin-2026';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

const SEED_PROJECTS: ProjectRecord[] = [
  {
    id: 'project-1',
    slug: 'al-bayan-digital',
    title: 'Al-Bayan Digital',
    tagline: 'Bilingual Quranic reflection & translation reading experience built for calm daily study.',
    category: 'Development',
    tags: ['React', 'Tailwind CSS', 'Typography'],
    thumbnail: '/images/projects/project-1.png',
    previewImage: '/images/projects/project-1.png',
    videoIds: [],
    liveUrl: 'https://www.youtube.com/@Quran_Translators',
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
    liveUrl: 'https://www.youtube.com/@Quran_Translators',
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

function ensureDataFiles(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(SEED_PROJECTS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(INQUIRIES_FILE)) {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readProjects(): ProjectRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_PROJECTS;
    return (parsed as ProjectRecord[]).map((p) => {
      const normalizedLive =
        p.liveUrl === 'https://www.youtube.com/@Quran.Translators'
          ? 'https://www.youtube.com/@Quran_Translators'
          : p.liveUrl;
      if (p.id !== 'project-2') {
        return normalizedLive !== p.liveUrl ? { ...p, liveUrl: normalizedLive } : p;
      }
      return {
        ...p,
        liveUrl: normalizedLive,
        thumbnail:
          p.thumbnail === '/images/projects/project-2.png'
            ? '/images/projects/project-2.png?v=2'
            : p.thumbnail,
        previewImage:
          p.previewImage === '/images/projects/project-2.png'
            ? '/images/projects/project-2.png?v=2'
            : p.previewImage,
        hasPerson: true,
      };
    });
  } catch {
    return SEED_PROJECTS;
  }
}

function writeProjects(projects: ProjectRecord[]): void {
  ensureDataFiles();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
}

function readInquiries(): InquiryRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(INQUIRIES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

async function startServer(): Promise<void> {
  ensureDataFiles();
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/projects', (_req, res) => {
    res.json({ projects: readProjects() });
  });

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body as { password?: string };
    if (!password || password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Incorrect admin passphrase.' });
      return;
    }
    const token = jwt.sign({ role: 'admin', owner: 'Muhammad Talha' }, JWT_SECRET, {
      expiresIn: '12h',
    });
    res.json({ token });
  });

  app.post('/api/projects', requireAuth, (req, res) => {
    const body = req.body as Partial<ProjectRecord>;
    if (!body.title || !body.tagline || !body.category) {
      res.status(400).json({ error: 'Title, tagline, and category are required.' });
      return;
    }
    const projects = readProjects();
    const accent = body.accentColor?.trim() || '#8B5CF6';
    const created: ProjectRecord = {
      id: body.id || `project-${crypto.randomBytes(3).toString('hex')}`,
      slug:
        body.slug?.trim() ||
        body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      title: body.title.trim(),
      tagline: body.tagline.trim(),
      category: body.category,
      tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : [body.category],
      thumbnail: body.thumbnail?.trim() || '/images/projects/project-1.png',
      previewImage:
        body.previewImage?.trim() || body.thumbnail?.trim() || '/images/projects/project-1.png',
      videoIds: Array.isArray(body.videoIds) ? body.videoIds : [],
      liveUrl: body.liveUrl?.trim() || undefined,
      description: body.description?.trim() || body.tagline.trim(),
      role: body.role?.trim() || 'End-to-end Design & Development',
      tools: Array.isArray(body.tools) && body.tools.length > 0 ? body.tools : ['React'],
      accentColor: accent,
      gradient:
        body.gradient?.trim() ||
        `linear-gradient(135deg, ${accent}4D 0%, #120d22 58%, #07050d 100%)`,
      cardLayout:
        body.cardLayout === 'tall' || body.cardLayout === 'wide' || body.cardLayout === 'square'
          ? body.cardLayout
          : 'square',
      hoverEffect: body.hoverEffect || 'lift-glow',
      hasPerson: Boolean(body.hasPerson),
      stats: Array.isArray(body.stats) ? body.stats.slice(0, 3) : undefined,
      year: (body.year || String(new Date().getFullYear())).trim(),
    };
    const updated = [created, ...projects];
    writeProjects(updated);
    res.status(201).json({ project: created, projects: updated });
  });

  app.put('/api/projects/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const body = req.body as Partial<ProjectRecord>;
    const projects = readProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    projects[index] = {
      ...projects[index],
      ...body,
      id,
      videoIds: Array.isArray(body.videoIds) ? body.videoIds : projects[index].videoIds || [],
      liveUrl: body.liveUrl?.trim() || undefined,
    };
    writeProjects(projects);
    res.json({ project: projects[index], projects });
  });

  app.delete('/api/projects/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const projects = readProjects().filter((p) => p.id !== id);
    writeProjects(projects);
    res.json({ projects });
  });

  app.post('/api/contact', (req, res) => {
    const { name, email, projectType, budget, message } = req.body as Partial<InquiryRecord>;
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and project brief are required.' });
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    const inquiries = readInquiries();
    const record: InquiryRecord = {
      id: `inq-${crypto.randomBytes(4).toString('hex')}`,
      name: name.trim(),
      email: email.trim(),
      projectType: (projectType || 'Web Development').trim(),
      budget: (budget || 'Flexible').trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    inquiries.unshift(record);
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf-8');
    res.status(201).json({ ok: true, inquiry: record });
  });

  app.get('/api/inquiries', requireAuth, (_req, res) => {
    res.json({ inquiries: readInquiries() });
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Muhammad Talha Portfolio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
