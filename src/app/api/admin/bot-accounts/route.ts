import { NextRequest, NextResponse } from 'next/server';

/**
 * Firebase Admin SDK 동적 import 및 초기화
 */
async function getFirebaseAdmin() {
  const admin = await import('firebase-admin');
  
  if (admin.default.apps.length > 0) {
    return admin.default;
  }

  const serviceAccount = {
    type: 'service_account',
    project_id: 'inschoolz',
    private_key_id: 'c275cfa0f454d6f4b89a11aa523712b845a772fb',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDjNSkxYSc4W8hz\nSYiL0YKRJrDbE8oqrusQ7q2VNv4+trKEZlb4+L2wejXYfuBx2mtEA98klHz+msAA\n4IvDZd5780xFTRML7flTVdnnPfREI/JjRot3PJgBXlGy8gCH/URDx4TurxaU0w6k\nwRAL9uOYurMmggHEpn2T8B4ZAX4cEqWECtHI+/YxhZAs0vdbha1LQXOwMmzg/5lX\nt7qQhGsfs+hgUloZCGw/9LPHzbCUPoN9A9qQmpt1egzTwuk6VBlTcxiGmvxP5Bob\nktlXU2hOoClBZd/VmGJT6RYWHekpWhfKrPyNKk8704UNyQKOeBX9Xb4aUq0KrX1O\nJ3ErYbI5AgMBAAECggEAFs+P2tZJ2BMBlUQtAk8+0DsrMa4onjprfTVelgbXEGLK\nmheljwoiDpARId2IbnB4U8lzuLoeW81w42Wn19k9X1e2MOr5COSTzeBmUnIE47vG\n1QgQbnXV6PqYMeKxV6B/dF1D+laiahSlJA4CAhbVE3tYYHsC7xmsApND4kzPusTw\nDae1Xguw1Og+WA7YMRnjqlyHUBHmIzbQ9vUGKZP12H2UQVAItMtKepyEh5lWMGfG\nTJ0FUnbodqHExDJVPgC93ajU2u1aHRHcEJBGKfbs4c6DJsuQ8WLewTjN97uzXe3n\nSBa4A2CRy9gfQ/LYpjOWkxyUjzoR/z9vEc0QAGOalQKBgQDymGHa7V7RlylVClr+\nt27g0aJ0+bpO+5u7dZwONd2yv9Yr53wxDQ5aAIIOD8ugzKFtx0CYqJPeaC24JLrE\ncDYx3cNrQRjBFpywGqxN+Yp1PDBjEVbSv3Bfwvr5qA/8bjPjeITs723J0U1fM0fT\nMWEHC2atqd58bIvJy7xtxIjsTwKBgQDvwx1MLdzQVNrq9cGdKHM2tZv5DECm9rFg\ngV7z/FwrYZZm+6IWi93g5APH3L3+imnDliuPA/32CzN6rAg0Vuyw4enWPOBIYlPi\noINNJMF1kOkNHhgqbMJdUkRSwAhvUeFa+4jsomVIgmdQ0WIFyEjedv9j6rdmm/mW\ng5fUaNiu9wJ/EvPUsUXaIoWstPgaI8ww3V+DUaAw7fq6L+sARhvvNgfGs6diDHL4\nrA9eGbsiLW3PLsRiR4rkAnwhFkHIVZBuq3anzblINc2OcDOlQnI8XuxU22h/X/eU\nz+ZrtRVsKkxxwVOpDtmluh6f7NAUzGsPKX26h9a9ivrv8NP55Jl2GQKBgBrEyP+Z\nWz7zSmHTQGOggYSJMDnVEV7SyikBKK3K7it1wMoMrCMiSIp0SqvEzH2fzIEmwgQ8\nqN0QkRXQITZewhxZjLb7ovrR55W04BP715GdtTdetcn+zJCIv9IRWJ+9H5D95mKt\nGuvGi2xthCkrHF+iH49zRDizj2Erngb8Eb0vAoGBANZh79dagXDCRep2+ZIc/4f1\nRRoDQLMZ2+yWeRyJjA3fa1x5yBOicDKCACchmFNBPoYni1fMNttofa1ljG+Ekz0h\nwGrDmyZ1a7ChcdCwZmkGuhlfdTiqrPTLUum5acOGH4bcyzcQlkjOULVPUEj3CM6H\n5yYTJVEjbc/8BPSFqu5n\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-p6trg@inschoolz.iam.gserviceaccount.com',
    client_id: '109288666163900087649',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-p6trg%40inschoolz.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com'
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin.default.initializeApp({
    credential: admin.default.credential.cert(serviceAccount as admin.default.ServiceAccount),
    databaseURL: 'https://inschoolz-default-rtdb.asia-southeast1.firebasedatabase.app'
  });

  return admin.default;
}

/**
 * GET /api/admin/bot-accounts
 * 봇 계정 목록 조회
 */
export async function GET() {
  try {
    console.log('🤖 봇 계정 목록 조회 시작');

    const app = await getFirebaseAdmin();
    const db = app.firestore();
    
    // fake: true인 봇 계정들 조회
    const botsQuery = await db
      .collection('users')
      .where('fake', '==', true)
      .get();

    if (botsQuery.empty) {
      console.log('📝 봇 계정이 없습니다.');
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        lastUpdated: new Date().toISOString(),
        source: 'firebase_direct_realtime'
      });
    }

    const botAccounts: any[] = [];
    
    botsQuery.docs.forEach((doc) => {
      const data = doc.data();
      
      // 봇 계정 데이터 구성
      const botAccount = {
        uid: data.uid || doc.id,
        nickname: data.profile?.userName || data.nickname || '익명',
        schoolId: data.schoolId || '',
        schoolName: data.schoolName || '알 수 없는 학교',
        schoolType: data.schoolType || 'middle',
        stats: {
          level: data.stats?.level || 1,
          totalExperience: data.stats?.totalExperience || 0,
          postCount: data.stats?.postCount || 0,
          commentCount: data.stats?.commentCount || 0
        },
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
      
      botAccounts.push(botAccount);
    });

    console.log(`✅ ${botAccounts.length}개의 봇 계정 조회 완료`);
    
    return NextResponse.json({
      success: true,
      data: botAccounts,
      total: botAccounts.length,
      lastUpdated: new Date().toISOString(),
      source: 'firebase_direct_realtime',
      note: '🤖 Firebase에서 직접 실시간으로 조회한 fake: true 봇 계정입니다!'
    });

  } catch (error) {
    console.error('❌ 봇 계정 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `봇 계정을 조회하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
