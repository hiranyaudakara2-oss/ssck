import { useMemo, useState } from 'react';
import { ExternalLink, Film } from 'lucide-react';
import {
  MorphingBackdrop,
  RevealBlock,
  SafeImage,
} from '../components/MotionPrimitives';
import { useData } from '../context/DataContext';

export function GalleryPage() {
  const { gallery } = useData();
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(() => {
    const set = new Set(gallery.map((g) => g.category));
    return ['All', ...Array.from(set)];
  }, [gallery]);

  const filtered = useMemo(() => {
    return gallery.filter((g) => categoryFilter === 'All' || g.category === categoryFilter);
  }, [gallery, categoryFilter]);

  return (
    <div className="relative overflow-hidden py-14 sm:py-20">
      <MorphingBackdrop variant="section" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealBlock className="max-w-3xl">
          <h1
            className="font-display mt-3 font-bold tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
          >
            Gallery
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Visual documentation from engineering bays, biotechnology trials, computing studios, and field mapping expeditions.
          </p>
        </RevealBlock>

        <div className="mt-10 flex w-fit flex-wrap items-center gap-1 rounded-xl bg-white/5 p-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <RevealBlock key={item.id}>
              <article className="glass-surface flex h-full flex-col overflow-hidden rounded-2xl">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {item.mediaType === 'video' ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0d152c] p-6 text-center">
                      <Film className="h-10 w-10 text-blue-400" />
                      <span className="mt-2 text-xs font-medium text-slate-300">
                        Video Document
                      </span>
                    </div>
                  ) : (
                    <SafeImage
                      src={item.mediaUrl}
                      alt={item.title}
                      fallbackLabel={item.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-blue-300">{item.category}</span>
                    {item.capturedDate && (
                      <span className="font-mono tabular-nums">{item.capturedDate}</span>
                    )}
                  </div>
                  <h2 className="font-display mt-1.5 text-base font-semibold text-white">
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400">
                      {item.description}
                    </p>
                  )}

                  {item.driveUrl && (
                    <div className="mt-4 border-t border-white/10 pt-3 flex justify-end">
                      <a
                        href={item.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/35 px-3 py-1.5 text-xs font-semibold text-cyan-200 border border-blue-400/30 hover:bg-blue-600/50 hover:text-white transition-colors"
                      >
                        <span>Google Drive</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </article>
            </RevealBlock>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const { projects } = useData();
  const [subjectFilter, setSubjectFilter] = useState('All');

  const subjectCodes = useMemo(() => {
    const set = new Set(projects.map((p) => p.subjectCode.toUpperCase()));
    return ['All', ...Array.from(set)];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter(
      (p) => subjectFilter === 'All' || p.subjectCode.toUpperCase() === subjectFilter
    );
  }, [projects, subjectFilter]);

  return (
    <div className="relative overflow-hidden py-14 sm:py-20">
      <MorphingBackdrop variant="section" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealBlock className="max-w-3xl">
          <h1
            className="font-display mt-3 font-bold tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
          >
            Student Innovation Projects
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Capstone prototypes, autonomous hardware, hydroponic automation, and software platforms engineered by Technology Section teams.
          </p>
        </RevealBlock>

        <div className="mt-10 flex w-fit flex-wrap items-center gap-1 rounded-xl bg-white/5 p-1">
          {subjectCodes.map((code) => (
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

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <RevealBlock key={project.id}>
              <div className="glass-surface flex h-full flex-col overflow-hidden rounded-2xl">
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <SafeImage
                    src={project.imageUrl}
                    alt={project.title}
                    fallbackLabel={project.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono font-semibold text-violet-300">
                      {project.subjectCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{project.year}</span>
                  </div>
                  <h2 className="font-display mt-2 text-lg font-semibold text-white">
                    {project.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-300">
                    {project.summary}
                  </p>
                  <p className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400">
                    Team: {project.studentTeam}
                  </p>
                </div>
              </div>
            </RevealBlock>
          ))}
        </div>
      </div>
    </div>
  );
}
