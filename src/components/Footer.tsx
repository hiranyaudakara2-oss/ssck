import { Mail, MapPin, Phone } from 'lucide-react';
import { useData } from '../context/DataContext';
import { DEFAULT_WEB_LOGO } from '../data/seedDefaults';
import type { PageRoute } from '../types';
import { CustomLinksSlot } from './CustomLinksSlot';

export function Footer({
  onNavigate,
  onPrefetch,
}: {
  onNavigate: (route: PageRoute, subjectId?: string) => void;
  onPrefetch?: (route: PageRoute) => void;
}) {
  const { siteSettings } = useData();

  const programLinks: { route: PageRoute; label: string }[] = [
    { route: 'home', label: 'Home' },
    { route: 'history', label: 'History' },
    { route: 'teachers-members', label: 'Teacher & Member' },
    { route: 'events', label: 'Event' },
    { route: 'projects', label: 'Project' },
  ];

  const communityLinks: { route: PageRoute; label: string }[] = [
    { route: 'achievements', label: 'Achievements' },
    { route: 'gallery', label: 'Gallery' },
    { route: 'about', label: 'About us' },
    { route: 'admin', label: 'Admin portal' },
  ];

  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#040711]/92 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src={siteSettings.logoUrl || DEFAULT_WEB_LOGO}
                alt={siteSettings.siteTitle}
                referrerPolicy="no-referrer"
                className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_2px_10px_rgba(96,165,250,0.25)]"
              />
              <span className="font-display text-lg font-semibold text-white">
                {siteSettings.siteTitle}
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              {siteSettings.tagline}
            </p>
            <div className="mt-6 space-y-2.5 text-sm text-slate-400">
              {siteSettings.footerAddress && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <span>{siteSettings.footerAddress}</span>
                </div>
              )}
              {siteSettings.footerEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-blue-400" />
                  <a
                    href={`mailto:${siteSettings.footerEmail}`}
                    className="hover:text-white transition-colors"
                  >
                    {siteSettings.footerEmail}
                  </a>
                </div>
              )}
              {siteSettings.footerPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-blue-400" />
                  <span className="tabular-nums">{siteSettings.footerPhone}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-white">Academics</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {programLinks.map((item) => (
                <li key={item.route}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.route)}
                    onMouseEnter={() => onPrefetch?.(item.route)}
                    onFocus={() => onPrefetch?.(item.route)}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-white">Community</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {communityLinks.map((item) => (
                <li key={item.route}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.route)}
                    onMouseEnter={() => onPrefetch?.(item.route)}
                    onFocus={() => onPrefetch?.(item.route)}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <CustomLinksSlot targetSection="footer" variant="footer" onNavigate={onNavigate} />

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>{siteSettings.footerCopyright}</p>
        </div>
      </div>

      <div
        aria-label="Color palette"
        className="absolute bottom-3 right-4 flex items-center gap-2"
      >
        <span
          title="Maroon (#800000)"
          className="h-[11px] w-[11px] rounded-full bg-[#800000] transition-transform duration-200 ease-out hover:scale-[1.2]"
        />
        <span
          title="Ivory (#FFFFF0)"
          className="h-[11px] w-[11px] rounded-full border border-white/25 bg-[#FFFFF0] transition-transform duration-200 ease-out hover:scale-[1.2]"
        />
        <span
          title="Dark Blue (#00008B)"
          className="h-[11px] w-[11px] rounded-full bg-[#00008B] transition-transform duration-200 ease-out hover:scale-[1.2]"
        />
      </div>
    </footer>
  );
}
