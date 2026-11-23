import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  enableNetwork,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isBootstrappedAdminEmail,
  isOfflineFirestoreError,
  OperationType,
} from '../firebase';
import {
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_COMMUNITY_DIRECTORY,
  DEFAULT_DOWNLOADS,
  DEFAULT_EVENTS,
  DEFAULT_GALLERY,
  DEFAULT_HERO_SLIDES,
  DEFAULT_HISTORY_EVENTS,
  DEFAULT_PROJECTS,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_STUDENTS,
  DEFAULT_SUBJECTS,
  DEFAULT_TEACHERS,
  DEFAULT_WEB_LOGO,
  HERO_CAMPUS_IMAGE,
} from '../data/seedDefaults';
import type {
  Achievement,
  AdminLog,
  Announcement,
  CampusEvent,
  CommunityCategory,
  CommunityComment,
  CommunityDirectoryMember,
  CommunityLike,
  CommunityMember,
  CommunityPost,
  ContactMessage,
  CustomLink,
  DownloadResource,
  EventStatus,
  GalleryItem,
  HeroSlide,
  HistoryMilestone,
  SiteSettings,
  Student,
  StudentProject,
  Subject,
  Teacher,
  UserProfile,
} from '../types';
import {
  clampNumber,
  clampString,
  clampStringList,
  createUniqueId,
  normalizeMediaUrl,
  preserveDocId,
  sanitizeDocId,
} from '../utils/validation';

function makeTombstoneId(collectionName: string, id: string): string {
  return preserveDocId(`${collectionName}__${id}`);
}

const DEFAULT_TOMBSTONE_IDS = new Set<string>([
  ...DEFAULT_SUBJECTS.map((i) => makeTombstoneId('subjects', i.id)),
  ...DEFAULT_TEACHERS.map((i) => makeTombstoneId('teachers', i.id)),
  ...DEFAULT_STUDENTS.map((i) => makeTombstoneId('students', i.id)),
  ...DEFAULT_EVENTS.map((i) => makeTombstoneId('events', i.id)),
  ...DEFAULT_ACHIEVEMENTS.map((i) => makeTombstoneId('achievements', i.id)),
  ...DEFAULT_ANNOUNCEMENTS.map((i) => makeTombstoneId('announcements', i.id)),
  ...DEFAULT_GALLERY.map((i) => makeTombstoneId('gallery', i.id)),
  ...DEFAULT_HERO_SLIDES.map((i) => makeTombstoneId('heroSlides', i.id)),
  ...DEFAULT_PROJECTS.map((i) => makeTombstoneId('projects', i.id)),
  ...DEFAULT_DOWNLOADS.map((i) => makeTombstoneId('downloads', i.id)),
  ...DEFAULT_HISTORY_EVENTS.map((i) => makeTombstoneId('historyEvents', i.id)),
  ...DEFAULT_COMMUNITY_DIRECTORY.map((i) => makeTombstoneId('communityDirectory', i.id)),
]);

function mergeCollectionWithDefaults<T extends { id: string }>(
  defaults: T[],
  firestoreDocs: T[],
  deletedTombstoneIds: string[],
  collectionName: string
): T[] {
  const deletedSet = new Set(deletedTombstoneIds);
  const map = new Map<string, T>();
  defaults.forEach((item) => {
    const key = makeTombstoneId(collectionName, item.id);
    if (!deletedSet.has(key) && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });
  firestoreDocs.forEach((docItem) => {
    map.set(docItem.id, docItem);
  });
  return Array.from(map.values());
}

interface DataContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  authReady: boolean;
  adminAuthenticated: boolean;
  adminAuthReady: boolean;
  adminEmail: string | null;
  loadingData: boolean;
  eventsLoaded: boolean;
  announcementsLoaded: boolean;
  isFirestoreSeeded: boolean;
  seedingInProgress: boolean;
  siteSettings: SiteSettings;
  subjects: Subject[];
  teachers: Teacher[];
  students: Student[];
  events: CampusEvent[];
  achievements: Achievement[];
  announcements: Announcement[];
  gallery: GalleryItem[];
  heroSlides: HeroSlide[];
  projects: StudentProject[];
  downloads: DownloadResource[];
  historyEvents: HistoryMilestone[];
  communityPosts: CommunityPost[];
  communityMembers: CommunityMember[];
  communityDirectory: CommunityDirectoryMember[];
  registeredMembersCount: number;
  customLinks: CustomLink[];
  users: UserProfile[];
  adminLogs: AdminLog[];
  contactMessages: ContactMessage[];
  signInWithGoogle: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
  loginAdminWithCredentials: (email: string, password: string) => Promise<void>;
  logoutAdminSession: () => Promise<void>;
  seedDatabase: () => Promise<void>;
  saveSiteSettings: (data: Omit<SiteSettings, 'id' | 'updatedAt' | 'updatedBy'>) => Promise<void>;
  saveSubject: (data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteSubject: (id: string, title: string) => Promise<void>;
  saveTeacher: (data: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteTeacher: (id: string, name: string) => Promise<void>;
  saveStudent: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteStudent: (id: string, name: string) => Promise<void>;
  saveCommunityDirectoryMember: (
    data: Omit<CommunityDirectoryMember, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<void>;
  deleteCommunityDirectoryMember: (id: string, fullName: string) => Promise<void>;
  seedDefaultCommunityDirectory: () => Promise<void>;
  saveEvent: (data: Omit<CampusEvent, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  updateEventStatus: (
    event: CampusEvent,
    status: EventStatus,
    cancellationReason?: string
  ) => Promise<void>;
  deleteEvent: (id: string, title: string) => Promise<void>;
  saveAchievement: (data: Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteAchievement: (id: string, title: string) => Promise<void>;
  saveAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteAnnouncement: (id: string, title: string) => Promise<void>;
  saveGalleryItem: (data: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteGalleryItem: (id: string, title: string) => Promise<void>;
  saveProject: (data: Omit<StudentProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteProject: (id: string, title: string) => Promise<void>;
  saveDownloadResource: (data: Omit<DownloadResource, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteDownloadResource: (id: string, title: string) => Promise<void>;
  saveHistoryMilestone: (
    data: Omit<HistoryMilestone, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<void>;
  deleteHistoryMilestone: (id: string, title: string) => Promise<void>;
  seedDefaultHistory: () => Promise<void>;
  createCommunityPost: (data: {
    category: CommunityCategory;
    title: string;
    content: string;
    imageUrl?: string;
  }) => Promise<void>;
  updateCommunityPost: (
    id: string,
    data: {
      category: CommunityCategory;
      title: string;
      content: string;
      imageUrl?: string;
    }
  ) => Promise<void>;
  togglePinCommunityPost: (id: string, pinned: boolean, title: string) => Promise<void>;
  deleteCommunityPost: (id: string, title: string) => Promise<void>;
  toggleLikePost: (postId: string, currentlyLiked: boolean) => Promise<void>;
  addCommunityComment: (postId: string, body: string) => Promise<void>;
  deleteCommunityComment: (postId: string, commentId: string) => Promise<void>;
  subscribePostInteractions: (
    postId: string,
    onLikes: (likes: CommunityLike[]) => void,
    onComments: (comments: CommunityComment[]) => void
  ) => () => void;
  updateUserRoleAndStatus: (
    targetUser: UserProfile,
    role: 'member' | 'student' | 'teacher' | 'admin',
    status: 'active' | 'inactive'
  ) => Promise<void>;
  deleteUserAccount: (targetUser: UserProfile) => Promise<void>;
  saveCustomLink: (
    data: Omit<CustomLink, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<void>;
  deleteCustomLink: (id: string, title: string) => Promise<void>;
  saveHeroSlide: (
    data: Omit<HeroSlide, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<void>;
  deleteHeroSlide: (id: string, caption: string) => Promise<void>;
  reorderHeroSlides: (orderedSlides: HeroSlide[]) => Promise<void>;
  restoreDefaultHeroSlides: () => Promise<void>;
  submitContactMessage: (subject: string, message: string) => Promise<void>;
  updateContactStatus: (id: string, status: 'new' | 'reviewed' | 'resolved') => Promise<void>;
  deleteContactMessage: (id: string) => Promise<void>;
  uploadImageToImgBB: (
    file: File,
    folder?: string,
    onProgress?: (pct: number) => void
  ) => Promise<string>;
  hasOpenModal: boolean;
  activeModalId: string | null;
  registerModal: (id: string, isOpen: boolean) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminDoc, setIsAdminDoc] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminAuthReady, setAdminAuthReady] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [siteSettingsDoc, setSiteSettingsDoc] = useState<SiteSettings | null>(null);
  const [subjectsDocs, setSubjectsDocs] = useState<Subject[]>([]);
  const [teachersDocs, setTeachersDocs] = useState<Teacher[]>([]);
  const [studentsDocs, setStudentsDocs] = useState<Student[]>([]);
  const [eventsDocs, setEventsDocs] = useState<CampusEvent[]>([]);
  const [achievementsDocs, setAchievementsDocs] = useState<Achievement[]>([]);
  const [announcementsDocs, setAnnouncementsDocs] = useState<Announcement[]>([]);
  const [galleryDocs, setGalleryDocs] = useState<GalleryItem[]>([]);
  const [projectsDocs, setProjectsDocs] = useState<StudentProject[]>([]);
  const [downloadsDocs, setDownloadsDocs] = useState<DownloadResource[]>([]);
  const [historyEventsDocs, setHistoryEventsDocs] = useState<HistoryMilestone[]>([]);
  const [communityPostsDocs, setCommunityPostsDocs] = useState<CommunityPost[]>([]);
  const [communityMembersDocs, setCommunityMembersDocs] = useState<CommunityMember[]>([]);
  const [communityDirectoryDocs, setCommunityDirectoryDocs] = useState<CommunityDirectoryMember[]>([]);
  const [customLinksDocs, setCustomLinksDocs] = useState<CustomLink[]>([]);
  const [heroSlidesDocs, setHeroSlidesDocs] = useState<HeroSlide[]>([]);

  const [usersDocs, setUsersDocs] = useState<UserProfile[]>([]);
  const [adminLogsDocs, setAdminLogsDocs] = useState<AdminLog[]>([]);
  const [contactDocs, setContactDocs] = useState<ContactMessage[]>([]);
  const [siteSettingsSynced, setSiteSettingsSynced] = useState(false);
  const [deletedDefaultsSynced, setDeletedDefaultsSynced] = useState(false);
  const [communityDirectorySynced, setCommunityDirectorySynced] = useState(false);
  const [eventsSynced, setEventsSynced] = useState(false);
  const [announcementsSynced, setAnnouncementsSynced] = useState(false);
  const [initialLoadTimedOut, setInitialLoadTimedOut] = useState(false);
  const [firestoreServerSynced, setFirestoreServerSynced] = useState(false);
  const [seedingInProgress, setSeedingInProgress] = useState(false);
  const [openModalIds, setOpenModalIds] = useState<string[]>([]);
  const autoSeedAttemptedRef = React.useRef(false);

  const loadingData =
    !(siteSettingsSynced && deletedDefaultsSynced && communityDirectorySynced) &&
    !initialLoadTimedOut;

  const registerModal = useCallback((id: string, isOpen: boolean) => {
    setOpenModalIds((prev) => {
      const exists = prev.includes(id);
      if (isOpen && !exists) return [...prev, id];
      if (!isOpen && exists) return prev.filter((item) => item !== id);
      return prev;
    });
  }, []);

  const hasOpenModal = openModalIds.length > 0;
  const activeModalId = openModalIds[0] ?? null;

  const [deletedDefaultKeys, setDeletedDefaultKeys] = useState<string[]>([]);

  const markDefaultDeleted = useCallback(
    async (collectionName: string, id: string, deletedByUid: string) => {
      const tombstoneId = makeTombstoneId(collectionName, id);
      if (!DEFAULT_TOMBSTONE_IDS.has(tombstoneId)) return;
      await setDoc(doc(db, 'deletedDefaults', tombstoneId), {
        itemId: id.slice(0, 128),
        collectionName: collectionName.slice(0, 60),
        deletedBy: deletedByUid,
        deletedAt: serverTimestamp(),
      });
    },
    []
  );

  const unmarkDefaultDeleted = useCallback(
    async (collectionName: string, id: string) => {
      const tombstoneId = makeTombstoneId(collectionName, id);
      if (!deletedDefaultKeys.includes(tombstoneId)) return;
      try {
        await deleteDoc(doc(db, 'deletedDefaults', tombstoneId));
      } catch (err) {
        if (!isOfflineFirestoreError(err)) {
          console.warn('Could not clear default tombstone:', err);
        }
      }
    },
    [deletedDefaultKeys]
  );

  const isAdmin = useMemo(() => {
    if (!user || !user.emailVerified) return false;
    return isAdminDoc || isBootstrappedAdminEmail(user.email);
  }, [user, isAdminDoc]);

  // Verify existing server-side Admin Panel session on mount
  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const storedToken = window.sessionStorage.getItem('techsphere_admin_token');
        const res = await fetch('/api/admin/session', {
          credentials: 'include',
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : undefined,
        });
        if (!res.ok) throw new Error('Session check failed');
        const payload = (await res.json()) as {
          authenticated?: boolean;
          email?: string | null;
        };
        if (active) {
          setAdminAuthenticated(Boolean(payload.authenticated));
          setAdminEmail(payload.authenticated ? payload.email || null : null);
          if (!payload.authenticated) {
            window.sessionStorage.removeItem('techsphere_admin_token');
          }
        }
      } catch {
        if (active) {
          setAdminAuthenticated(false);
          setAdminEmail(null);
        }
      } finally {
        if (active) setAdminAuthReady(true);
      }
    };
    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  const isFirestoreSeeded = useMemo(() => {
    return subjectsDocs.length > 0 || siteSettingsDoc !== null;
  }, [subjectsDocs.length, siteSettingsDoc]);

  const handleListenerError = useCallback(
    (error: unknown, op: OperationType, path: string) => {
      if (isOfflineFirestoreError(error)) {
        return;
      }
      handleFirestoreError(error, op, path);
    },
    []
  );

  // Ensure Firebase Auth finishes initial persistence/token hydration before opening Firestore streams
  useEffect(() => {
    let active = true;
    void auth
      .authStateReady()
      .catch(() => undefined)
      .finally(() => {
        if (active) setAuthInitialized(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Auth listener & automatic user profile sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setIsAdminDoc(false);
        setAuthReady(true);
        return;
      }

      try {
        // Check admin registry
        const adminRef = doc(db, 'admins', firebaseUser.uid);
        const adminSnap = await getDoc(adminRef);
        setIsAdminDoc(adminSnap.exists());

        // Check or create user profile and public non-PII community member record
        const userRef = doc(db, 'users', firebaseUser.uid);
        const memberRef = doc(db, 'communityMembers', firebaseUser.uid);
        const isBootstrapped =
          firebaseUser.emailVerified && isBootstrappedAdminEmail(firebaseUser.email);

        if (isBootstrapped || adminSnap.exists()) {
          setAdminAuthenticated(true);
          setAdminEmail(firebaseUser.email || null);
        }

        if (firebaseUser.emailVerified) {
          const userSnap = await getDoc(userRef);
          const memberSnap = await getDoc(memberRef);
          const fallbackRole: 'admin' | 'member' =
            isBootstrapped || adminSnap.exists() ? 'admin' : 'member';
          const safeName = clampString(
            firebaseUser.displayName || 'Community Member',
            120,
            'Community Member'
          );
          const safePhoto = clampString(firebaseUser.photoURL || '', 1000);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: safeName,
              email: clampString(firebaseUser.email || '', 180),
              photoURL: safePhoto,
              role: fallbackRole,
              status: 'active',
              department: 'General Technology',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          if (!memberSnap.exists()) {
            const existingUserData = userSnap.exists()
              ? (userSnap.data() as Partial<UserProfile>)
              : null;
            await setDoc(memberRef, {
              uid: firebaseUser.uid,
              displayName: clampString(existingUserData?.displayName || safeName, 120, 'Community Member'),
              photoURL: clampString(existingUserData?.photoURL || safePhoto, 1000),
              role: existingUserData?.role || fallbackRole,
              status: 'active',
              department: clampString(existingUserData?.department || 'General Technology', 100),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        if (!isOfflineFirestoreError(err)) {
          console.error('Auth profile sync warning:', err);
        }
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to current user's profile doc in real time
  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}`;
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile({ id: snap.id, ...(snap.data() as Omit<UserProfile, 'id'>) });
        }
      },
      (error) => handleListenerError(error, OperationType.GET, path)
    );
    return () => unsub();
  }, [user, handleListenerError]);

  // Public real-time Firestore listeners (independent of admin authentication)
  // Wait for initial Auth hydration so WatchStream opens once with stable credentials
  useEffect(() => {
    if (!authInitialized) return;
    let unmounted = false;
    const cleanups: (() => void)[] = [];
    const retryTriggers: (() => void)[] = [];

    const fallbackTimer = window.setTimeout(() => {
      if (!unmounted) {
        setInitialLoadTimedOut(true);
      }
    }, 10_000);

    function attachResilientListener<T>(
      path: string,
      createSub: (onNext: (snap: T) => void, onError: (error: unknown) => void) => () => void,
      onData: (snap: T) => void,
      onSettled?: () => void
    ) {
      let currentUnsub: (() => void) | null = null;
      let retryTimer: number | null = null;
      let attempt = 0;
      let degraded = false;

      const subscribeNow = () => {
        if (unmounted) return;
        if (retryTimer !== null) {
          window.clearTimeout(retryTimer);
          retryTimer = null;
        }
        currentUnsub?.();
        currentUnsub = createSub(
          (snap) => {
            attempt = 0;
            degraded = false;
            onData(snap);
            onSettled?.();
          },
          (error) => {
            onSettled?.();
            const code =
              error && typeof error === 'object' && 'code' in error
                ? String((error as { code?: unknown }).code || '')
                : '';
            const isTransient =
              isOfflineFirestoreError(error) ||
              code === 'unavailable' ||
              code === 'deadline-exceeded' ||
              code === 'internal' ||
              code === 'unknown' ||
              code === 'cancelled' ||
              code === 'aborted';

            if (isTransient) {
              degraded = true;
              const delayMs = Math.min(20_000, 1500 * Math.pow(2, attempt));
              attempt = Math.min(attempt + 1, 5);
              if (!unmounted && retryTimer === null) {
                retryTimer = window.setTimeout(() => {
                  retryTimer = null;
                  subscribeNow();
                }, delayMs);
              }
              return;
            }
            handleListenerError(error, OperationType.LIST, path);
          }
        );
      };

      subscribeNow();
      retryTriggers.push(() => {
        if (degraded && !unmounted) {
          attempt = 0;
          subscribeNow();
        }
      });
      cleanups.push(() => {
        if (retryTimer !== null) {
          window.clearTimeout(retryTimer);
          retryTimer = null;
        }
        currentUnsub?.();
        currentUnsub = null;
      });
    }

    attachResilientListener<DocumentSnapshot<DocumentData>>(
      'siteSettings/main',
      (onNext, onError) =>
        onSnapshot(
          doc(db, 'siteSettings', 'main'),
          { includeMetadataChanges: true },
          onNext,
          onError
        ),
      (snap) => {
        if (snap.exists()) {
          setSiteSettingsDoc({ id: snap.id, ...(snap.data() as SiteSettings) });
        } else {
          setSiteSettingsDoc(null);
        }
        if (!snap.metadata.fromCache) {
          setFirestoreServerSynced(true);
        }
      },
      () => setSiteSettingsSynced(true)
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'deletedDefaults',
      (onNext, onError) => onSnapshot(collection(db, 'deletedDefaults'), onNext, onError),
      (snap) => {
        setDeletedDefaultKeys(snap.docs.map((d) => d.id));
      },
      () => setDeletedDefaultsSynced(true)
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'subjects',
      (onNext, onError) =>
        onSnapshot(query(collection(db, 'subjects'), orderBy('order', 'asc')), onNext, onError),
      (snap) => {
        setSubjectsDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Subject, 'id'>) })));
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'teachers',
      (onNext, onError) => onSnapshot(collection(db, 'teachers'), onNext, onError),
      (snap) => {
        setTeachersDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Teacher, 'id'>) })));
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'students',
      (onNext, onError) => onSnapshot(collection(db, 'students'), onNext, onError),
      (snap) => {
        setStudentsDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'events',
      (onNext, onError) =>
        onSnapshot(query(collection(db, 'events'), orderBy('eventDate', 'desc')), onNext, onError),
      (snap) => {
        setEventsDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CampusEvent, 'id'>) })));
      },
      () => setEventsSynced(true)
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'achievements',
      (onNext, onError) =>
        onSnapshot(query(collection(db, 'achievements'), orderBy('year', 'desc')), onNext, onError),
      (snap) => {
        setAchievementsDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Achievement, 'id'>) }))
        );
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'announcements',
      (onNext, onError) =>
        onSnapshot(
          query(collection(db, 'announcements'), orderBy('publishDate', 'desc')),
          onNext,
          onError
        ),
      (snap) => {
        setAnnouncementsDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, 'id'>) }))
        );
      },
      () => setAnnouncementsSynced(true)
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'projects',
      (onNext, onError) =>
        onSnapshot(query(collection(db, 'projects'), orderBy('year', 'desc')), onNext, onError),
      (snap) => {
        setProjectsDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudentProject, 'id'>) }))
        );
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'gallery',
      (onNext, onError) => onSnapshot(collection(db, 'gallery'), onNext, onError),
      (snap) => {
        setGalleryDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, 'id'>) })));
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'downloads',
      (onNext, onError) => onSnapshot(collection(db, 'downloads'), onNext, onError),
      (snap) => {
        setDownloadsDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DownloadResource, 'id'>) }))
        );
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'historyEvents',
      (onNext, onError) =>
        onSnapshot(query(collection(db, 'historyEvents'), orderBy('order', 'asc')), onNext, onError),
      (snap) => {
        setHistoryEventsDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HistoryMilestone, 'id'>) }))
        );
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'communityPosts',
      (onNext, onError) =>
        onSnapshot(
          query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc')),
          onNext,
          onError
        ),
      (snap) => {
        setCommunityPostsDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommunityPost, 'id'>) }))
        );
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'communityMembers',
      (onNext, onError) => onSnapshot(collection(db, 'communityMembers'), onNext, onError),
      (snap) => {
        setCommunityMembersDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommunityMember, 'id'>) }))
        );
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'communityDirectory',
      (onNext, onError) =>
        onSnapshot(
          query(collection(db, 'communityDirectory'), orderBy('order', 'asc')),
          onNext,
          onError
        ),
      (snap) => {
        setCommunityDirectoryDocs(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CommunityDirectoryMember, 'id'>),
          }))
        );
      },
      () => setCommunityDirectorySynced(true)
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'customLinks',
      (onNext, onError) =>
        onSnapshot(query(collection(db, 'customLinks'), orderBy('order', 'asc')), onNext, onError),
      (snap) => {
        setCustomLinksDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CustomLink, 'id'>) }))
        );
      }
    );

    attachResilientListener<QuerySnapshot<DocumentData>>(
      'heroSlides',
      (onNext, onError) =>
        onSnapshot(query(collection(db, 'heroSlides'), orderBy('order', 'asc')), onNext, onError),
      (snap) => {
        setHeroSlidesDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HeroSlide, 'id'>) }))
        );
      }
    );

    const handleReconnect = () => {
      void enableNetwork(db).catch(() => undefined);
      retryTriggers.forEach((trigger) => trigger());
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        retryTriggers.forEach((trigger) => trigger());
      }
    };
    window.addEventListener('online', handleReconnect);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unmounted = true;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener('online', handleReconnect);
      document.removeEventListener('visibilitychange', handleVisibility);
      cleanups.forEach((u) => u());
    };
  }, [authInitialized, handleListenerError]);

  // Admin-only listeners
  useEffect(() => {
    if (!authReady || !isAdmin) {
      setUsersDocs([]);
      setAdminLogsDocs([]);
      setContactDocs([]);
      return;
    }

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setUsersDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserProfile, 'id'>) })));
      },
      (error) => handleListenerError(error, OperationType.LIST, 'users')
    );

    const unsubLogs = onSnapshot(
      query(collection(db, 'adminLogs'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAdminLogsDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminLog, 'id'>) })));
      },
      (error) => handleListenerError(error, OperationType.LIST, 'adminLogs')
    );

    const unsubContacts = onSnapshot(
      query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc')),
      (snap) => {
        setContactDocs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ContactMessage, 'id'>) }))
        );
      },
      (error) => handleListenerError(error, OperationType.LIST, 'contactMessages')
    );

    return () => {
      unsubUsers();
      unsubLogs();
      unsubContacts();
    };
  }, [authReady, isAdmin, handleListenerError]);

  // Backfill public communityMembers directory from legacy /users when admin is online
  useEffect(() => {
    if (!authReady || !isAdmin || usersDocs.length === 0) return;
    const existingMemberIds = new Set(communityMembersDocs.map((m) => m.uid));
    const missing = usersDocs.filter((u) => !existingMemberIds.has(u.uid));
    if (missing.length === 0) return;

    missing.forEach((u) => {
      void setDoc(doc(db, 'communityMembers', u.uid), {
        uid: u.uid,
        displayName: clampString(u.displayName || 'Community Member', 120, 'Community Member'),
        photoURL: clampString(u.photoURL || '', 1000),
        role: u.role === 'student' ? 'member' : u.role,
        status: u.status || 'active',
        department: clampString(u.department || 'General Technology', 100),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        console.warn('Community member backfill skipped:', err);
      });
    });
  }, [authReady, isAdmin, usersDocs, communityMembersDocs]);

  const logAdminAction = useCallback(
    async (action: string, targetCollection: string, targetTitle: string) => {
      if (!user) return;
      const id = createUniqueId('log');
      try {
        await setDoc(doc(db, 'adminLogs', id), {
          action: clampString(action, 80, 'Action'),
          targetCollection: clampString(targetCollection, 80, 'system'),
          targetTitle: clampString(targetTitle, 200, 'Untitled'),
          adminUid: user.uid,
          adminName: clampString(user.displayName || user.email || 'Admin', 120, 'Admin'),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        if (!isOfflineFirestoreError(error)) {
          console.warn('Admin log write notice:', error);
        }
      }
    },
    [user]
  );

  const seedDatabase = useCallback(async () => {
    if (!user || !isAdmin || seedingInProgress) return;
    setSeedingInProgress(true);
    let currentStep = 'batch-seed';
    try {
      const now = serverTimestamp();
      let seededAny = false;

      const commitChunk = async (
        stepName: string,
        build: (batch: ReturnType<typeof writeBatch>) => number
      ) => {
        currentStep = stepName;
        const batch = writeBatch(db);
        const count = build(batch);
        if (count > 0) {
          await batch.commit();
          seededAny = true;
        }
      };

      const settingsSnap = await getDoc(doc(db, 'siteSettings', 'main'));
      if (!settingsSnap.exists()) {
        await commitChunk('siteSettings/main', (batch) => {
          batch.set(doc(db, 'siteSettings', 'main'), {
            ...DEFAULT_SITE_SETTINGS,
            updatedAt: now,
            updatedBy: user.uid,
          });
          return 1;
        });
      }

      const collectionSeeds: Array<{
        name: string;
        items: Array<{ id: string } & Record<string, unknown>>;
      }> = [
        { name: 'subjects', items: DEFAULT_SUBJECTS },
        { name: 'teachers', items: DEFAULT_TEACHERS },
        { name: 'students', items: DEFAULT_STUDENTS },
        { name: 'events', items: DEFAULT_EVENTS },
        { name: 'achievements', items: DEFAULT_ACHIEVEMENTS },
        { name: 'announcements', items: DEFAULT_ANNOUNCEMENTS },
        { name: 'gallery', items: DEFAULT_GALLERY },
        { name: 'heroSlides', items: DEFAULT_HERO_SLIDES },
        { name: 'projects', items: DEFAULT_PROJECTS },
        { name: 'downloads', items: DEFAULT_DOWNLOADS },
        { name: 'historyEvents', items: DEFAULT_HISTORY_EVENTS },
        { name: 'communityDirectory', items: DEFAULT_COMMUNITY_DIRECTORY },
      ];

      for (const entry of collectionSeeds) {
        currentStep = entry.name;
        const snap = await getDocs(query(collection(db, entry.name), limit(1)));
        if (snap.empty) {
          await commitChunk(entry.name, (batch) => {
            entry.items.forEach(({ id, ...rest }) => {
              const tombstoneId = makeTombstoneId(entry.name, id);
              if (deletedDefaultKeys.includes(tombstoneId)) {
                batch.delete(doc(db, 'deletedDefaults', tombstoneId));
              }
              batch.set(doc(db, entry.name, id), { ...rest, createdAt: now, updatedAt: now });
            });
            return entry.items.length;
          });
        }
      }

      if (seededAny) {
        await logAdminAction('Initialized Database', 'system', 'Seeded Core Institutional Content');
      }
    } catch (error) {
      if (isOfflineFirestoreError(error)) {
        autoSeedAttemptedRef.current = false;
        console.warn('Skipped database initialization while Cloud Firestore is offline.');
        return;
      }
      handleFirestoreError(error, OperationType.WRITE, currentStep);
    } finally {
      setSeedingInProgress(false);
    }
  }, [user, isAdmin, seedingInProgress, logAdminAction, deletedDefaultKeys]);

  // Auto-seed once when verified admin opens site, server responded, and database is completely empty
  useEffect(() => {
    if (
      authReady &&
      isAdmin &&
      firestoreServerSynced &&
      !loadingData &&
      !isFirestoreSeeded &&
      !seedingInProgress &&
      !autoSeedAttemptedRef.current
    ) {
      autoSeedAttemptedRef.current = true;
      void seedDatabase().catch((err) => {
        if (!isOfflineFirestoreError(err)) {
          console.error('Database initialization error:', err);
        }
      });
    }
  }, [
    authReady,
    isAdmin,
    firestoreServerSynced,
    loadingData,
    isFirestoreSeeded,
    seedingInProgress,
    seedDatabase,
  ]);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user && isBootstrappedAdminEmail(cred.user.email)) {
        setAdminAuthenticated(true);
        setAdminEmail(cred.user.email);
      }
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled'
      ) {
        return false;
      }
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        throw new Error(
          `Domain "${host}" is not authorized in Firebase Authentication. Add "${host}" under Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      }
      if (code === 'auth/popup-blocked') {
        throw new Error(
          'Browser blocked the Google sign-in popup. Allow popups for this site and try again.'
        );
      }
      throw new Error(
        err instanceof Error ? err.message : 'Google authentication failed. Please try again.'
      );
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const loginAdminWithCredentials = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      authenticated?: boolean;
      email?: string;
      token?: string;
      error?: string;
    };
    if (!res.ok || !payload.authenticated) {
      throw new Error(payload.error || 'Invalid administrator username/email or password.');
    }
    if (payload.token) {
      window.sessionStorage.setItem('techsphere_admin_token', payload.token);
    }
    setAdminAuthenticated(true);
    setAdminEmail(payload.email || null);
  }, []);

  const logoutAdminSession = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      window.sessionStorage.removeItem('techsphere_admin_token');
      setAdminAuthenticated(false);
      setAdminEmail(null);
    }
  }, []);

  const assertCloudAdminAuth = useCallback(() => {
    if (!user || !user.emailVerified || !isAdmin) {
      throw new Error(
        'Cloud Firestore write access requires Google admin authentication. Please click "Connect Cloud Auth" above to authorize your admin account.'
      );
    }
    return user;
  }, [user, isAdmin]);

  const saveSiteSettings = useCallback(
    async (data: Omit<SiteSettings, 'id' | 'updatedAt' | 'updatedBy'>) => {
      const cloudUser = assertCloudAdminAuth();
      const path = 'siteSettings/main';
      const cleanSocial: Record<string, string> = {};
      if (data.socialLinks) {
        (
          [
            'facebook',
            'instagram',
            'youtube',
            'tiktok',
            'whatsapp',
            'linkedin',
            'github',
            'twitter',
            'website',
          ] as const
        ).forEach((key) => {
          const val = clampString(data.socialLinks?.[key] || '', 500);
          if (val) cleanSocial[key] = val;
        });
      }
      try {
        await setDoc(doc(db, 'siteSettings', 'main'), {
          siteTitle: clampString(data.siteTitle, 120, DEFAULT_SITE_SETTINGS.siteTitle),
          tagline: clampString(data.tagline, 180, DEFAULT_SITE_SETTINGS.tagline),
          heroTitle: clampString(data.heroTitle, 160, DEFAULT_SITE_SETTINGS.heroTitle),
          heroSubtitle: clampString(data.heroSubtitle, 500, DEFAULT_SITE_SETTINGS.heroSubtitle),
          heroBannerUrl: clampString(normalizeMediaUrl(data.heroBannerUrl || ''), 1000),
          logoUrl: clampString(normalizeMediaUrl(data.logoUrl || ''), 1000),
          floatingWidgetImageUrl: clampString(
            normalizeMediaUrl(data.floatingWidgetImageUrl || DEFAULT_WEB_LOGO),
            1000
          ),
          aboutMission: clampString(data.aboutMission, 2000, DEFAULT_SITE_SETTINGS.aboutMission),
          aboutVision: clampString(data.aboutVision, 2000, DEFAULT_SITE_SETTINGS.aboutVision),
          footerAddress: clampString(data.footerAddress || '', 300),
          footerEmail: clampString(data.footerEmail || '', 150),
          footerPhone: clampString(data.footerPhone || '', 60),
          footerCopyright: clampString(data.footerCopyright || '', 200),
          statsStudents: clampNumber(data.statsStudents, 0, 100000, 640),
          statsProjects: clampNumber(data.statsProjects, 0, 100000, 128),
          statsAwards: clampNumber(data.statsAwards, 0, 100000, 42),
          statsPassRate: clampNumber(data.statsPassRate, 0, 100, 98.4),
          statsVisitors: clampNumber(data.statsVisitors, 0, 10000000, 18420),
          maintenanceMode: Boolean(data.maintenanceMode),
          maintenanceAnnouncement: clampString(
            data.maintenanceAnnouncement || DEFAULT_SITE_SETTINGS.maintenanceAnnouncement || '',
            1000
          ),
          maintenanceExpectedTime: clampString(
            data.maintenanceExpectedTime || DEFAULT_SITE_SETTINGS.maintenanceExpectedTime || '',
            200
          ),
          socialLinks: cleanSocial,
          updatedAt: serverTimestamp(),
          updatedBy: cloudUser.uid,
        });
        await logAdminAction('Updated Site Settings', 'siteSettings', data.siteTitle);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction]
  );

  const saveSubject = useCallback(
    async (data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanCode = clampString(data.code, 20, 'TECH');
      const cleanName = clampString(data.name, 120);
      const cleanShort = clampString(data.shortDescription, 300);
      const cleanFull = clampString(data.fullDescription, 3000);
      if (cleanCode.length < 2) throw new Error('Subject code must be at least 2 characters.');
      if (cleanName.length < 2) throw new Error('Subject name must be at least 2 characters.');
      if (cleanShort.length < 2) throw new Error('Short description must be at least 2 characters.');
      if (cleanFull.length < 2) throw new Error('Full description must be at least 2 characters.');

      const id = data.id ? preserveDocId(data.id) : createUniqueId(cleanCode || 'subj');
      const path = `subjects/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'subjects', id));
        const payload = {
          code: cleanCode,
          name: cleanName,
          shortDescription: cleanShort,
          fullDescription: cleanFull,
          imageUrl: clampString(normalizeMediaUrl(data.imageUrl || ''), 1000),
          headTeacherName: clampString(data.headTeacherName || '', 120),
          headTeacherTitle: clampString(data.headTeacherTitle || '', 120),
          labFacilities: clampString(data.labFacilities || '', 600),
          curriculumHighlights: clampStringList(data.curriculumHighlights || [], 10, 200),
          order: clampNumber(data.order, 0, 1000, 1),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'subjects', id), payload);
          await logAdminAction('Updated Subject', 'subjects', payload.name);
        } else {
          await setDoc(doc(db, 'subjects', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Created Subject', 'subjects', payload.name);
        }
        await unmarkDefaultDeleted('subjects', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteSubject = useCallback(
    async (id: string, title: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `subjects/${id}`;
      try {
        await deleteDoc(doc(db, 'subjects', id));
        await markDefaultDeleted('subjects', id, cloudUser.uid);
        await logAdminAction('Deleted Subject', 'subjects', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const saveTeacher = useCallback(
    async (data: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanName = clampString(data.name, 120);
      const cleanRole = clampString(data.role, 120);
      const cleanDept = clampString(data.department, 100);
      if (cleanName.length < 2) throw new Error('Teacher name must be at least 2 characters.');
      if (cleanRole.length < 2) throw new Error('Teacher role/designation must be at least 2 characters.');
      if (cleanDept.length < 2) throw new Error('Department/subject must be at least 2 characters.');

      const id = data.id ? preserveDocId(data.id) : createUniqueId('teacher');
      const path = `teachers/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'teachers', id));
        const payload = {
          name: cleanName,
          role: cleanRole,
          department: cleanDept,
          qualifications: clampString(data.qualifications || '', 300),
          bio: clampString(data.bio || '', 1200),
          photoUrl: clampString(normalizeMediaUrl(data.photoUrl || ''), 1000),
          officeRoom: clampString(data.officeRoom || '', 80),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'teachers', id), payload);
          await logAdminAction('Updated Teacher', 'teachers', payload.name);
        } else {
          await setDoc(doc(db, 'teachers', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Added Teacher', 'teachers', payload.name);
        }
        await unmarkDefaultDeleted('teachers', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteTeacher = useCallback(
    async (id: string, name: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `teachers/${id}`;
      try {
        await deleteDoc(doc(db, 'teachers', id));
        await markDefaultDeleted('teachers', id, cloudUser.uid);
        await logAdminAction('Deleted Teacher', 'teachers', name);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const saveStudent = useCallback(
    async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanName = clampString(data.fullName, 120);
      const cleanGrade = clampString(data.gradeLevel, 60);
      const cleanStream = clampString(data.stream, 100);
      if (cleanName.length < 2) throw new Error('Student full name must be at least 2 characters.');
      if (cleanGrade.length < 1) throw new Error('Grade level is required.');
      if (cleanStream.length < 2) throw new Error('Technology stream must be at least 2 characters.');

      const id = data.id ? preserveDocId(data.id) : createUniqueId('student');
      const path = `students/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'students', id));
        const payload = {
          fullName: cleanName,
          gradeLevel: cleanGrade,
          stream: cleanStream,
          roleTitle: clampString(data.roleTitle || '', 120),
          achievementsSummary: clampString(data.achievementsSummary || '', 800),
          photoUrl: clampString(normalizeMediaUrl(data.photoUrl || ''), 1000),
          graduationYear: clampString(data.graduationYear || '', 20),
          featured: Boolean(data.featured),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'students', id), payload);
          await logAdminAction('Updated Student', 'students', payload.fullName);
        } else {
          await setDoc(doc(db, 'students', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Added Student', 'students', payload.fullName);
        }
        await unmarkDefaultDeleted('students', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteStudent = useCallback(
    async (id: string, name: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `students/${id}`;
      try {
        await deleteDoc(doc(db, 'students', id));
        await markDefaultDeleted('students', id, cloudUser.uid);
        await logAdminAction('Deleted Student', 'students', name);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const saveCommunityDirectoryMember = useCallback(
    async (
      data: Omit<CommunityDirectoryMember, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ) => {
      assertCloudAdminAuth();
      const cleanName = clampString(data.fullName, 120);
      const cleanBio = clampString(data.bio, 1200);
      const cleanYear = clampString(data.year || '2026', 12, '2026');
      if (cleanName.length < 2) throw new Error('Full name must be at least 2 characters.');
      if (cleanBio.length < 2) throw new Error('Biography must be at least 2 characters.');
      if (cleanYear.length < 4) throw new Error('Year must be at least 4 characters (e.g., 2026).');

      const id = data.id ? preserveDocId(data.id) : createUniqueId('member');
      const path = `communityDirectory/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'communityDirectory', id));
        const cleanSocial: Record<string, string> = {};
        if (data.socialLinks) {
          (['linkedin', 'github', 'twitter', 'instagram', 'website'] as const).forEach((key) => {
            const val = clampString(data.socialLinks?.[key] || '', 500);
            if (val) cleanSocial[key] = val;
          });
        }
        const payload = {
          fullName: cleanName,
          position: data.position,
          year: cleanYear,
          bio: cleanBio,
          photoUrl: clampString(normalizeMediaUrl(data.photoUrl || ''), 1000),
          secondaryPhotoUrl: clampString(normalizeMediaUrl(data.secondaryPhotoUrl || ''), 1000),
          memberCode: clampString(data.memberCode || '', 40),
          isExecutive: Boolean(data.isExecutive),
          order: clampNumber(data.order, 0, 10000, 10),
          socialLinks: cleanSocial,
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'communityDirectory', id), payload);
          await logAdminAction(
            `Updated Member (${payload.position})`,
            'communityDirectory',
            payload.fullName
          );
        } else {
          await setDoc(doc(db, 'communityDirectory', id), {
            ...payload,
            createdAt: serverTimestamp(),
          });
          await logAdminAction(
            `Added Member (${payload.position})`,
            'communityDirectory',
            payload.fullName
          );
        }
        await unmarkDefaultDeleted('communityDirectory', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteCommunityDirectoryMember = useCallback(
    async (id: string, fullName: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `communityDirectory/${id}`;
      try {
        await deleteDoc(doc(db, 'communityDirectory', id));
        await markDefaultDeleted('communityDirectory', id, cloudUser.uid);
        await logAdminAction('Deleted Community Member', 'communityDirectory', fullName);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const seedDefaultCommunityDirectory = useCallback(async () => {
    assertCloudAdminAuth();
    const path = 'communityDirectory';
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      DEFAULT_COMMUNITY_DIRECTORY.forEach(({ id, ...rest }) => {
        const tombstoneId = makeTombstoneId('communityDirectory', id);
        if (deletedDefaultKeys.includes(tombstoneId)) {
          batch.delete(doc(db, 'deletedDefaults', tombstoneId));
        }
        batch.set(doc(db, 'communityDirectory', id), {
          ...rest,
          createdAt: now,
          updatedAt: now,
        });
      });
      await batch.commit();
      await logAdminAction(
        'Seeded Executive Committee',
        'communityDirectory',
        `${DEFAULT_COMMUNITY_DIRECTORY.length} Official Profiles`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [assertCloudAdminAuth, logAdminAction, deletedDefaultKeys]);

  const saveEvent = useCallback(
    async (data: Omit<CampusEvent, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanTitle = clampString(data.title, 160);
      const cleanCategory = clampString(data.category, 80);
      const cleanEventDate = clampString(data.eventDate, 60);
      const cleanLocation = clampString(data.location, 160);
      if (!cleanTitle) {
        throw new Error('Event title is required.');
      }
      if (!cleanCategory) {
        throw new Error('Event category is required.');
      }
      if (cleanEventDate.length < 4) {
        throw new Error('Please choose a valid event date (YYYY-MM-DD).');
      }
      if (!cleanLocation) {
        throw new Error('Event location is required.');
      }

      const validStatuses: EventStatus[] = ['scheduled', 'live', 'cancelled', 'closed'];
      const resolvedStatus: EventStatus =
        data.status && validStatuses.includes(data.status)
          ? data.status
          : data.isUpcoming
          ? 'scheduled'
          : 'closed';
      const resolvedUpcoming = resolvedStatus === 'scheduled' || resolvedStatus === 'live';

      const id = data.id ? preserveDocId(data.id) : createUniqueId('event');
      const path = `events/${id}`;
      try {
        const isExisting = data.id ? (await getDoc(doc(db, 'events', id))).exists() : false;
        const payload = {
          title: cleanTitle,
          category: cleanCategory,
          eventDate: cleanEventDate,
          startTime: clampString(data.startTime || '', 20),
          timeLabel: clampString(data.timeLabel || '', 60),
          location: cleanLocation,
          description: clampString(data.description || '', 2000),
          imageUrl: clampString(normalizeMediaUrl(data.imageUrl || ''), 1000),
          isUpcoming: resolvedUpcoming,
          status: resolvedStatus,
          cancellationReason:
            resolvedStatus === 'cancelled'
              ? clampString(data.cancellationReason || '', 400)
              : '',
          liveStreamUrl: clampString(data.liveStreamUrl || '', 1000),
          registrationLink: clampString(data.registrationLink || '', 1000),
          updatedAt: serverTimestamp(),
        };
        if (isExisting) {
          await updateDoc(doc(db, 'events', id), payload);
          await logAdminAction('Updated Event', 'events', payload.title);
        } else {
          await setDoc(doc(db, 'events', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Created Event', 'events', payload.title);
        }
        await unmarkDefaultDeleted('events', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const updateEventStatus = useCallback(
    async (event: CampusEvent, status: EventStatus, cancellationReason?: string) => {
      assertCloudAdminAuth();
      const id = preserveDocId(event.id);
      const path = `events/${id}`;
      const nextUpcoming = status === 'scheduled' || status === 'live';
      const cleanReason =
        status === 'cancelled' ? clampString(cancellationReason || '', 400) : '';

      const actionLabelMap: Record<EventStatus, string> = {
        live: 'Started Live Event',
        cancelled: 'Cancelled Event',
        closed: 'Closed Event',
        scheduled: 'Reset Event Schedule',
      };

      try {
        const existingSnap = await getDoc(doc(db, 'events', id));
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'events', id), {
            status,
            isUpcoming: nextUpcoming,
            cancellationReason: cleanReason,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(doc(db, 'events', id), {
            title: clampString(event.title, 160, 'SSCK TECH Event'),
            category: clampString(event.category, 80, 'Workshop'),
            eventDate: clampString(event.eventDate, 60, new Date().toISOString().slice(0, 10)),
            startTime: clampString(event.startTime || '', 20),
            timeLabel: clampString(event.timeLabel || '', 60),
            location: clampString(event.location, 160, 'SSCK TECH Campus'),
            description: clampString(event.description || '', 2000),
            imageUrl: clampString(normalizeMediaUrl(event.imageUrl || ''), 1000),
            isUpcoming: nextUpcoming,
            status,
            cancellationReason: cleanReason,
            liveStreamUrl: clampString(event.liveStreamUrl || '', 1000),
            registrationLink: clampString(event.registrationLink || '', 1000),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await unmarkDefaultDeleted('events', id);
        }
        await logAdminAction(actionLabelMap[status], 'events', event.title);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteEvent = useCallback(
    async (id: string, title: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `events/${id}`;
      try {
        await deleteDoc(doc(db, 'events', id));
        await markDefaultDeleted('events', id, cloudUser.uid);
        await logAdminAction('Deleted Event', 'events', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const saveAchievement = useCallback(
    async (data: Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanTitle = clampString(data.title, 160);
      const cleanCategory = clampString(data.category, 80);
      const cleanYear = clampString(data.year, 12);
      if (cleanTitle.length < 2) throw new Error('Achievement title must be at least 2 characters.');
      if (cleanCategory.length < 2) throw new Error('Category must be at least 2 characters.');
      if (cleanYear.length < 4) throw new Error('Year must be at least 4 characters (e.g., 2026).');

      const id = data.id ? preserveDocId(data.id) : createUniqueId('ach');
      const path = `achievements/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'achievements', id));
        const payload = {
          title: cleanTitle,
          category: cleanCategory,
          awardLevel: data.awardLevel,
          tier: data.tier || 'Gold',
          iconType: data.iconType || 'trophy',
          year: cleanYear,
          awardDate: clampString(data.awardDate || '', 40),
          recipients: clampString(data.recipients || '', 240),
          description: clampString(data.description || '', 1500),
          imageUrl: clampString(normalizeMediaUrl(data.imageUrl || ''), 1000),
          featured: Boolean(data.featured),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'achievements', id), payload);
          await logAdminAction('Updated Achievement', 'achievements', payload.title);
        } else {
          await setDoc(doc(db, 'achievements', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Published Achievement', 'achievements', payload.title);
        }
        await unmarkDefaultDeleted('achievements', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteAchievement = useCallback(
    async (id: string, title: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `achievements/${id}`;
      try {
        await deleteDoc(doc(db, 'achievements', id));
        await markDefaultDeleted('achievements', id, cloudUser.uid);
        await logAdminAction('Deleted Achievement', 'achievements', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const saveAnnouncement = useCallback(
    async (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanTitle = clampString(data.title, 160);
      const cleanSummary = clampString(data.summary, 360);
      const cleanPublishDate = clampString(data.publishDate, 40);
      if (cleanTitle.length < 2) throw new Error('Announcement title must be at least 2 characters.');
      if (cleanSummary.length < 2) throw new Error('Summary must be at least 2 characters.');
      if (cleanPublishDate.length < 4) throw new Error('Publish date must be at least 4 characters.');

      const id = data.id ? preserveDocId(data.id) : createUniqueId('ann');
      const path = `announcements/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'announcements', id));
        const payload = {
          title: cleanTitle,
          summary: cleanSummary,
          body: clampString(data.body || '', 3000),
          imageUrl: clampString(normalizeMediaUrl(data.imageUrl || ''), 1000),
          priority: data.priority,
          publishDate: cleanPublishDate,
          pinnedToHome: Boolean(data.pinnedToHome),
          authorName: clampString(data.authorName || user?.displayName || 'Admin', 120),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'announcements', id), payload);
          await logAdminAction('Updated Announcement', 'announcements', payload.title);
        } else {
          await setDoc(doc(db, 'announcements', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Published Announcement', 'announcements', payload.title);
        }
        await unmarkDefaultDeleted('announcements', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, user, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteAnnouncement = useCallback(
    async (id: string, title: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `announcements/${id}`;
      try {
        await deleteDoc(doc(db, 'announcements', id));
        await markDefaultDeleted('announcements', id, cloudUser.uid);
        await logAdminAction('Deleted Announcement', 'announcements', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const saveGalleryItem = useCallback(
    async (data: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanTitle = clampString(data.title, 160);
      const cleanCategory = clampString(data.category, 80);
      const cleanMediaUrl = clampString(normalizeMediaUrl(data.mediaUrl), 1000);
      if (cleanTitle.length < 2) throw new Error('Gallery title must be at least 2 characters.');
      if (cleanCategory.length < 2) throw new Error('Category must be at least 2 characters.');
      if (cleanMediaUrl.length < 2) throw new Error('Please upload an image or provide a valid media URL.');

      const id = data.id ? preserveDocId(data.id) : createUniqueId('gal');
      const path = `gallery/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'gallery', id));
        const payload = {
          title: cleanTitle,
          category: cleanCategory,
          mediaType: data.mediaType,
          mediaUrl: cleanMediaUrl,
          description: clampString(data.description || '', 600),
          capturedDate: clampString(data.capturedDate || '', 40),
          driveUrl: clampString(data.driveUrl || '', 500),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'gallery', id), payload);
          await logAdminAction('Updated Gallery Item', 'gallery', payload.title);
        } else {
          await setDoc(doc(db, 'gallery', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Added Gallery Media', 'gallery', payload.title);
        }
        await unmarkDefaultDeleted('gallery', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteGalleryItem = useCallback(
    async (id: string, title: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `gallery/${id}`;
      try {
        await deleteDoc(doc(db, 'gallery', id));
        await markDefaultDeleted('gallery', id, cloudUser.uid);
        await logAdminAction('Deleted Gallery Item', 'gallery', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const saveProject = useCallback(
    async (data: Omit<StudentProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanTitle = clampString(data.title, 160);
      const cleanSubject = clampString(data.subjectCode, 30);
      const cleanTeam = clampString(data.studentTeam, 240);
      const cleanYear = clampString(data.year, 12);
      const cleanSummary = clampString(data.summary, 500);
      if (cleanTitle.length < 2) throw new Error('Project title must be at least 2 characters.');
      if (cleanSubject.length < 2) throw new Error('Subject code must be at least 2 characters.');
      if (cleanTeam.length < 2) throw new Error('Student team must be at least 2 characters.');
      if (cleanYear.length < 4) throw new Error('Year must be at least 4 characters (e.g., 2026).');
      if (cleanSummary.length < 2) throw new Error('Project summary must be at least 2 characters.');

      const id = data.id ? preserveDocId(data.id) : createUniqueId('proj');
      const path = `projects/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'projects', id));
        const payload = {
          title: cleanTitle,
          subjectCode: cleanSubject,
          studentTeam: cleanTeam,
          year: cleanYear,
          summary: cleanSummary,
          technicalDetails: clampString(data.technicalDetails || '', 3000),
          imageUrl: clampString(normalizeMediaUrl(data.imageUrl || ''), 1000),
          demoUrl: clampString(data.demoUrl || '', 1000),
          featured: Boolean(data.featured),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'projects', id), payload);
          await logAdminAction('Updated Project', 'projects', payload.title);
        } else {
          await setDoc(doc(db, 'projects', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Added Student Project', 'projects', payload.title);
        }
        await unmarkDefaultDeleted('projects', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteProject = useCallback(
    async (id: string, title: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `projects/${id}`;
      try {
        await deleteDoc(doc(db, 'projects', id));
        await markDefaultDeleted('projects', id, cloudUser.uid);
        await logAdminAction('Deleted Project', 'projects', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const saveDownloadResource = useCallback(
    async (data: Omit<DownloadResource, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanTitle = clampString(data.title, 160);
      const cleanSubject = clampString(data.subjectCode, 30);
      const cleanFileUrl = clampString(data.fileUrl, 1000);
      if (cleanTitle.length < 2) throw new Error('Resource title must be at least 2 characters.');
      if (cleanSubject.length < 2) throw new Error('Subject code must be at least 2 characters.');
      if (cleanFileUrl.length < 2) throw new Error('Please provide a valid download URL.');

      const id = data.id ? preserveDocId(data.id) : createUniqueId('dl');
      const path = `downloads/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'downloads', id));
        const payload = {
          title: cleanTitle,
          subjectCode: cleanSubject,
          resourceType: data.resourceType,
          fileFormat: data.fileFormat,
          fileSizeLabel: clampString(data.fileSizeLabel || '', 40),
          fileUrl: cleanFileUrl,
          description: clampString(data.description || '', 600),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'downloads', id), payload);
          await logAdminAction('Updated Resource', 'downloads', payload.title);
        } else {
          await setDoc(doc(db, 'downloads', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Added Download Resource', 'downloads', payload.title);
        }
        await unmarkDefaultDeleted('downloads', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteDownloadResource = useCallback(
    async (id: string, title: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `downloads/${id}`;
      try {
        await deleteDoc(doc(db, 'downloads', id));
        await markDefaultDeleted('downloads', id, cloudUser.uid);
        await logAdminAction('Deleted Resource', 'downloads', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const saveHistoryMilestone = useCallback(
    async (data: Omit<HistoryMilestone, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const cleanYear = clampString(data.year, 40);
      const cleanEra = clampString(data.era, 80);
      const cleanTitle = clampString(data.title, 160);
      const cleanDesc = clampString(data.description, 2500);
      if (cleanYear.length < 2) throw new Error('Milestone year must be at least 2 characters.');
      if (cleanEra.length < 2) throw new Error('Era label must be at least 2 characters.');
      if (cleanTitle.length < 2) throw new Error('Milestone title must be at least 2 characters.');
      if (cleanDesc.length < 5) throw new Error('Description must be at least 5 characters.');

      const id = data.id ? preserveDocId(data.id) : createUniqueId('hist');
      const path = `historyEvents/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'historyEvents', id));
        const payload = {
          year: cleanYear,
          era: cleanEra,
          title: cleanTitle,
          description: cleanDesc,
          impactSummary: clampString(data.impactSummary || '', 500),
          imageUrl: clampString(normalizeMediaUrl(data.imageUrl || ''), 1000),
          order: clampNumber(data.order, 0, 1000, 1),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'historyEvents', id), payload);
          await logAdminAction('Updated History Milestone', 'historyEvents', payload.title);
        } else {
          await setDoc(doc(db, 'historyEvents', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Added History Milestone', 'historyEvents', payload.title);
        }
        await unmarkDefaultDeleted('historyEvents', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteHistoryMilestone = useCallback(
    async (id: string, title: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `historyEvents/${id}`;
      try {
        await deleteDoc(doc(db, 'historyEvents', id));
        await markDefaultDeleted('historyEvents', id, cloudUser.uid);
        await logAdminAction('Deleted History Milestone', 'historyEvents', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const seedDefaultHistory = useCallback(async () => {
    assertCloudAdminAuth();
    const path = 'historyEvents';
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      DEFAULT_HISTORY_EVENTS.forEach(({ id, ...rest }) => {
        const tombstoneId = makeTombstoneId('historyEvents', id);
        if (deletedDefaultKeys.includes(tombstoneId)) {
          batch.delete(doc(db, 'deletedDefaults', tombstoneId));
        }
        batch.set(doc(db, 'historyEvents', id), { ...rest, createdAt: now, updatedAt: now });
      });
      await batch.commit();
      await logAdminAction('Synced Default History', 'historyEvents', '8 Technological Eras');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [assertCloudAdminAuth, logAdminAction, deletedDefaultKeys]);

  const createCommunityPost = useCallback(
    async (data: {
      category: CommunityCategory;
      title: string;
      content: string;
      imageUrl?: string;
    }) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with a verified Google account to publish a post.');
      }
      const id = createUniqueId('post');
      const path = `communityPosts/${id}`;
      const resolvedRole = isAdmin
        ? 'Admin'
        : userProfile?.role === 'teacher'
        ? 'Faculty'
        : 'Community Member';
      try {
        await setDoc(doc(db, 'communityPosts', id), {
          authorUid: user.uid,
          authorName: clampString(
            userProfile?.displayName || user.displayName || 'Community Member',
            120,
            'Community Member'
          ),
          authorRole: clampString(resolvedRole, 40, 'Community Member'),
          authorPhotoUrl: clampString(userProfile?.photoURL || user.photoURL || '', 1000),
          category: data.category,
          title: clampString(data.title, 160),
          content: clampString(data.content, 3000),
          imageUrl: clampString(normalizeMediaUrl(data.imageUrl || ''), 1000),
          pinned: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    [user, userProfile, isAdmin]
  );

  const updateCommunityPost = useCallback(
    async (
      id: string,
      data: {
        category: CommunityCategory;
        title: string;
        content: string;
        imageUrl?: string;
      }
    ) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with a verified Google account to edit this post.');
      }
      const path = `communityPosts/${id}`;
      try {
        await updateDoc(doc(db, 'communityPosts', id), {
          category: data.category,
          title: clampString(data.title, 160),
          content: clampString(data.content, 3000),
          imageUrl: clampString(normalizeMediaUrl(data.imageUrl || ''), 1000),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const togglePinCommunityPost = useCallback(
    async (id: string, pinned: boolean, title: string) => {
      assertCloudAdminAuth();
      const path = `communityPosts/${id}`;
      try {
        await updateDoc(doc(db, 'communityPosts', id), {
          pinned,
          updatedAt: serverTimestamp(),
        });
        await logAdminAction(pinned ? 'Pinned Community Post' : 'Unpinned Community Post', 'communityPosts', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction]
  );

  const deleteCommunityPost = useCallback(
    async (id: string, title: string) => {
      if (!user || !user.emailVerified) {
        throw new Error(
          'Please sign in with a verified Google account before deleting a post.'
        );
      }
      const path = `communityPosts/${id}`;
      try {
        await deleteDoc(doc(db, 'communityPosts', id));
        if (isAdmin) {
          await logAdminAction('Deleted Community Post', 'communityPosts', title);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [user, isAdmin, logAdminAction]
  );

  const toggleLikePost = useCallback(
    async (postId: string, currentlyLiked: boolean) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with a verified Google account to like posts.');
      }
      const path = `communityPosts/${postId}/likes/${user.uid}`;
      try {
        if (currentlyLiked) {
          await deleteDoc(doc(db, 'communityPosts', postId, 'likes', user.uid));
        } else {
          await setDoc(doc(db, 'communityPosts', postId, 'likes', user.uid), {
            uid: user.uid,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [user]
  );

  const addCommunityComment = useCallback(
    async (postId: string, body: string) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with a verified Google account to comment.');
      }
      const commentId = createUniqueId('cmt');
      const path = `communityPosts/${postId}/comments/${commentId}`;
      const resolvedRole = isAdmin
        ? 'Admin'
        : userProfile?.role === 'teacher'
        ? 'Faculty'
        : 'Community Member';
      try {
        await setDoc(doc(db, 'communityPosts', postId, 'comments', commentId), {
          authorUid: user.uid,
          authorName: clampString(
            userProfile?.displayName || user.displayName || 'Community Member',
            120,
            'Community Member'
          ),
          authorRole: clampString(resolvedRole, 40, 'Community Member'),
          authorPhotoUrl: clampString(userProfile?.photoURL || user.photoURL || '', 1000),
          body: clampString(body, 1200),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    [user, userProfile, isAdmin]
  );

  const deleteCommunityComment = useCallback(
    async (postId: string, commentId: string) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with a verified Google account to delete this comment.');
      }
      const path = `communityPosts/${postId}/comments/${commentId}`;
      try {
        await deleteDoc(doc(db, 'communityPosts', postId, 'comments', commentId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const subscribePostInteractions = useCallback(
    (
      postId: string,
      onLikes: (likes: CommunityLike[]) => void,
      onComments: (comments: CommunityComment[]) => void
    ) => {
      const unsubLikes = onSnapshot(
        collection(db, 'communityPosts', postId, 'likes'),
        (snap) => {
          onLikes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommunityLike, 'id'>) })));
        },
        (error) => handleListenerError(error, OperationType.LIST, `communityPosts/${postId}/likes`)
      );

      const unsubComments = onSnapshot(
        query(collection(db, 'communityPosts', postId, 'comments'), orderBy('createdAt', 'asc')),
        (snap) => {
          onComments(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommunityComment, 'id'>) }))
          );
        },
        (error) => handleListenerError(error, OperationType.LIST, `communityPosts/${postId}/comments`)
      );

      return () => {
        unsubLikes();
        unsubComments();
      };
    },
    [handleListenerError]
  );

  const updateUserRoleAndStatus = useCallback(
    async (
      targetUser: UserProfile,
      role: 'member' | 'student' | 'teacher' | 'admin',
      status: 'active' | 'inactive'
    ) => {
      assertCloudAdminAuth();
      if (!user) return;
      const normalizedRole = role === 'student' ? 'member' : role;
      const userPath = `users/${targetUser.uid}`;
      try {
        await updateDoc(doc(db, 'users', targetUser.uid), {
          role: normalizedRole,
          status,
          updatedAt: serverTimestamp(),
        });

        const memberRef = doc(db, 'communityMembers', targetUser.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          await updateDoc(memberRef, {
            role: normalizedRole,
            status,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(memberRef, {
            uid: targetUser.uid,
            displayName: clampString(targetUser.displayName || 'Community Member', 120, 'Community Member'),
            photoURL: clampString(targetUser.photoURL || '', 1000),
            role: normalizedRole,
            status,
            department: clampString(targetUser.department || 'General Technology', 100),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        const adminRef = doc(db, 'admins', targetUser.uid);
        const existingAdminSnap = await getDoc(adminRef);
        if (normalizedRole === 'admin' && status === 'active') {
          if (!existingAdminSnap.exists()) {
            await setDoc(adminRef, {
              uid: targetUser.uid,
              email: clampString(targetUser.email, 180),
              assignedBy: user.uid,
              createdAt: serverTimestamp(),
            });
          }
        } else if (!isBootstrappedAdminEmail(targetUser.email) && existingAdminSnap.exists()) {
          await deleteDoc(adminRef);
        }
        await logAdminAction(
          `Updated Community Member (${normalizedRole}, ${status})`,
          'users',
          targetUser.displayName || targetUser.email
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userPath);
      }
    },
    [assertCloudAdminAuth, user, logAdminAction]
  );

  const deleteUserAccount = useCallback(
    async (targetUser: UserProfile) => {
      assertCloudAdminAuth();
      if (isBootstrappedAdminEmail(targetUser.email)) {
        throw new Error('The primary system administrator account cannot be deleted.');
      }
      const userPath = `users/${targetUser.uid}`;
      try {
        await deleteDoc(doc(db, 'users', targetUser.uid));
        const memberRef = doc(db, 'communityMembers', targetUser.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          await deleteDoc(memberRef);
        }
        const adminRef = doc(db, 'admins', targetUser.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          await deleteDoc(adminRef);
        }
        await logAdminAction(
          'Deleted Community Member',
          'users',
          targetUser.displayName || targetUser.email
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, userPath);
      }
    },
    [assertCloudAdminAuth, logAdminAction]
  );

  const saveCustomLink = useCallback(
    async (data: Omit<CustomLink, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('link');
      const path = `customLinks/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'customLinks', id));
        const payload = {
          title: clampString(data.title, 100),
          url: clampString(data.url, 1000),
          description: clampString(data.description || '', 300),
          targetSection: data.targetSection,
          icon: clampString(data.icon || 'external-link', 40),
          attachToElement: clampString(data.attachToElement || '', 80),
          order: clampNumber(data.order, 0, 1000, 1),
          isActive: Boolean(data.isActive),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'customLinks', id), payload);
          await logAdminAction('Updated Custom Link', 'customLinks', payload.title);
        } else {
          await setDoc(doc(db, 'customLinks', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Added Custom Link', 'customLinks', payload.title);
        }
        await unmarkDefaultDeleted('customLinks', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteCustomLink = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `customLinks/${id}`;
      try {
        await deleteDoc(doc(db, 'customLinks', id));
        await logAdminAction('Deleted Custom Link', 'customLinks', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction]
  );

  const heroSlides = useMemo<HeroSlide[]>(() => {
    const merged = mergeCollectionWithDefaults(
      DEFAULT_HERO_SLIDES as HeroSlide[],
      heroSlidesDocs,
      deletedDefaultKeys,
      'heroSlides'
    );
    return merged
      .map((item) => ({
        ...item,
        imageUrl: normalizeMediaUrl(item.imageUrl),
        subtitle: item.subtitle || '',
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 5);
  }, [heroSlidesDocs, deletedDefaultKeys]);

  const saveHeroSlide = useCallback(
    async (data: Omit<HeroSlide, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const isEditingExisting = Boolean(data.id && heroSlides.some((s) => s.id === data.id));
      if (!isEditingExisting && heroSlides.length >= 5) {
        throw new Error(
          'Maximum of 5 hero showcase photos reached. Edit, replace, or delete an existing photo first.'
        );
      }
      const cleanImageUrl = clampString(normalizeMediaUrl(data.imageUrl), 1000);
      if (!cleanImageUrl) {
        throw new Error('Please upload an image or provide a valid image URL.');
      }
      const cleanCaption = clampString(data.caption, 220);
      if (cleanCaption.length < 2) {
        throw new Error('Please enter a caption (at least 2 characters).');
      }

      const id = data.id ? preserveDocId(data.id) : createUniqueId('hero-slide');
      const path = `heroSlides/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'heroSlides', id));
        const payload = {
          imageUrl: cleanImageUrl,
          caption: cleanCaption,
          subtitle: clampString(data.subtitle || '', 120),
          order: clampNumber(data.order, 0, 100, heroSlides.length + 1),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'heroSlides', id), payload);
          await logAdminAction('Updated Hero Photo Slide', 'heroSlides', payload.caption);
        } else {
          await setDoc(doc(db, 'heroSlides', id), {
            ...payload,
            createdAt: serverTimestamp(),
          });
          await logAdminAction('Added Hero Photo Slide', 'heroSlides', payload.caption);
        }
        await unmarkDefaultDeleted('heroSlides', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, heroSlides, logAdminAction, unmarkDefaultDeleted]
  );

  const deleteHeroSlide = useCallback(
    async (id: string, caption: string) => {
      const cloudUser = assertCloudAdminAuth();
      const path = `heroSlides/${id}`;
      try {
        await deleteDoc(doc(db, 'heroSlides', id));
        await markDefaultDeleted('heroSlides', id, cloudUser.uid);
        await logAdminAction('Deleted Hero Photo Slide', 'heroSlides', caption || id);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markDefaultDeleted]
  );

  const reorderHeroSlides = useCallback(
    async (orderedSlides: HeroSlide[]) => {
      assertCloudAdminAuth();
      const path = 'heroSlides';
      try {
        const capped = orderedSlides.slice(0, 5);
        const existingChecks = await Promise.all(
          capped.map((slide) => getDoc(doc(db, 'heroSlides', slide.id)))
        );
        const now = serverTimestamp();
        const batch = writeBatch(db);
        capped.forEach((slide, idx) => {
          const ref = doc(db, 'heroSlides', slide.id);
          const nextOrder = idx + 1;
          if (existingChecks[idx]?.exists()) {
            batch.update(ref, { order: nextOrder, updatedAt: now });
          } else {
            batch.set(ref, {
              imageUrl: clampString(normalizeMediaUrl(slide.imageUrl), 1000, HERO_CAMPUS_IMAGE),
              caption: clampString(slide.caption, 220, 'SSCK TECH Showcase'),
              subtitle: clampString(slide.subtitle || '', 120),
              order: nextOrder,
              createdAt: now,
              updatedAt: now,
            });
          }
        });
        await batch.commit();
        await logAdminAction('Reordered Hero Photo Slides', 'heroSlides', `${capped.length} slides`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction]
  );

  const restoreDefaultHeroSlides = useCallback(async () => {
    assertCloudAdminAuth();
    const path = 'heroSlides';
    try {
      const existingSnap = await getDocs(collection(db, 'heroSlides'));
      const defaultIds = new Set(DEFAULT_HERO_SLIDES.map((d) => d.id));
      const now = serverTimestamp();
      const batch = writeBatch(db);

      existingSnap.docs.forEach((docItem) => {
        if (!defaultIds.has(docItem.id)) {
          batch.delete(docItem.ref);
        }
      });

      DEFAULT_HERO_SLIDES.forEach(({ id, ...rest }) => {
        const tombstoneId = makeTombstoneId('heroSlides', id);
        if (deletedDefaultKeys.includes(tombstoneId)) {
          batch.delete(doc(db, 'deletedDefaults', tombstoneId));
        }
        batch.set(doc(db, 'heroSlides', id), {
          ...rest,
          createdAt: now,
          updatedAt: now,
        });
      });

      await batch.commit();
      await logAdminAction('Restored Default Hero Photos', 'heroSlides', '5 Institutional Photos');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [assertCloudAdminAuth, logAdminAction, deletedDefaultKeys]);

  const submitContactMessage = useCallback(
    async (subject: string, message: string) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with a verified Google account to submit an inquiry.');
      }
      const id = createUniqueId('msg');
      const path = `contactMessages/${id}`;
      try {
        await setDoc(doc(db, 'contactMessages', id), {
          senderUid: user.uid,
          senderName: clampString(user.displayName || 'Visitor', 120, 'Visitor'),
          senderEmail: clampString(user.email || '', 180),
          subject: clampString(subject, 180),
          message: clampString(message, 3000),
          status: 'new',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const updateContactStatus = useCallback(
    async (id: string, status: 'new' | 'reviewed' | 'resolved') => {
      assertCloudAdminAuth();
      const path = `contactMessages/${id}`;
      try {
        await updateDoc(doc(db, 'contactMessages', id), {
          status,
          updatedAt: serverTimestamp(),
        });
        await logAdminAction(`Marked Inquiry ${status}`, 'contactMessages', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction]
  );

  const deleteContactMessage = useCallback(
    async (id: string) => {
      assertCloudAdminAuth();
      const path = `contactMessages/${id}`;
      try {
        await deleteDoc(doc(db, 'contactMessages', id));
        await logAdminAction('Deleted Inquiry', 'contactMessages', id);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction]
  );

  const uploadImageToImgBB = useCallback(
    async (
      file: File,
      folder = 'general',
      onProgress?: (pct: number) => void
    ): Promise<string> => {
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files (PNG, JPG, WEBP, GIF) can be uploaded to ImgBB.');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be 10 MB or smaller.');
      }

      onProgress?.(10);
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read image file.'));
          }
        };
        reader.onerror = () => reject(new Error('Unable to read selected image file.'));
        reader.readAsDataURL(file);
      });

      onProgress?.(25);
      const safeName = `${folder}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 60)}`;

      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload-image');
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable && onProgress) {
            const pct = 25 + Math.round((ev.loaded / ev.total) * 70);
            onProgress(Math.min(95, pct));
          }
        };

        xhr.onload = () => {
          try {
            const parsed = JSON.parse(xhr.responseText || '{}') as {
              url?: string;
              error?: string;
            };
            if (xhr.status >= 200 && xhr.status < 300 && parsed.url) {
              onProgress?.(100);
              resolve(parsed.url);
            } else {
              reject(new Error(parsed.error || `Upload failed with HTTP ${xhr.status}`));
            }
          } catch {
            reject(new Error(`Upload failed with HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error while uploading image to ImgBB proxy.'));
        };

        xhr.send(JSON.stringify({ imageBase64, name: safeName }));
      });
    },
    []
  );

  // Use live Firestore data if populated, falling back seamlessly to institutional defaults while unseeded
  const siteSettings = useMemo<SiteSettings>(() => {
    if (!siteSettingsDoc) return DEFAULT_SITE_SETTINGS;
    const normalizedTitle =
      siteSettingsDoc.siteTitle?.trim().toLowerCase() === 'nexustech faculty'
        ? 'SSCK TECH'
        : siteSettingsDoc.siteTitle || DEFAULT_SITE_SETTINGS.siteTitle;
    const normalizedCopyright = siteSettingsDoc.footerCopyright
      ? siteSettingsDoc.footerCopyright.replace(/NexusTech Faculty/gi, 'SSCK TECH')
      : DEFAULT_SITE_SETTINGS.footerCopyright;
    const legacyDefaultHeroSubtitle =
      'Welcome to SSCK TECH—an interdisciplinary school technology academy uniting Science for Technology, Engineering, ICT, Bio Systems, Smart Agriculture, and Geospatial Analysis inside industry-grade laboratories.';
    const normalizedHeroSubtitle =
      !siteSettingsDoc.heroSubtitle?.trim() ||
      siteSettingsDoc.heroSubtitle.trim() === legacyDefaultHeroSubtitle
        ? DEFAULT_SITE_SETTINGS.heroSubtitle
        : siteSettingsDoc.heroSubtitle;
    const normalizedBanner = normalizeMediaUrl(siteSettingsDoc.heroBannerUrl);
    const normalizedLogo = normalizeMediaUrl(siteSettingsDoc.logoUrl);
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...siteSettingsDoc,
      siteTitle: normalizedTitle,
      heroSubtitle: normalizedHeroSubtitle,
      heroBannerUrl: normalizedBanner || DEFAULT_SITE_SETTINGS.heroBannerUrl,
      footerCopyright: normalizedCopyright,
      logoUrl: normalizedLogo || DEFAULT_WEB_LOGO,
      maintenanceMode: siteSettingsDoc.maintenanceMode ?? DEFAULT_SITE_SETTINGS.maintenanceMode ?? false,
      maintenanceAnnouncement: siteSettingsDoc.maintenanceAnnouncement || DEFAULT_SITE_SETTINGS.maintenanceAnnouncement || '',
      maintenanceExpectedTime: siteSettingsDoc.maintenanceExpectedTime || DEFAULT_SITE_SETTINGS.maintenanceExpectedTime || '',
      socialLinks: {
        ...(DEFAULT_SITE_SETTINGS.socialLinks || {}),
        ...(siteSettingsDoc.socialLinks || {}),
      },
    };
  }, [siteSettingsDoc]);
  const subjects = useMemo<Subject[]>(() => {
    const merged = mergeCollectionWithDefaults(
      DEFAULT_SUBJECTS,
      subjectsDocs,
      deletedDefaultKeys,
      'subjects'
    );
    return merged
      .map((item) => ({ ...item, imageUrl: normalizeMediaUrl(item.imageUrl) }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [subjectsDocs, deletedDefaultKeys]);

  const teachers = useMemo<Teacher[]>(() => {
    return mergeCollectionWithDefaults(
      DEFAULT_TEACHERS,
      teachersDocs,
      deletedDefaultKeys,
      'teachers'
    ).map((item) => ({ ...item, photoUrl: normalizeMediaUrl(item.photoUrl) }));
  }, [teachersDocs, deletedDefaultKeys]);

  const students = useMemo<Student[]>(() => {
    return mergeCollectionWithDefaults(
      DEFAULT_STUDENTS,
      studentsDocs,
      deletedDefaultKeys,
      'students'
    ).map((item) => ({ ...item, photoUrl: normalizeMediaUrl(item.photoUrl) }));
  }, [studentsDocs, deletedDefaultKeys]);

  const events = useMemo<CampusEvent[]>(() => {
    const merged = mergeCollectionWithDefaults<CampusEvent>(
      DEFAULT_EVENTS as CampusEvent[],
      eventsDocs,
      deletedDefaultKeys,
      'events'
    );
    const statusPriority: Record<EventStatus, number> = {
      live: 0,
      scheduled: 1,
      cancelled: 2,
      closed: 3,
    };
    return merged
      .map((item) => {
        const normalizedStatus: EventStatus =
          item.status && ['scheduled', 'live', 'cancelled', 'closed'].includes(item.status)
            ? item.status
            : item.isUpcoming
            ? 'scheduled'
            : 'closed';
        return {
          ...item,
          status: normalizedStatus,
          isUpcoming: normalizedStatus === 'scheduled' || normalizedStatus === 'live',
          imageUrl: normalizeMediaUrl(item.imageUrl),
        };
      })
      .sort((a, b) => {
        const rankDiff =
          statusPriority[a.status ?? 'scheduled'] - statusPriority[b.status ?? 'scheduled'];
        if (rankDiff !== 0) return rankDiff;
        const dateCmp = (b.eventDate || '').localeCompare(a.eventDate || '');
        if (dateCmp !== 0) return dateCmp;
        return (
          (b.updatedAt?.seconds ?? b.createdAt?.seconds ?? 0) -
          (a.updatedAt?.seconds ?? a.createdAt?.seconds ?? 0)
        );
      });
  }, [eventsDocs, deletedDefaultKeys]);

  const achievements = useMemo<Achievement[]>(() => {
    const merged = mergeCollectionWithDefaults(
      DEFAULT_ACHIEVEMENTS,
      achievementsDocs,
      deletedDefaultKeys,
      'achievements'
    );
    return merged
      .map((item) => ({ ...item, imageUrl: normalizeMediaUrl(item.imageUrl) }))
      .sort((a, b) => (b.year || '').localeCompare(a.year || ''));
  }, [achievementsDocs, deletedDefaultKeys]);

  const announcements = useMemo<Announcement[]>(() => {
    const merged = mergeCollectionWithDefaults<Announcement>(
      DEFAULT_ANNOUNCEMENTS as Announcement[],
      announcementsDocs,
      deletedDefaultKeys,
      'announcements'
    );
    return merged
      .map((item) => ({ ...item, imageUrl: normalizeMediaUrl(item.imageUrl) }))
      .sort((a, b) => {
        const dateCmp = (b.publishDate || '').localeCompare(a.publishDate || '');
        if (dateCmp !== 0) return dateCmp;
        return (b.updatedAt?.seconds ?? b.createdAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? a.createdAt?.seconds ?? 0);
      });
  }, [announcementsDocs, deletedDefaultKeys]);

  const gallery = useMemo<GalleryItem[]>(() => {
    return mergeCollectionWithDefaults(
      DEFAULT_GALLERY,
      galleryDocs,
      deletedDefaultKeys,
      'gallery'
    ).map((item) => ({ ...item, mediaUrl: normalizeMediaUrl(item.mediaUrl) }));
  }, [galleryDocs, deletedDefaultKeys]);

  const projects = useMemo<StudentProject[]>(() => {
    return mergeCollectionWithDefaults(
      DEFAULT_PROJECTS,
      projectsDocs,
      deletedDefaultKeys,
      'projects'
    ).map((item) => ({ ...item, imageUrl: normalizeMediaUrl(item.imageUrl) }));
  }, [projectsDocs, deletedDefaultKeys]);

  const downloads = useMemo<DownloadResource[]>(() => {
    return mergeCollectionWithDefaults(
      DEFAULT_DOWNLOADS,
      downloadsDocs,
      deletedDefaultKeys,
      'downloads'
    );
  }, [downloadsDocs, deletedDefaultKeys]);

  const historyEvents = useMemo<HistoryMilestone[]>(() => {
    const merged = mergeCollectionWithDefaults(
      DEFAULT_HISTORY_EVENTS,
      historyEventsDocs,
      deletedDefaultKeys,
      'historyEvents'
    );
    return merged
      .map((item) => ({ ...item, imageUrl: normalizeMediaUrl(item.imageUrl) }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [historyEventsDocs, deletedDefaultKeys]);

  const communityPosts = useMemo<CommunityPost[]>(() => {
    return [...communityPostsDocs]
      .map((item) => ({
        ...item,
        imageUrl: normalizeMediaUrl(item.imageUrl),
        authorPhotoUrl: normalizeMediaUrl(item.authorPhotoUrl),
      }))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const aSec = a.createdAt?.seconds ?? 0;
        const bSec = b.createdAt?.seconds ?? 0;
        return bSec - aSec;
      });
  }, [communityPostsDocs]);

  const communityDirectory = useMemo<CommunityDirectoryMember[]>(() => {
    const merged = mergeCollectionWithDefaults(
      DEFAULT_COMMUNITY_DIRECTORY as CommunityDirectoryMember[],
      communityDirectoryDocs,
      deletedDefaultKeys,
      'communityDirectory'
    );
    return merged
      .map((item) => ({
        ...item,
        photoUrl: normalizeMediaUrl(item.photoUrl),
        secondaryPhotoUrl: normalizeMediaUrl(item.secondaryPhotoUrl),
        year: typeof item.year === 'string' && item.year.trim() ? item.year.trim() : '2026',
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [communityDirectoryDocs, deletedDefaultKeys]);

  const customLinks = useMemo<CustomLink[]>(() => {
    return [...customLinksDocs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [customLinksDocs]);

  const registeredMembersCount = useMemo(() => {
    const publicActiveCount = communityMembersDocs.filter((m) => m.status !== 'inactive').length;
    if (isAdmin && usersDocs.length > 0) {
      const adminUsersActive = usersDocs.filter((u) => u.status !== 'inactive').length;
      return Math.max(publicActiveCount, adminUsersActive);
    }
    return publicActiveCount;
  }, [communityMembersDocs, usersDocs, isAdmin]);

  const value: DataContextValue = {
    user,
    userProfile,
    isAdmin,
    authReady,
    adminAuthenticated,
    adminAuthReady,
    adminEmail,
    loadingData,
    eventsLoaded: (eventsSynced && deletedDefaultsSynced) || initialLoadTimedOut,
    announcementsLoaded: (announcementsSynced && deletedDefaultsSynced) || initialLoadTimedOut,
    isFirestoreSeeded,
    seedingInProgress,
    siteSettings,
    subjects,
    teachers,
    students,
    events,
    achievements,
    announcements,
    gallery,
    heroSlides,
    projects,
    downloads,
    historyEvents,
    communityPosts,
    communityMembers: communityMembersDocs,
    communityDirectory,
    registeredMembersCount,
    customLinks,
    users: usersDocs,
    adminLogs: adminLogsDocs,
    contactMessages: contactDocs,
    signInWithGoogle,
    signOutUser,
    loginAdminWithCredentials,
    logoutAdminSession,
    seedDatabase,
    saveSiteSettings,
    saveSubject,
    deleteSubject,
    saveTeacher,
    deleteTeacher,
    saveStudent,
    deleteStudent,
    saveCommunityDirectoryMember,
    deleteCommunityDirectoryMember,
    seedDefaultCommunityDirectory,
    saveEvent,
    updateEventStatus,
    deleteEvent,
    saveAchievement,
    deleteAchievement,
    saveAnnouncement,
    deleteAnnouncement,
    saveGalleryItem,
    deleteGalleryItem,
    saveProject,
    deleteProject,
    saveDownloadResource,
    deleteDownloadResource,
    saveHistoryMilestone,
    deleteHistoryMilestone,
    seedDefaultHistory,
    createCommunityPost,
    updateCommunityPost,
    togglePinCommunityPost,
    deleteCommunityPost,
    toggleLikePost,
    addCommunityComment,
    deleteCommunityComment,
    subscribePostInteractions,
    updateUserRoleAndStatus,
    deleteUserAccount,
    saveCustomLink,
    deleteCustomLink,
    saveHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    restoreDefaultHeroSlides,
    submitContactMessage,
    updateContactStatus,
    deleteContactMessage,
    uploadImageToImgBB,
    hasOpenModal,
    activeModalId,
    registerModal,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}

export function useRegisterModalOpen(isOpen: boolean): boolean {
  const { registerModal, activeModalId } = useData();
  const modalId = useId();
  useEffect(() => {
    registerModal(modalId, isOpen);
    return () => registerModal(modalId, false);
  }, [modalId, isOpen, registerModal]);
  return isOpen && activeModalId === modalId;
}
