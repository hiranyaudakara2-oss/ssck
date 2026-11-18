import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Compass, ExternalLink, Globe, Share2, Target } from 'lucide-react';
import { MorphingBackdrop, RevealBlock, SafeImage } from '../components/MotionPrimitives';
import { useData } from '../context/DataContext';
import { HERO_CAMPUS_IMAGE } from '../data/seedDefaults';
import type { PageRoute, SiteSocialLinks } from '../types';

type SocialPlatformKey = keyof SiteSocialLinks;

interface SocialPlatformMeta {
  key: SocialPlatformKey;
  label: string;
  handleHint: string;
  accentClass: string;
  iconBgClass: string;
  icon: ReactNode;
}

const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    handleHint: 'Community updates & campus stories',
    accentClass: 'hover:border-blue-400/50 hover:bg-blue-500/12 hover:shadow-blue-500/20',
    iconBgClass: 'bg-blue-600/20 text-blue-300 group-hover:bg-blue-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2V11H7.5v3h2.7v8h3.3z" />
      </svg>
    ),
  },
  {
    key: 'instagram',
    label: 'Instagram',
    handleHint: 'Lab reels & robotics highlights',
    accentClass: 'hover:border-pink-400/50 hover:bg-pink-500/12 hover:shadow-pink-500/20',
    iconBgClass: 'bg-pink-600/20 text-pink-300 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:via-pink-500 group-hover:to-purple-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" />
      </svg>
    ),
  },
  {
    key: 'youtube',
    label: 'YouTube',
    handleHint: 'Tech talks & project demos',
    accentClass: 'hover:border-rose-400/50 hover:bg-rose-500/12 hover:shadow-rose-500/20',
    iconBgClass: 'bg-rose-600/20 text-rose-300 group-hover:bg-rose-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.6 15.6V8.4L15.9 12l-6.3 3.6z" />
      </svg>
    ),
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    handleHint: 'Quick lab builds & campus clips',
    accentClass: 'hover:border-cyan-400/50 hover:bg-cyan-500/12 hover:shadow-cyan-500/20',
    iconBgClass: 'bg-cyan-500/20 text-cyan-200 group-hover:bg-slate-900 group-hover:text-cyan-300',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.64a6.34 6.34 0 0 0 6.34-6.34V8.76a8.26 8.26 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.17z" />
      </svg>
    ),
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    handleHint: 'Announcements channel & helpdesk',
    accentClass: 'hover:border-emerald-400/50 hover:bg-emerald-500/12 hover:shadow-emerald-500/20',
    iconBgClass: 'bg-emerald-600/20 text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.57 14.87L2 22l5.28-1.38A9.9 9.9 0 1 0 12.04 2zm5.77 14.08c-.24.68-1.41 1.3-1.95 1.38-.52.08-1.18.11-1.91-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5-4.38-5.15-4.58-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.06-2.52c.28-.3.61-.38.81-.38h.59c.19 0 .45-.07.7.53.26.62.88 2.15.96 2.31.08.15.13.34.03.54-.1.2-.15.33-.3.5-.15.18-.32.4-.45.54-.15.15-.31.32-.13.62.18.3.8 1.31 1.71 2.12 1.18 1.05 2.17 1.38 2.48 1.53.3.15.48.13.66-.08.18-.2.76-.88.96-1.18.2-.3.4-.25.68-.15.28.1 1.77.83 2.07.98.3.15.5.22.58.35.07.13.07.75-.17 1.43z" />
      </svg>
    ),
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    handleHint: 'Alumni & industry network',
    accentClass: 'hover:border-sky-400/50 hover:bg-sky-500/12 hover:shadow-sky-500/20',
    iconBgClass: 'bg-sky-600/20 text-sky-300 group-hover:bg-sky-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    key: 'github',
    label: 'GitHub',
    handleHint: 'Open-source student repositories',
    accentClass: 'hover:border-slate-300/45 hover:bg-slate-400/12 hover:shadow-slate-500/20',
    iconBgClass: 'bg-slate-600/25 text-slate-200 group-hover:bg-slate-100 group-hover:text-slate-900',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.2 1.9 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />
      </svg>
    ),
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    handleHint: 'Live event dispatches',
    accentClass: 'hover:border-sky-300/45 hover:bg-sky-400/12 hover:shadow-sky-500/20',
    iconBgClass: 'bg-sky-500/20 text-sky-200 group-hover:bg-slate-950 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: 'website',
    label: 'Official Website',
    handleHint: 'External portal & documentation',
    accentClass: 'hover:border-indigo-400/50 hover:bg-indigo-500/12 hover:shadow-indigo-500/20',
    iconBgClass: 'bg-indigo-600/20 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white',
    icon: <Globe className="h-5 w-5" aria-hidden="true" />,
  },
];

function normalizeSocialHref(key: SocialPlatformKey, raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (key === 'whatsapp') {
    if (/^\+?\d[\d\s\-()]{5,}$/.test(trimmed)) {
      const digits = trimmed.replace(/\D/g, '');
      return digits ? `https://wa.me/${digits}` : null;
    }
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function AboutPage({ onNavigate }: { onNavigate: (route: PageRoute) => void }) {
  const { siteSettings, subjects, teachers } = useData();

  const activeSocialLinks = SOCIAL_PLATFORMS.map((platform) => {
    const href = normalizeSocialHref(platform.key, siteSettings.socialLinks?.[platform.key]);
    return href ? { ...platform, href } : null;
  }).filter((item): item is SocialPlatformMeta & { href: string } => Boolean(item));

  return (
    <div className="relative overflow-hidden py-14 sm:py-20">
      <MorphingBackdrop variant="section" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealBlock className="max-w-3xl">
          <h1
            className="font-display mt-3 font-bold tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
          >
            About Us
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
            {siteSettings.tagline}. Our faculty bridges secondary STEM theory with authentic workshop fabrication, computational architecture, and environmental systems research.
          </p>
        </RevealBlock>

        {/* Hero Campus Visual */}
        <RevealBlock className="mt-10">
          <div className="glass-surface-elevated overflow-hidden rounded-2xl">
            <div className="aspect-[16/7] w-full overflow-hidden">
              <SafeImage
                src={siteSettings.heroBannerUrl || HERO_CAMPUS_IMAGE}
                alt="Technology Section Atrium and Makerspace"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </RevealBlock>

        {/* Vision & Mission */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <RevealBlock>
            <div className="glass-surface h-full rounded-2xl p-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-300">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="font-display mt-5 text-2xl font-semibold text-white">Our Mission</h2>
              <p className="mt-3 text-base leading-relaxed text-slate-300">
                {siteSettings.aboutMission}
              </p>
            </div>
          </RevealBlock>

          <RevealBlock delay={0.08}>
            <div className="glass-surface h-full rounded-2xl p-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300">
                <Compass className="h-5 w-5" />
              </div>
              <h2 className="font-display mt-5 text-2xl font-semibold text-white">Our Vision</h2>
              <p className="mt-3 text-base leading-relaxed text-slate-300">
                {siteSettings.aboutVision}
              </p>
            </div>
          </RevealBlock>
        </div>

        {/* Official Social Media Channels */}
        {activeSocialLinks.length > 0 && (
          <RevealBlock className="mt-14 border-t border-white/10 pt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  <Share2 className="h-4 w-4" />
                  <span>Official Channels</span>
                </p>
                <h2 className="font-display mt-1.5 text-2xl font-bold text-white sm:text-3xl">
                  Connect With SSCK TECH
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Follow live workshop highlights, exhibition livestreams, student project showcases, and community announcements across our official platforms.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeSocialLinks.map((social, idx) => (
                <motion.a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  whileHover={{ y: -4, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className={`glass-surface group flex items-center justify-between gap-4 rounded-2xl border border-white/10 p-4 shadow-lg transition-all duration-200 ${social.accentClass}`}
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${social.iconBgClass}`}
                    >
                      {social.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold text-white">
                        {social.label}
                      </p>
                      <p className="truncate text-xs text-slate-400 group-hover:text-slate-300">
                        {social.handleHint}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                </motion.a>
              ))}
            </div>
          </RevealBlock>
        )}

        {/* Institutional Snapshot */}
        <RevealBlock className="mt-14 glass-surface rounded-2xl p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Active Disciplines</p>
              <p className="font-display mt-1 text-3xl font-bold tabular-nums text-white">
                {subjects.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">Core & Elective Technology Subjects</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Specialist Faculty</p>
              <p className="font-display mt-1 text-3xl font-bold tabular-nums text-white">
                {teachers.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">Dedicated Lab & Lecture Educators</p>
            </div>
            <div className="flex flex-col justify-center">
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Schedule a Campus Lab Visit
              </button>
            </div>
          </div>
        </RevealBlock>
      </div>
    </div>
  );
}

