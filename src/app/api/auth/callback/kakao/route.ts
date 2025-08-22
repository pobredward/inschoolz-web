import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { doc, setDoc, updateDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { createKakaoFirebaseToken } from '@/lib/auth/kakao-firebase';

/**
 * 환경에 따른 카카오 Redirect URI 반환
 */
const getKakaoRedirectUri = (): string => {
  // 개발 환경에서는 localhost 사용
  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:3000/api/auth/callback/kakao';
  }
  
  // 프로덕션에서는 환경 변수 사용
  return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'https://inschoolz.com/api/auth/callback/kakao';
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // 에러가 있는 경우 처리
    if (error) {
      console.error('카카오 로그인 에러:', error);
      return NextResponse.redirect(new URL('/auth?error=kakao_auth_failed', request.url));
    }

    // 인가 코드가 없는 경우
    if (!code) {
      console.error('카카오 인가 코드가 없습니다.');
      return NextResponse.redirect(new URL('/auth?error=no_auth_code', request.url));
    }

    // 환경에 따른 redirect_uri 설정
    const redirectUri = getKakaoRedirectUri();

    console.log('카카오 토큰 요청 설정:', {
      environment: process.env.NODE_ENV,
      redirectUri,
      code: code?.substring(0, 10) + '...'
    });

    // 카카오 액세스 토큰 요청
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_KAKAO_APP_KEY!,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('카카오 토큰 요청 실패:', tokenResponse.statusText);
      return NextResponse.redirect(new URL('/auth?error=token_request_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // 카카오 사용자 정보 요청
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!userResponse.ok) {
      console.error('카카오 사용자 정보 요청 실패:', userResponse.statusText);
      return NextResponse.redirect(new URL('/auth?error=user_info_failed', request.url));
    }

    const userData = await userResponse.json();
    console.log('카카오 사용자 정보:', userData);

    // 카카오 사용자 정보로 Firestore에 사용자 생성/업데이트
    const kakaoUserId = userData.id.toString();
    const email = userData.kakao_account?.email || '';
    const nickname = userData.properties?.nickname || `카카오사용자${userData.id}`;
    const profileImage = userData.properties?.profile_image || '';

    try {
      // 기존 카카오 사용자 확인
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('kakaoId', '==', kakaoUserId));
      const querySnapshot = await getDocs(q);

      let user: User;
      let userId: string;

      if (!querySnapshot.empty) {
        // 기존 사용자 업데이트
        const userDoc = querySnapshot.docs[0];
        userId = userDoc.id;
        user = userDoc.data() as User;

        // 마지막 로그인 시간 업데이트
        await updateDoc(doc(db, 'users', userId), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          'profile.profileImageUrl': profileImage // 프로필 이미지 업데이트
        });

        console.log('기존 카카오 사용자 로그인:', { userId, userName: user.profile?.userName });
      } else {
        // 새 사용자 생성
        userId = `kakao_${kakaoUserId}`;
        
        user = {
          uid: userId,
          email: email,
          kakaoId: kakaoUserId,
          profile: {
            userName: nickname,
            realName: '',
            gender: '',
            birthYear: 0,
            birthMonth: 0,
            birthDay: 0,
            phoneNumber: '',
            profileImageUrl: profileImage,
            createdAt: Timestamp.now(),
            isAdmin: false
          },
          role: 'student',
          isVerified: false,
          stats: {
            level: 1,
            currentExp: 0,
            totalExperience: 0,
            currentLevelRequiredXp: 10,
            postCount: 0,
            commentCount: 0,
            likeCount: 0,
            streak: 0
          },
          agreements: {
            terms: true, // 카카오 로그인 시 기본 동의로 처리
            privacy: true,
            location: false,
            marketing: false
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        };

        // Firestore에 사용자 정보 저장
        await setDoc(doc(db, 'users', userId), user);
        
        console.log('새 카카오 사용자 생성:', { userId, userName: nickname });
      }

      console.log('카카오 로그인 DB 처리 완료:', { userId, isNewUser: querySnapshot.empty });

      // Firebase Auth 커스텀 토큰 생성
      let firebaseCustomToken: string | null = null;
      try {
        console.log('🔥 Firebase 커스텀 토큰 생성 시도 중...', { kakaoUserId, email, nickname });
        firebaseCustomToken = await createKakaoFirebaseToken(kakaoUserId, {
          email: email,
          nickname: nickname,
          profileImage: profileImage,
        });
        console.log('✅ Firebase 커스텀 토큰 생성 완료:', { tokenLength: firebaseCustomToken?.length });
      } catch (firebaseError) {
        console.error('❌ Firebase 커스텀 토큰 생성 실패:', firebaseError);
        console.error('Firebase 오류 상세:', JSON.stringify(firebaseError, null, 2));
        // Firebase Auth 실패해도 Firestore 로그인은 유지 (선택적)
      }

      // 사용자 정보를 쿠키에 저장 (성공 페이지에서 사용)
      const cookieStore = await cookies();
      cookieStore.set('kakao_user_data', JSON.stringify({
        id: userData.id,
        email: email,
        nickname: nickname,
        profile_image: profileImage,
        access_token: access_token,
        userId: userId, // DB에 저장된 사용자 ID 추가
        firebaseCustomToken: firebaseCustomToken, // Firebase 커스텀 토큰 추가
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24시간
      });

    } catch (dbError) {
      console.error('카카오 로그인 DB 처리 오류:', dbError);
      return NextResponse.redirect(new URL('/auth?error=db_processing_failed', request.url));
    }

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/auth/kakao/success', request.url));

  } catch (error) {
    console.error('카카오 로그인 콜백 처리 중 오류:', error);
    return NextResponse.redirect(new URL('/auth?error=callback_processing_failed', request.url));
  }
}
