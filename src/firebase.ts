import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  doc,
  enableNetwork,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: { timeoutSeconds: 8 },
        ignoreUndefinedProperties: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const BOOTSTRAPPED_ADMIN_EMAIL = 'hiranyaudakara2@gmail.com';
export const BOOTSTRAPPED_ADMIN_EMAILS = [
  'hiranyaudakara2@gmail.com',
  'sscktechsociety@gmail.com',
];

export function isBootstrappedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return BOOTSTRAPPED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function isOfflineFirestoreError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errObj = error as { code?: unknown; message?: unknown };
  const code = typeof errObj.code === 'string' ? errObj.code : '';
  const message = typeof errObj.message === 'string' ? errObj.message.toLowerCase() : '';
  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    message.includes('client is offline') ||
    message.includes('could not reach cloud firestore') ||
    message.includes("backend didn't respond")
  );
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function hasValidFirebaseConfig(): boolean {
  return Boolean(
    firebaseConfig.projectId &&
      firebaseConfig.projectId !== 'remixed-project-id' &&
      firebaseConfig.apiKey &&
      firebaseConfig.firestoreDatabaseId
  );
}

function waitForVisibleTab(): Promise<void> {
  if (typeof document === 'undefined' || document.visibilityState === 'visible') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', onVisibility);
        resolve();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
  });
}

async function testConnection(retryCount = 0): Promise<void> {
  if (!hasValidFirebaseConfig()) {
    console.error('Please check your Firebase configuration.');
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'online',
        () => {
          void enableNetwork(db)
            .catch(() => undefined)
            .then(() => testConnection(0));
        },
        { once: true }
      );
    }
    return;
  }

  // Wait for Firebase Auth hydration and an active foreground tab so Firestore
  // opens a single clean WatchStream instead of tearing down on CredentialChange.
  await auth.authStateReady().catch(() => undefined);
  await waitForVisibleTab();

  try {
    // Use a dedicated read-allowed probe doc ID so the one-shot listen/unlisten
    // does not race with DataContext's live siteSettings/main snapshot listener.
    await getDocFromServer(doc(db, 'siteSettings', 'connection-check'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      if (retryCount < 1 && typeof window !== 'undefined') {
        void enableNetwork(db).catch(() => undefined);
        window.setTimeout(() => {
          void testConnection(retryCount + 1);
        }, 2500);
        return;
      }
      if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        console.error('Please check your Firebase configuration.');
      }
    }
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}
