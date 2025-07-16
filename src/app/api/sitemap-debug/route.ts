import { NextResponse } from 'next/server';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SamplePost {
  id: string;
  type: string;
  boardCode: string;
  title: string;
  createdAt: unknown;
  isAnonymous: boolean;
  hasRequiredFields: boolean;
  schoolId?: string;
  regions?: unknown;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Sitemap 디버깅 시작...');
    
    const result = {
      timestamp: new Date().toISOString(),
      firebaseStatus: 'unknown',
      postsFound: 0,
      samplePosts: [] as SamplePost[],
      error: null as string | null,
      processingTime: 0,
    };

    // Firebase 연결 확인
    if (!db) {
      result.firebaseStatus = 'not_initialized';
      result.error = 'Firebase database not initialized';
      result.processingTime = Date.now() - startTime;
      return NextResponse.json(result, { status: 500 });
    }

    result.firebaseStatus = 'initialized';

    // 게시글 쿼리 테스트
    const postsQuery = query(
      collection(db, 'posts'),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10) // 디버깅용으로 10개만
    );

    const postsSnapshot = await getDocs(postsQuery);
    result.postsFound = postsSnapshot.size;
    
    // 샘플 게시글 정보 수집
    postsSnapshot.forEach((doc) => {
      const post = doc.data();
      result.samplePosts.push({
        id: doc.id,
        type: post.type || '',
        boardCode: post.boardCode || '',
        title: post.title?.substring(0, 50) + '...' || 'No title',
        createdAt: post.createdAt,
        isAnonymous: post.authorInfo?.isAnonymous || false,
        hasRequiredFields: !!(post.type && post.boardCode && post.createdAt),
        schoolId: post.schoolId,
        regions: post.regions,
      });
    });

    result.processingTime = Date.now() - startTime;
    
    console.log(`✅ Sitemap 디버깅 완료: ${result.postsFound}개 게시글 발견`);
    
    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      }
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Sitemap 디버깅 오류:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      firebaseStatus: 'error',
      postsFound: 0,
      samplePosts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    }, { status: 500 });
  }
} 