import * as admin from 'firebase-admin';

interface FirebaseAdminApp {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  storage: admin.storage.Storage;
}

let firebaseAdminApp: FirebaseAdminApp | null = null;

// 서비스 계정 정보를 직접 정의
const serviceAccount = {
  type: "service_account",
  project_id: "inschoolz",
  private_key_id: "c275cfa0f454d6f4b89a11aa523712b845a772fb",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDjNSkxYSc4W8hz\nSYiL0YKRJrDbE8oqrusQ7q2VNv4+trKEZlb4+L2wejXYfuBx2mtEA98klHz+msAA\n4IvDZd5780xFTRML7flTVdnnPfREI/JjRot3PJgBXlGy8gCH/URDx4TurxaU0w6k\nwRAL9uOYurMmggHEpn2T8B4ZAX4cEqWECtHI+/YxhZAs0vdbha1LQXOwMmzg/5lX\nt7qQhGsfs+hgUloZCGw/9LPHzbCUPoN9A9qQmpt1egzTwuk6VBlTcxiGmvxP5Bob\nktlXU2hOoClBZd/VmGJT6RYWHekpWhfKrPyNKk8704UNyQKOeBX9Xb4aUq0KrX1O\nJ3ErYbI5AgMBAAECggEAFs+P2tZJ2BMBlUQtAk8+0DsrMa4onjprfTVelgbXEGLK\nmheljwoiDpARId2IbnB4U8lzuLoeW81w42Wn19k9X1e2MOr5COSTzeBmUnIE47vG\n1QgQbnXV6PqYMeKxV6B/dF1D+laiahSlJA4CAhbVE3tYYHsC7xmsApND4kzPusTw\nDae1Xguw1Og+WA7YMRnjqlyHUBHmIzbQ9vUGKZP12H2UQVAItMtKepyEh5lWMGfG\nTJ0FUnbodqHExDJVPgC93ajU2u1aHRHcEJBGKfbs4c6DJsuQ8WLewTjN97uzXe3n\nSBa4A2CRy9gfQ/LYpjOWkxyUjzoR/z9vEc0QAGOalQKBgQDymGHa7V7RlylVClr+\nt27g0aJ0+bpO+5u7dZwONd2yv9Yr53wxDQ5aAIIOD8ugzKFtx0CYqJPeaC24JLrE\ncDYx3cNrQRjBFpywGqxN+Yp1PDBjEVbSv3Bfwvr5qA/8bjPjeITs723J0U1fM0fT\nMWEHC2atqd58bIvJy7xtxIjsTwKBgQDvwx1MLdzQVNrq9cGdKHM2tZv5DECm9rFg\ngV7z/FwrYZZm+6IWi93g5APH3L3+imnDliuPA/32CzN6rAg0Vuyw4enWPOBIYlPi\noINNJMF1kOkNHhgqbMJdUkRSwAhvUeFa+4jsomVIgmdQ0WIFyEjedv9j6rdmm/mW\ng5fUaNiu9wJ/EvPUsUXaIoWstPgaI8ww3V+DUaAw7fq6L+sARhvvNgfGs6diDHL4\nrA9eGbsiLW3PLsRiR4rkAnwhFkHIVZBuq3anzblINc2OcDOlQnI8XuxU22h/X/eU\nz+ZrtRVsKkxxwVOpDtmluh6f7NAUzGsPKX26h9a9ivrv8NP55Jl2GQKBgBrEyP+Z\nWz7zSmHTQGOggYSJMDnVEV7SyikBKK3K7it1wMoMrCMiSIp0SqvEzH2fzIEmwgQ8\nqN0QkRXQITZewhxZjLb7ovrR55W04BP715GdtTdetcn+zJCIv9IRWJ+9H5D95mKt\nGuvGi2xthCkrHF+iH49zRDizj2Erngb8Eb0vAoGBANZh79dagXDCRep2+ZIc/4f1\nRRoDQLMZ2+yWeRyJjA3fa1x5yBOicDKCACchmFNBPoYni1fMNttofa1ljG+Ekz0h\nwGrDmyZ1a7ChcdCwZmkGuhlfdTiqrPTLUum5acOGH4bcyzcQlkjOULVPUEj3CM6H\n5yYTJVEjbc/8BPSFqu5n\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-p6trg@inschoolz.iam.gserviceaccount.com",
  client_id: "109288666163900087649",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-p6trg%40inschoolz.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// 하나의 함수로 Firebase Admin 초기화 및 서비스 반환
function getFirebaseAdmin(): FirebaseAdminApp {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  try {
    // 이미 초기화되었는지 확인
    if (!admin.apps.length) {
      console.log('🔧 Firebase Admin SDK 초기화 중...');

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: 'https://inschoolz-default-rtdb.asia-southeast1.firebasedatabase.app'
      });
      
      console.log('✅ Firebase Admin SDK 초기화 완료');
    }

    firebaseAdminApp = {
      db: admin.firestore(),
      auth: admin.auth(),
      storage: admin.storage()
    };

    return firebaseAdminApp;
  } catch (error) {
    console.error('❌ Firebase Admin 초기화 오류:', error);
    throw new Error(`Firebase Admin 초기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
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