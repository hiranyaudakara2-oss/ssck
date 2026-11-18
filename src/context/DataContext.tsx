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
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isBootstrappedAdminEmail,
  isOfflineFirestoreError,
  OperationType,
  verifyFirestoreOnline,
} from '../firebase';
import {
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_COMMUNITY_DIRECTORY,
  DEFAULT_DOWNLOADS,
  DEFAULT_EVENTS,
  DEFAULT_GALLERY,
  DEFAULT_HISTORY_EVENTS,
  DEFAULT_PROJECTS,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_STUDENTS,
  DEFAULT_SUBJECTS,
  DEFAULT_TEACHERS,
  DEFAULT_WEB_LOGO,
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
  GalleryItem,
  HistoryMilestone,
  SiteSettings,
  Student,
  StudentProject,
  Subject,
  Teacher,
  UserProfile,
} from '../types';
import { clampNumber, clampString, clampStringList, createUniqueId, preserveDocId, sanitizeDocId } from '../utils/validation';

function mergeCollectionWithDefaults<T extends { id: string }>(
  defaults: T[],
  firestoreDocs: T[],
  deletedIds: string[]
): T[] {
  const map = new Map<string, T>();
  defaults.forEach((item) => {
    map.set(item.id, item);
  });
  firestoreDocs.forEach((doc) => {
    map.set(doc.id, doc);
  });
  return Array.from(map.values()).filter((item) => !deletedIds.includes(item.id));
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
  activePopupAnnouncement: Announcement | null;
  gallery: GalleryItem[];
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

  const [usersDocs, setUsersDocs] = useState<UserProfile[]>([]);
  const [adminLogsDocs, setAdminLogsDocs] = useState<AdminLog[]>([]);
  const [contactDocs, setContactDocs] = useState<ContactMessage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [eventsSynced, setEventsSynced] = useState(false);
  const [announcementsSynced, setAnnouncementsSynced] = useState(false);
  const [firestoreServerSynced, setFirestoreServerSynced] = useState(false);
  const [seedingInProgress, setSeedingInProgress] = useState(false);
  const [openModalIds, setOpenModalIds] = useState<string[]>([]);
  const autoSeedAttemptedRef = React.useRef(false);

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

  const [localDeletedIds, setLocalDeletedIds] = useState<string[]>(() => {
    try {
      const stored =
        window.localStorage.getItem('techsphere_deleted_default_ids') ||
        window.sessionStorage.getItem('techsphere_deleted_default_ids');
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  const markItemDeleted = useCallback((id: string) => {
    setLocalDeletedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem('techsphere_deleted_default_ids', JSON.stringify(next));
        window.sessionStorage.setItem('techsphere_deleted_default_ids', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const unmarkItemDeleted = useCallback((id: string) => {
    setLocalDeletedIds((prev) => {
      if (!prev.includes(id)) return prev;
      const next = prev.filter((item) => item !== id);
      try {
        window.localStorage.setItem('techsphere_deleted_default_ids', JSON.stringify(next));
        window.sessionStorage.setItem('techsphere_deleted_default_ids', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

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

  // Subscribe to current user's profile doc after initial Firestore server sync is established
  useEffect(() => {
    if (!user || !firestoreServerSynced) return;
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
  }, [user, firestoreServerSynced, handleListenerError]);

  // Public Firestore listeners (verify server reachability before attaching WatchStreams)
  useEffect(() => {
    let active = true;
    let primaryAttached = false;
    let secondaryAttached = false;
    let secondaryPhaseTwoTimer = 0;
    let reconnectTimer = 0;
    const unsubs: (() => void)[] = [];

    const attachSecondaryListeners = () => {
      if (!active || secondaryAttached) return;
      secondaryAttached = true;

      // Wave 1: Primary campus content collections
      unsubs.push(
        onSnapshot(
          query(collection(db, 'subjects'), orderBy('order', 'asc')),
          (snap) => {
            setSubjectsDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Subject, 'id'>) })));
          },
          (error) => handleListenerError(error, OperationType.LIST, 'subjects')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'teachers'),
          (snap) => {
            setTeachersDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Teacher, 'id'>) })));
          },
          (error) => handleListenerError(error, OperationType.LIST, 'teachers')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'students'),
          (snap) => {
            setStudentsDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
          },
          (error) => handleListenerError(error, OperationType.LIST, 'students')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'events'), orderBy('eventDate', 'desc')),
          (snap) => {
            setEventsDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CampusEvent, 'id'>) })));
            setEventsSynced(true);
          },
          (error) => {
            setEventsSynced(true);
            handleListenerError(error, OperationType.LIST, 'events');
          }
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'achievements'), orderBy('year', 'desc')),
          (snap) => {
            setAchievementsDocs(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Achievement, 'id'>) }))
            );
          },
          (error) => handleListenerError(error, OperationType.LIST, 'achievements')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'announcements'), orderBy('publishDate', 'desc')),
          (snap) => {
            setAnnouncementsDocs(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, 'id'>) }))
            );
            setAnnouncementsSynced(true);
          },
          (error) => {
            setAnnouncementsSynced(true);
            handleListenerError(error, OperationType.LIST, 'announcements');
          }
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'projects'), orderBy('year', 'desc')),
          (snap) => {
            setProjectsDocs(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudentProject, 'id'>) }))
            );
          },
          (error) => handleListenerError(error, OperationType.LIST, 'projects')
        )
      );

      // Wave 2: Secondary showcase, archive, and community collections
      secondaryPhaseTwoTimer = window.setTimeout(() => {
        if (!active) return;

        unsubs.push(
          onSnapshot(
            collection(db, 'gallery'),
            (snap) => {
              setGalleryDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, 'id'>) })));
            },
            (error) => handleListenerError(error, OperationType.LIST, 'gallery')
          )
        );

        unsubs.push(
          onSnapshot(
            collection(db, 'downloads'),
            (snap) => {
              setDownloadsDocs(
                snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DownloadResource, 'id'>) }))
              );
            },
            (error) => handleListenerError(error, OperationType.LIST, 'downloads')
          )
        );

        unsubs.push(
          onSnapshot(
            query(collection(db, 'historyEvents'), orderBy('order', 'asc')),
            (snap) => {
              setHistoryEventsDocs(
                snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HistoryMilestone, 'id'>) }))
              );
            },
            (error) => handleListenerError(error, OperationType.LIST, 'historyEvents')
          )
        );

        unsubs.push(
          onSnapshot(
            query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc')),
            (snap) => {
              setCommunityPostsDocs(
                snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommunityPost, 'id'>) }))
              );
            },
            (error) => handleListenerError(error, OperationType.LIST, 'communityPosts')
          )
        );

        unsubs.push(
          onSnapshot(
            collection(db, 'communityMembers'),
            (snap) => {
              setCommunityMembersDocs(
                snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommunityMember, 'id'>) }))
              );
            },
            (error) => handleListenerError(error, OperationType.LIST, 'communityMembers')
          )
        );

        unsubs.push(
          onSnapshot(
            query(collection(db, 'communityDirectory'), orderBy('order', 'asc')),
            (snap) => {
              setCommunityDirectoryDocs(
                snap.docs.map((d) => ({
                  id: d.id,
                  ...(d.data() as Omit<CommunityDirectoryMember, 'id'>),
                }))
              );
            },
            (error) => handleListenerError(error, OperationType.LIST, 'communityDirectory')
          )
        );

        unsubs.push(
          onSnapshot(
            query(collection(db, 'customLinks'), orderBy('order', 'asc')),
            (snap) => {
              setCustomLinksDocs(
                snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CustomLink, 'id'>) }))
              );
            },
            (error) => handleListenerError(error, OperationType.LIST, 'customLinks')
          )
        );
      }, 120);
    };

    const startPrimaryStream = () => {
      if (!active || primaryAttached) return;
      primaryAttached = true;

      unsubs.push(
        onSnapshot(
          doc(db, 'siteSettings', 'main'),
          (snap) => {
            if (snap.exists()) {
              setSiteSettingsDoc({ id: snap.id, ...(snap.data() as SiteSettings) });
            } else {
              setSiteSettingsDoc(null);
            }
            if (!snap.metadata.fromCache) {
              setFirestoreServerSynced(true);
              attachSecondaryListeners();
            }
            setLoadingData(false);
          },
          (error) => {
            if (isOfflineFirestoreError(error)) {
              setFirestoreServerSynced(false);
              setLoadingData(false);
              return;
            }
            handleFirestoreError(error, OperationType.GET, 'siteSettings/main');
          }
        )
      );
    };

    const initFirestoreStreams = async () => {
      const reachable = await verifyFirestoreOnline(6000);
      if (!active) return;

      if (reachable) {
        startPrimaryStream();
      } else {
        setLoadingData(false);
        setEventsSynced(true);
        setAnnouncementsSynced(true);
        window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(() => {
          if (active && !primaryAttached) {
            void initFirestoreStreams();
          }
        }, 20000);
      }
    };

    const handleOnline = () => {
      if (!primaryAttached) {
        void initFirestoreStreams();
      } else {
        attachSecondaryListeners();
      }
    };
    window.addEventListener('online', handleOnline);

    void initFirestoreStreams();

    return () => {
      active = false;
      window.clearTimeout(secondaryPhaseTwoTimer);
      window.clearTimeout(reconnectTimer);
      window.removeEventListener('online', handleOnline);
      unsubs.forEach((u) => u());
    };
  }, [handleListenerError]);

  // Admin-only listeners (wait until initial public WatchStream is synced with server)
  useEffect(() => {
    if (!authReady || !isAdmin || !firestoreServerSynced) {
      if (!authReady || !isAdmin) {
        setUsersDocs([]);
        setAdminLogsDocs([]);
        setContactDocs([]);
      }
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
  }, [authReady, isAdmin, firestoreServerSynced, loadingData, handleListenerError]);

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
              unmarkItemDeleted(id);
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
  }, [user, isAdmin, seedingInProgress, logAdminAction, unmarkItemDeleted]);

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
        // User closed or dismissed the popup intentionally; do not log an error or rethrow
        return false;
      }
      console.warn('Google sign-in notice:', err);
      return false;
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
          heroBannerUrl: clampString(data.heroBannerUrl || '', 1000),
          logoUrl: clampString(data.logoUrl || '', 1000),
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
      const id = data.id ? preserveDocId(data.id) : createUniqueId(data.code || 'subj');
      const path = `subjects/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'subjects', id));
        const payload = {
          code: clampString(data.code, 20, 'TECH'),
          name: clampString(data.name, 120),
          shortDescription: clampString(data.shortDescription, 300),
          fullDescription: clampString(data.fullDescription, 3000),
          imageUrl: clampString(data.imageUrl || '', 1000),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteSubject = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `subjects/${id}`;
      try {
        await deleteDoc(doc(db, 'subjects', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Subject', 'subjects', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const saveTeacher = useCallback(
    async (data: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('teacher');
      const path = `teachers/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'teachers', id));
        const payload = {
          name: clampString(data.name, 120),
          role: clampString(data.role, 120),
          department: clampString(data.department, 100),
          qualifications: clampString(data.qualifications || '', 300),
          bio: clampString(data.bio || '', 1200),
          photoUrl: clampString(data.photoUrl || '', 1000),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteTeacher = useCallback(
    async (id: string, name: string) => {
      assertCloudAdminAuth();
      const path = `teachers/${id}`;
      try {
        await deleteDoc(doc(db, 'teachers', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Teacher', 'teachers', name);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const saveStudent = useCallback(
    async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('student');
      const path = `students/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'students', id));
        const payload = {
          fullName: clampString(data.fullName, 120),
          gradeLevel: clampString(data.gradeLevel, 60),
          stream: clampString(data.stream, 100),
          roleTitle: clampString(data.roleTitle || '', 120),
          achievementsSummary: clampString(data.achievementsSummary || '', 800),
          photoUrl: clampString(data.photoUrl || '', 1000),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteStudent = useCallback(
    async (id: string, name: string) => {
      assertCloudAdminAuth();
      const path = `students/${id}`;
      try {
        await deleteDoc(doc(db, 'students', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Student', 'students', name);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const saveCommunityDirectoryMember = useCallback(
    async (
      data: Omit<CommunityDirectoryMember, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ) => {
      assertCloudAdminAuth();
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
          fullName: clampString(data.fullName, 120),
          position: data.position,
          year: clampString(data.year || '2026', 12) || '2026',
          bio: clampString(data.bio, 1200),
          photoUrl: clampString(data.photoUrl || '', 1000),
          secondaryPhotoUrl: clampString(data.secondaryPhotoUrl || '', 1000),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteCommunityDirectoryMember = useCallback(
    async (id: string, fullName: string) => {
      assertCloudAdminAuth();
      const path = `communityDirectory/${id}`;
      try {
        await deleteDoc(doc(db, 'communityDirectory', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Community Member', 'communityDirectory', fullName);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const seedDefaultCommunityDirectory = useCallback(async () => {
    assertCloudAdminAuth();
    const path = 'communityDirectory';
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      DEFAULT_COMMUNITY_DIRECTORY.forEach(({ id, ...rest }) => {
        unmarkItemDeleted(id);
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
  }, [assertCloudAdminAuth, logAdminAction]);

  const saveEvent = useCallback(
    async (data: Omit<CampusEvent, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('event');
      const path = `events/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'events', id));
        const payload = {
          title: clampString(data.title, 160),
          category: clampString(data.category, 80),
          eventDate: clampString(data.eventDate, 60),
          startTime: clampString(data.startTime || '', 20),
          timeLabel: clampString(data.timeLabel || '', 60),
          location: clampString(data.location, 160),
          description: clampString(data.description || '', 2000),
          imageUrl: clampString(data.imageUrl || '', 1000),
          isUpcoming: Boolean(data.isUpcoming),
          registrationLink: clampString(data.registrationLink || '', 1000),
          updatedAt: serverTimestamp(),
        };
        if (existingSnap.exists()) {
          await updateDoc(doc(db, 'events', id), payload);
          await logAdminAction('Updated Event', 'events', payload.title);
        } else {
          await setDoc(doc(db, 'events', id), { ...payload, createdAt: serverTimestamp() });
          await logAdminAction('Created Event', 'events', payload.title);
        }
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteEvent = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `events/${id}`;
      try {
        await deleteDoc(doc(db, 'events', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Event', 'events', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const saveAchievement = useCallback(
    async (data: Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('ach');
      const path = `achievements/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'achievements', id));
        const payload = {
          title: clampString(data.title, 160),
          category: clampString(data.category, 80),
          awardLevel: data.awardLevel,
          tier: data.tier || 'Gold',
          iconType: data.iconType || 'trophy',
          year: clampString(data.year, 12),
          awardDate: clampString(data.awardDate || '', 40),
          recipients: clampString(data.recipients || '', 240),
          description: clampString(data.description || '', 1500),
          imageUrl: clampString(data.imageUrl || '', 1000),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteAchievement = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `achievements/${id}`;
      try {
        await deleteDoc(doc(db, 'achievements', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Achievement', 'achievements', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const saveAnnouncement = useCallback(
    async (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('ann');
      const path = `announcements/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'announcements', id));
        const payload = {
          title: clampString(data.title, 160),
          summary: clampString(data.summary, 360),
          body: clampString(data.body || '', 3000),
          imageUrl: clampString(data.imageUrl || '', 1000),
          priority: data.priority,
          publishDate: clampString(data.publishDate, 40),
          pinnedToHome: Boolean(data.pinnedToHome),
          showAsPopup: Boolean(data.showAsPopup),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, user, logAdminAction, unmarkItemDeleted]
  );

  const deleteAnnouncement = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `announcements/${id}`;
      try {
        await deleteDoc(doc(db, 'announcements', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Announcement', 'announcements', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const saveGalleryItem = useCallback(
    async (data: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('gal');
      const path = `gallery/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'gallery', id));
        const payload = {
          title: clampString(data.title, 160),
          category: clampString(data.category, 80),
          mediaType: data.mediaType,
          mediaUrl: clampString(data.mediaUrl, 1000),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteGalleryItem = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `gallery/${id}`;
      try {
        await deleteDoc(doc(db, 'gallery', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Gallery Item', 'gallery', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const saveProject = useCallback(
    async (data: Omit<StudentProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('proj');
      const path = `projects/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'projects', id));
        const payload = {
          title: clampString(data.title, 160),
          subjectCode: clampString(data.subjectCode, 30),
          studentTeam: clampString(data.studentTeam, 240),
          year: clampString(data.year, 12),
          summary: clampString(data.summary, 500),
          technicalDetails: clampString(data.technicalDetails || '', 3000),
          imageUrl: clampString(data.imageUrl || '', 1000),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteProject = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `projects/${id}`;
      try {
        await deleteDoc(doc(db, 'projects', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Project', 'projects', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const saveDownloadResource = useCallback(
    async (data: Omit<DownloadResource, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('dl');
      const path = `downloads/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'downloads', id));
        const payload = {
          title: clampString(data.title, 160),
          subjectCode: clampString(data.subjectCode, 30),
          resourceType: data.resourceType,
          fileFormat: data.fileFormat,
          fileSizeLabel: clampString(data.fileSizeLabel || '', 40),
          fileUrl: clampString(data.fileUrl, 1000),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteDownloadResource = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `downloads/${id}`;
      try {
        await deleteDoc(doc(db, 'downloads', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Resource', 'downloads', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const saveHistoryMilestone = useCallback(
    async (data: Omit<HistoryMilestone, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      assertCloudAdminAuth();
      const id = data.id ? preserveDocId(data.id) : createUniqueId('hist');
      const path = `historyEvents/${id}`;
      try {
        const existingSnap = await getDoc(doc(db, 'historyEvents', id));
        const payload = {
          year: clampString(data.year, 40),
          era: clampString(data.era, 80),
          title: clampString(data.title, 160),
          description: clampString(data.description, 2500),
          impactSummary: clampString(data.impactSummary || '', 500),
          imageUrl: clampString(data.imageUrl || '', 1000),
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteHistoryMilestone = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `historyEvents/${id}`;
      try {
        await deleteDoc(doc(db, 'historyEvents', id));
        markItemDeleted(id);
        await logAdminAction('Deleted History Milestone', 'historyEvents', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

  const seedDefaultHistory = useCallback(async () => {
    assertCloudAdminAuth();
    const path = 'historyEvents';
    try {
      const now = serverTimestamp();
      const batch = writeBatch(db);
      DEFAULT_HISTORY_EVENTS.forEach(({ id, ...rest }) => {
        unmarkItemDeleted(id);
        batch.set(doc(db, 'historyEvents', id), { ...rest, createdAt: now, updatedAt: now });
      });
      await batch.commit();
      await logAdminAction('Synced Default History', 'historyEvents', '8 Technological Eras');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]);

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
          imageUrl: clampString(data.imageUrl || '', 1000),
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
      if (!user || !user.emailVerified) return;
      const path = `communityPosts/${id}`;
      try {
        await updateDoc(doc(db, 'communityPosts', id), {
          category: data.category,
          title: clampString(data.title, 160),
          content: clampString(data.content, 3000),
          imageUrl: clampString(data.imageUrl || '', 1000),
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
      if (!user) return;
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
        unmarkItemDeleted(id);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, unmarkItemDeleted]
  );

  const deleteCustomLink = useCallback(
    async (id: string, title: string) => {
      assertCloudAdminAuth();
      const path = `customLinks/${id}`;
      try {
        await deleteDoc(doc(db, 'customLinks', id));
        markItemDeleted(id);
        await logAdminAction('Deleted Custom Link', 'customLinks', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [assertCloudAdminAuth, logAdminAction, markItemDeleted]
  );

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
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...siteSettingsDoc,
      siteTitle: normalizedTitle,
      heroSubtitle: normalizedHeroSubtitle,
      footerCopyright: normalizedCopyright,
      logoUrl: siteSettingsDoc.logoUrl?.trim() ? siteSettingsDoc.logoUrl : DEFAULT_WEB_LOGO,
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
    const merged = mergeCollectionWithDefaults(DEFAULT_SUBJECTS, subjectsDocs, localDeletedIds);
    return merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [subjectsDocs, localDeletedIds]);

  const teachers = useMemo<Teacher[]>(() => {
    return mergeCollectionWithDefaults(DEFAULT_TEACHERS, teachersDocs, localDeletedIds);
  }, [teachersDocs, localDeletedIds]);

  const students = useMemo<Student[]>(() => {
    return mergeCollectionWithDefaults(DEFAULT_STUDENTS, studentsDocs, localDeletedIds);
  }, [studentsDocs, localDeletedIds]);

  const events = useMemo<CampusEvent[]>(() => {
    return mergeCollectionWithDefaults(DEFAULT_EVENTS, eventsDocs, localDeletedIds);
  }, [eventsDocs, localDeletedIds]);

  const achievements = useMemo<Achievement[]>(() => {
    return mergeCollectionWithDefaults(DEFAULT_ACHIEVEMENTS, achievementsDocs, localDeletedIds);
  }, [achievementsDocs, localDeletedIds]);

  const announcements = useMemo<Announcement[]>(() => {
    return mergeCollectionWithDefaults(DEFAULT_ANNOUNCEMENTS, announcementsDocs, localDeletedIds);
  }, [announcementsDocs, localDeletedIds]);

  const gallery = useMemo<GalleryItem[]>(() => {
    return mergeCollectionWithDefaults(DEFAULT_GALLERY, galleryDocs, localDeletedIds);
  }, [galleryDocs, localDeletedIds]);

  const projects = useMemo<StudentProject[]>(() => {
    return mergeCollectionWithDefaults(DEFAULT_PROJECTS, projectsDocs, localDeletedIds);
  }, [projectsDocs, localDeletedIds]);

  const downloads = useMemo<DownloadResource[]>(() => {
    return mergeCollectionWithDefaults(DEFAULT_DOWNLOADS, downloadsDocs, localDeletedIds);
  }, [downloadsDocs, localDeletedIds]);

  const historyEvents = useMemo<HistoryMilestone[]>(() => {
    const merged = mergeCollectionWithDefaults(
      DEFAULT_HISTORY_EVENTS,
      historyEventsDocs,
      localDeletedIds
    );
    return merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [historyEventsDocs, localDeletedIds]);

  const communityPosts = useMemo<CommunityPost[]>(() => {
    return [...communityPostsDocs]
      .filter((item) => !localDeletedIds.includes(item.id))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const aSec = a.createdAt?.seconds ?? 0;
        const bSec = b.createdAt?.seconds ?? 0;
        return bSec - aSec;
      });
  }, [communityPostsDocs, localDeletedIds]);

  const activePopupAnnouncement = useMemo<Announcement | null>(() => {
    return announcements.find((item) => item.showAsPopup === true) ?? null;
  }, [announcements]);

  const communityDirectory = useMemo<CommunityDirectoryMember[]>(() => {
    const merged = mergeCollectionWithDefaults(
      DEFAULT_COMMUNITY_DIRECTORY as CommunityDirectoryMember[],
      communityDirectoryDocs,
      localDeletedIds
    );
    return merged
      .map((item) => ({
        ...item,
        year: typeof item.year === 'string' && item.year.trim() ? item.year.trim() : '2026',
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [communityDirectoryDocs, localDeletedIds]);

  const customLinks = useMemo<CustomLink[]>(() => {
    return customLinksDocs
      .filter((item) => !localDeletedIds.includes(item.id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [customLinksDocs, localDeletedIds]);

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
    eventsLoaded: eventsSynced || !loadingData,
    announcementsLoaded: announcementsSynced || !loadingData,
    isFirestoreSeeded,
    seedingInProgress,
    siteSettings,
    subjects,
    teachers,
    students,
    events,
    achievements,
    announcements,
    activePopupAnnouncement,
    gallery,
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
