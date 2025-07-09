import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  DocumentReference,
  WhereFilterOp,
  OrderByDirection,
  SetOptions,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * 문서 가져오기
 * @param path 컬렉션 경로
 * @param id 문서 ID
 * @returns 문서 데이터 (없으면 null)
 */
export const getDocument = async <T>(path: string, id: string): Promise<T | null> => {
  try {
    const docRef = doc(db, path, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error('문서 가져오기 오류:', error);
    throw new Error('문서를 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 컬렉션 문서 목록 가져오기
 * @param path 컬렉션 경로
 * @param constraints 쿼리 제약 조건
 * @returns 문서 목록
 */
export const getDocuments = async <T>(
  path: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  try {
    const collectionRef = collection(db, path);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const documents: T[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() } as T);
    });
    
    return documents;
  } catch (error) {
    console.error('문서 목록 가져오기 오류:', error);
    throw new Error('문서 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 페이지네이션 문서 목록 가져오기
 * @param path 컬렉션 경로
 * @param constraints 쿼리 제약 조건
 * @param pageSize 페이지 크기
 * @param lastDoc 마지막 문서 (다음 페이지 시작점)
 * @returns 문서 목록 및 다음 페이지 시작점
 */
export const getPaginatedDocuments = async <T>(
  path: string,
  constraints: QueryConstraint[] = [],
  pageSize = 10,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: T[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    const collectionRef = collection(db, path);
    
    let q;
    if (lastDoc) {
      q = query(collectionRef, ...constraints, limit(pageSize), startAfter(lastDoc));
    } else {
      q = query(collectionRef, ...constraints, limit(pageSize));
    }
    
    const querySnapshot = await getDocs(q);
    
    const items: T[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as T);
    });
    
    // 마지막 문서 (다음 페이지 시작점)
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    
    return { items, lastDoc: newLastDoc };
  } catch (error) {
    console.error('페이지네이션 문서 목록 가져오기 오류:', error);
    throw new Error('페이지네이션 문서 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 문서 생성 또는 덮어쓰기
 * @param path 컬렉션 경로
 * @param id 문서 ID
 * @param data 문서 데이터
 * @param merge 병합 여부 (기존 필드 유지)
 * @returns 문서 ID
 */
export const setDocument = async <T extends Record<string, unknown>>(
  path: string,
  id: string,
  data: T,
  merge = false
): Promise<string> => {
  try {
    const docRef = doc(db, path, id);
    const timestamp = serverTimestamp();
    
    // 타임스탬프 필드 자동 추가
    const dataWithTimestamps = {
      ...data,
      updatedAt: timestamp,
    };
    
    // 문서가 새로 생성되는 경우에만 createdAt 추가
    if (!merge) {
      (dataWithTimestamps as Record<string, unknown>).createdAt = timestamp;
    }
    
    if (merge) {
      await setDoc(docRef, dataWithTimestamps as DocumentData, { merge: true });
    } else {
      await setDoc(docRef, dataWithTimestamps as DocumentData);
    }
    return id;
  } catch (error) {
    console.error('문서 생성/덮어쓰기 오류:', error);
    throw new Error('문서를 생성하거나 덮어쓰는 중 오류가 발생했습니다.');
  }
};

/**
 * 자동 ID로 문서 생성
 * @param path 컬렉션 경로
 * @param data 문서 데이터
 * @returns 생성된 문서 ID
 */
export const addDocument = async <T extends Record<string, unknown>>(
  path: string,
  data: T
): Promise<string> => {
  try {
    const collectionRef = collection(db, path);
    const timestamp = serverTimestamp();
    
    // 타임스탬프 필드 자동 추가
    const dataWithTimestamps = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    const docRef = await addDoc(collectionRef, dataWithTimestamps as DocumentData);
    return docRef.id;
  } catch (error) {
    console.error('문서 생성 오류:', error);
    throw new Error('문서를 생성하는 중 오류가 발생했습니다.');
  }
};

/**
 * 문서 업데이트
 * @param path 컬렉션 경로
 * @param id 문서 ID
 * @param data 업데이트할 데이터
 */
export const updateDocument = async <T extends Record<string, unknown>>(
  path: string,
  id: string,
  data: Partial<T>
): Promise<void> => {
  try {
    const docRef = doc(db, path, id);
    
    // 타임스탬프 필드 자동 추가
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, dataWithTimestamp as DocumentData);
  } catch (error) {
    console.error('문서 업데이트 오류:', error);
    throw new Error('문서를 업데이트하는 중 오류가 발생했습니다.');
  }
};

/**
 * 문서 삭제
 * @param path 컬렉션 경로
 * @param id 문서 ID
 */
export const deleteDocument = async (path: string, id: string): Promise<void> => {
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('문서 삭제 오류:', error);
    throw new Error('문서를 삭제하는 중 오류가 발생했습니다.');
  }
};

/**
 * 배치 작업 (여러 작업을 원자적으로 실행)
 * @param operations 실행할 작업 배열
 */
export const performBatchOperation = async (
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    ref: DocumentReference;
    data?: Record<string, unknown>;
    options?: SetOptions;
  }>
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    operations.forEach((operation) => {
      const { type, ref, data, options } = operation;
      
      if (type === 'set' && data) {
        if (options) {
          batch.set(ref, data, options);
        } else {
          batch.set(ref, data);
        }
      } else if (type === 'update' && data) {
        batch.update(ref, data as any);
      } else if (type === 'delete') {
        batch.delete(ref);
      }
    });
    
    await batch.commit();
  } catch (error) {
    console.error('배치 작업 오류:', error);
    throw new Error('배치 작업을 실행하는 중 오류가 발생했습니다.');
  }
};

// Firestore 쿼리 헬퍼
export const firestoreHelper = {
  // 서버 타임스탬프
  serverTimestamp: () => serverTimestamp(),
  
  // 필드 증가
  increment: (value: number) => increment(value),
  
  // 배열에 항목 추가
  arrayUnion: <T>(...elements: T[]) => arrayUnion(...elements),
  
  // 배열에서 항목 제거
  arrayRemove: <T>(...elements: T[]) => arrayRemove(...elements),
  
  // 문서 참조 생성
  docRef: (path: string, id: string) => doc(db, path, id),
  
  // 쿼리 조건 생성 헬퍼
  where: (field: string, operator: WhereFilterOp, value: unknown) => where(field, operator, value),
  orderBy: (field: string, direction: OrderByDirection = 'asc') => orderBy(field, direction),
  limit: (n: number) => limit(n),
}; 