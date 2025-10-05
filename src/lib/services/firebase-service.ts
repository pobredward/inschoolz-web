import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK 통합 서비스
 * 모든 서비스에서 공통으로 사용하는 Firebase 초기화 및 유틸리티
 */
export class FirebaseService {
  private static instance: FirebaseService;
  private admin: typeof admin;

  private constructor() {
    this.admin = admin;
    this.initializeFirebaseAdmin();
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Firebase Admin SDK 초기화
   */
  private initializeFirebaseAdmin() {
    if (this.admin.apps.length === 0) {
      try {
        // 환경변수에서 서비스 계정 정보 가져오기
        const serviceAccount = {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID || 'inschoolz',
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || 'c275cfa0f454d6f4b89a11aa523712b845a772fb',
          private_key: (process.env.FIREBASE_PRIVATE_KEY || 
            '-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDjNSkxYSc4W8hz\nSYiL0YKRJrDbE8oqrusQ7q2VNv4+trKEZlb4+L2wejXYfuBx2mtEA98klHz+msAA\n4IvDZd5780xFTRML7flTVdnnPfREI/JjRot3PJgBXlGy8gCH/URDx4TurxaU0w6k\nwRAL9uOYurMmggHEpn2T8B4ZAX4cEqWECtHI+/YxhZAs0vdbha1LQXOwMmzg/5lX\nt7qQhGsfs+hgUloZCGw/9LPHzbCUPoN9A9qQmpt1egzTwuk6VBlTcxiGmvxP5Bob\nktlXU2hOoClBZd/VmGJT6RYWHekpWhfKrPyNKk8704UNyQKOeBX9Xb4aUq0KrX1O\nJ3ErYbI5AgMBAAECggEAFs+P2tZJ2BMBlUQtAk8+0DsrMa4onjprfTVelgbXEGLK\nmheljwoiDpARId2IbnB4U8lzuLoeW81w42Wn19k9X1e2MOr5COSTzeBmUnIE47vG\n1QgQbnXV6PqYMeKxV6B/dF1D+laiahSlJA4CAhbVE3tYYHsC7xmsApND4kzPusTw\nDae1Xguw1Og+WA7YMRnjqlyHUBHmIzbQ9vUGKZP12H2UQVAItMtKepyEh5lWMGfG\nTJ0FUnbodqHExDJVPgC93ajU2u1aHRHcEJBGKfbs4c6DJsuQ8WLewTjN97uzXe3n\nSBa4A2CRy9gfQ/LYpjOWkxyUjzoR/z9vEc0QAGOalQKBgQDymGHa7V7RlylVClr+\nt27g0aJ0+bpO+5u7dZwONd2yv9Yr53wxDQ5aAIIOD8ugzKFtx0CYqJPeaC24JLrE\ncDYx3cNrQRjBFpywGqxN+Yp1PDBjEVbSv3Bfwvr5qA/8bjPjeITs723J0U1fM0fT\nMWEHC2atqd58bIvJy7xtxIjsTwKBgQDvwx1MLdzQVNrq9cGdKHM2tZv5DECm9rFg\ngV7z/FwrYZZm+6IWi93g5APH3L3+imnDliuPA/32CzN6rAg0Vuyw4enWPOBIYlPi\noINNJMF1kOkNHhgqbMJdUkRSwAhvUeFa+4jsomVIgmdQ0WIFyEjedv9j6rdmm/mW\ng5fUaNiu9wJ/EvPUsUXaIoWstPgaI8ww3V+DUaAw7fq6L+sARhvvNgfGs6diDHL4\nrA9eGbsiLW3PLsRiR4rkAnwhFkHIVZBuq3anzblINc2OcDOlQnI8XuxU22h/X/eU\nz+ZrtRVsKkxxwVOpDtmluh6f7NAUzGsPKX26h9a9ivrv8NP55Jl2GQKBgBrEyP+Z\nWz7zSmHTQGOggYSJMDnVEV7SyikBKK3K7it1wMoMrCMiSIp0SqvEzH2fzIEmwgQ8\nqN0QkRXQITZewhxZjLb7ovrR55W04BP715GdtTdetcn+zJCIv9IRWJ+9H5D95mKt\nGuvGi2xthCkrHF+iH49zRDizj2Erngb8Eb0vAoGBANZh79dagXDCRep2+ZIc/4f1\nRRoDQLMZ2+yWeRyJjA3fa1x5yBOicDKCACchmFNBPoYni1fMNttofa1ljG+Ekz0h\nwGrDmyZ1a7ChcdCwZmkGuhlfdTiqrPTLUum5acOGH4bcyzcQlkjOULVPUEj3CM6H\n5yYTJVEjbc/8BPSFqu5n\n-----END PRIVATE KEY-----\n'
          ).replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-p6trg@inschoolz.iam.gserviceaccount.com',
          client_id: process.env.FIREBASE_CLIENT_ID || '109288666163900087649',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${(process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-p6trg@inschoolz.iam.gserviceaccount.com').replace('@', '%40')}`,
          universe_domain: 'googleapis.com'
        };

        this.admin.initializeApp({
          credential: this.admin.credential.cert(serviceAccount as admin.ServiceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://inschoolz-default-rtdb.asia-southeast1.firebasedatabase.app'
        });

        console.log('✅ Firebase Admin SDK 초기화 완료');
      } catch (error) {
        console.error('❌ Firebase Admin 초기화 오류:', error);
        throw error;
      }
    }
  }

  /**
   * Firestore 인스턴스 반환
   */
  public getFirestore(): admin.firestore.Firestore {
    return this.admin.firestore();
  }

  /**
   * FieldValue 반환 (서버 타임스탬프 등)
   */
  public getFieldValue(): typeof admin.firestore.FieldValue {
    return this.admin.firestore.FieldValue;
  }

  /**
   * Admin 인스턴스 반환
   */
  public getAdmin(): typeof admin {
    return this.admin;
  }

  /**
   * Firebase 스타일 UID 생성 (28자 영숫자)
   */
  public generateFirebaseStyleUID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < 28; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * UID 중복 확인
   */
  public async isUIDUnique(uid: string): Promise<boolean> {
    try {
      const userDoc = await this.getFirestore().collection('users').doc(uid).get();
      return !userDoc.exists;
    } catch (error) {
      console.error('UID 중복 확인 실패:', error);
      return false;
    }
  }

  /**
   * 고유한 Firebase 스타일 UID 생성
   */
  public async generateUniqueFirebaseUID(): Promise<string> {
    let attempts = 0;
    let uid: string;
    
    do {
      uid = this.generateFirebaseStyleUID();
      attempts++;
      
      if (attempts > 10) {
        throw new Error('고유한 UID 생성에 실패했습니다.');
      }
    } while (!(await this.isUIDUnique(uid)));
    
    return uid;
  }

  /**
   * 배치 작업 도우미
   */
  public async executeBatch<T>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<void>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<void> {
    const total = items.length;
    let processed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await processor(batch);
      processed += batch.length;
      
      if (onProgress) {
        onProgress(Math.min(processed, total), total);
      }

      // API 부하 방지를 위한 딜레이
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}

export default FirebaseService;
