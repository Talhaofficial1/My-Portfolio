import { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { PROFILE } from '../data/portfolioData';
import { SOCIAL_LINKS } from '../data/social';
import type { InquiryPayload } from '../types/portfolio';
import { SocialBrandIcon } from './SocialIcons';

const DEFAULT_FORMSPREE_URL = 'https://formspree.io/f/xppddyje';
const FORMSPREE_URL = (
  import.meta.env.VITE_FORMSPREE_URL?.trim() || DEFAULT_FORMSPREE_URL
).trim();

const INITIAL_FORM: InquiryPayload = {
  name: '',
  email: '',
  projectType: 'Web Development',
  budget: '$500 – $1,500',
  message: '',
  website: '',
};

interface FormspreeErrorItem {
  field?: string;
  message?: string;
  code?: string;
}

interface FormspreeResponse {
  ok?: boolean;
  next?: string;
  error?: string;
  errors?: FormspreeErrorItem[];
}

export function FinalCtaSection() {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<InquiryPayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirectFallback, setShowDirectFallback] = useState(false);

  const focusForm = () => {
    nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => nameInputRef.current?.focus(), 350);
  };

  const buildDirectMailto = () => {
    const subject = encodeURIComponent(
      form.name.trim()
        ? `Portfolio inquiry from ${form.name.trim()} (${form.projectType})`
        : `Portfolio inquiry (${form.projectType})`
    );
    const body = encodeURIComponent(
      [
        `Hi Muhammad Talha,`,
        ``,
        `Name: ${form.name.trim() || 'N/A'}`,
        `Email: ${form.email.trim() || 'N/A'}`,
        `Project Type: ${form.projectType}`,
        `Estimated Budget: ${form.budget}`,
        ``,
        `Message:`,
        form.message.trim() || '(Write your message here)',
      ].join('\n')
    );
    return `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;
  };

  const buildDirectWhatsApp = () => {
    const text = encodeURIComponent(
      form.message.trim()
        ? `Assalamu Alaikum Talha, I'm ${form.name.trim() || 'a visitor'} (${form.projectType}, ${form.budget}). ${form.message.trim()}`
        : `Assalamu Alaikum Talha, I would like to discuss a ${form.projectType} project.`
    );
    return `https://wa.me/${PROFILE.whatsappNumber}?text=${text}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowDirectFallback(false);

    // Honeypot anti-spam check: silently ignore automated bot submissions
    if ((form.website || '').trim().length > 0) {
      setForm(INITIAL_FORM);
      setSubmitted(true);
      return;
    }

    const cleanName = form.name.trim();
    const cleanEmail = form.email.trim();
    const cleanMessage = form.message.trim();

    if (cleanName.length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanMessage.length < 10) {
      setError('Please write a message of at least 10 characters so I can reply accurately.');
      return;
    }

    if (!FORMSPREE_URL) {
      const configError = 'Formspree endpoint URL is empty.';
      console.error('Contact form submission failed:', configError);
      setShowDirectFallback(true);
      setError(
        'The contact form endpoint is empty. Please click "Email me directly" or WhatsApp below so your message still reaches me right away.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          _replyto: cleanEmail,
          _subject: `New message from ${cleanName} via portfolio`,
          projectType: form.projectType,
          budget: form.budget,
          message: cleanMessage,
          _gotcha: form.website || '',
        }),
      });

      let body: FormspreeResponse | null = null;
      try {
        body = (await response.json()) as FormspreeResponse;
      } catch {
        body = null;
      }

      if (!response.ok) {
        const realError =
          body?.errors
            ?.map((item) => item.message)
            .filter(Boolean)
            .join(', ') ||
          body?.error ||
          `HTTP ${response.status} ${response.statusText}`.trim();

        console.error('Formspree contact form submission failed:', {
          status: response.status,
          endpoint: FORMSPREE_URL,
          message: realError,
          responseBody: body,
        });

        setShowDirectFallback(true);
        setError(
          `Could not send your message (${realError}). Please use "Email me directly" or WhatsApp below so your message is not lost.`
        );
        return;
      }

      setForm(INITIAL_FORM);
      setSubmitted(true);
    } catch (err) {
      const realError = err instanceof Error ? err.message : String(err);
      console.error('Formspree contact form request error:', realError, err);
      setShowDirectFallback(true);
      setError(
        `Unable to submit right now (${realError}). Use "Email me directly" or WhatsApp below so your message still reaches me immediately.`
      );
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
            <a
              href={`mailto:${PROFILE.email}`}
              className="font-mono text-xs text-white/55 transition-colors hover:text-[#A78BFA]"
            >
              {PROFILE.email}
            </a>
          </div>

          {submitted ? (
            <div
              role="status"
              className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-6 py-10 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h4 className="mt-4 text-xl font-bold text-emerald-200">Message sent!</h4>
              <p className="mt-2 max-w-md text-sm font-medium text-emerald-300">
                Thanks! Your message was sent. I will reply soon.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setError(null);
                  setShowDirectFallback(false);
                  setForm(INITIAL_FORM);
                }}
                className="mt-6 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-5 py-2 text-xs font-medium text-emerald-100 transition-colors hover:border-emerald-300/60 hover:bg-emerald-500/25"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="relative space-y-5">
              {/* Honeypot anti-spam trap (hidden from humans & screen readers) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
              >
                <label htmlFor="contact-website">Leave this field blank</label>
                <input
                  id="contact-website"
                  name="_gotcha"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website || ''}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>

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
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-4 text-xs text-rose-200"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <p className="leading-relaxed font-medium">{error}</p>
                  </div>

                  {showDirectFallback && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2.5 pl-6">
                      <a
                        href={buildDirectMailto()}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-colors hover:bg-[#A78BFA]"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Email me directly</span>
                      </a>

                      <a
                        href={buildDirectWhatsApp()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white transition-colors hover:border-violet-400/60 hover:bg-white/[0.12]"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-[#A78BFA]" />
                        <span>WhatsApp ({PROFILE.whatsappDisplay})</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#8B5CF6] px-7 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all hover:bg-[#A78BFA] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Project Brief</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
