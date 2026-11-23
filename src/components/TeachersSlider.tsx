import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, GraduationCap, MapPin, X } from 'lucide-react';
import { SafeImage } from './MotionPrimitives';
import type { Teacher } from '../types';

interface TeachersSliderProps {
  teachers: Teacher[];
}

export function TeachersSlider({ teachers }: TeachersSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const displayTeachers = teachers.length > 0 ? teachers : [];

  useEffect(() => {
    if (displayTeachers.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayTeachers.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayTeachers.length, isPaused]);

  if (displayTeachers.length === 0) {
    return (
      <div className="glass-surface rounded-2xl p-8 text-center text-sm text-slate-400">
        No faculty members found. Administrators can add teachers from the Admin Panel.
      </div>
    );
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayTeachers.length) % displayTeachers.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayTeachers.length);
  };

  return (
    <div
      className="relative overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/35 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
            <GraduationCap className="h-3.5 w-3.5 text-blue-300" />
            <span>Instructional Faculty &amp; Lab Mentors</span>
          </div>
          <h3 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
            Teachers &amp; Faculty Slider
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous teacher"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-blue-400/50 hover:bg-blue-500/15 hover:text-blue-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next teacher"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-blue-400/50 hover:bg-blue-500/15 hover:text-blue-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div className="relative overflow-hidden rounded-2xl p-1">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayTeachers.map((teacher, idx) => {
            const isFeatured = idx === currentIndex || idx === (currentIndex + 1) % displayTeachers.length || idx === (currentIndex + 2) % displayTeachers.length;
            if (!isFeatured && displayTeachers.length > 3) return null;

            return (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedTeacher(teacher)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-[#0d1630]/95 to-[#091023]/95 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-400/50 hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.3)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060b19]">
                  <SafeImage
                    src={teacher.photoUrl}
                    alt={teacher.name}
                    fallbackLabel={teacher.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091127] via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full border border-blue-400/35 bg-[#050914]/88 px-3 py-1 font-mono text-[11px] font-semibold text-blue-200 backdrop-blur-sm">
                    {teacher.department}
                  </span>
                </div>

                <div className="p-6">
                  <span className="text-xs font-semibold text-blue-300">{teacher.role}</span>
                  <h4 className="font-display mt-2 text-xl font-bold text-white group-hover:text-blue-200">
                    {teacher.name}
                  </h4>
                  {teacher.qualifications && (
                    <p className="mt-1 text-xs font-medium text-slate-400">{teacher.qualifications}</p>
                  )}
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-300">
                    {teacher.bio || 'Technology Department Faculty Member'}
                  </p>
                  {teacher.officeRoom && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      <span>{teacher.officeRoom}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {displayTeachers.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to teacher slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              currentIndex === i ? 'w-8 bg-blue-400' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Full Detail Modal */}
      <AnimatePresence>
        {selectedTeacher && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedTeacher(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-blue-400/40 bg-gradient-to-br from-[#0e1938] via-[#0a132c] to-[#13193b] p-6 sm:p-8 shadow-2xl text-white"
            >
              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                aria-label="Close modal"
                className="absolute right-4 top-4 rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative aspect-[4/3] sm:aspect-square w-full sm:w-56 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-[#050914]">
                  <SafeImage
                    src={selectedTeacher.photoUrl}
                    alt={selectedTeacher.name}
                    fallbackLabel={selectedTeacher.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-blue-400/40 bg-[#050914]/88 px-3 py-1 font-mono text-xs font-semibold text-blue-200">
                    {selectedTeacher.department}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="rounded-md border border-blue-400/35 bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-200">
                    {selectedTeacher.role}
                  </span>

                  <h3 className="font-display mt-2.5 text-2xl font-bold tracking-tight text-white">
                    {selectedTeacher.name}
                  </h3>

                  {selectedTeacher.qualifications && (
                    <p className="mt-1 text-xs font-medium text-blue-300">{selectedTeacher.qualifications}</p>
                  )}

                  <p className="mt-4 text-sm leading-relaxed text-slate-200">
                    {selectedTeacher.bio || 'Dedicated educator and laboratory mentor at SSCK Technology Section.'}
                  </p>

                  {selectedTeacher.officeRoom && (
                    <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-slate-300">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      <span>Office / Laboratory Location: {selectedTeacher.officeRoom}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
