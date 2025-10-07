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
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL?.replace('@', '%40')}`,
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
