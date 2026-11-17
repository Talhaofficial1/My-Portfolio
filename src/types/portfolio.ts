export type ProjectCategory = 'Development' | 'Editing' | 'Design';
export type CardLayout = 'tall' | 'wide' | 'square';
export type CardHoverEffect =
  | 'lift-glow'
  | 'zoom-pan'
  | 'tilt-shine'
  | 'border-pulse'
  | 'slide-reveal';

export interface ProjectStat {
  label: string;
  value: string;
}

export interface ProjectItem {
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

export interface StatItem {
  id: string;
  value: number | null;
  suffix: string;
  displayFallback?: string;
  label: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  iconName: 'code' | 'film' | 'layers';
}

export interface InquiryPayload {
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
  website?: string;
}

export interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
  read: boolean;
  createdAt: string;
}
