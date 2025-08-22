import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

    // 사용자 정보를 쿠키에 임시 저장 (보안상 JWT 토큰 사용 권장)
    const cookieStore = cookies();
    cookieStore.set('kakao_user_data', JSON.stringify({
      id: userData.id,
      email: userData.kakao_account?.email,
      nickname: userData.properties?.nickname,
      profile_image: userData.properties?.profile_image,
      access_token: access_token,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24시간
    });

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/auth/kakao/success', request.url));

  } catch (error) {
    console.error('카카오 로그인 콜백 처리 중 오류:', error);
    return NextResponse.redirect(new URL('/auth?error=callback_processing_failed', request.url));
  }
}
