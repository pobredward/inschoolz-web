import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';

interface KakaoUserInfo {
  id: number;
  kakao_account: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    phone_number?: string;
    birthday?: string;
    birthyear?: string;
    gender?: 'female' | 'male';
  };
}

/**
 * 카카오 액세스 토큰 검증
 */
async function validateKakaoToken(accessToken: string): Promise<KakaoUserInfo> {
  try {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('카카오 API 오류:', response.status, errorText);
      throw new Error(`카카오 토큰 검증 실패: ${response.status}`);
    }

    const userInfo: KakaoUserInfo = await response.json();
    console.log('✅ 카카오 사용자 정보 검증 성공:', {
      id: userInfo.id,
      email: userInfo.kakao_account.email,
      hasEmail: !!userInfo.kakao_account.email,
      emailType: typeof userInfo.kakao_account.email,
      nickname: userInfo.kakao_account.profile?.nickname,
      fullKakaoAccount: userInfo.kakao_account
    });

    return userInfo;
  } catch (error) {
    console.error('❌ 카카오 토큰 검증 실패:', error);
    throw new Error('카카오 토큰 검증에 실패했습니다.');
  }
}

/**
 * Firebase 커스텀 토큰 생성
 */
async function createFirebaseCustomToken(kakaoUser: KakaoUserInfo): Promise<string> {
  try {
    // 카카오 사용자 ID를 Firebase UID로 사용 (접두사 추가로 고유성 보장)
    const uid = `kakao_${kakaoUser.id}`;
    
    // 추가 클레임 설정
    const userEmail = kakaoUser.kakao_account.email;
    console.log('🔍 커스텀 토큰 생성 시 이메일 확인:', {
      originalEmail: userEmail,
      hasEmail: !!userEmail,
      emailLength: userEmail ? userEmail.length : 0,
      emailType: typeof userEmail
    });

    const additionalClaims = {
      provider: 'kakao',
      kakao_id: kakaoUser.id,
      email: userEmail || '',
      nickname: kakaoUser.kakao_account.profile?.nickname || '',
      profile_image: kakaoUser.kakao_account.profile?.profile_image_url || '',
    };

    // Firebase Auth에서 사용자 생성 또는 업데이트 (커스텀 토큰 생성 전에 먼저 처리)
    const adminAuth = getAuth();
    try {
      // 먼저 사용자가 존재하는지 확인
      let userExists = false;
      try {
        await adminAuth.getUser(uid);
        userExists = true;
        console.log('ℹ️ 기존 사용자 발견:', uid);
      } catch {
        console.log('ℹ️ 신규 사용자, 생성 필요:', uid);
      }

      console.log('🔍 Firebase Auth 사용자 생성/업데이트 시도:', {
        uid,
        emailValue: kakaoUser.kakao_account.email,
        hasEmail: !!kakaoUser.kakao_account.email,
        emailUndefined: kakaoUser.kakao_account.email === undefined,
        emailNull: kakaoUser.kakao_account.email === null,
        emailEmpty: kakaoUser.kakao_account.email === '',
        action: userExists ? 'update' : 'create'
      });

      // Firebase Auth 사용자 데이터 준비
      const userEmail = kakaoUser.kakao_account.email && kakaoUser.kakao_account.email.trim() 
        ? kakaoUser.kakao_account.email.trim()
        : `kakao_${kakaoUser.id}@temp.inschoolz.com`;

      const updateData: any = {
        email: userEmail,
        emailVerified: true, // 카카오 인증을 통한 이메일이므로 verified로 설정
        displayName: kakaoUser.kakao_account.profile?.nickname || `카카오사용자${kakaoUser.id}`,
        photoURL: kakaoUser.kakao_account.profile?.profile_image_url || undefined,
      };
      
      console.log('📧 Firebase Auth 이메일 설정:', {
        email: userEmail,
        isKakaoEmail: !!kakaoUser.kakao_account.email,
        emailVerified: true
      });

      let userRecord;
      try {
        userRecord = userExists 
          ? await adminAuth.updateUser(uid, updateData)
          : await adminAuth.createUser({
              uid,
              ...updateData
            });
      } catch (emailError: any) {
        console.warn('⚠️ 이메일 설정 실패, 이메일 없이 재시도:', emailError.message);
        
        // 이메일 충돌 등의 문제가 있으면 이메일 없이 사용자 생성/업데이트
        const updateDataWithoutEmail = {
          displayName: updateData.displayName,
          photoURL: updateData.photoURL,
        };
        
        userRecord = userExists 
          ? await adminAuth.updateUser(uid, updateDataWithoutEmail)
          : await adminAuth.createUser({
              uid,
              ...updateDataWithoutEmail
            });
        
        console.log('✅ 이메일 없이 사용자 생성/업데이트 성공');
      }

      console.log('✅ Firebase Auth 사용자 생성/업데이트 성공:', { 
        uid, 
        email: userRecord.email,
        displayName: userRecord.displayName,
        action: userExists ? 'updated' : 'created'
      });

      // 추가: 사용자 생성/업데이트 후 이메일이 제대로 설정되었는지 확인하고 필요시 재설정
      if (!userRecord.email || userRecord.email === '-') {
        console.log('🔄 이메일이 설정되지 않음, 강제 재설정 시도');
        try {
          const finalUserRecord = await adminAuth.updateUser(uid, { 
            email: userEmail,
            emailVerified: true 
          });
          console.log('✅ 이메일 강제 재설정 성공:', finalUserRecord.email);
        } catch (retryError) {
          console.error('❌ 이메일 강제 재설정 실패:', retryError);
        }
      }
    } catch (authError) {
      console.error('❌ Firebase Auth 사용자 생성/업데이트 실패:', authError);
      // 실패해도 커스텀 토큰은 생성하여 클라이언트에서 처리할 수 있도록 함
    }

    // Firebase 커스텀 토큰 생성 (사용자 생성/업데이트 후에 처리)
    console.log('🔑 Firebase 커스텀 토큰 생성 시작');
    const customToken = await adminAuth.createCustomToken(uid, additionalClaims);
    
    console.log('✅ Firebase 커스텀 토큰 생성 성공:', { uid });
    return customToken;
  } catch (error) {
    console.error('❌ Firebase 커스텀 토큰 생성 실패:', error);
    throw new Error('Firebase 토큰 생성에 실패했습니다.');
  }
}

/**
 * POST /api/auth/kakao/token
 * 카카오 액세스 토큰을 받아 Firebase 커스텀 토큰 반환
 */
export async function POST(request: NextRequest) {
  console.log('🚀 카카오 토큰 교환 API 시작');
  
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { accessToken } = body;
    
    console.log('📝 요청 데이터:', {
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0
    });

    if (!accessToken) {
      console.log('❌ accessToken이 누락됨');
      return NextResponse.json(
        { error: 'accessToken이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('1️⃣ 카카오 액세스 토큰 검증 시작...');
    // 1. 카카오 액세스 토큰 검증 및 사용자 정보 조회
    const kakaoUser = await validateKakaoToken(accessToken);

    console.log('2️⃣ Firebase 커스텀 토큰 생성 시작...');
    // 2. Firebase 커스텀 토큰 생성
    const customToken = await createFirebaseCustomToken(kakaoUser);

    console.log('3️⃣ 성공 응답 준비 중...');
    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      customToken,
      user: {
        id: kakaoUser.id,
        email: kakaoUser.kakao_account.email,
        nickname: kakaoUser.kakao_account.profile?.nickname,
        profileImage: kakaoUser.kakao_account.profile?.profile_image_url,
      }
    });

  } catch (error) {
    console.error('❌ 카카오 토큰 교환 API 오류 상세:', {
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : null,
      type: typeof error,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
        success: false 
      },
      { status: 500 }
    );
  }
}
