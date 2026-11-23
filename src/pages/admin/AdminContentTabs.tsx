import React, { useMemo, useState } from 'react';
import {
  Archive,
  Ban,
  Edit3,
  ExternalLink,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  formatColomboDateLabel,
  resolveEffectiveEventStatus,
} from '../../components/EventCountdown';
import { SafeImage } from '../../components/MotionPrimitives';
import { SectionEmptyState } from '../../components/SectionEmptyState';
import { useData } from '../../context/DataContext';
import { isBootstrappedAdminEmail } from '../../firebase';
import { isValidExternalUrl } from '../../utils/validation';
import type {
  Achievement,
  AchievementIconType,
  AchievementTier,
  CampusEvent,
  DownloadResource,
  EventStatus,
  GalleryItem,
  Student,
  StudentProject,
  Teacher,
} from '../../types';
import { AdminActionAlert } from './AdminActionAlert';
import { AdminMediaInput } from './AdminMediaInput';

export function PeopleTab() {
  const { teachers, students, saveTeacher, deleteTeacher, saveStudent, deleteStudent } = useData();
  const [subTab, setSubTab] = useState<'teachers' | 'students'>('teachers');
  const [editTeacher, setEditTeacher] = useState<Partial<Teacher> | null>(null);
  const [editStudent, setEditStudent] = useState<Partial<Student> | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher) return;
    if (!editTeacher.name || editTeacher.name.trim().length < 2) {
      setActionError('Teacher name must be at least 2 characters.');
      return;
    }
    if (!editTeacher.role || editTeacher.role.trim().length < 2) {
      setActionError('Role / Title must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await saveTeacher({
        id: editTeacher.id,
        name: editTeacher.name || '',
        role: editTeacher.role || '',
        department: editTeacher.department || 'SFT',
        qualifications: editTeacher.qualifications || '',
        bio: editTeacher.bio || '',
        photoUrl: editTeacher.photoUrl || '',
        officeRoom: editTeacher.officeRoom || '',
      });
      setEditTeacher(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to save teacher profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    if (!editStudent.fullName || editStudent.fullName.trim().length < 2) {
      setActionError('Student full name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await saveStudent({
        id: editStudent.id,
        fullName: editStudent.fullName || '',
        gradeLevel: editStudent.gradeLevel || 'Grade 13',
        stream: editStudent.stream || 'Engineering Technology',
        roleTitle: editStudent.roleTitle || '',
        achievementsSummary: editStudent.achievementsSummary || '',
        photoUrl: editStudent.photoUrl || '',
        graduationYear: editStudent.graduationYear || '2026',
        featured: Boolean(editStudent.featured),
      });
      setEditStudent(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to save member profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    setActionError(null);
    try {
      await deleteTeacher(id, name);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete teacher profile. Please try again.'
      );
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    setActionError(null);
    try {
      await deleteStudent(id, name);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete member profile. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Teachers & Community Members</h2>
          <p className="mt-1 text-sm text-slate-400">
            Manage faculty profiles, office locations, and featured Community Member guild leads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setSubTab('teachers')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                subTab === 'teachers' ? 'bg-blue-600 text-white' : 'text-slate-300'
              }`}
            >
              Teachers ({teachers.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('students')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                subTab === 'students' ? 'bg-blue-600 text-white' : 'text-slate-300'
              }`}
            >
              Community Members ({students.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setActionError(null);
              if (subTab === 'teachers') {
                setEditTeacher({ name: '', role: '', department: 'SFT' });
              } else {
                setEditStudent({
                  fullName: '',
                  gradeLevel: 'Grade 13',
                  stream: 'Engineering Technology',
                  featured: true,
                });
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>{subTab === 'teachers' ? 'Add Teacher' : 'Add Member'}</span>
          </button>
        </div>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {subTab === 'teachers' && editTeacher && (
        <form
          onSubmit={handleSaveTeacher}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Full Name</label>
              <input
                type="text"
                required
                maxLength={120}
                value={editTeacher.name || ''}
                onChange={(e) => setEditTeacher({ ...editTeacher, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Role</label>
              <input
                type="text"
                required
                maxLength={120}
                value={editTeacher.role || ''}
                onChange={(e) => setEditTeacher({ ...editTeacher, role: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Department</label>
              <input
                type="text"
                required
                maxLength={100}
                value={editTeacher.department || ''}
                onChange={(e) => setEditTeacher({ ...editTeacher, department: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-300">Qualifications</label>
              <input
                type="text"
                maxLength={300}
                value={editTeacher.qualifications || ''}
                onChange={(e) =>
                  setEditTeacher({ ...editTeacher, qualifications: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Office / Lab Room</label>
              <input
                type="text"
                maxLength={80}
                value={editTeacher.officeRoom || ''}
                onChange={(e) => setEditTeacher({ ...editTeacher, officeRoom: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-300">Biography</label>
            <textarea
              rows={2}
              maxLength={1200}
              value={editTeacher.bio || ''}
              onChange={(e) => setEditTeacher({ ...editTeacher, bio: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <AdminMediaInput
            label="Profile Photo"
            value={editTeacher.photoUrl || ''}
            onChange={(url) => setEditTeacher({ ...editTeacher, photoUrl: url })}
            folder="teachers"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              {saving ? 'Saving...' : 'Save Teacher'}
            </button>
            <button
              type="button"
              onClick={() => setEditTeacher(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {subTab === 'students' && editStudent && (
        <form
          onSubmit={handleSaveStudent}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Member Name</label>
              <input
                type="text"
                required
                maxLength={120}
                value={editStudent.fullName || ''}
                onChange={(e) => setEditStudent({ ...editStudent, fullName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Grade Level</label>
              <input
                type="text"
                required
                maxLength={60}
                value={editStudent.gradeLevel || ''}
                onChange={(e) => setEditStudent({ ...editStudent, gradeLevel: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Stream</label>
              <input
                type="text"
                required
                maxLength={100}
                value={editStudent.stream || ''}
                onChange={(e) => setEditStudent({ ...editStudent, stream: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Leadership / Role Title</label>
              <input
                type="text"
                maxLength={120}
                value={editStudent.roleTitle || ''}
                onChange={(e) => setEditStudent({ ...editStudent, roleTitle: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Graduation Year</label>
              <input
                type="text"
                maxLength={20}
                value={editStudent.graduationYear || ''}
                onChange={(e) => setEditStudent({ ...editStudent, graduationYear: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <label className="flex items-center gap-2 pt-6 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(editStudent.featured)}
                onChange={(e) => setEditStudent({ ...editStudent, featured: e.target.checked })}
              />
              <span>Featured Scholar</span>
            </label>
          </div>
          <div>
            <label className="block text-xs text-slate-300">Achievements Summary</label>
            <textarea
              rows={2}
              maxLength={800}
              value={editStudent.achievementsSummary || ''}
              onChange={(e) =>
                setEditStudent({ ...editStudent, achievementsSummary: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <AdminMediaInput
            label="Member Photo"
            value={editStudent.photoUrl || ''}
            onChange={(url) => setEditStudent({ ...editStudent, photoUrl: url })}
            folder="students"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              {saving ? 'Saving...' : 'Save Member'}
            </button>
            <button
              type="button"
              onClick={() => setEditStudent(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1328]">
        {subTab === 'teachers' ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{t.department}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{t.role}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditTeacher(t)}
                        className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteTeacher(t.id, t.name)}
                        className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:bg-rose-950/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Stream</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-white">{s.fullName}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{s.gradeLevel}</td>
                  <td className="px-4 py-3 text-xs text-blue-300">{s.stream}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditStudent(s)}
                        className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteStudent(s.id, s.fullName)}
                        className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:bg-rose-950/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function EventsAchievementsTab() {
  const {
    events,
    achievements,
    saveEvent,
    updateEventStatus,
    deleteEvent,
    saveAchievement,
    deleteAchievement,
  } = useData();
  const [subTab, setSubTab] = useState<'events' | 'achievements'>('events');
  const [editEvent, setEditEvent] = useState<Partial<CampusEvent> | null>(null);
  const [editAch, setEditAch] = useState<Partial<Achievement> | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [cancelTargetEvent, setCancelTargetEvent] = useState<CampusEvent | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('All');
  const [eventYearFilter, setEventYearFilter] = useState<string>('All');

  const eventCategories = useMemo(() => {
    const cats = new Set(['Exhibition', 'Workshop', 'Competition', 'Symposium']);
    events.forEach((e) => {
      if (e.category?.trim()) cats.add(e.category.trim());
    });
    return ['All', ...Array.from(cats)];
  }, [events]);

  const eventYears = useMemo(() => {
    const years = new Set(['2024', '2025', '2026', '2027', '2028']);
    events.forEach((e) => {
      const match = e.eventDate?.match(/\b(20\d{2})\b/);
      if (match?.[1]) years.add(match[1]);
    });
    return ['All', ...Array.from(years).sort((a, b) => b.localeCompare(a))];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesCat =
        eventCategoryFilter === 'All' ||
        ev.category?.trim().toLowerCase() === eventCategoryFilter.toLowerCase();
      const evYear = ev.eventDate?.match(/\b(20\d{2})\b/)?.[1] || '';
      const matchesYear = eventYearFilter === 'All' || evYear === eventYearFilter;
      return matchesCat && matchesYear;
    });
  }, [events, eventCategoryFilter, eventYearFilter]);

  const hasEventFilters = eventCategoryFilter !== 'All' || eventYearFilter !== 'All';

  const toDateTimeLocalValue = (eventDate?: string, startTime?: string): string => {
    const safeDate = (eventDate || new Date().toISOString().slice(0, 10)).split('T')[0];
    const safeTime = /^\d{1,2}:\d{2}$/.test((startTime || '').trim())
      ? (startTime || '').trim().padStart(5, '0')
      : '09:00';
    return `${safeDate}T${safeTime}`;
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEvent) return;
    const cleanTitle = (editEvent.title || '').trim();
    const cleanCategory = (editEvent.category || 'Workshop').trim();
    const cleanDate = (editEvent.eventDate || new Date().toISOString().slice(0, 10)).trim();
    const cleanLocation = (editEvent.location || '').trim();
    const chosenStatus: EventStatus =
      editEvent.status || (editEvent.isUpcoming ? 'scheduled' : 'closed');

    if (!cleanTitle) {
      setActionError('Please enter a valid event title.');
      return;
    }
    if (!cleanCategory) {
      setActionError('Please enter an event category.');
      return;
    }
    if (cleanDate.length < 4) {
      setActionError('Please select a valid event date and time.');
      return;
    }
    if (!cleanLocation) {
      setActionError('Please enter a valid event venue.');
      return;
    }

    setSaving(true);
    setActionError(null);
    try {
      await saveEvent({
        id: editEvent.id,
        title: cleanTitle,
        category: cleanCategory,
        eventDate: cleanDate,
        startTime: editEvent.startTime || '',
        timeLabel: editEvent.timeLabel || '',
        location: cleanLocation,
        description: editEvent.description || '',
        imageUrl: editEvent.imageUrl || '',
        isUpcoming: chosenStatus === 'scheduled' || chosenStatus === 'live',
        status: chosenStatus,
        cancellationReason: chosenStatus === 'cancelled' ? editEvent.cancellationReason || '' : '',
        liveStreamUrl: editEvent.liveStreamUrl || '',
        registrationLink: editEvent.registrationLink || '',
      });
      setEditEvent(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to save event. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (
    ev: CampusEvent,
    nextStatus: EventStatus,
    reason?: string
  ) => {
    setActionError(null);
    setStatusUpdatingId(ev.id);
    try {
      await updateEventStatus(ev, nextStatus, reason);
      if (cancelTargetEvent?.id === ev.id) {
        setCancelTargetEvent(null);
        setCancelReasonInput('');
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to update event status. Please try again.'
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleSaveAch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAch) return;
    setSaving(true);
    setActionError(null);
    try {
      await saveAchievement({
        id: editAch.id,
        title: editAch.title || '',
        category: editAch.category || 'Engineering & Robotics',
        awardLevel: editAch.awardLevel || 'National',
        tier: editAch.tier || 'Gold',
        iconType: editAch.iconType || 'trophy',
        year: editAch.year || '2026',
        awardDate: editAch.awardDate || '',
        recipients: editAch.recipients || '',
        description: editAch.description || '',
        imageUrl: editAch.imageUrl || '',
        featured: Boolean(editAch.featured),
      });
      setEditAch(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to publish achievement. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    setActionError(null);
    try {
      await deleteEvent(id, title);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete event. Please try again.'
      );
    }
  };

  const handleDeleteAchievement = async (id: string, title: string) => {
    setActionError(null);
    try {
      await deleteAchievement(id, title);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete achievement. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Events & Achievements</h2>
          <p className="mt-1 text-sm text-slate-400">
            Schedule exhibitions, workshops, and publish institutional student awards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setSubTab('events')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                subTab === 'events' ? 'bg-blue-600 text-white' : 'text-slate-300'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('achievements')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                subTab === 'achievements' ? 'bg-blue-600 text-white' : 'text-slate-300'
              }`}
            >
              Achievements ({achievements.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setActionError(null);
              if (subTab === 'events') {
                setEditEvent({
                  title: '',
                  category: 'Workshop',
                  eventDate: new Date().toISOString().slice(0, 10),
                  startTime: '09:00',
                  location: '',
                  isUpcoming: true,
                  status: 'scheduled',
                  cancellationReason: '',
                  liveStreamUrl: '',
                  registrationLink: '',
                });
              } else {
                setEditAch({
                  title: '',
                  category: 'Engineering & Robotics',
                  awardLevel: 'National',
                  tier: 'Gold',
                  iconType: 'trophy',
                  year: '2026',
                  awardDate: new Date().toISOString().slice(0, 10),
                  featured: true,
                });
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>{subTab === 'events' ? 'Add Event' : 'Publish Award'}</span>
          </button>
        </div>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {subTab === 'events' && editEvent && (
        <form
          onSubmit={handleSaveEvent}
          className="space-y-4 rounded-xl border border-[#00FFFF]/35 bg-[#081229]/95 p-6 shadow-[0_0_28px_rgba(0,255,255,0.08)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <h3 className="font-display text-base font-semibold text-white">
              {editEvent.id ? 'Edit Event & Live Schedule' : 'Create New Event'}
            </h3>
            <span className="font-mono text-[11px] text-[#00FFFF]">
              Asia/Colombo (UTC+05:30)
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-300">Event Title</label>
              <input
                type="text"
                required
                maxLength={160}
                value={editEvent.title || ''}
                onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                placeholder="e.g., SSCK Tech Day & Autonomous Robotics Fair"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Category / Stream</label>
              <input
                type="text"
                required
                maxLength={80}
                value={editEvent.category || ''}
                onChange={(e) => setEditEvent({ ...editEvent, category: e.target.value })}
                placeholder="Exhibition, Workshop, Competition..."
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="block text-xs text-slate-300">
                Date &amp; Start Time (Countdown Target)
              </label>
              <input
                type="datetime-local"
                required
                value={toDateTimeLocalValue(editEvent.eventDate, editEvent.startTime)}
                onChange={(e) => {
                  const raw = e.target.value;
                  const [dPart, tPart] = raw.split('T');
                  setEditEvent({
                    ...editEvent,
                    eventDate: dPart || editEvent.eventDate || '',
                    startTime: tPart ? tPart.slice(0, 5) : editEvent.startTime || '09:00',
                  });
                }}
                className="mt-1 w-full rounded-lg border border-[#00FFFF]/30 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Venue / Location</label>
              <input
                type="text"
                required
                maxLength={160}
                value={editEvent.location || ''}
                onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
                placeholder="SSCK Main Auditorium"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Event Status</label>
              <select
                value={
                  editEvent.status || (editEvent.isUpcoming ? 'scheduled' : 'closed')
                }
                onChange={(e) => {
                  const nextStatus = e.target.value as EventStatus;
                  setEditEvent({
                    ...editEvent,
                    status: nextStatus,
                    isUpcoming: nextStatus === 'scheduled' || nextStatus === 'live',
                  });
                }}
                className="mt-1 w-full rounded-lg border border-[#FFD700]/35 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                <option value="scheduled">Scheduled / Upcoming</option>
                <option value="live">Started / Live Now</option>
                <option value="cancelled">Cancelled</option>
                <option value="closed">Closed / Completed</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Display Time Label (Optional)</label>
              <input
                type="text"
                maxLength={60}
                value={editEvent.timeLabel || ''}
                onChange={(e) => setEditEvent({ ...editEvent, timeLabel: e.target.value })}
                placeholder="09:00 AM – 04:00 PM"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Live Stream / Join URL (Optional)</label>
              <input
                type="text"
                maxLength={1000}
                value={editEvent.liveStreamUrl || ''}
                onChange={(e) => setEditEvent({ ...editEvent, liveStreamUrl: e.target.value })}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Registration URL (Optional)</label>
              <input
                type="text"
                maxLength={1000}
                value={editEvent.registrationLink || ''}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, registrationLink: e.target.value })
                }
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          {(editEvent.status === 'cancelled') && (
            <div>
              <label className="block text-xs text-rose-300">
                Cancellation Notice (Shown on Public Card)
              </label>
              <input
                type="text"
                maxLength={400}
                value={editEvent.cancellationReason || ''}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, cancellationReason: e.target.value })
                }
                placeholder="Optional reason for cancellation (e.g., Rescheduled due to weather)"
                className="mt-1 w-full rounded-lg border border-rose-500/40 bg-rose-950/20 px-3 py-2 text-sm text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-300">Description</label>
            <textarea
              rows={3}
              maxLength={2000}
              value={editEvent.description || ''}
              onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <AdminMediaInput
            label="Event Cover Image"
            value={editEvent.imageUrl || ''}
            onChange={(url) => setEditEvent({ ...editEvent, imageUrl: url })}
            folder="events"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-[#00FFFF]/85 to-blue-600 px-5 py-2 text-xs font-bold text-[#050914] transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {saving ? 'Saving to Firestore...' : 'Save & Sync Event'}
            </button>
            <button
              type="button"
              onClick={() => setEditEvent(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {subTab === 'achievements' && editAch && (
        <form
          onSubmit={handleSaveAch}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-300">Achievement Title</label>
              <input
                type="text"
                required
                maxLength={160}
                value={editAch.title || ''}
                onChange={(e) => setEditAch({ ...editAch, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Award Level</label>
              <select
                value={editAch.awardLevel || 'National'}
                onChange={(e) =>
                  setEditAch({
                    ...editAch,
                    awardLevel: e.target.value as Achievement['awardLevel'],
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                <option value="International">International</option>
                <option value="National">National</option>
                <option value="Provincial">Provincial</option>
                <option value="School">School</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Badge Tier</label>
              <select
                value={editAch.tier || 'Gold'}
                onChange={(e) =>
                  setEditAch({
                    ...editAch,
                    tier: e.target.value as AchievementTier,
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300">Animated Graphic</label>
              <select
                value={editAch.iconType || 'trophy'}
                onChange={(e) =>
                  setEditAch({
                    ...editAch,
                    iconType: e.target.value as AchievementIconType,
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                <option value="trophy">Trophy</option>
                <option value="medal">Medal</option>
                <option value="certificate">Certificate</option>
                <option value="award">Award</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300">Award Date</label>
              <input
                type="date"
                value={editAch.awardDate || ''}
                onChange={(e) => setEditAch({ ...editAch, awardDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Category</label>
              <input
                type="text"
                required
                maxLength={80}
                value={editAch.category || ''}
                onChange={(e) => setEditAch({ ...editAch, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Year</label>
              <input
                type="text"
                required
                maxLength={12}
                value={editAch.year || ''}
                onChange={(e) => setEditAch({ ...editAch, year: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Recipients</label>
              <input
                type="text"
                maxLength={240}
                value={editAch.recipients || ''}
                onChange={(e) => setEditAch({ ...editAch, recipients: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-300">Description</label>
            <textarea
              rows={2}
              maxLength={1500}
              value={editAch.description || ''}
              onChange={(e) => setEditAch({ ...editAch, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <AdminMediaInput
            label="Achievement Photo (ImgBB Upload)"
            value={editAch.imageUrl || ''}
            onChange={(url) => setEditAch({ ...editAch, imageUrl: url })}
            folder="achievements"
          />
          <label className="flex items-center gap-2 text-xs text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(editAch.featured)}
              onChange={(e) => setEditAch({ ...editAch, featured: e.target.checked })}
            />
            <span>Feature on Home Page</span>
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              {saving ? 'Publishing...' : 'Save Achievement'}
            </button>
            <button
              type="button"
              onClick={() => setEditAch(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {subTab === 'events' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-400">
            Showing {filteredEvents.length} of {events.length} event(s)
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter events by category"
              value={eventCategoryFilter}
              onChange={(e) => setEventCategoryFilter(e.target.value)}
              className="rounded-lg border border-white/15 bg-[#091022] px-3 py-1.5 text-xs text-slate-200"
            >
              {eventCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter events by year"
              value={eventYearFilter}
              onChange={(e) => setEventYearFilter(e.target.value)}
              className="rounded-lg border border-white/15 bg-[#091022] px-3 py-1.5 text-xs text-slate-200"
            >
              {eventYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr === 'All' ? 'All Years' : yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {subTab === 'events' && cancelTargetEvent && (
        <div className="rounded-xl border border-rose-500/45 bg-rose-950/30 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-rose-200">
              Cancel Event: <span className="text-white">{cancelTargetEvent.title}</span>
            </p>
            <span className="font-mono text-[11px] text-rose-300">Instant Public Sync</span>
          </div>
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              maxLength={400}
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              placeholder="Optional cancellation reason shown on public cards (e.g., Postponed due to weather)..."
              className="flex-1 rounded-lg border border-rose-500/35 bg-[#091022] px-3 py-2 text-xs text-white focus:border-rose-400 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={statusUpdatingId === cancelTargetEvent.id}
                onClick={() =>
                  void handleQuickStatusChange(cancelTargetEvent, 'cancelled', cancelReasonInput)
                }
                className="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50 whitespace-nowrap"
              >
                {statusUpdatingId === cancelTargetEvent.id
                  ? 'Cancelling...'
                  : 'Confirm Cancellation'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCancelTargetEvent(null);
                  setCancelReasonInput('');
                }}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {subTab === 'events' && filteredEvents.length === 0 ? (
        <SectionEmptyState
          variant="events"
          compact
          onResetFilters={
            hasEventFilters && events.length > 0
              ? () => {
                  setEventCategoryFilter('All');
                  setEventYearFilter('All');
                }
              : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1328]">
          {subTab === 'events' ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="px-4 py-3">Event &amp; Venue</th>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Live Status</th>
                  <th className="px-4 py-3">One-Click Status Controls</th>
                  <th className="px-4 py-3 text-right">Edit / Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvents.map((ev) => {
                  const effective = resolveEffectiveEventStatus(ev);
                  const isBusy = statusUpdatingId === ev.id;
                  return (
                    <tr key={ev.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{ev.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          <span className="text-[#FFD700]">{ev.category}</span> · {ev.location}
                        </p>
                        {effective === 'cancelled' && ev.cancellationReason && (
                          <p className="mt-1 text-[11px] text-rose-300">
                            Notice: {ev.cancellationReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-300 whitespace-nowrap">
                        {formatColomboDateLabel(ev.eventDate, ev.startTime, ev.timeLabel)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {effective === 'live' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00FFFF]/50 bg-[#042331] px-2 py-0.5 font-mono text-[11px] font-bold text-[#00FFFF]">
                            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                            ● LIVE NOW
                          </span>
                        ) : effective === 'cancelled' ? (
                          <span className="inline-flex items-center rounded-md border border-rose-500/40 bg-rose-950/60 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-300">
                            CANCELLED
                          </span>
                        ) : effective === 'closed' ? (
                          <span className="inline-flex items-center rounded-md border border-[#FFD700]/40 bg-[#141208] px-2 py-0.5 font-mono text-[11px] font-bold text-[#FFD700]">
                            CLOSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-cyan-500/35 bg-cyan-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-300">
                            UPCOMING
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy || ev.status === 'live'}
                            onClick={() => void handleQuickStatusChange(ev, 'live')}
                            title="Start Event (Mark Live Now)"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-[#00FFFF] transition-colors hover:bg-emerald-900/60 disabled:opacity-40 whitespace-nowrap"
                          >
                            <Play className="h-3 w-3" />
                            <span>Start</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy || ev.status === 'cancelled'}
                            onClick={() => {
                              setCancelTargetEvent(ev);
                              setCancelReasonInput(ev.cancellationReason || '');
                            }}
                            title="Cancel Event"
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-950/40 px-2.5 py-1 text-[11px] font-semibold text-rose-300 transition-colors hover:bg-rose-900/60 disabled:opacity-40 whitespace-nowrap"
                          >
                            <Ban className="h-3 w-3" />
                            <span>Cancel</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy || ev.status === 'closed'}
                            onClick={() => void handleQuickStatusChange(ev, 'closed')}
                            title="Close / Complete Event"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#FFD700]/40 bg-[#1a1608]/70 px-2.5 py-1 text-[11px] font-semibold text-[#FFD700] transition-colors hover:bg-[#2a240c] disabled:opacity-40 whitespace-nowrap"
                          >
                            <Archive className="h-3 w-3" />
                            <span>Close</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy || ev.status === 'scheduled'}
                            onClick={() => void handleQuickStatusChange(ev, 'scheduled')}
                            title="Reset to Scheduled"
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/35 bg-cyan-950/35 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 transition-colors hover:bg-cyan-900/50 disabled:opacity-40 whitespace-nowrap"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reset</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditEvent(ev)}
                            title="Edit Event Details"
                            className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:border-[#00FFFF]/40 hover:text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteEvent(ev.id, ev.title)}
                            title="Delete Event"
                            className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:border-rose-400/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                <th className="px-4 py-3">Award</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Date / Year</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {achievements.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-white">{a.title}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-amber-300">
                    {a.tier || (a.awardLevel === 'International' ? 'Platinum' : 'Gold')}
                  </td>
                  <td className="px-4 py-3 text-xs text-violet-300">{a.awardLevel}</td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-300">
                    {a.awardDate || a.year}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditAch(a)}
                        className="rounded-lg border border-white/10 p-1.5 text-slate-300"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAchievement(a.id, a.title)}
                        className="rounded-lg border border-white/10 p-1.5 text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}
    </div>
  );
}

export function ProjectsTab() {
  const { projects, saveProject, deleteProject } = useData();
  const [editing, setEditing] = useState<Partial<StudentProject> | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title || editing.title.trim().length < 2) {
      setActionError('Project title must be at least 2 characters.');
      return;
    }
    if (!editing.studentTeam || editing.studentTeam.trim().length < 2) {
      setActionError('Student team must be at least 2 characters.');
      return;
    }
    if (!editing.summary || editing.summary.trim().length < 2) {
      setActionError('Project summary must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await saveProject({
        id: editing.id,
        title: editing.title || '',
        subjectCode: editing.subjectCode || 'ET',
        studentTeam: editing.studentTeam || '',
        year: editing.year || '2026',
        summary: editing.summary || '',
        technicalDetails: editing.technicalDetails || '',
        imageUrl: editing.imageUrl || '',
        demoUrl: editing.demoUrl || '',
        featured: Boolean(editing.featured),
      });
      setEditing(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to save project. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    setActionError(null);
    try {
      await deleteProject(id, title);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete project. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Student Projects</h2>
          <p className="mt-1 text-sm text-slate-400">
            Publish student prototypes, engineering builds, and live demo documentation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setEditing({
              title: '',
              subjectCode: 'ET',
              studentTeam: '',
              year: '2026',
              featured: true,
            });
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Add Project</span>
        </button>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-300">Project Title</label>
              <input
                type="text"
                required
                maxLength={160}
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Subject Code</label>
              <input
                type="text"
                required
                maxLength={30}
                value={editing.subjectCode || ''}
                onChange={(e) => setEditing({ ...editing, subjectCode: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-300">Student Team</label>
              <input
                type="text"
                required
                maxLength={240}
                value={editing.studentTeam || ''}
                onChange={(e) => setEditing({ ...editing, studentTeam: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Year</label>
              <input
                type="text"
                required
                maxLength={12}
                value={editing.year || ''}
                onChange={(e) => setEditing({ ...editing, year: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-300">Summary</label>
            <input
              type="text"
              required
              maxLength={500}
              value={editing.summary || ''}
              onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300">Technical Details</label>
            <textarea
              rows={3}
              maxLength={3000}
              value={editing.technicalDetails || ''}
              onChange={(e) => setEditing({ ...editing, technicalDetails: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <AdminMediaInput
            label="Project Cover Photo"
            value={editing.imageUrl || ''}
            onChange={(url) => setEditing({ ...editing, imageUrl: url })}
            folder="projects"
          />
          <div>
            <label className="block text-xs text-slate-300">Demo / Repository Link (Optional)</label>
            <input
              type="text"
              maxLength={1000}
              value={editing.demoUrl || ''}
              onChange={(e) => setEditing({ ...editing, demoUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              {saving ? 'Saving...' : 'Save Project'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1328]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-white">{p.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-violet-300">{p.subjectCode}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{p.studentTeam}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="rounded-lg border border-white/10 p-1.5 text-slate-300"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteProject(p.id, p.title)}
                      className="rounded-lg border border-white/10 p-1.5 text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GalleryTab() {
  const { gallery, saveGalleryItem, deleteGalleryItem } = useData();
  const [editing, setEditing] = useState<Partial<GalleryItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title || editing.title.trim().length < 2) {
      setActionError('Media title must be at least 2 characters.');
      return;
    }
    if (!editing.mediaUrl || editing.mediaUrl.trim().length < 2) {
      setActionError('Please provide or upload a valid image or video media URL.');
      return;
    }
    if (editing.driveUrl && editing.driveUrl.trim() && !isValidExternalUrl(editing.driveUrl.trim())) {
      setActionError('Please provide a valid Google Drive link starting with http:// or https://');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await saveGalleryItem({
        id: editing.id,
        title: editing.title || '',
        category: editing.category || 'Campus & Labs',
        mediaType: editing.mediaType || 'image',
        mediaUrl: editing.mediaUrl || '',
        description: editing.description || '',
        capturedDate: editing.capturedDate || new Date().toISOString().slice(0, 10),
        driveUrl: editing.driveUrl || '',
      });
      setEditing(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to save gallery item. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string, title: string) => {
    setActionError(null);
    try {
      await deleteGalleryItem(id, title);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete gallery item. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Gallery Management</h2>
          <p className="mt-1 text-sm text-slate-400">
            Upload photos or videos, organize categories, edit descriptions, and curate media.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setEditing({
              title: '',
              category: 'Campus & Labs',
              mediaType: 'image',
              mediaUrl: '',
              capturedDate: new Date().toISOString().slice(0, 10),
            });
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Add Media</span>
        </button>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-300">Title</label>
              <input
                type="text"
                required
                maxLength={160}
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Category</label>
              <input
                type="text"
                required
                maxLength={80}
                value={editing.category || ''}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                placeholder="e.g., Robotics, Campus & Labs"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-300">Media Type</label>
              <select
                value={editing.mediaType || 'image'}
                onChange={(e) =>
                  setEditing({ ...editing, mediaType: e.target.value as 'image' | 'video' })
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300">Captured Date</label>
              <input
                type="date"
                value={editing.capturedDate || ''}
                onChange={(e) => setEditing({ ...editing, capturedDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <AdminMediaInput
            label="Media File or URL"
            value={editing.mediaUrl || ''}
            onChange={(url) => setEditing({ ...editing, mediaUrl: url })}
            folder="gallery"
            accept="image/*,video/*"
          />
          <div>
            <label className="block text-xs text-slate-300">Description</label>
            <textarea
              rows={2}
              maxLength={600}
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300">Google Drive Link (Optional)</label>
            <input
              type="url"
              maxLength={500}
              value={editing.driveUrl || ''}
              onChange={(e) => setEditing({ ...editing, driveUrl: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              {saving ? 'Saving...' : 'Save Media'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1328]"
          >
            <div className="aspect-[16/10] w-full overflow-hidden">
              <SafeImage
                src={item.mediaUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-medium text-blue-300">{item.category}</p>
              <h3 className="font-display mt-1 truncate text-sm font-semibold text-white">
                {item.title}
              </h3>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="rounded-lg border border-white/10 p-1.5 text-slate-300"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteGalleryItem(item.id, item.title)}
                  className="rounded-lg border border-white/10 p-1.5 text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DownloadsTab() {
  const { downloads, saveDownloadResource, deleteDownloadResource } = useData();
  const [editing, setEditing] = useState<Partial<DownloadResource> | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title || editing.title.trim().length < 2) {
      setActionError('Document title must be at least 2 characters.');
      return;
    }
    if (!editing.fileUrl || editing.fileUrl.trim().length < 2) {
      setActionError('Please provide or upload a valid document or Google Drive link.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await saveDownloadResource({
        id: editing.id,
        title: editing.title || '',
        subjectCode: editing.subjectCode || 'SFT',
        resourceType: editing.resourceType || 'Syllabus',
        fileFormat: editing.fileFormat || 'PDF',
        fileSizeLabel: editing.fileSizeLabel || '',
        fileUrl: editing.fileUrl || '',
        description: editing.description || '',
      });
      setEditing(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to save download resource. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDownload = async (id: string, title: string) => {
    setActionError(null);
    try {
      await deleteDownloadResource(id, title);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete download resource. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Downloads & Google Drive Resources
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Upload PDFs directly or attach external Google Drive folders for students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActionError(null);
            setEditing({
              title: '',
              subjectCode: 'SFT',
              resourceType: 'Syllabus',
              fileFormat: 'Drive',
              fileUrl: '',
            });
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Add Resource</span>
        </button>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-blue-500/30 bg-[#0b1328] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-300">Document Title</label>
              <input
                type="text"
                required
                maxLength={160}
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">Subject Code</label>
              <input
                type="text"
                required
                maxLength={30}
                value={editing.subjectCode || ''}
                onChange={(e) => setEditing({ ...editing, subjectCode: e.target.value })}
                placeholder="SFT, ET, ICT, BST, AGRI, GEO"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-300">Resource Type</label>
              <select
                value={editing.resourceType || 'Syllabus'}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    resourceType: e.target.value as DownloadResource['resourceType'],
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                <option value="Syllabus">Syllabus</option>
                <option value="Past Paper">Past Paper</option>
                <option value="Lab Manual">Lab Manual</option>
                <option value="Study Guide">Study Guide</option>
                <option value="Dataset">Dataset</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300">Format</label>
              <select
                value={editing.fileFormat || 'PDF'}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    fileFormat: e.target.value as DownloadResource['fileFormat'],
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              >
                <option value="PDF">PDF</option>
                <option value="Drive">Google Drive</option>
                <option value="DOCX">DOCX</option>
                <option value="ZIP">ZIP</option>
                <option value="Link">External Link</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300">File Size Label</label>
              <input
                type="text"
                maxLength={40}
                value={editing.fileSizeLabel || ''}
                onChange={(e) => setEditing({ ...editing, fileSizeLabel: e.target.value })}
                placeholder="e.g., 4.2 MB"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <AdminMediaInput
            label="PDF / Document Upload or Google Drive URL"
            value={editing.fileUrl || ''}
            onChange={(url) => setEditing({ ...editing, fileUrl: url })}
            folder="documents"
            accept=".pdf,.doc,.docx,.zip,.csv,application/pdf"
            placeholder="https://drive.google.com/... or upload file"
          />

          <div>
            <label className="block text-xs text-slate-300">Description</label>
            <textarea
              rows={2}
              maxLength={600}
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#091022] px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              {saving ? 'Saving...' : 'Save Resource'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1328]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {downloads.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-white">{d.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-blue-300">{d.subjectCode}</td>
                <td className="px-4 py-3 text-xs text-slate-300">{d.resourceType}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{d.fileFormat}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-white/10 p-1.5 text-blue-300"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditing(d)}
                      className="rounded-lg border border-white/10 p-1.5 text-slate-300"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDownload(d.id, d.title)}
                      className="rounded-lg border border-white/10 p-1.5 text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function UsersInquiriesTab() {
  const {
    users,
    contactMessages,
    updateUserRoleAndStatus,
    deleteUserAccount,
    updateContactStatus,
    deleteContactMessage,
  } = useData();
  const [subTab, setSubTab] = useState<'users' | 'inquiries'>('users');
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDeleteUser = async (target: (typeof users)[number]) => {
    setDeletingUid(target.uid);
    setActionError(null);
    try {
      await deleteUserAccount(target);
      setConfirmDeleteUid(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to remove user account. Please try again.'
      );
    } finally {
      setDeletingUid(null);
    }
  };

  const handleUpdateUserRoleAndStatus = async (
    target: (typeof users)[number],
    role: 'member' | 'student' | 'teacher' | 'admin',
    status: 'active' | 'inactive'
  ) => {
    setActionError(null);
    try {
      await updateUserRoleAndStatus(target, role, status);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to update user permissions. Please try again.'
      );
    }
  };

  const handleUpdateContactStatus = async (
    id: string,
    status: 'new' | 'reviewed' | 'resolved'
  ) => {
    setActionError(null);
    try {
      await updateContactStatus(id, status);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to update inquiry status. Please try again.'
      );
    }
  };

  const handleDeleteContactMessage = async (id: string) => {
    setActionError(null);
    try {
      await deleteContactMessage(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete inquiry. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Community Members & Inquiries
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Assign administrator roles securely, manage Community Member accounts, and review campus inquiries.
          </p>
        </div>

        <div className="flex rounded-xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setSubTab('users')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
              subTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            Community Members ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('inquiries')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
              subTab === 'inquiries' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            Contact Inquiries ({contactMessages.length})
          </button>
        </div>
      </div>

      <AdminActionAlert error={actionError} onDismiss={() => setActionError(null)} />

      {subTab === 'users' ? (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1328]">
          {users.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No registered Community Member profiles loaded yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const isPrimaryAdmin = isBootstrappedAdminEmail(u.email);
                  const normalizedRole = u.role === 'student' ? 'member' : u.role;
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium text-white">{u.displayName}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          disabled={isPrimaryAdmin}
                          value={normalizedRole}
                          onChange={(e) =>
                            void handleUpdateUserRoleAndStatus(
                              u,
                              e.target.value as 'member' | 'teacher' | 'admin',
                              u.status
                            )
                          }
                          className="rounded-lg border border-white/15 bg-[#091022] px-2.5 py-1.5 text-xs text-white disabled:opacity-60"
                        >
                          <option value="member">Community Member</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          disabled={isPrimaryAdmin}
                          value={u.status}
                          onChange={(e) =>
                            void handleUpdateUserRoleAndStatus(
                              u,
                              u.role,
                              e.target.value as 'active' | 'inactive'
                            )
                          }
                          className="rounded-lg border border-white/15 bg-[#091022] px-2.5 py-1.5 text-xs text-white disabled:opacity-60"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Deactivated</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPrimaryAdmin ? (
                          <span className="text-[11px] text-slate-500">Primary Admin</span>
                        ) : confirmDeleteUid === u.uid ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={deletingUid === u.uid}
                              onClick={() => void handleDeleteUser(u)}
                              className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-500"
                            >
                              {deletingUid === u.uid ? 'Removing...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUid(null)}
                              className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUid(u.uid)}
                            aria-label={`Remove ${u.displayName}`}
                            className="rounded-lg border border-white/10 p-1.5 text-rose-400 hover:bg-rose-950/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {contactMessages.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#0b1328] p-6 text-sm text-slate-400">
              No inquiries submitted yet.
            </div>
          ) : (
            contactMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border border-white/10 bg-[#0b1328] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-white">{msg.senderName}</span> ({msg.senderEmail})
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={msg.status}
                      onChange={(e) =>
                        void handleUpdateContactStatus(
                          msg.id,
                          e.target.value as 'new' | 'reviewed' | 'resolved'
                        )
                      }
                      className="rounded-lg border border-white/15 bg-[#091022] px-2.5 py-1 text-xs text-white"
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleDeleteContactMessage(msg.id)}
                      className="rounded-lg border border-white/10 p-1.5 text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-display mt-2 text-base font-semibold text-white">
                  {msg.subject}
                </h3>
                <p className="mt-1.5 text-sm text-slate-300">{msg.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
