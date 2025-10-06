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

interface SchoolStats {
  id: string;
  name: string;
  type: 'elementary' | 'middle' | 'high';
  region: string;
  botCount: number;
  postCount: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'no_bots';
}

/**
 * GET /api/admin/school-stats
 * 학교별 통계 조회 (필터링 지원)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'all';
    const schoolType = searchParams.get('schoolType') || 'all';
    const search = searchParams.get('search') || '';
    const searchMode = searchParams.get('searchMode') || 'contains'; // 'contains' 또는 'startsWith'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('🏫 학교별 통계 조회 시작:', { region, schoolType, search, searchMode, page, limit });

    const app = await getFirebaseAdmin();
    const db = app.firestore();
    
    // 전체 카운트를 위한 쿼리 (필터 적용)
    let countQuery = db.collection('schools');
    if (region !== 'all') {
      countQuery = countQuery.where('SIDO_NAME', '==', region);
    }
    
    // 학교 쿼리 구성 (페이지네이션 적용)
    let schoolsQuery = db.collection('schools').orderBy('KOR_NAME');
    
    // 지역 필터
    if (region !== 'all') {
      schoolsQuery = schoolsQuery.where('SIDO_NAME', '==', region);
    }
    
    // 페이지네이션 적용
    const offset = (page - 1) * limit;
    if (offset > 0) {
      schoolsQuery = schoolsQuery.offset(offset);
    }
    schoolsQuery = schoolsQuery.limit(limit);
    
    // 병렬로 전체 카운트와 현재 페이지 데이터 조회
    const [totalCountSnapshot, schoolsSnapshot] = await Promise.all([
      countQuery.count().get(),
      schoolsQuery.get()
    ]);
    
    const totalCount = totalCountSnapshot.data().count;
    
    if (schoolsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
        filters: { region, schoolType, search, searchMode, page, limit }
      });
    }

    // 학교 데이터 처리
    const schools: any[] = [];
    const schoolIds: string[] = [];
    
    schoolsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const schoolName = data.KOR_NAME || '알 수 없는 학교';
      
      // 학교명 검색 필터 (최적화된 검색)
      if (search) {
        const searchLower = search.toLowerCase();
        const schoolNameLower = schoolName.toLowerCase();
        
        if (searchMode === 'startsWith') {
          // 시작하는 단어로 검색 (더 빠름)
          if (!schoolNameLower.startsWith(searchLower)) {
            return;
          }
        } else {
          // 포함하는 단어로 검색 (기존 방식)
          if (!schoolNameLower.includes(searchLower)) {
            return;
          }
        }
      }
      
      // 학교 유형 판단
      let type: 'elementary' | 'middle' | 'high' = 'middle';
      if (schoolName.includes('초등학교')) {
        type = 'elementary';
      } else if (schoolName.includes('고등학교') || schoolName.includes('고교')) {
        type = 'high';
      }
      
      // 학교 유형 필터
      if (schoolType !== 'all' && type !== schoolType) {
        return;
      }
      
      const schoolId = data.SCHUL_CODE || doc.id;
      schoolIds.push(schoolId);
      
      schools.push({
        id: schoolId,
        name: schoolName,
        type,
        region: data.SIDO_NAME || '알 수 없음',
        botCount: 0,
        postCount: 0,
        lastActivity: '활동 없음',
        status: 'no_bots' as const
      });
    });

    if (schools.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
        filters: { region, schoolType, search, searchMode, page, limit }
      });
    }

    // 각 학교별 봇 수와 게시글 수 조회
    const schoolStatsMap = new Map<string, SchoolStats>();
    schools.forEach(school => {
      schoolStatsMap.set(school.id, school);
    });

    // 봇 수 조회 (배치로 처리)
    const botsQuery = await db.collection('users')
      .where('fake', '==', true)
      .where('schoolId', 'in', schoolIds.slice(0, 10)) // Firestore 'in' 제한
      .get();
    
    const botCounts = new Map<string, number>();
    botsQuery.docs.forEach(doc => {
      const data = doc.data();
      const schoolId = data.schoolId;
      if (schoolId) {
        botCounts.set(schoolId, (botCounts.get(schoolId) || 0) + 1);
      }
    });

    // 게시글 수 조회 (배치로 처리)
    const postsQuery = await db.collection('posts')
      .where('fake', '==', true)
      .where('schoolId', 'in', schoolIds.slice(0, 10)) // Firestore 'in' 제한
      .get();
    
    const postCounts = new Map<string, number>();
    const lastActivities = new Map<string, Date>();
    
    postsQuery.docs.forEach(doc => {
      const data = doc.data();
      const schoolId = data.schoolId;
      if (schoolId) {
        postCounts.set(schoolId, (postCounts.get(schoolId) || 0) + 1);
        
        // 마지막 활동 시간 업데이트
        const createdAt = data.createdAt?.toDate?.() || new Date();
        const currentLast = lastActivities.get(schoolId);
        if (!currentLast || createdAt > currentLast) {
          lastActivities.set(schoolId, createdAt);
        }
      }
    });

    // 통계 업데이트
    const schoolStats: SchoolStats[] = [];
    schoolStatsMap.forEach((school, schoolId) => {
      const botCount = botCounts.get(schoolId) || 0;
      const postCount = postCounts.get(schoolId) || 0;
      const lastActivity = lastActivities.get(schoolId);
      
      let status: 'active' | 'inactive' | 'no_bots' = 'no_bots';
      if (botCount > 0) {
        status = postCount > 0 ? 'active' : 'inactive';
      }
      
      let lastActivityStr = '활동 없음';
      if (lastActivity) {
        const daysDiff = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 0) {
          lastActivityStr = '오늘';
        } else if (daysDiff === 1) {
          lastActivityStr = '어제';
        } else if (daysDiff < 7) {
          lastActivityStr = `${daysDiff}일 전`;
        } else if (daysDiff < 30) {
          lastActivityStr = `${Math.floor(daysDiff / 7)}주 전`;
        } else {
          lastActivityStr = `${Math.floor(daysDiff / 30)}개월 전`;
        }
      }
      
      schoolStats.push({
        ...school,
        botCount,
        postCount,
        lastActivity: lastActivityStr,
        status
      });
    });

    // 상태별 정렬 (활성 > 비활성 > 봇 없음)
    schoolStats.sort((a, b) => {
      const statusOrder = { active: 0, inactive: 1, no_bots: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      // 같은 상태면 게시글 수로 정렬
      return b.postCount - a.postCount;
    });

    console.log(`✅ 학교별 통계 조회 완료: ${schoolStats.length}개 학교 (페이지 ${page}/${Math.ceil(totalCount / limit)})`);
    
    return NextResponse.json({
      success: true,
      data: schoolStats,
      total: schoolStats.length,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      filters: { region, schoolType, search, page, limit },
      lastUpdated: new Date().toISOString(),
      source: 'firebase_direct_realtime'
    });

  } catch (error) {
    console.error('❌ 학교별 통계 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `학교별 통계를 조회하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
