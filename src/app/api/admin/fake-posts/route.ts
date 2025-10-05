import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin SDK를 직접 임포트하지 않고 동적으로 로드
async function getFirebaseAdmin() {
  const admin = await import('firebase-admin');
  
  // 이미 초기화된 앱이 있는지 확인
  if (admin.default.apps.length > 0) {
    return admin.default.app();
  }

  // 서비스 계정 정보
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

  // Firebase Admin 초기화
  return admin.default.initializeApp({
    credential: admin.default.credential.cert(serviceAccount as any),
    databaseURL: 'https://inschoolz-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔥 Firebase에서 직접 fake: true 게시글 실시간 조회 시작');

    const app = await getFirebaseAdmin();
    const db = app.firestore();
    
    // fake: true 게시글만 조회
    const fakePostsQuery = await db
      .collection('posts')
      .where('fake', '==', true)
      .limit(50)
      .get();

    if (fakePostsQuery.empty) {
      console.log('✅ fake: true 게시글이 없습니다.');
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        lastUpdated: new Date().toISOString(),
        source: 'firebase_direct_empty',
        note: "현재 Firebase에 fake: true 게시글이 없습니다."
      });
    }

    const allPosts: any[] = [];
    const schoolIds = new Set<string>();
    
    // 모든 AI 게시글 수집
    fakePostsQuery.docs.forEach(doc => {
      const data = doc.data();
      if (data.schoolId) {
        schoolIds.add(data.schoolId);
      }
      allPosts.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        schoolId: data.schoolId,
        authorId: data.authorId,
        authorNickname: data.authorNickname || data.authorInfo?.displayName || '익명',
        boardCode: data.boardCode,
        boardName: data.boardName,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        stats: data.stats || { viewCount: 0, likeCount: 0, commentCount: 0 },
        fake: data.fake,
        tags: data.tags || []
      });
    });

    // 학교 정보 조회 (배치로 효율적으로)
    const schoolMap = new Map<string, string>();
    if (schoolIds.size > 0) {
      const schoolPromises = Array.from(schoolIds).map(async (schoolId: string) => {
        try {
          const schoolDoc = await db.collection('schools').doc(schoolId).get();
          if (schoolDoc.exists) {
            const schoolData = schoolDoc.data();
            schoolMap.set(schoolId, schoolData?.KOR_NAME || '알 수 없는 학교');
          }
        } catch (error) {
          console.error(`학교 정보 조회 실패 (${schoolId}):`, error);
          schoolMap.set(schoolId, '알 수 없는 학교');
        }
      });
      
      await Promise.all(schoolPromises);
    }

    // 게시글에 학교 이름 추가하고 최신순으로 정렬
    const postsWithSchoolNames = allPosts.map(post => ({
      ...post,
      schoolName: schoolMap.get(post.schoolId) || '알 수 없는 학교'
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`🎉 Firebase에서 직접 ${postsWithSchoolNames.length}개 fake: true 게시글 조회 완료!`);

    return NextResponse.json({
      success: true,
      data: postsWithSchoolNames,
      total: postsWithSchoolNames.length,
      lastUpdated: new Date().toISOString(),
      source: 'firebase_direct_realtime',
      note: `🔥 Firebase에서 직접 실시간으로 조회한 fake: true 게시글입니다!`
    });

  } catch (error) {
    console.error('❌ Firebase 직접 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: `Firebase 직접 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    
    if (!postId) {
      return NextResponse.json(
        { success: false, error: '게시글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('🗑️ AI 게시글 삭제 시작:', postId);

    const app = await getFirebaseAdmin();
    const db = app.firestore();
    
    // 게시글 존재 확인 및 fake 여부 검증
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return NextResponse.json(
        { success: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const postData = postDoc.data();
    if (!postData?.fake) {
      return NextResponse.json(
        { success: false, error: '실제 게시글은 삭제할 수 없습니다.' },
        { status: 403 }
      );
    }
    
    // AI 게시글 삭제
    await db.collection('posts').doc(postId).delete();
    
    console.log('✅ AI 게시글 삭제 완료:', postId);
    
    return NextResponse.json({
      success: true,
      message: 'AI 게시글이 삭제되었습니다.',
      data: { id: postId }
    });

  } catch (error) {
    console.error('❌ AI 게시글 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: `게시글 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}