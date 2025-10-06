import { NextRequest, NextResponse } from 'next/server';

// 메모리 캐시 (프로덕션에서는 Redis 사용 권장)
interface CacheItem {
  data: any[];
  timestamp: number;
  total: number;
}

const cache = new Map<string, CacheItem>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

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
 * 최적화된 봇 계정 조회 함수
 */
async function getBotAccountsOptimized(limit: number = 100, schoolType?: string) {
  const app = await getFirebaseAdmin();
  const db = app.firestore();
  
  console.log(`🔍 봇 계정 조회 시작 (limit: ${limit}, schoolType: ${schoolType || 'all'})`);
  
  // 쿼리 빌더 - 인덱스 최적화를 위해 orderBy 추가
  let query = db.collection('users')
    .where('fake', '==', true);
  
  // 학교 유형 필터링 (선택적)
  if (schoolType && schoolType !== 'all') {
    query = query.where('schoolType', '==', schoolType);
  }
  
  // 성능을 위해 생성일 기준으로 정렬하고 제한
  query = query
    .orderBy('createdAt', 'desc')
    .limit(limit);

  const startTime = Date.now();
  const botsSnapshot = await query.get();
  const queryTime = Date.now() - startTime;
  
  console.log(`⚡ Firestore 쿼리 완료: ${queryTime}ms, ${botsSnapshot.size}개 문서`);

  const botAccounts: any[] = [];
  
  botsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    
    // 봇 계정 데이터 구성 (필수 필드만)
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

  return {
    data: botAccounts,
    total: botsSnapshot.size,
    queryTime,
    hasMore: botsSnapshot.size === limit // 더 많은 데이터가 있을 가능성
  };
}

/**
 * GET /api/admin/bot-accounts
 * 봇 계정 목록 조회 (최적화된 버전)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const schoolType = searchParams.get('schoolType') || 'all';
    const useCache = searchParams.get('cache') !== 'false';
    
    // 캐시 키 생성
    const cacheKey = `bot_accounts_${limit}_${schoolType}`;
    
    // 캐시 확인
    if (useCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('💾 캐시에서 봇 계정 데이터 반환');
        return NextResponse.json({
          success: true,
          data: cached.data,
          total: cached.total,
          lastUpdated: new Date(cached.timestamp).toISOString(),
          source: 'cache',
          note: '캐시된 데이터입니다. 최대 5분 지연될 수 있습니다.'
        });
      }
    }

    // Firebase에서 최신 데이터 조회
    const result = await getBotAccountsOptimized(limit, schoolType);
    
    // 캐시에 저장
    if (useCache) {
      cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
        total: result.total
      });
    }

    console.log(`✅ ${result.data.length}개의 봇 계정 조회 완료 (${result.queryTime}ms)`);
    
    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      hasMore: result.hasMore,
      queryTime: result.queryTime,
      lastUpdated: new Date().toISOString(),
      source: 'firebase_optimized',
      note: '🚀 최적화된 쿼리로 조회한 봇 계정 목록입니다!'
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
