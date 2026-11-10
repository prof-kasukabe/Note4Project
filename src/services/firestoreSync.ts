import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, auth, initAuth } from '../firebase';
import { DocItem } from '../types';

const COLLECTION_NAME = 'documents';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Validate live connection to Firestore as required by the Firebase skill
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await initAuth();
    await getDocFromServer(doc(db, COLLECTION_NAME, 'connection_health_check'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline, falling back to local persistent store:', error.message);
      return false;
    }
    return true;
  }
}

/**
 * Clean document payload to ensure no undefined values are passed to Firestore
 */
function cleanDocPayload(d: Partial<DocItem>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(d)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Subscribe to real-time document changes across all devices using Firestore onSnapshot
 */
export function subscribeToWorkspace(
  onDocsChange: (docs: DocItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  // Ensure auth is initialized
  initAuth();

  const colRef = collection(db, COLLECTION_NAME);
  const q = query(colRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: DocItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DocItem;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      if (items.length > 0) {
        onDocsChange(items);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save / Update a document in Firestore in real-time
 */
export async function saveDocToFirestore(documentItem: DocItem): Promise<void> {
  const docPath = `${COLLECTION_NAME}/${documentItem.id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, documentItem.id);
    const payload = cleanDocPayload(documentItem);
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
    throw err;
  }
}

/**
 * Delete a document and its immediate sub-pages from Firestore
 */
export async function deleteDocFromFirestore(docId: string, childIds: string[] = []): Promise<void> {
  const docPath = `${COLLECTION_NAME}/${docId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTION_NAME, docId));
    childIds.forEach((childId) => {
      batch.delete(doc(db, COLLECTION_NAME, childId));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
    throw err;
  }
}

/**
 * Seed initial documents if Firestore collection is completely empty
 */
export async function seedFirestoreIfEmpty(initialDocs: DocItem[]): Promise<boolean> {
  try {
    await initAuth();
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && initialDocs.length > 0) {
      const batch = writeBatch(db);
      for (const d of initialDocs) {
        const ref = doc(db, COLLECTION_NAME, d.id);
        batch.set(ref, cleanDocPayload(d));
      }
      await batch.commit();
      console.log(`> Seeded ${initialDocs.length} initial workspace documents to Firestore`);
      return true;
    }
    return false;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    return false;
  }
}
