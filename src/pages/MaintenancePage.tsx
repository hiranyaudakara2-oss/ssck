import React from 'react';
import { motion } from 'motion/react';
import { Clock, ShieldCheck, Wrench } from 'lucide-react';
import { useData } from '../context/DataContext';
import { DEFAULT_WEB_LOGO } from '../data/seedDefaults';
import type { PageRoute } from '../types';

export function MaintenancePage({ onNavigate }: { onNavigate: (route: PageRoute) => void }) {
  const { siteSettings, adminAuthenticated } = useData();

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center px-4 py-16">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="glass-surface-elevated relative z-10 w-full max-w-xl rounded-3xl p-8 text-center shadow-2xl sm:p-10"
      >
        {/* Top Decorative Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-blue-950/80 to-indigo-950/80 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
          <Wrench className="h-10 w-10 text-cyan-400 animate-pulse" />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <img
            src={siteSettings.logoUrl || DEFAULT_WEB_LOGO}
            alt={siteSettings.siteTitle}
            referrerPolicy="no-referrer"
            className="h-6 w-6 object-contain"
          />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-300">
            {siteSettings.siteTitle} Scheduled Maintenance
          </span>
        </div>

        <h1
          className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          style={{ textWrap: 'balance' }}
        >
          We&apos;ll Be Back Soon!
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          {siteSettings.maintenanceAnnouncement ||
            'We are currently upgrading our laboratory management servers and core academic systems to deliver an even more powerful platform.'}
        </p>

        {siteSettings.maintenanceExpectedTime && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-950/30 px-4 py-2.5 text-xs font-medium text-blue-200">
            <Clock className="h-4 w-4 text-blue-400 shrink-0" />
            <span>{siteSettings.maintenanceExpectedTime}</span>
          </div>
        )}

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-xs text-slate-400">
            Are you an administrator? You can access the control portal below to manage maintenance settings.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{adminAuthenticated ? 'Return to Admin Portal' : 'Sign In as Administrator'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
