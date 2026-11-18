import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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

let inFlightReachabilityCheck: Promise<boolean> | null = null;

/**
 * Probes Cloud Firestore server reachability before opening persistent WatchStreams
 * so offline/throttled environments do not stall for 10s on Listen streams.
 */
export async function verifyFirestoreOnline(timeoutMs = 5000): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  if (inFlightReachabilityCheck) {
    return inFlightReachabilityCheck;
  }

  inFlightReachabilityCheck = (async () => {
    let timer = 0;
    try {
      const probe = getDocFromServer(doc(db, 'siteSettings', 'main')).then(() => true);
      const timeout = new Promise<boolean>((resolve) => {
        timer = window.setTimeout(() => resolve(false), timeoutMs);
      });
      return await Promise.race([probe, timeout]);
    } catch (error) {
      if (isOfflineFirestoreError(error)) {
        return false;
      }
      // Backend responded (e.g. permission error), so connectivity is healthy
      return true;
    } finally {
      if (timer) window.clearTimeout(timer);
      inFlightReachabilityCheck = null;
    }
  })();

  return inFlightReachabilityCheck;
}

async function testConnection() {
  try {
    await verifyFirestoreOnline(6000);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}
