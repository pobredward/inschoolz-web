import admin from 'firebase-admin';

// Firebase Admin SDK 초기화 함수
let adminApp: admin.app.App | null = null;

export const initializeFirebaseAdmin = () => {
  if (adminApp) {
    return adminApp;
  }

  if (admin.apps.length > 0) {
    adminApp = admin.apps[0];
    return adminApp;
  }

  try {
    // 환경 변수 확인
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn(`⚠️ Firebase Admin SDK 환경 변수 누락: ${missingVars.join(', ')}`);
      return null;
    }

    // 환경 변수에서 서비스 계정 키 정보 가져오기
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
    };

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
    });

    console.log('✅ Firebase Admin SDK 초기화 완료');
    return adminApp;
  } catch (error) {
    console.error('❌ Firebase Admin SDK 초기화 실패:', error);
    return null;
  }
};

// 지연 초기화를 위한 getter 함수들
export const getAdminAuth = () => {
  const app = initializeFirebaseAdmin();
  return app ? admin.auth(app) : null;
};

export const getAdminFirestore = () => {
  const app = initializeFirebaseAdmin();
  return app ? admin.firestore(app) : null;
};

export default admin;