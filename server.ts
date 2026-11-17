import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
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
  read: boolean;
  createdAt: string;
}

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'talha-portfolio-dev-secret-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'talha-admin-2026';
const MONGO_URI = (process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();
const EMAIL_USER = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
const CONTACT_TO_EMAIL = (process.env.CONTACT_TO_EMAIL || 'talha8786815@gmail.com').trim();
const CLIENT_URL = (process.env.CLIENT_URL || '').trim();

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

// MongoDB Message Model
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 160 },
    projectType: { type: String, required: true, trim: true, maxlength: 100 },
    budget: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const MessageModel =
  mongoose.models.ContactMessage || mongoose.model('ContactMessage', messageSchema);

let mongoConnected = false;

async function connectMongoIfConfigured(): Promise<void> {
  if (!MONGO_URI || MONGO_URI.includes('<username>') || MONGO_URI.includes('<password>')) {
    return;
  }
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    mongoConnected = true;
    console.log('Connected to MongoDB for portfolio messages.');
  } catch (err) {
    mongoConnected = false;
    console.warn('MongoDB unavailable, using local JSON persistence fallback:', (err as Error).message);
  }
}

function isMongoReady(): boolean {
  return mongoConnected && mongoose.connection.readyState === 1;
}

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

function normalizeMessageRecord(raw: Partial<InquiryRecord> & { _id?: unknown }): InquiryRecord {
  return {
    id: raw.id ? String(raw.id) : raw._id ? String(raw._id) : `msg-${crypto.randomBytes(4).toString('hex')}`,
    name: String(raw.name || '').trim(),
    email: String(raw.email || '').trim(),
    projectType: String(raw.projectType || 'Web Development').trim(),
    budget: String(raw.budget || 'Flexible').trim(),
    message: String(raw.message || '').trim(),
    read: Boolean(raw.read),
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
  };
}

function readLocalInquiries(): InquiryRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(INQUIRIES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeMessageRecord(item))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

function writeLocalInquiries(records: InquiryRecord[]): void {
  ensureDataFiles();
  fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

async function listMessages(): Promise<InquiryRecord[]> {
  if (isMongoReady()) {
    const docs = await MessageModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((doc) => normalizeMessageRecord(doc as Partial<InquiryRecord> & { _id?: unknown }));
  }
  return readLocalInquiries();
}

async function saveMessage(payload: {
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
}): Promise<InquiryRecord> {
  if (isMongoReady()) {
    const doc = await MessageModel.create({
      ...payload,
      read: false,
      createdAt: new Date(),
    });
    return normalizeMessageRecord(doc.toObject() as Partial<InquiryRecord> & { _id?: unknown });
  }

  const record: InquiryRecord = {
    id: `inq-${crypto.randomBytes(4).toString('hex')}`,
    ...payload,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const existing = readLocalInquiries();
  existing.unshift(record);
  writeLocalInquiries(existing);
  return record;
}

async function setMessageReadStatus(id: string, read: boolean): Promise<InquiryRecord | null> {
  if (isMongoReady()) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updated = await MessageModel.findByIdAndUpdate(
      id,
      { $set: { read } },
      { new: true }
    ).lean();
    if (!updated) return null;
    return normalizeMessageRecord(updated as Partial<InquiryRecord> & { _id?: unknown });
  }

  const existing = readLocalInquiries();
  const idx = existing.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  existing[idx] = { ...existing[idx], read };
  writeLocalInquiries(existing);
  return existing[idx];
}

async function deleteMessageById(id: string): Promise<boolean> {
  if (isMongoReady()) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const deleted = await MessageModel.findByIdAndDelete(id);
    return Boolean(deleted);
  }

  const existing = readLocalInquiries();
  const filtered = existing.filter((item) => item.id !== id);
  if (filtered.length === existing.length) return false;
  writeLocalInquiries(filtered);
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSmtpConfigured(): boolean {
  return Boolean(
    EMAIL_USER &&
      EMAIL_PASS &&
      !EMAIL_PASS.includes('your-16-char') &&
      !EMAIL_USER.includes('example.com')
  );
}

async function sendContactEmails(record: InquiryRecord): Promise<{
  emailConfigured: boolean;
  emailSent: boolean;
  emailError?: string;
}> {
  if (!isSmtpConfigured()) {
    return {
      emailConfigured: false,
      emailSent: false,
    };
  }

  const transporter = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      })
    : nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });

  const safeName = escapeHtml(record.name);
  const safeEmail = escapeHtml(record.email);
  const safeType = escapeHtml(record.projectType);
  const safeBudget = escapeHtml(record.budget);
  const safeMessage = escapeHtml(record.message).replace(/\n/g, '<br />');
  const formattedDate = new Date(record.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  try {
    // 1. Send notification email to Muhammad Talha with replyTo set to visitor's email
    await transporter.sendMail({
      from: `"Muhammad Talha Portfolio" <${EMAIL_USER}>`,
      to: CONTACT_TO_EMAIL,
      replyTo: `${record.name} <${record.email}>`,
      subject: `New message from ${record.name} via portfolio`,
      text: [
        `New portfolio inquiry received (${formattedDate})`,
        ``,
        `Name: ${record.name}`,
        `Email: ${record.email}`,
        `Project Type: ${record.projectType}`,
        `Budget: ${record.budget}`,
        ``,
        `Message:`,
        record.message,
      ].join('\n'),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#07050d; color:#f4f4f5; padding:28px; border-radius:14px; border:1px solid #2e1d52;">
          <p style="margin:0 0 8px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#a78bfa;">PORTFOLIO CONTACT INQUIRY</p>
          <h2 style="margin:0 0 18px; font-size:20px; color:#ffffff;">New message from ${safeName}</h2>
          <table style="width:100%; border-collapse:collapse; margin-bottom:18px; font-size:14px;">
            <tr><td style="padding:8px 0; color:#a1a1aa; width:130px;">Name</td><td style="padding:8px 0; color:#ffffff; font-weight:600;">${safeName}</td></tr>
            <tr><td style="padding:8px 0; color:#a1a1aa;">Email</td><td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#a78bfa;">${safeEmail}</a></td></tr>
            <tr><td style="padding:8px 0; color:#a1a1aa;">Project Type</td><td style="padding:8px 0; color:#ffffff;">${safeType}</td></tr>
            <tr><td style="padding:8px 0; color:#a1a1aa;">Budget</td><td style="padding:8px 0; color:#ffffff;">${safeBudget}</td></tr>
            <tr><td style="padding:8px 0; color:#a1a1aa;">Received</td><td style="padding:8px 0; color:#d4d4d8;">${escapeHtml(formattedDate)}</td></tr>
          </table>
          <div style="background:#110b22; border:1px solid #352160; border-radius:10px; padding:16px; font-size:14px; line-height:1.6; color:#f4f4f5;">
            ${safeMessage}
          </div>
          <p style="margin:18px 0 0; font-size:12px; color:#a1a1aa;">Hit Reply to respond directly to ${safeName} (${safeEmail}).</p>
        </div>
      `,
    });

    // 2. Send automatic confirmation email to the visitor
    await transporter.sendMail({
      from: `"Muhammad Talha" <${EMAIL_USER}>`,
      to: record.email,
      replyTo: CONTACT_TO_EMAIL,
      subject: 'Thanks, I received your message — Muhammad Talha',
      text: [
        `Hi ${record.name},`,
        ``,
        `Thanks, I received your message and will reply soon.`,
        ``,
        `Summary of your message:`,
        `- Project Type: ${record.projectType}`,
        `- Budget: ${record.budget}`,
        `- Message: ${record.message}`,
        ``,
        `Best regards,`,
        `Muhammad Talha`,
        `Lahore, Pakistan`,
        `${CONTACT_TO_EMAIL}`,
      ].join('\n'),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#07050d; color:#f4f4f5; padding:28px; border-radius:14px; border:1px solid #2e1d52;">
          <p style="margin:0 0 8px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#a78bfa;">MUHAMMAD TALHA STUDIO</p>
          <h2 style="margin:0 0 12px; font-size:20px; color:#ffffff;">Hi ${safeName},</h2>
          <p style="margin:0 0 18px; font-size:15px; line-height:1.6; color:#e4e4e7;">
            Thanks, I received your message and will reply soon.
          </p>
          <div style="background:#110b22; border:1px solid #352160; border-radius:10px; padding:14px 16px; font-size:13px; line-height:1.6; color:#d4d4d8;">
            <strong style="color:#a78bfa;">Your Inquiry Summary</strong><br />
            Project Type: ${safeType}<br />
            Budget: ${safeBudget}<br /><br />
            ${safeMessage}
          </div>
          <p style="margin:18px 0 0; font-size:13px; color:#a1a1aa;">
            Best regards,<br />
            <strong style="color:#ffffff;">Muhammad Talha</strong> · Lahore, Pakistan
          </p>
        </div>
      `,
    });

    return { emailConfigured: true, emailSent: true };
  } catch (err) {
    console.error('Nodemailer email send error:', err);
    return {
      emailConfigured: true,
      emailSent: false,
      emailError: (err as Error).message,
    };
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
  await connectMongoIfConfigured();

  const app = express();
  app.set('trust proxy', 1);

  const allowedOrigins = [
    ...CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean),
    (process.env.APP_URL || '').trim(),
  ].filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true);
          return;
        }
        callback(null, true);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '5mb' }));

  const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error:
          'Too many messages sent from your IP (limit is 5 per hour). Please wait a bit or email me directly.',
      });
    },
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mongoConnected: isMongoReady(),
      emailConfigured: isSmtpConfigured(),
      timestamp: new Date().toISOString(),
    });
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

  app.post('/api/contact', contactLimiter, async (req, res) => {
    const body = req.body as Partial<InquiryRecord> & { website?: string };

    // Honeypot spam check: silently ignore bots without saving or emailing
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      console.log('[spam-blocked] Honeypot field filled by IP:', req.ip);
      res.status(200).json({ ok: true, spamFiltered: true });
      return;
    }

    const cleanName = typeof body.name === 'string' ? body.name.trim() : '';
    const cleanEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const cleanType =
      typeof body.projectType === 'string' && body.projectType.trim()
        ? body.projectType.trim().slice(0, 100)
        : 'Web Development';
    const cleanBudget =
      typeof body.budget === 'string' && body.budget.trim()
        ? body.budget.trim().slice(0, 100)
        : 'Flexible';
    const cleanMessage = typeof body.message === 'string' ? body.message.trim() : '';

    if (cleanName.length < 2 || cleanName.length > 120) {
      res.status(400).json({ error: 'Please enter your name (at least 2 characters).' });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(cleanEmail) || cleanEmail.length > 160) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (cleanMessage.length < 10 || cleanMessage.length > 4000) {
      res.status(400).json({
        error: 'Please share a brief description of at least 10 characters so I can help properly.',
      });
      return;
    }

    try {
      const record = await saveMessage({
        name: cleanName,
        email: cleanEmail,
        projectType: cleanType,
        budget: cleanBudget,
        message: cleanMessage,
      });

      const emailResult = await sendContactEmails(record);

      res.status(201).json({
        ok: true,
        inquiry: record,
        storage: isMongoReady() ? 'mongodb' : 'local',
        ...emailResult,
      });
    } catch (err) {
      console.error('Failed to process contact submission:', err);
      res.status(500).json({
        error: 'Unable to save your message right now. Please email me directly or use WhatsApp.',
      });
    }
  });

  const handleListMessages = async (_req: express.Request, res: express.Response) => {
    try {
      const messages = await listMessages();
      const unreadCount = messages.filter((m) => !m.read).length;
      res.json({
        messages,
        inquiries: messages,
        unreadCount,
        storage: isMongoReady() ? 'mongodb' : 'local',
      });
    } catch (err) {
      console.error('Failed to load messages:', err);
      res.status(500).json({ error: 'Failed to load messages.' });
    }
  };

  const handleUpdateReadStatus = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const body = req.body as { read?: boolean };
      const nextRead = typeof body.read === 'boolean' ? body.read : true;
      const updated = await setMessageReadStatus(id, nextRead);
      if (!updated) {
        res.status(404).json({ error: 'Message not found.' });
        return;
      }
      const messages = await listMessages();
      const unreadCount = messages.filter((m) => !m.read).length;
      res.json({
        ok: true,
        message: updated,
        inquiry: updated,
        messages,
        inquiries: messages,
        unreadCount,
      });
    } catch (err) {
      console.error('Failed to update message status:', err);
      res.status(500).json({ error: 'Failed to update message status.' });
    }
  };

  const handleDeleteMessage = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const deleted = await deleteMessageById(id);
      if (!deleted) {
        res.status(404).json({ error: 'Message not found.' });
        return;
      }
      const messages = await listMessages();
      const unreadCount = messages.filter((m) => !m.read).length;
      res.json({
        ok: true,
        messages,
        inquiries: messages,
        unreadCount,
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
      res.status(500).json({ error: 'Failed to delete message.' });
    }
  };

  app.get('/api/messages', requireAuth, handleListMessages);
  app.get('/api/inquiries', requireAuth, handleListMessages);
  app.patch('/api/messages/:id/read', requireAuth, handleUpdateReadStatus);
  app.patch('/api/inquiries/:id/read', requireAuth, handleUpdateReadStatus);
  app.delete('/api/messages/:id', requireAuth, handleDeleteMessage);
  app.delete('/api/inquiries/:id', requireAuth, handleDeleteMessage);

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
