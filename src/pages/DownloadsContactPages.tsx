import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
} from 'lucide-react';
import { CustomLinksSlot } from '../components/CustomLinksSlot';
import { HoverInfoBox } from '../components/HoverInfoBox';
import { MorphingBackdrop, RevealBlock } from '../components/MotionPrimitives';
import { useData } from '../context/DataContext';
import type { PageRoute } from '../types';

export function DownloadsPage({
  onNavigate,
}: {
  onNavigate?: (route: PageRoute, subjectId?: string) => void;
}) {
  const { downloads } = useData();
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const subjectsList = useMemo(() => {
    const set = new Set(downloads.map((d) => d.subjectCode.toUpperCase()));
    return ['All', ...Array.from(set)];
  }, [downloads]);

  const typesList = ['All', 'Syllabus', 'Past Paper', 'Lab Manual', 'Study Guide', 'Dataset'];

  const filtered = useMemo(() => {
    return downloads.filter((d) => {
      const matchSubj =
        subjectFilter === 'All' || d.subjectCode.toUpperCase() === subjectFilter;
      const matchType = typeFilter === 'All' || d.resourceType === typeFilter;
      const q = searchTerm.trim().toLowerCase();
      const matchQ =
        !q ||
        d.title.toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q);
      return matchSubj && matchType && matchQ;
    });
  }, [downloads, subjectFilter, typeFilter, searchTerm]);

  return (
    <div className="relative overflow-hidden py-14 sm:py-20">
      <MorphingBackdrop variant="section" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealBlock className="max-w-3xl">
          <h1
            className="font-display mt-3 font-bold tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
          >
            Downloads & Learning Materials
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Access verified syllabi, past examination packs, laboratory SOP manuals, datasets, and shared Google Drive folders across all Technology Section subjects.
          </p>
          <CustomLinksSlot targetSection="downloads" onNavigate={onNavigate} />
        </RevealBlock>

        {/* Filters */}
        <div className="mt-10 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-fit flex-wrap items-center gap-1 rounded-xl bg-white/5 p-1">
              {subjectsList.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSubjectFilter(code)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    subjectFilter === code
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search manuals, papers..."
                className="w-full rounded-xl border border-white/10 bg-[#0d152c] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex w-fit flex-wrap items-center gap-1 rounded-xl bg-white/5 p-1">
            {typesList.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === t
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Downloads List */}
        {filtered.length === 0 ? (
          <div className="mt-10 glass-surface rounded-2xl p-10 text-center text-sm text-slate-400">
            No learning materials matched your current filter.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {filtered.map((item) => (
              <RevealBlock key={item.id}>
                <HoverInfoBox
                  className="h-full"
                  title={item.title}
                  badge={`${item.subjectCode} · ${item.resourceType}`}
                  description={item.description || `Open ${item.fileFormat} learning resource (${item.fileSizeLabel || 'Verified'})`}
                  icon={<FileText className="h-3.5 w-3.5" />}
                >
                  <article className="glass-surface flex h-full flex-col justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono font-semibold text-blue-300">
                          {item.subjectCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.resourceType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{item.fileFormat}</span>
                        {item.fileSizeLabel && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{item.fileSizeLabel}</span>
                          </>
                        )}
                      </div>
                      <h2 className="font-display mt-2 flex items-center gap-2 text-base font-semibold text-white">
                        <FileText className="h-4 w-4 shrink-0 text-blue-400" />
                        <span className="truncate">{item.title}</span>
                      </h2>
                      {item.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap"
                    >
                      {item.fileFormat === 'Drive' || item.fileFormat === 'Link' ? (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Open Drive</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </>
                      )}
                    </a>
                  </article>
                </HoverInfoBox>
              </RevealBlock>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ContactPage({
  onNavigate,
}: {
  onNavigate?: (route: PageRoute, subjectId?: string) => void;
}) {
  const { siteSettings, user, signInWithGoogle, submitContactMessage } = useData();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (subject.trim().length < 2) {
      setErrorMsg('Please provide a brief subject line.');
      return;
    }
    if (message.trim().length < 5) {
      setErrorMsg('Please enter at least a short message describing your inquiry.');
      return;
    }
    setSubmitting(true);
    try {
      await submitContactMessage(subject, message);
      setSubmitted(true);
      setSubject('');
      setMessage('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden py-14 sm:py-20">
      <MorphingBackdrop variant="section" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealBlock className="max-w-3xl">
          <h1
            className="font-display mt-3 font-bold tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
          >
            Contact the Technology Section
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Reach out for admissions guidance, laboratory partnerships, robotics exhibition inquiries, or academic support.
          </p>
          <CustomLinksSlot targetSection="contact" onNavigate={onNavigate} />
        </RevealBlock>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          {/* Contact Information */}
          <div className="space-y-6 lg:col-span-5">
            <div className="glass-surface rounded-2xl p-7">
              <h2 className="font-display text-xl font-semibold text-white">
                Campus Office Details
              </h2>

              <div className="mt-6 space-y-5 text-sm text-slate-300">
                <div className="flex items-start gap-3.5">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                  <div>
                    <p className="font-semibold text-white">Location</p>
                    <p className="mt-0.5 text-slate-400">{siteSettings.footerAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                  <div>
                    <p className="font-semibold text-white">Official Email</p>
                    <a
                      href={`mailto:${siteSettings.footerEmail}`}
                      className="mt-0.5 block text-blue-300 hover:underline"
                    >
                      {siteSettings.footerEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                  <div>
                    <p className="font-semibold text-white">Department Telephone</p>
                    <p className="mt-0.5 font-mono tabular-nums text-slate-400">
                      {siteSettings.footerPhone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="glass-surface rounded-2xl p-7 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-white">
                Send a Direct Inquiry
              </h2>

              {!user ? (
                <div className="mt-6 rounded-xl border border-blue-500/25 bg-blue-950/30 p-6">
                  <p className="text-sm leading-relaxed text-slate-300">
                    To protect the department from automated spam, inquiries are linked to a verified Google account. Sign in below to send a message directly to the Technology Section administration.
                  </p>
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    <span>Sign in with Google to Message</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                    Signed in as <span className="font-semibold text-white">{user.displayName}</span> ({user.email})
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-medium text-slate-300">
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      maxLength={180}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Grade 12 Engineering Stream Admission Inquiry"
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0a1124] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-medium text-slate-300">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      maxLength={3000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your inquiry for the Technology Section coordinators..."
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0a1124] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-medium text-rose-400">{errorMsg}</p>
                  )}

                  {submitted && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-xs font-medium text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Your inquiry has been received by the Technology Section office.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{submitting ? 'Sending...' : 'Send Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
