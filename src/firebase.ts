import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  type Firestore,
  type FirestoreSettings,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

function createFirestoreInstance(): Firestore {
  try {
    const settings = {
      experimentalForceLongPolling: true,
      experimentalLongPollingOptions: { timeoutSeconds: 25 },
      useFetchStreams: false,
      ignoreUndefinedProperties: true,
    } as FirestoreSettings;
    return initializeFirestore(app, settings, firebaseConfig.firestoreDatabaseId);
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

async function testConnection(retryCount = 0): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'siteSettings', 'main'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      if (retryCount < 1 && typeof window !== 'undefined') {
        window.setTimeout(() => {
          void testConnection(retryCount + 1);
        }, 2500);
        return;
      }
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}
