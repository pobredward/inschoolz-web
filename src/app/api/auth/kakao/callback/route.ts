/**
 * 카카오 로그인 콜백 API 라우트
 * 카카오에서 전달받은 인가 코드를 처리하여 액세스 토큰을 발급받습니다.
 */

import { NextRequest, NextResponse } from 'next/server';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  refresh_token_expires_in: number;
}

interface KakaoErrorResponse {
  error: string;
  error_description: string;
  error_code?: string;
}

/**
 * 카카오 OAuth 토큰 요청
 */
async function getKakaoAccessToken(code: string, requestUrl: string): Promise<KakaoTokenResponse> {
  const tokenEndpoint = 'https://kauth.kakao.com/oauth/token';
  
  // 리다이렉트 URI 결정 (환경 변수 또는 현재 도메인 기반)
  let redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  if (!redirectUri) {
    const url = new URL(requestUrl);
    redirectUri = `${url.origin}/api/auth/kakao/callback`;
  }
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.NEXT_PUBLIC_KAKAO_APP_KEY!,
    redirect_uri: redirectUri,
    code,
  });

  console.log('[KAKAO] 토큰 요청 파라미터:', {
    grant_type: 'authorization_code',
    client_id: process.env.NEXT_PUBLIC_KAKAO_APP_KEY,
    redirect_uri: redirectUri,
    code: code.substring(0, 10) + '...',
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[KAKAO] 토큰 요청 실패:', data);
      throw new Error(`카카오 토큰 요청 실패: ${data.error_description || data.error}`);
    }

    console.log('[KAKAO] 토큰 요청 성공');
    return data as KakaoTokenResponse;
  } catch (error) {
    console.error('[KAKAO] 토큰 요청 중 오류:', error);
    throw error;
  }
}

/**
 * GET /api/auth/kakao/callback
 * 카카오 로그인 콜백 처리
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('[KAKAO] 콜백 요청 받음:', { 
      code: code?.substring(0, 10) + '...', 
      error, 
      state 
    });

    // 에러 처리
    if (error) {
      console.error('[KAKAO] 카카오 로그인 에러:', error);
      const errorMessage = searchParams.get('error_description') || '카카오 로그인 중 오류가 발생했습니다.';
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    // 인가 코드 확인
    if (!code) {
      console.error('[KAKAO] 인가 코드가 없습니다.');
      return NextResponse.redirect(
        new URL('/auth?error=카카오 인가 코드를 받을 수 없습니다.', request.url)
      );
    }

    // 액세스 토큰 요청
    const tokenData = await getKakaoAccessToken(code, request.url);

    // 프론트엔드로 리다이렉트 (액세스 토큰을 쿼리 파라미터로 전달)
    // 보안상 실제 환경에서는 세션이나 HTTP-only 쿠키 사용 권장
    const redirectUrl = new URL('/auth/kakao/success', request.url);
    redirectUrl.searchParams.set('access_token', tokenData.access_token);
    
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    console.log('[KAKAO] 성공적으로 처리됨, 리다이렉트:', redirectUrl.pathname);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('[KAKAO] 콜백 처리 중 오류:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '카카오 로그인 처리 중 오류가 발생했습니다.';
    
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
