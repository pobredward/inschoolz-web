import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔥 Firebase Admin SDK 테스트 시작...');
    
    // Firebase Admin SDK 초기화 테스트
    const app = initializeFirebaseAdmin();
    console.log('Firebase Admin App:', app ? '✅ 성공' : '❌ 실패');
    
    // AdminAuth 획득 테스트
    const adminAuth = getAdminAuth();
    console.log('Admin Auth:', adminAuth ? '✅ 성공' : '❌ 실패');
    
    if (adminAuth) {
      // 간단한 Auth 기능 테스트 (사용자 수 확인)
      try {
        const listUsersResult = await adminAuth.listUsers(1);
        console.log('listUsers 테스트: ✅ 성공');
        
        return NextResponse.json({ 
          success: true, 
          message: 'Firebase Admin SDK가 정상적으로 초기화되었습니다.',
          userCount: listUsersResult.users.length,
          hasNextPage: !!listUsersResult.pageToken
        });
      } catch (authError) {
        console.error('Firebase Auth 작업 실패:', authError);
        return NextResponse.json({ 
          success: false, 
          message: 'Firebase Admin SDK는 초기화되었지만 Auth 작업에 실패했습니다.',
          error: authError.message 
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin SDK 초기화에 실패했습니다.',
        envVars: {
          PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
          PRIVATE_KEY_ID: !!process.env.FIREBASE_PRIVATE_KEY_ID,
          PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
          CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
          CLIENT_ID: !!process.env.FIREBASE_CLIENT_ID,
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Firebase Admin SDK 테스트 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Firebase Admin SDK 테스트 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
