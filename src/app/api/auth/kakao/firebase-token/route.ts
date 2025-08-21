/**
 * 카카오 로그인 사용자를 위한 Firebase Custom Token 생성 API
 * 카카오 액세스 토큰을 받아 Firebase Auth 토큰을 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Firebase Admin SDK 초기화 (빌드 시 안전한 초기화)
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return; // 이미 초기화됨
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // 환경 변수가 모두 설정되어 있는지 확인
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[FIREBASE ADMIN] 환경 변수가 설정되지 않았습니다. Firebase Admin SDK를 초기화할 수 없습니다.');
    return;
  }

  try {
    const serviceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };

    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });

    console.log('[FIREBASE ADMIN] Firebase Admin SDK 초기화 완료');
  } catch (error) {
    console.error('[FIREBASE ADMIN] 초기화 실패:', error);
  }
}

interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account: {
    profile: {
      nickname: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    email?: string;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    phone_number?: string;
    gender?: string;
  };
}

/**
 * 카카오 사용자 정보 가져오기
 */
async function getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  if (!response.ok) {
    throw new Error('카카오 사용자 정보를 가져올 수 없습니다.');
  }

  return response.json();
}

/**
 * POST /api/auth/kakao/firebase-token
 * 카카오 액세스 토큰으로 Firebase Custom Token 생성
 */
export async function POST(request: NextRequest) {
  try {
    // Firebase Admin SDK 초기화 시도
    initializeFirebaseAdmin();

    // Firebase Admin이 초기화되지 않은 경우 에러 반환
    if (getApps().length === 0) {
      console.error('[FIREBASE TOKEN] Firebase Admin SDK가 초기화되지 않았습니다.');
      return NextResponse.json(
        { error: 'Firebase Admin SDK 설정이 필요합니다. 환경 변수를 확인해주세요.' },
        { status: 500 }
      );
    }

    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: '액세스 토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('[FIREBASE TOKEN] 카카오 사용자 정보 요청 시작');

    // 카카오 사용자 정보 가져오기
    const kakaoUser = await getKakaoUserInfo(accessToken);
    const kakaoId = kakaoUser.id.toString();
    const uid = `kakao_${kakaoId}`;

    console.log('[FIREBASE TOKEN] 카카오 사용자 정보:', {
      id: kakaoId,
      nickname: kakaoUser.properties.nickname,
      email: kakaoUser.kakao_account.email,
    });

    // Firebase Auth에서 사용자 확인/생성
    const auth = getAuth();
    let firebaseUser;

    try {
      // 기존 사용자 확인
      firebaseUser = await auth.getUser(uid);
      console.log('[FIREBASE TOKEN] 기존 Firebase 사용자 발견:', uid);
    } catch (error) {
      // 새 사용자 생성
      console.log('[FIREBASE TOKEN] 새 Firebase 사용자 생성:', uid);
      
      firebaseUser = await auth.createUser({
        uid: uid,
        email: kakaoUser.kakao_account.email || undefined,
        displayName: kakaoUser.properties.nickname || '카카오사용자',
        photoURL: kakaoUser.kakao_account.profile.profile_image_url || undefined,
        emailVerified: !!kakaoUser.kakao_account.is_email_verified,
      });
    }

    // Custom Token 생성
    const customToken = await auth.createCustomToken(uid, {
      kakaoId: kakaoId,
      provider: 'kakao',
      nickname: kakaoUser.properties.nickname,
      email: kakaoUser.kakao_account.email,
    });

    console.log('[FIREBASE TOKEN] Custom Token 생성 완료');

    return NextResponse.json({
      success: true,
      customToken,
      user: {
        uid: uid,
        kakaoId: kakaoId,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      },
    });

  } catch (error) {
    console.error('[FIREBASE TOKEN] 에러:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Firebase 토큰 생성 중 오류가 발생했습니다.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
