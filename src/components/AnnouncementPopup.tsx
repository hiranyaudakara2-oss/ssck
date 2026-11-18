import { useMemo, useState } from 'react';
import { AlertTriangle, Calendar, Check, FileText, Info, Megaphone } from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  FullScreenOverlay,
  OverlayActionButton,
  OverlayMediaFrame,
  OverlayPanel,
  OverlayStagger,
} from './FullScreenOverlay';
import { SafeImage } from './MotionPrimitives';

const STORAGE_KEY = 'techsphere_popup_dismissed_token';

export function AnnouncementPopup() {
  const { activePopupAnnouncement } = useData();
  const [dismissedToken, setDismissedToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const currentToken = useMemo(() => {
    if (!activePopupAnnouncement) return '';
    const updatedSec = activePopupAnnouncement.updatedAt?.seconds ?? '';
    return `${activePopupAnnouncement.id}|${updatedSec}|${activePopupAnnouncement.publishDate}|${activePopupAnnouncement.title}`;
  }, [activePopupAnnouncement]);

  const isOpen = Boolean(activePopupAnnouncement && currentToken !== dismissedToken);

  const handleClose = () => {
    if (!currentToken) return;
    setDismissedToken(currentToken);
    try {
      sessionStorage.setItem(STORAGE_KEY, currentToken);
    } catch {
      // Ignore storage quota issues
    }
  };

  const renderPriority = (priority: string) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" />
          Urgent Announcement
        </span>
      );
    }
    if (priority === 'important') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300">
          <Info className="h-3.5 w-3.5" />
          Important Notice
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300">
        <FileText className="h-3.5 w-3.5" />
        Faculty Announcement
      </span>
    );
  };

  const overlayTone = activePopupAnnouncement?.priority === 'urgent' ? 'amber' : 'default';

  return (
    <FullScreenOverlay
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabelledBy="announcement-popup-title"
      closeLabel="Close announcement popup"
      maxWidth="4xl"
      tone={overlayTone}
      accentBarClass={
        overlayTone === 'amber'
          ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-violet-500'
          : undefined
      }
      headerBadge={
        activePopupAnnouncement && (
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-blue-300">
              <Megaphone className="h-4 w-4 text-cyan-400" />
              Official Broadcast
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            {renderPriority(activePopupAnnouncement.priority)}
          </div>
        )
      }
    >
      {activePopupAnnouncement && (
        <OverlayPanel tone={overlayTone}>
          {activePopupAnnouncement.imageUrl && (
            <OverlayMediaFrame className="aspect-[16/9] max-h-[380px] w-full border-b border-blue-400/15">
              <SafeImage
                src={activePopupAnnouncement.imageUrl}
                alt={activePopupAnnouncement.title}
                fallbackLabel={activePopupAnnouncement.title}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081028] via-[#081028]/20 to-transparent" />
            </OverlayMediaFrame>
          )}

          <div className="p-6 sm:p-10">
            <OverlayStagger delay={0.07}>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-cyan-300">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  Published {activePopupAnnouncement.publishDate}
                </span>
                {activePopupAnnouncement.authorName && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">By {activePopupAnnouncement.authorName}</span>
                  </>
                )}
              </div>
            </OverlayStagger>

            <OverlayStagger delay={0.13}>
              <h2
                id="announcement-popup-title"
                className="font-display mt-3 bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-4xl"
                style={{ textWrap: 'balance' }}
              >
                {activePopupAnnouncement.title}
              </h2>
            </OverlayStagger>

            <OverlayStagger delay={0.19}>
              <p className="mt-5 rounded-xl border border-blue-400/25 bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-violet-500/15 p-4 text-base font-medium leading-relaxed text-slate-100 shadow-inner sm:p-5 sm:text-lg">
                {activePopupAnnouncement.summary}
              </p>
            </OverlayStagger>

            {activePopupAnnouncement.body && (
              <OverlayStagger delay={0.25}>
                <div className="mt-6 text-sm leading-relaxed text-slate-300 whitespace-pre-line sm:text-base">
                  {activePopupAnnouncement.body}
                </div>
              </OverlayStagger>
            )}

            <OverlayStagger delay={0.3}>
              <div className="mt-8 flex items-center justify-end gap-3 border-t border-white/10 pt-6">
                <OverlayActionButton
                  variant={overlayTone === 'amber' ? 'amber' : 'primary'}
                  onClick={handleClose}
                >
                  <Check className="h-4 w-4" />
                  <span>Acknowledge &amp; Close</span>
                </OverlayActionButton>
              </div>
            </OverlayStagger>
          </div>
        </OverlayPanel>
      )}
    </FullScreenOverlay>
  );
}
