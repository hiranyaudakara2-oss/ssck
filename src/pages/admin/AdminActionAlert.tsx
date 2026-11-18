import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { useData } from '../../context/DataContext';

export function AdminActionAlert({
  error,
  onDismiss,
}: {
  error: string | null;
  onDismiss: () => void;
}) {
  const { user, isAdmin, signInWithGoogle } = useData();

  if (!error) return null;

  let displayMessage = error;
  let isPermissionDenied = false;

  try {
    if (error.startsWith('{') && error.includes('"error"')) {
      const parsed = JSON.parse(error) as {
        error?: string;
        operationType?: string;
        path?: string;
      };
      if (parsed.error) {
        const errLower = parsed.error.toLowerCase();
        if (
          errLower.includes('missing or insufficient permissions') ||
          errLower.includes('permission_denied') ||
          errLower.includes('permission-denied')
        ) {
          isPermissionDenied = true;
          displayMessage = `Cloud permission denied for ${parsed.path || 'database'}. Authorize your Google Admin account below to grant write access.`;
        } else {
          displayMessage = `${parsed.error} (${parsed.path || 'system'})`;
        }
      }
    }
  } catch {
    displayMessage = error;
  }

  const needsCloudAuth = isPermissionDenied || !user || !isAdmin;

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-xs font-medium text-rose-100 shadow-lg backdrop-blur-sm"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {isPermissionDenied ? (
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
        )}
        <span className="break-words">{displayMessage}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {needsCloudAuth && (
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Authorize Google Admin
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="rounded-lg p-1 text-rose-200/80 transition-colors hover:bg-rose-900/50 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
