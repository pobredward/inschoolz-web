import * as admin from 'firebase-admin';

// 서비스 계정 정보 (환경변수에서 가져오기)
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL?.replace('@', '%40')}`,
  universe_domain: "googleapis.com"
};

// Firebase Admin 초기화 함수
function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: 'https://inschoolz-default-rtdb.asia-southeast1.firebasedatabase.app'
      });
      console.log('✅ Firebase Admin SDK 초기화 완료');
    } catch (error) {
      console.error('❌ Firebase Admin 초기화 오류:', error);
      throw error;
    }
  }
  return admin.app();
}

// Firestore 인스턴스 반환
export function adminFirestore() {
  initializeFirebaseAdmin();
  return admin.firestore();
}

// Auth 인스턴스 반환
export function adminAuth() {
  return admin.auth();
}

// Storage 인스턴스 반환
export function adminStorage() {
  return admin.storage();
}