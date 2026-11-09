import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, initAuth } from '../firebase';
import { DocItem } from '../types';

const COLLECTION_NAME = 'documents';

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
  // Ensure anonymous auth is active
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
      onDocsChange(items);
    },
    (err) => {
      console.warn('Firestore subscription notice:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save / Update a document in Firestore in real-time
 */
export async function saveDocToFirestore(documentItem: DocItem): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, documentItem.id);
    const payload = cleanDocPayload(documentItem);
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.error('Error saving document to Firestore:', err);
    throw err;
  }
}

/**
 * Delete a document and its immediate sub-pages from Firestore
 */
export async function deleteDocFromFirestore(docId: string, childIds: string[] = []): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTION_NAME, docId));
    childIds.forEach((childId) => {
      batch.delete(doc(db, COLLECTION_NAME, childId));
    });
    await batch.commit();
  } catch (err) {
    console.error('Error deleting document from Firestore:', err);
    throw err;
  }
}

/**
 * Seed initial documents if Firestore collection is completely empty
 */
export async function seedFirestoreIfEmpty(initialDocs: DocItem[]): Promise<boolean> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && initialDocs.length > 0) {
      const batch = writeBatch(db);
      for (const d of initialDocs) {
        const ref = doc(db, COLLECTION_NAME, d.id);
        batch.set(ref, cleanDocPayload(d));
      }
      await batch.commit();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Could not seed Firestore:', err);
    return false;
  }
}
