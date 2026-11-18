import React from 'react';
import {
  BookOpen,
  Code2,
  Cpu,
  ExternalLink,
  FileText,
  Globe,
  Link2,
  Sparkles,
  Video,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { CustomLinkTarget, PageRoute } from '../types';
import { HoverInfoBox } from './HoverInfoBox';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  book: BookOpen,
  code: Code2,
  cpu: Cpu,
  video: Video,
  file: FileText,
  sparkles: Sparkles,
  'external-link': ExternalLink,
};

const VALID_ROUTES: PageRoute[] = [
  'home',
  'about',
  'subjects',
  'history',
  'community',
  'teachers',
  'students',
  'events',
  'achievements',
  'gallery',
  'projects',
  'downloads',
  'contact',
  'admin',
];

function resolveInternalRoute(url: string): { route: PageRoute; subjectId?: string } | null {
  const trimmed = url.trim();
  if (!trimmed.startsWith('/')) return null;
  const clean = trimmed.replace(/^\/+|\/+$/g, '');
  if (!clean) return { route: 'home' };
  if (clean.startsWith('subjects/')) {
    return { route: 'subjects', subjectId: decodeURIComponent(clean.slice('subjects/'.length)) };
  }
  if (VALID_ROUTES.includes(clean as PageRoute)) {
    return { route: clean as PageRoute };
  }
  return null;
}

interface CustomLinksSlotProps {
  targetSection: CustomLinkTarget;
  onNavigate?: (route: PageRoute, subjectId?: string) => void;
  variant?: 'inline' | 'cards' | 'footer';
  heading?: string;
}

export function CustomLinksSlot({
  targetSection,
  onNavigate,
  variant = 'inline',
  heading,
}: CustomLinksSlotProps) {
  const { customLinks } = useData();

  const links = customLinks
    .filter((l) => l.isActive && l.targetSection === targetSection)
    .sort((a, b) => a.order - b.order);

  if (links.length === 0) return null;

  const renderIcon = (iconKey?: string) => {
    const IconComp = (iconKey && ICON_MAP[iconKey]) || Link2;
    return <IconComp className="h-3.5 w-3.5 shrink-0" />;
  };

  if (variant === 'footer') {
    return (
      <div className="mt-8 border-t border-white/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
          {heading || 'Featured Quick Links'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {links.map((link) => {
            const internal = resolveInternalRoute(link.url);
            const iconNode = renderIcon(link.icon);
            const infoDesc =
              link.description ||
              (link.attachToElement ? `Linked to ${link.attachToElement}` : link.url);

            if (internal && onNavigate) {
              return (
                <HoverInfoBox
                  key={link.id}
                  title={link.title}
                  description={infoDesc}
                  badge="Quick Access"
                  icon={iconNode}
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(internal.route, internal.subjectId)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-blue-400/50 hover:bg-blue-600/15 hover:text-white"
                  >
                    {iconNode}
                    <span>{link.title}</span>
                  </button>
                </HoverInfoBox>
              );
            }

            return (
              <HoverInfoBox
                key={link.id}
                title={link.title}
                description={infoDesc}
                badge="External Link"
                icon={iconNode}
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-blue-400/50 hover:bg-blue-600/15 hover:text-white"
                >
                  {iconNode}
                  <span>{link.title}</span>
                </a>
              </HoverInfoBox>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="mt-8">
        {heading && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-300">
            {heading}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => {
            const internal = resolveInternalRoute(link.url);
            const iconNode = renderIcon(link.icon);
            const infoDesc = link.description || link.url;
            const innerContent = (
              <div className="glass-surface flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 transition-colors hover:border-blue-400/50 hover:bg-blue-600/10">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-600/15 text-blue-300">
                    {iconNode}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{link.title}</p>
                    {link.description && (
                      <p className="truncate text-xs text-slate-400">{link.description}</p>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-blue-300" />
              </div>
            );

            return (
              <HoverInfoBox
                key={link.id}
                title={link.title}
                description={infoDesc}
                badge={link.attachToElement || 'Curated Resource'}
                icon={iconNode}
              >
                {internal && onNavigate ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(internal.route, internal.subjectId)}
                    className="block w-full text-left"
                  >
                    {innerContent}
                  </button>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    {innerContent}
                  </a>
                )}
              </HoverInfoBox>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2.5">
      {heading && <span className="text-xs font-medium text-slate-400">{heading}:</span>}
      {links.map((link) => {
        const internal = resolveInternalRoute(link.url);
        const iconNode = renderIcon(link.icon);
        const infoDesc =
          link.description ||
          (link.attachToElement ? `Attached to ${link.attachToElement}` : link.url);

        if (internal && onNavigate) {
          return (
            <HoverInfoBox
              key={link.id}
              title={link.title}
              description={infoDesc}
              badge={link.attachToElement || 'Section Link'}
              icon={iconNode}
            >
              <button
                type="button"
                onClick={() => onNavigate(internal.route, internal.subjectId)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-600/10 px-3.5 py-2 text-xs font-semibold text-blue-200 transition-colors hover:border-blue-400/60 hover:bg-blue-600/20 hover:text-white"
              >
                {iconNode}
                <span>{link.title}</span>
              </button>
            </HoverInfoBox>
          );
        }

        return (
          <HoverInfoBox
            key={link.id}
            title={link.title}
            description={infoDesc}
            badge={link.attachToElement || 'External Link'}
            icon={iconNode}
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-600/10 px-3.5 py-2 text-xs font-semibold text-blue-200 transition-colors hover:border-blue-400/60 hover:bg-blue-600/20 hover:text-white"
            >
              {iconNode}
              <span>{link.title}</span>
            </a>
          </HoverInfoBox>
        );
      })}
    </div>
  );
}
