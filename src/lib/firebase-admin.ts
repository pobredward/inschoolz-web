import * as admin from 'firebase-admin';

interface FirebaseAdminApp {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  storage: admin.storage.Storage;
}

let firebaseAdminApp: FirebaseAdminApp | null = null;

// 하나의 함수로 Firebase Admin 초기화 및 서비스 반환
function getFirebaseAdmin(): FirebaseAdminApp {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  try {
    // 이미 초기화되었는지 확인
    if (!admin.apps.length) {
      // 환경 변수
      const privateKey = process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : '';

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        } as admin.ServiceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }

    firebaseAdminApp = {
      db: admin.firestore(),
      auth: admin.auth(),
      storage: admin.storage()
    };

    return firebaseAdminApp;
  } catch (error) {
    console.error('Firebase Admin 초기화 오류:', error);
    // 에러 발생 시 빈 객체를 반환하는 대신 예외 전파
    throw new Error('Firebase Admin 초기화 실패');
  }
}

// 필요시 초기화되는 함수 export
export function getFirestore() {
  return getFirebaseAdmin().db;
}

export function getAuth() {
  return getFirebaseAdmin().auth;
}

export function getStorage() {
  return getFirebaseAdmin().storage;
}

// 빌드 시 초기화 문제를 피하기 위해 함수로 export
export { getAuth as adminAuth, getFirestore as adminFirestore, getStorage as adminStorage }; 