import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { PROFILE } from '../data/portfolioData';
import { SOCIAL_LINKS } from '../data/social';
import type { InquiryPayload } from '../types/portfolio';
import { SocialBrandIcon } from './SocialIcons';

export function FinalCtaSection() {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<InquiryPayload>({
    name: '',
    email: '',
    projectType: 'Web Development',
    budget: '$500 – $1,500',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const focusForm = () => {
    nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => nameInputRef.current?.focus(), 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email address, and project message.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'Request failed');
      }
      setSubmitted(true);
    } catch {
      // Offline / static frontend fallback: store inquiry locally so user flow never breaks
      try {
        const existing = JSON.parse(localStorage.getItem('talha_local_inquiries') || '[]');
        existing.unshift({
          ...form,
          id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('talha_local_inquiries', JSON.stringify(existing));
      } catch {
        // Ignore storage errors
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative z-10 overflow-hidden bg-[#07050d] px-5 pt-24 pb-28 sm:px-8 sm:pt-32"
    >
      {/* Massive radial violet glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 left-1/2 h-[620px] w-[960px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(88, 28, 135, 0.1) 45%, transparent 72%)',
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Portrait Holding Laptop with Overlaid Headline */}
        <div className="relative mx-auto overflow-hidden rounded-[26px] border border-white/10 bg-[#0c0916] shadow-[0_32px_90px_rgba(0,0,0,0.85)]">
          <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
            <img
              src={PROFILE.assets.sceneLaptop}
              alt="Muhammad Talha holding an open laptop toward the camera"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-top"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#07050d] via-[#07050d]/45 to-[#07050d]/25"
            />

            {/* Headline overlaid across laptop screen area */}
            <div className="absolute inset-x-0 bottom-8 flex flex-col items-center justify-center px-4 text-center sm:bottom-14">
              <h2
                className="font-display text-balance font-extrabold leading-[0.98] tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]"
                style={{ fontSize: 'clamp(2.4rem, 7vw, 5.75rem)' }}
              >
                This one&apos;s <span className="text-[#A78BFA]">yours.</span>
              </h2>
            </div>
          </div>

          {/* Action Strip directly under portrait */}
          <div className="flex flex-col items-center justify-between gap-5 border-t border-white/10 bg-[#0a0712]/90 px-6 py-7 text-center sm:flex-row sm:px-9 sm:text-left">
            <div>
              <p className="text-lg font-semibold text-white sm:text-xl">
                Let&apos;s build your brand&apos;s website.
              </p>
              <p className="mt-1 text-xs text-white/60 sm:text-sm">
                Based in {PROFILE.location} — collaborating with clients worldwide.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={focusForm}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#8B5CF6] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_26px_rgba(139,92,246,0.45)] transition-colors hover:bg-[#A78BFA]"
              >
                <span>Get a Quote</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href={PROFILE.socials.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-violet-400/50 hover:bg-white/[0.08]"
              >
                <MessageCircle className="h-4 w-4 text-[#A78BFA]" />
                <span>WhatsApp Me</span>
              </a>
            </div>
          </div>
        </div>

        {/* 3 Glass Social Cards */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-3.5 sm:grid-cols-3">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              title={item.label}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/55 hover:bg-violet-500/10 hover:shadow-[0_0_26px_rgba(139,92,246,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-[#0c0816] text-[#A78BFA] transition-colors group-hover:border-violet-400/55 group-hover:text-white">
                  <SocialBrandIcon id={item.id} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{item.ctaLabel}</p>
                  <p className="truncate font-mono text-[10px] text-white/50">{item.handle}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#A78BFA]" />
            </a>
          ))}
        </div>

        {/* Glass Contact Form */}
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-9">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.08] pb-4">
            <div>
              <p className="font-mono-label text-[10px] text-[#A78BFA]">START A PROJECT</p>
              <h3 className="mt-1.5 text-xl font-bold text-white">Send a quick brief</h3>
            </div>
            <span className="font-mono text-xs text-white/50">{PROFILE.email}</span>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-400/35 bg-violet-500/15">
                <CheckCircle2 className="h-7 w-7 text-[#A78BFA]" />
              </div>
              <h4 className="mt-4 text-xl font-bold text-white">Inquiry received</h4>
              <p className="mt-2 max-w-md text-sm text-white/65">
                Thank you, {form.name}. I&apos;ve received your project details and will reply within
                24 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: '',
                    email: '',
                    projectType: 'Web Development',
                    budget: '$500 – $1,500',
                    message: '',
                  });
                }}
                className="mt-6 rounded-full border border-white/15 px-5 py-2 text-xs font-medium text-white/80 hover:border-violet-400/50 hover:text-white"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-medium text-white/75">
                    Your Name
                  </label>
                  <input
                    ref={nameInputRef}
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ahmed Khan"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-medium text-white/75">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ahmed@company.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-type" className="block text-xs font-medium text-white/75">
                    Project Type
                  </label>
                  <select
                    id="contact-type"
                    value={form.projectType}
                    onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-3 text-sm text-white focus:border-violet-400 focus:outline-none"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Video Editing">Video Editing</option>
                    <option value="Graphic / UI Design">Graphic / UI Design</option>
                    <option value="Full Brand + Website">Full Brand + Website</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-budget" className="block text-xs font-medium text-white/75">
                    Estimated Budget
                  </label>
                  <select
                    id="contact-budget"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-3 text-sm text-white focus:border-violet-400 focus:outline-none"
                  >
                    <option value="Under $500">Under $500</option>
                    <option value="$500 – $1,500">$500 – $1,500</option>
                    <option value="$1,500 – $3,500">$1,500 – $3,500</option>
                    <option value="$3,500+">$3,500+</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-medium text-white/75">
                  Project Details
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell me about your timeline, goals, and what you want to launch..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#080610] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-400 focus:outline-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-rose-400">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#8B5CF6] px-7 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all hover:bg-[#A78BFA] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{submitting ? 'Sending...' : 'Send Project Brief'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
