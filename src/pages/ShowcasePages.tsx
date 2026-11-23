import { useMemo, useState } from 'react';
import { ExternalLink, Film, X, ZoomIn, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MorphingBackdrop,
  RevealBlock,
  SafeImage,
} from '../components/MotionPrimitives';
import { useData } from '../context/DataContext';

export function GalleryPage() {
  const { gallery } = useData();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

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
            A visual journey through our technology exhibitions, hands-on workshops, robotics builds, and memorable milestones.
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
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
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
              <article
                onClick={() => item.mediaType === 'image' && setSelectedPhoto(item)}
                className="group glass-surface flex h-full flex-col overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-950/40"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
                  {item.mediaType === 'video' ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0d152c] p-6 text-center">
                      <Film className="h-10 w-10 text-blue-400" />
                      <span className="mt-2 text-xs font-medium text-slate-300">
                        Video Document
                      </span>
                    </div>
                  ) : (
                    <>
                      <SafeImage
                        src={item.mediaUrl}
                        alt={item.title}
                        fallbackLabel={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white border border-white/20">
                          <ZoomIn className="h-3.5 w-3.5 text-blue-400" />
                          <span>Click to expand</span>
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-blue-300">{item.category}</span>
                    {item.capturedDate && (
                      <span className="font-mono tabular-nums">{item.capturedDate}</span>
                    )}
                  </div>
                  <h2 className="font-display mt-1.5 text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400">
                      {item.description}
                    </p>
                  )}

                  {item.driveUrl && (
                    <div className="mt-4 border-t border-white/10 pt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
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

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-[#030712]/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
              className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-blue-500/40 bg-[#081126] shadow-2xl shadow-blue-950/80 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-[#0b142d] px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
                    {selectedPhoto.category}
                  </span>
                  {selectedPhoto.capturedDate && (
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                      <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                      {selectedPhoto.capturedDate}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="rounded-xl bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative flex-1 overflow-hidden bg-black/80 flex items-center justify-center p-4">
                <img
                  src={selectedPhoto.mediaUrl}
                  alt={selectedPhoto.title}
                  className="max-h-[60vh] w-auto object-contain rounded-xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-6 bg-[#070e20] border-t border-white/10 space-y-2">
                <h3 className="font-display text-xl font-bold text-white">
                  {selectedPhoto.title}
                </h3>
                {selectedPhoto.description && (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedPhoto.description}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
            Transforming classroom concepts into real-world engineering, robotics, and software solutions. Explore the prototypes and digital systems built by our Technology Section.
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
              <article className="glass-surface group flex h-full flex-col overflow-hidden rounded-2xl transition-colors hover:border-blue-500/35">
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <SafeImage
                    src={project.imageUrl}
                    alt={project.title}
                    fallbackLabel={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                  {project.technicalDetails && (
                    <p className="mt-3 text-xs leading-relaxed text-slate-400">
                      {project.technicalDetails}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-slate-400">
                    <span className="truncate">Team: {project.studentTeam}</span>
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 font-semibold text-blue-300 transition-colors hover:text-white"
                      >
                        <span>Demo</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            </RevealBlock>
          ))}
        </div>
      </div>
    </div>
  );
}
