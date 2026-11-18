import React, { useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { optimizeImageFile } from '../../utils/imageOptimizer';

interface AdminMediaInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  accept?: string;
  placeholder?: string;
}

export function AdminMediaInput({
  label,
  value,
  onChange,
  folder,
  accept = 'image/*',
  placeholder = 'https://... or upload image via ImgBB below',
}: AdminMediaInputProps) {
  const { uploadImageToImgBB } = useData();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [optimizationNote, setOptimizationNote] = useState<string>('');
  const [optimizing, setOptimizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const supportsImageUpload = accept.includes('image');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadError('');
    setUploadSuccess(false);
    setOptimizationNote('');

    if (!file.type.startsWith('image/')) {
      setUploadError(
        'ImgBB accepts image files (PNG, JPG, WEBP, GIF). For PDFs/documents, paste a Google Drive or direct URL above.'
      );
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setUploadError('Selected image exceeds 12 MB. Please choose a smaller image.');
      return;
    }

    setOptimizing(true);
    try {
      const optimized = await optimizeImageFile(file, { maxDimension: 1400, quality: 0.84 });
      setPendingFile(optimized.file);
      setPreviewDataUrl(optimized.previewDataUrl);
      if (optimized.wasCompressed && optimized.originalSize > optimized.optimizedSize) {
        const beforeKb = Math.round(optimized.originalSize / 1024);
        const afterKb = Math.max(1, Math.round(optimized.optimizedSize / 1024));
        setOptimizationNote(`Optimized for fast web loading: ${beforeKb} KB → ${afterKb} KB`);
      }
    } catch {
      setUploadError('Unable to read or optimize the selected image file.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setUploadError('');
    setUploadSuccess(false);
    setUploading(true);
    setProgress(5);
    try {
      const url = await uploadImageToImgBB(pendingFile, folder, (pct) => setProgress(pct));
      onChange(url);
      setPendingFile(null);
      setPreviewDataUrl('');
      setOptimizationNote('');
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? `${err.message} You can also paste an image URL above.`
          : 'ImgBB upload failed. Paste an image URL above.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    setPreviewDataUrl('');
    setOptimizationNote('');
    setProgress(0);
    setUploadError('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-300">{label}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          maxLength={1000}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setUploadSuccess(false);
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />

        {supportsImageUpload && (
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-500/35 bg-blue-600/15 px-3.5 py-2 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-600/25 whitespace-nowrap shrink-0">
            {optimizing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            <span>{optimizing ? 'Optimizing...' : 'Choose Image'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void handleFileSelect(e)}
              disabled={uploading || optimizing}
              className="hidden"
            />
          </label>
        )}
      </div>

      {!supportsImageUpload && (
        <p className="text-[11px] text-slate-400">
          Paste a verified Google Drive share link or direct HTTPS document URL above.
        </p>
      )}

      {/* Pre-upload Preview & ImgBB Confirm Bar */}
      {pendingFile && previewDataUrl && (
        <div className="rounded-xl border border-blue-500/35 bg-[#081024] p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <img
              src={previewDataUrl}
              alt="Pre-upload preview"
              className="h-20 w-28 shrink-0 rounded-lg border border-white/10 bg-[#050914] object-contain p-0.5"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-white">{pendingFile.name}</p>
                <span className="shrink-0 font-mono text-[11px] text-slate-400">
                  {Math.max(1, Math.round(pendingFile.size / 1024))} KB
                </span>
              </div>

              {optimizationNote && (
                <p className="text-[11px] font-medium text-cyan-300">{optimizationNote}</p>
              )}

              {uploading && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="font-mono text-[11px] text-blue-300">
                    Uploading to ImgBB... {progress}%
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void handleConfirmUpload()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>{uploading ? `Uploading ${progress}%` : 'Upload to ImgBB'}</span>
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleCancelPending}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing/Uploaded Image Thumbnail */}
      {!pendingFile && value && supportsImageUpload && (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#081024]/70 p-2">
          <img
            src={value}
            alt="Current media"
            referrerPolicy="no-referrer"
            className="h-12 w-16 shrink-0 rounded-md bg-[#050914] object-contain p-0.5"
          />
          <div className="min-w-0 flex-1">
            {uploadSuccess && (
              <p className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                <span>Uploaded to ImgBB</span>
              </p>
            )}
            <p className="truncate font-mono text-[11px] text-slate-400">{value}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setUploadSuccess(false);
            }}
            aria-label={`Remove ${label}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {uploadError && <p className="text-xs text-amber-300">{uploadError}</p>}
    </div>
  );
}
