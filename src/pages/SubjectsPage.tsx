import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Cpu, Download, ExternalLink, User } from 'lucide-react';
import { CustomLinksSlot } from '../components/CustomLinksSlot';
import { HoverInfoBox } from '../components/HoverInfoBox';
import { MorphingBackdrop, RevealBlock, SafeImage, TiltCard } from '../components/MotionPrimitives';
import { useData } from '../context/DataContext';
import type { PageRoute } from '../types';

interface SubjectsPageProps {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string | null) => void;
  onNavigate?: (route: PageRoute, subjectId?: string) => void;
}

export function SubjectsPage({ selectedSubjectId, onSelectSubject, onNavigate }: SubjectsPageProps) {
  const { subjects, downloads, projects, teachers } = useData();

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || null;

  if (activeSubject) {
    const relatedDownloads = downloads.filter(
      (d) => d.subjectCode.toUpperCase() === activeSubject.code.toUpperCase()
    );
    const relatedProjects = projects.filter(
      (p) => p.subjectCode.toUpperCase() === activeSubject.code.toUpperCase()
    );
    const relatedTeachers = teachers.filter(
      (t) =>
        t.department.toUpperCase() === activeSubject.code.toUpperCase() ||
        t.department.toLowerCase() === activeSubject.name.toLowerCase()
    );

    return (
      <div className="relative overflow-hidden py-12 sm:py-16">
        <MorphingBackdrop variant="section" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => onSelectSubject(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Subjects</span>
          </button>

          <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-sm text-blue-300">
                <span className="font-mono font-semibold">{activeSubject.code}</span>
                <span aria-hidden="true">·</span>
                <span>Technology Section Curriculum</span>
              </div>
              <h1
                className="font-display mt-3 font-bold tracking-tight text-white"
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3rem)', textWrap: 'balance' }}
              >
                {activeSubject.name}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-slate-300">
                {activeSubject.fullDescription}
              </p>

              {activeSubject.labFacilities && (
                <div className="mt-6 glass-surface rounded-xl p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                    <Cpu className="h-4 w-4" />
                    <span>Laboratory & Equipment Infrastructure</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{activeSubject.labFacilities}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="glass-surface-elevated h-full min-h-[260px] overflow-hidden rounded-2xl">
                <SafeImage
                  src={activeSubject.imageUrl}
                  alt={activeSubject.name}
                  fallbackLabel={activeSubject.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Curriculum Highlights & Faculty Info */}
          <div className="mt-12 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7 glass-surface rounded-2xl p-7">
              <h2 className="font-display text-xl font-semibold text-white">
                Core Curriculum Modules
              </h2>
              {activeSubject.curriculumHighlights && activeSubject.curriculumHighlights.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {activeSubject.curriculumHighlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  Curriculum module details are maintained by the department head.
                </p>
              )}
            </div>

            <div className="lg:col-span-5 glass-surface rounded-2xl p-7">
              <h2 className="font-display text-xl font-semibold text-white">
                Department Leadership
              </h2>
              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-300">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-white">
                    {activeSubject.headTeacherName || 'Faculty Coordinator'}
                  </p>
                  <p className="text-xs text-blue-300">
                    {activeSubject.headTeacherTitle || `${activeSubject.code} Department`}
                  </p>
                </div>
              </div>

              {relatedTeachers.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-5 space-y-3">
                  <p className="text-xs font-medium text-slate-400">Department Faculty</p>
                  {relatedTeachers.map((t) => (
                    <div key={t.id} className="text-sm">
                      <p className="font-medium text-white">{t.name}</p>
                      <p className="text-xs text-slate-400">
                        {t.role} {t.officeRoom ? `· ${t.officeRoom}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subject Downloadable Materials */}
          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold text-white">
              Downloadable Learning Materials ({activeSubject.code})
            </h2>
            {relatedDownloads.length === 0 ? (
              <div className="mt-4 glass-surface rounded-xl p-6 text-sm text-slate-400">
                No downloadable documents have been attached to {activeSubject.code} yet. Check the Downloads hub for general resources.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {relatedDownloads.map((res) => (
                  <div
                    key={res.id}
                    className="glass-surface flex items-center justify-between gap-4 rounded-xl p-5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-blue-300">{res.resourceType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{res.fileFormat}</span>
                        {res.fileSizeLabel && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{res.fileSizeLabel}</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-display mt-1 truncate text-base font-semibold text-white">
                        {res.title}
                      </h3>
                      {res.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {res.description}
                        </p>
                      )}
                    </div>
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
                    >
                      {res.fileFormat === 'Drive' || res.fileFormat === 'Link' ? (
                        <ExternalLink className="h-3.5 w-3.5" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>Open</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Projects */}
          {relatedProjects.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl font-bold text-white">
                Student Projects in {activeSubject.code}
              </h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {relatedProjects.map((proj) => (
                  <div key={proj.id} className="glass-surface rounded-xl p-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-violet-300">{proj.subjectCode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{proj.year}</span>
                    </div>
                    <h3 className="font-display mt-2 text-lg font-semibold text-white">
                      {proj.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">{proj.summary}</p>
                    <p className="mt-3 text-xs text-slate-400">Team: {proj.studentTeam}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden py-14 sm:py-20">
      <MorphingBackdrop variant="section" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealBlock className="max-w-3xl">
          <h1
            className="font-display mt-3 font-bold tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
          >
            Technology Section Subjects
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Select any subject below to explore curriculum modules, faculty coordinators, laboratory equipment, and downloadable syllabi or past papers.
          </p>
          <CustomLinksSlot targetSection="subjects" onNavigate={onNavigate} />
        </RevealBlock>

        <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, idx) => (
            <RevealBlock key={subject.id} delay={idx * 0.04}>
              <HoverInfoBox
                className="h-full"
                title={`${subject.code} · ${subject.name}`}
                badge={subject.headTeacherName || 'Academic Program'}
                description={subject.labFacilities || subject.shortDescription}
                icon={<BookOpen className="h-3.5 w-3.5" />}
              >
                <TiltCard
                  onClick={() => onSelectSubject(subject.id)}
                  className="group flex h-full flex-col overflow-hidden"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <SafeImage
                      src={subject.imageUrl}
                      alt={subject.name}
                      fallbackLabel={subject.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 text-xs text-blue-300">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="font-mono font-semibold">{subject.code}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate text-slate-400">
                        {subject.headTeacherName || 'Faculty Lead'}
                      </span>
                    </div>
                    <h2 className="font-display mt-2 text-xl font-semibold text-white">
                      {subject.name}
                    </h2>
                    <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-300">
                      {subject.shortDescription}
                    </p>
                    <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-blue-300 group-hover:text-white">
                      <span>View Subject Page</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </TiltCard>
              </HoverInfoBox>
            </RevealBlock>
          ))}
        </div>
      </div>
    </div>
  );
}
