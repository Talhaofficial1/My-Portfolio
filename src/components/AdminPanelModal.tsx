import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Inbox,
  Lock,
  Mail,
  MailOpen,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SOCIAL_LINKS } from '../data/social';
import type {
  CardHoverEffect,
  CardLayout,
  InquiryRecord,
  ProjectCategory,
  ProjectItem,
} from '../types/portfolio';
import {
  buildGradientFromAccent,
  extractYoutubeVideoIds,
  isValidExternalUrl,
  isValidHexColor,
  isValidImageSrc,
  normalizeProject,
  slugifyTitle,
} from '../utils/projectHelpers';
import { SocialBrandIcon } from './SocialIcons';

interface AdminPanelModalProps {
  open: boolean;
  projects: ProjectItem[];
  onClose: () => void;
  onProjectsChange: (projects: ProjectItem[]) => void;
}

interface ProjectFormState {
  title: string;
  tagline: string;
  description: string;
  role: string;
  toolsInput: string;
  category: ProjectCategory;
  tagsInput: string;
  thumbnail: string;
  previewImage: string;
  youtubeLinksInput: string;
  liveUrl: string;
  accentColor: string;
  gradient: string;
  cardLayout: CardLayout;
  hoverEffect: CardHoverEffect;
}

const ACCENT_PRESETS = ['#8B5CF6', '#38BDF8', '#D4AF37', '#34D399', '#F472B6'];

const EMPTY_FORM: ProjectFormState = {
  title: '',
  tagline: '',
  description: '',
  role: '',
  toolsInput: 'React, TypeScript, Tailwind CSS',
  category: 'Development',
  tagsInput: 'React, Tailwind CSS',
  thumbnail: '/images/projects/project-1.png',
  previewImage: '/images/projects/project-1.png',
  youtubeLinksInput: '',
  liveUrl: '',
  accentColor: '#8B5CF6',
  gradient: buildGradientFromAccent('#8B5CF6'),
  cardLayout: 'square',
  hoverEffect: 'lift-glow',
};

function formatMessageDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function buildReplyMailto(msg: InquiryRecord): string {
  const subject = encodeURIComponent(`Re: ${msg.projectType} inquiry — Muhammad Talha`);
  const body = encodeURIComponent(
    [
      `Hi ${msg.name},`,
      ``,
      `Thank you for reaching out via my portfolio regarding "${msg.projectType}" (Budget: ${msg.budget}).`,
      ``,
      ``,
      `--- Original Message ---`,
      msg.message,
    ].join('\n')
  );
  return `mailto:${msg.email}?subject=${subject}&body=${body}`;
}

export function AdminPanelModal({
  open,
  projects,
  onClose,
  onProjectsChange,
}: AdminPanelModalProps) {
  const [token, setToken] = useState<string>(() => localStorage.getItem('talha_admin_jwt') || '');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<'projects' | 'messages'>('projects');
  const [messages, setMessages] = useState<InquiryRecord[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    setLoadingMessages(true);
    try {
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('talha_admin_jwt');
        setToken('');
        return;
      }
      if (!res.ok) throw new Error('offline');
      const data = (await res.json()) as {
        messages?: InquiryRecord[];
        inquiries?: InquiryRecord[];
      };
      const rawList = Array.isArray(data.messages)
        ? data.messages
        : Array.isArray(data.inquiries)
          ? data.inquiries
          : [];
      const sorted = rawList
        .map((m) => ({ ...m, read: Boolean(m.read) }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(sorted);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [token]);

  useEffect(() => {
    if (!open || !token) return;
    fetchMessages();
  }, [open, token, fetchMessages]);

  const unreadCount = useMemo(() => messages.filter((m) => !m.read).length, [messages]);

  const filteredMessages = useMemo(() => {
    if (messageFilter === 'unread') return messages.filter((m) => !m.read);
    if (messageFilter === 'read') return messages.filter((m) => m.read);
    return messages;
  }, [messages, messageFilter]);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId) || null,
    [messages, selectedMessageId]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }
      localStorage.setItem('talha_admin_jwt', data.token);
      setToken(data.token);
      setPassword('');
    } catch {
      if (password === 'talha-admin-2026') {
        const offlineToken = 'offline-local-session';
        localStorage.setItem('talha_admin_jwt', offlineToken);
        setToken(offlineToken);
        setPassword('');
      } else {
        setAuthError('Backend offline. Enter local passphrase to edit locally.');
      }
    }
  };

  const handleToggleMessageRead = async (id: string, nextRead: boolean) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: nextRead } : m)));
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(id)}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ read: nextRead }),
      });
      if (res.ok) {
        const data = (await res.json()) as { messages?: InquiryRecord[] };
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch {
      // Optimistic state kept if temporarily offline
    }
  };

  const handleOpenMessage = (msg: InquiryRecord) => {
    setSelectedMessageId(msg.id);
    if (!msg.read) {
      void handleToggleMessageRead(msg.id, true);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMessageId === id) {
      setSelectedMessageId(null);
    }
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { messages?: InquiryRecord[] };
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch {
      // Optimistic removal kept
    }
  };

  const handleImageUpload = (
    field: 'thumbnail' | 'previewImage',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      setFormError('Image file must be under 2.5 MB.');
      return;
    }
    setFormError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, [field]: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (project: ProjectItem) => {
    setFormError(null);
    setEditingId(project.id);
    setForm({
      title: project.title,
      tagline: project.tagline,
      description: project.description,
      role: project.role,
      toolsInput: project.tools.join(', '),
      category: project.category,
      tagsInput: project.tags.join(', '),
      thumbnail: project.thumbnail,
      previewImage: project.previewImage,
      youtubeLinksInput: project.videoIds.join(', '),
      liveUrl: project.liveUrl || '',
      accentColor: project.accentColor,
      gradient: project.gradient,
      cardLayout: project.cardLayout,
      hoverEffect: project.hoverEffect,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleAccentChange = (nextColor: string) => {
    setForm((prev) => ({
      ...prev,
      accentColor: nextColor,
      gradient: isValidHexColor(nextColor) ? buildGradientFromAccent(nextColor) : prev.gradient,
    }));
  };

  const extractedVideoIds = extractYoutubeVideoIds(form.youtubeLinksInput);

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim() || !form.tagline.trim()) {
      setFormError('Title and tagline are required.');
      return;
    }

    if (form.liveUrl.trim() && !isValidExternalUrl(form.liveUrl.trim())) {
      setFormError('Live URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    const parsedTags = form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const parsedTools = form.toolsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const safeThumb = isValidImageSrc(form.thumbnail)
      ? form.thumbnail.trim()
      : extractedVideoIds[0]
        ? `https://img.youtube.com/vi/${extractedVideoIds[0]}/hqdefault.jpg`
        : '/images/projects/project-1.png';

    const safePreview = isValidImageSrc(form.previewImage) ? form.previewImage.trim() : safeThumb;
    const safeAccent = isValidHexColor(form.accentColor) ? form.accentColor.trim() : '#8B5CF6';

    const existing = editingId ? projects.find((p) => p.id === editingId) : undefined;
    const payload = normalizeProject({
      id: editingId || `project-${projects.length + 1}-${Date.now().toString(36)}`,
      slug: existing?.slug || slugifyTitle(form.title.trim()),
      title: form.title.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim() || form.tagline.trim(),
      role: form.role.trim() || 'End-to-end Design, Engineering & Delivery',
      tools: parsedTools.length > 0 ? parsedTools : ['React'],
      category: form.category,
      tags: parsedTags.length > 0 ? parsedTags : [form.category],
      thumbnail: safeThumb,
      previewImage: safePreview,
      videoIds: extractedVideoIds,
      liveUrl: form.liveUrl.trim() ? form.liveUrl.trim() : undefined,
      accentColor: safeAccent,
      gradient: form.gradient.trim() || buildGradientFromAccent(safeAccent),
      cardLayout: form.cardLayout,
      hoverEffect: form.hoverEffect,
      hasPerson: existing?.hasPerson,
      stats: existing?.stats,
      year: existing?.year || String(new Date().getFullYear()),
    });

    try {
      const endpoint = editingId ? `/api/projects/${editingId}` : '/api/projects';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('offline');
      const data = (await res.json()) as { projects: ProjectItem[] };
      const normalized = data.projects.map((p, idx) => normalizeProject(p, idx));
      localStorage.setItem('talha_local_projects', JSON.stringify(normalized));
      onProjectsChange(normalized);
    } catch {
      const updated = editingId
        ? projects.map((p) => (p.id === editingId ? payload : p))
        : [payload, ...projects];
      localStorage.setItem('talha_local_projects', JSON.stringify(updated));
      onProjectsChange(updated);
    } finally {
      setSaving(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('offline');
      const data = (await res.json()) as { projects: ProjectItem[] };
      const normalized = data.projects.map((p, idx) => normalizeProject(p, idx));
      localStorage.setItem('talha_local_projects', JSON.stringify(normalized));
      onProjectsChange(normalized);
    } catch {
      const updated = projects.filter((p) => p.id !== id);
      localStorage.setItem('talha_local_projects', JSON.stringify(updated));
      onProjectsChange(updated);
    }
    if (editingId === id) {
      cancelEdit();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('talha_admin_jwt');
    setToken('');
    setSelectedMessageId(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-violet-500/30 bg-[#0d0917] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.85)] sm:p-8"
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="font-mono-label text-[10px] text-[#A78BFA]">PORTFOLIO STUDIO</p>
                <h3 className="mt-1 flex items-center gap-2.5 text-xl font-bold text-white">
                  <span>Manage Projects &amp; Messages</span>
                  {token && unreadCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-[#8B5CF6] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]">
                      {unreadCount} unread
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1.5 sm:flex">
                  {SOCIAL_LINKS.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_16px_rgba(139,92,246,0.45)]"
                    >
                      <SocialBrandIcon id={item.id} className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close studio panel"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {!token ? (
              <form onSubmit={handleLogin} className="mx-auto my-8 max-w-sm space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
                  <Lock className="h-5 w-5 text-[#A78BFA]" />
                </div>
                <p className="text-sm text-white/70">
                  Enter your studio passphrase to manage portfolio projects and read visitor
                  messages. Default dev passphrase:{' '}
                  <code className="text-[#A78BFA]">talha-admin-2026</code>
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin passphrase"
                  className="w-full rounded-xl border border-white/15 bg-[#07050d] px-4 py-3 text-sm text-white focus:border-violet-400 focus:outline-none"
                />
                {authError && <p className="text-xs text-rose-400">{authError}</p>}
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#8B5CF6] py-3 text-sm font-semibold text-white hover:bg-[#A78BFA]"
                >
                  Unlock Studio
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2 rounded-xl bg-white/[0.04] p-1">
                    <button
                      type="button"
                      onClick={() => setTab('projects')}
                      className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                        tab === 'projects'
                          ? 'bg-[#8B5CF6] text-white'
                          : 'text-white/65 hover:text-white'
                      }`}
                    >
                      Projects ({projects.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('messages');
                        void fetchMessages();
                      }}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                        tab === 'messages'
                          ? 'bg-[#8B5CF6] text-white'
                          : 'text-white/65 hover:text-white'
                      }`}
                    >
                      <span>Messages ({messages.length})</span>
                      {unreadCount > 0 && (
                        <span
                          aria-label={`${unreadCount} unread messages`}
                          className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            tab === 'messages'
                              ? 'bg-white text-[#6D28D9]'
                              : 'bg-[#8B5CF6] text-white shadow-[0_0_12px_rgba(139,92,246,0.65)]'
                          }`}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Sign Out
                  </button>
                </div>

                {tab === 'projects' ? (
                  <div className="space-y-6">
                    <form
                      onSubmit={handleSaveProject}
                      className="grid gap-3 rounded-xl border border-white/10 bg-[#07050d]/80 p-4 sm:grid-cols-2"
                    >
                      <div className="flex items-center justify-between sm:col-span-2">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#A78BFA]">
                          {editingId ? 'Editing Project' : 'Add New Project'}
                        </span>
                        {editingId && (
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-xs text-white/55 hover:text-white"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Project title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                      />

                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            category: e.target.value as ProjectCategory,
                          })
                        }
                        className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                      >
                        <option value="Development">Development</option>
                        <option value="Editing">Editing</option>
                        <option value="Design">Design</option>
                      </select>

                      <input
                        type="text"
                        required
                        placeholder="One-line tagline"
                        value={form.tagline}
                        onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none sm:col-span-2"
                      />

                      <textarea
                        rows={2}
                        placeholder="Project description (shown on dedicated project page)"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none sm:col-span-2"
                      />

                      <input
                        type="text"
                        placeholder="What I did (role)"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                      />

                      <input
                        type="text"
                        placeholder="Tools used (comma-separated: React, Figma, Premiere Pro)"
                        value={form.toolsInput}
                        onChange={(e) => setForm({ ...form, toolsInput: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                      />

                      <input
                        type="text"
                        placeholder="Tags (comma-separated, e.g. React, Motion, UI)"
                        value={form.tagsInput}
                        onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                      />

                      <input
                        type="url"
                        placeholder="Live site URL (optional, https://...)"
                        value={form.liveUrl}
                        onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                      />

                      {/* Visual Identity: accentColor, cardLayout, hoverEffect, gradient */}
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-[#120d20] px-3 py-2">
                        <label className="font-mono text-[10px] uppercase text-white/55">
                          Accent
                        </label>
                        <input
                          type="color"
                          value={isValidHexColor(form.accentColor) ? form.accentColor : '#8B5CF6'}
                          onChange={(e) => handleAccentChange(e.target.value)}
                          aria-label="Pick accent color"
                          className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <input
                          type="text"
                          value={form.accentColor}
                          onChange={(e) => handleAccentChange(e.target.value)}
                          placeholder="#8B5CF6"
                          className="w-20 bg-transparent font-mono text-xs text-white focus:outline-none"
                        />
                        <div className="ml-auto flex items-center gap-1">
                          {ACCENT_PRESETS.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => handleAccentChange(hex)}
                              aria-label={`Use accent ${hex}`}
                              className="h-4 w-4 rounded-full border border-white/25"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={form.cardLayout}
                          onChange={(e) =>
                            setForm({ ...form, cardLayout: e.target.value as CardLayout })
                          }
                          aria-label="Card layout"
                          className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                        >
                          <option value="tall">Layout: Tall</option>
                          <option value="wide">Layout: Wide</option>
                          <option value="square">Layout: Square</option>
                        </select>

                        <select
                          value={form.hoverEffect}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              hoverEffect: e.target.value as CardHoverEffect,
                            })
                          }
                          aria-label="Hover effect"
                          className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                        >
                          <option value="lift-glow">Hover: Lift Glow</option>
                          <option value="zoom-pan">Hover: Zoom Pan</option>
                          <option value="tilt-shine">Hover: Tilt Shine</option>
                          <option value="border-pulse">Hover: Border Pulse</option>
                          <option value="slide-reveal">Hover: Slide Reveal</option>
                        </select>
                      </div>

                      <input
                        type="text"
                        placeholder="Custom CSS gradient (auto-generated from accent)"
                        value={form.gradient}
                        onChange={(e) => setForm({ ...form, gradient: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 font-mono text-[11px] text-white focus:border-violet-400 focus:outline-none sm:col-span-2"
                      />

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Thumbnail URL (/images/projects/project-1.png)"
                          value={form.thumbnail}
                          onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                        />
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-2 text-[11px] text-white/80 hover:border-violet-400/50">
                          <Upload className="h-3.5 w-3.5 text-[#A78BFA]" />
                          <span>Thumb</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload('thumbnail', e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Preview image URL (/images/projects/project-1.png)"
                          value={form.previewImage}
                          onChange={(e) => setForm({ ...form, previewImage: e.target.value })}
                          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                        />
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-2 text-[11px] text-white/80 hover:border-violet-400/50">
                          <Upload className="h-3.5 w-3.5 text-[#A78BFA]" />
                          <span>Preview</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload('previewImage', e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="sm:col-span-2">
                        <textarea
                          rows={2}
                          placeholder="YouTube video links or 11-char IDs (comma or newline separated for multiple videos)"
                          value={form.youtubeLinksInput}
                          onChange={(e) =>
                            setForm({ ...form, youtubeLinksInput: e.target.value })
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#120d20] px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                        />
                        {form.youtubeLinksInput.trim() && (
                          <p className="mt-1 font-mono text-[10px] text-white/55">
                            {extractedVideoIds.length > 0
                              ? `Extracted YouTube IDs (${extractedVideoIds.length}): ${extractedVideoIds.join(', ')}`
                              : 'No valid 11-character YouTube video IDs detected yet'}
                          </p>
                        )}
                      </div>

                      {formError && (
                        <p role="alert" className="text-xs text-rose-400 sm:col-span-2">
                          {formError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#A78BFA] sm:col-span-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>
                          {saving
                            ? 'Saving...'
                            : editingId
                              ? 'Update Project'
                              : 'Add Project'}
                        </span>
                      </button>
                    </form>

                    <div className="space-y-2.5">
                      {projects.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: p.accentColor }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{p.title}</p>
                              <p className="truncate text-xs text-white/55">
                                {p.category} · {p.cardLayout} · {p.tags.join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(p)}
                              aria-label={`Edit ${p.title}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/65 hover:border-violet-400/50 hover:text-white"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(p.id)}
                              aria-label={`Delete ${p.title}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/55 hover:border-rose-400/50 hover:text-rose-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedMessage ? (
                  /* Opened Message Detail View */
                  <div className="space-y-5 rounded-2xl border border-violet-500/25 bg-[#07050d]/85 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <button
                        type="button"
                        onClick={() => setSelectedMessageId(null)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/80 hover:border-violet-400/50 hover:text-white"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 text-[#A78BFA]" />
                        <span>Back to Messages</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                            selectedMessage.read
                              ? 'border border-white/10 bg-white/[0.04] text-white/60'
                              : 'border border-violet-400/40 bg-violet-500/20 text-[#C4B5FD]'
                          }`}
                        >
                          {selectedMessage.read ? (
                            <>
                              <CheckCheck className="h-3 w-3" />
                              <span>Read</span>
                            </>
                          ) : (
                            <span>Unread</span>
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            void handleToggleMessageRead(selectedMessage.id, !selectedMessage.read)
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/85 hover:border-violet-400/50 hover:text-white"
                        >
                          <Check className="h-3.5 w-3.5 text-[#A78BFA]" />
                          <span>
                            {selectedMessage.read ? 'Mark as Unread' : 'Mark as Read'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDeleteMessage(selectedMessage.id)}
                          aria-label={`Delete message from ${selectedMessage.name}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-bold text-white">{selectedMessage.name}</h4>
                          <a
                            href={`mailto:${selectedMessage.email}`}
                            className="text-xs font-medium text-[#A78BFA] hover:underline"
                          >
                            {selectedMessage.email}
                          </a>
                        </div>
                        <span className="font-mono text-[11px] text-white/50">
                          {formatMessageDate(selectedMessage.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-white/80">
                          Type: {selectedMessage.projectType}
                        </span>
                        <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-white/80">
                          Budget: {selectedMessage.budget}
                        </span>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-[#120d20] p-4 text-sm leading-relaxed whitespace-pre-wrap text-white/90">
                        {selectedMessage.message}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                        <a
                          href={buildReplyMailto(selectedMessage)}
                          className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#8B5CF6] px-5 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] transition-colors hover:bg-[#A78BFA]"
                        >
                          <Mail className="h-4 w-4" />
                          <span>Reply by Email</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Messages List View (newest first) */
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        {(['all', 'unread', 'read'] as const).map((filterKey) => (
                          <button
                            key={filterKey}
                            type="button"
                            onClick={() => setMessageFilter(filterKey)}
                            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                              messageFilter === filterKey
                                ? 'bg-violet-500/25 text-[#C4B5FD] ring-1 ring-violet-400/50'
                                : 'bg-white/[0.04] text-white/60 hover:text-white'
                            }`}
                          >
                            {filterKey}
                            {filterKey === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => void fetchMessages()}
                        disabled={loadingMessages}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-white/75 hover:border-violet-400/50 hover:text-white disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 text-[#A78BFA] ${
                            loadingMessages ? 'animate-spin' : ''
                          }`}
                        />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {filteredMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center">
                        <Inbox className="h-8 w-8 text-white/30" />
                        <p className="mt-3 text-sm font-medium text-white/65">
                          {messageFilter === 'unread'
                            ? 'No unread messages right now.'
                            : 'No messages received yet.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {filteredMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`rounded-xl border p-4 transition-colors ${
                              msg.read
                                ? 'border-white/10 bg-white/[0.02]'
                                : 'border-violet-400/40 bg-violet-500/[0.08]'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenMessage(msg)}
                                className="min-w-0 flex-1 text-left focus-visible:outline-none"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  {!msg.read && (
                                    <span
                                      aria-label="Unread"
                                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#A78BFA] shadow-[0_0_10px_rgba(167,139,250,0.9)]"
                                    />
                                  )}
                                  <span className="text-sm font-semibold text-white">
                                    {msg.name}
                                  </span>
                                  <span className="text-xs text-[#A78BFA]">{msg.email}</span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                                      msg.read
                                        ? 'bg-white/[0.06] text-white/50'
                                        : 'bg-violet-500/25 text-[#DDD6FE]'
                                    }`}
                                  >
                                    {msg.read ? 'Read' : 'Unread'}
                                  </span>
                                </div>

                                <p className="mt-1 font-mono text-[11px] text-white/50">
                                  {msg.projectType} · {msg.budget} ·{' '}
                                  {formatMessageDate(msg.createdAt)}
                                </p>

                                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/80">
                                  {msg.message}
                                </p>
                              </button>

                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenMessage(msg)}
                                  title="Open message"
                                  aria-label={`Open message from ${msg.name}`}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2.5 text-[11px] font-medium text-white/85 hover:border-violet-400/60 hover:text-white"
                                >
                                  <MailOpen className="h-3.5 w-3.5 text-[#A78BFA]" />
                                  <span>Open</span>
                                </button>

                                {!msg.read && (
                                  <button
                                    type="button"
                                    onClick={() => void handleToggleMessageRead(msg.id, true)}
                                    title="Mark as read"
                                    aria-label={`Mark message from ${msg.name} as read`}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/65 hover:border-violet-400/50 hover:text-white"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                <a
                                  href={buildReplyMailto(msg)}
                                  title="Reply by email"
                                  aria-label={`Reply to ${msg.name} by email`}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/65 hover:border-violet-400/50 hover:text-[#A78BFA]"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </a>

                                <button
                                  type="button"
                                  onClick={() => void handleDeleteMessage(msg.id)}
                                  title="Delete message"
                                  aria-label={`Delete message from ${msg.name}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/55 hover:border-rose-400/50 hover:text-rose-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
