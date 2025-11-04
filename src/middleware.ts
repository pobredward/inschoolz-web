import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증이 필요 없는 공개 경로 목록
const publicRoutes = [
  '/auth',
  '/auth/reset-password',
  '/login',
  '/signup',
  '/',
  '/about',
  '/terms',
  '/privacy',
  '/sitemap.xml',
  '/robots.txt',
  '/ads.txt',
  '/app-ads.txt',
  '/youth-protection',
  '/help',
  '/support',
  '/community', // 커뮤니티 메인 페이지는 공개 접근 허용
  '/ranking', // 랭킹 페이지는 공개 접근 허용 (전국 랭킹은 누구나 볼 수 있음)
  '/games', // 게임 메인 페이지는 공개 접근 허용 (게임 목록은 누구나 볼 수 있음)
  '/my', // 마이페이지도 일단 공개 경로로 설정 (클라이언트에서 인증 처리)
  '/app', // 앱 다운로드 리다이렉트 페이지 (프리미엄 버전)
  '/download', // 앱 다운로드 리다이렉트 페이지 (스탠다드 버전)
  '/get', // 앱 다운로드 리다이렉트 페이지 (미니멀 버전)
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  console.log(`🚀 Middleware: ${path} - 요청 시작`);
  
  // 레거시 로그인/회원가입 쿼리 파라미터 처리
  if (path === '/auth') {
    const tab = request.nextUrl.searchParams.get('tab');
    const redirect = request.nextUrl.searchParams.get('redirect');
    
    if (tab === 'signup') {
      const redirectUrl = redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup';
      console.log(`🔄 Middleware: ${path}?tab=signup -> ${redirectUrl} 리다이렉트`);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } else {
      // tab=login 또는 tab이 없는 경우 모두 로그인으로
      const redirectUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
      console.log(`🔄 Middleware: ${path} -> ${redirectUrl} 리다이렉트`);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }
  
  // SEO용 커뮤니티 게시글 경로는 공개 접근 허용
  if (path.match(/^\/community\/(national|school|region)\/.*\/[a-zA-Z0-9]+$/)) {
    console.log(`✅ Middleware: ${path} - SEO 커뮤니티 경로 허용`);
    return NextResponse.next();
  }
  
  // 인증이 필요 없는 경로는 통과
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(`${route}/`));
  if (isPublicRoute) {
    console.log(`✅ Middleware: ${path} - 공개 경로 허용`);
    return NextResponse.next();
  }
  
  // 클라이언트 측 인증 쿠키 확인
  const authCookie = request.cookies.get('authToken');
  const uidCookie = request.cookies.get('uid');
  const userIdCookie = request.cookies.get('userId'); // 백업 쿠키
  
  console.log(`🔐 Middleware: ${path} - 인증 쿠키 확인: authToken=${authCookie ? '있음' : '없음'}, uid=${uidCookie ? '있음' : '없음'}, userId=${userIdCookie ? '있음' : '없음'}`);
  
  // 프로덕션 환경에서 쿠키 동기화 문제를 고려한 더 관대한 검증
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 인증 토큰이 없는 경우 로그인 페이지로 리디렉션
  // uid 또는 userId 쿠키 중 하나라도 있으면 허용 (백업 로직)
  const hasValidUidCookie = uidCookie || userIdCookie;
  
  if (!authCookie || !hasValidUidCookie) {
    // 프로덕션 환경에서는 한 번 더 관대하게 처리 (쿠키 동기화 지연 고려)
    if (isProduction && !authCookie && hasValidUidCookie) {
      console.log(`⚠️ Middleware: ${path} - authToken 없지만 uid 쿠키 있음, 프로덕션 환경이므로 일시적 허용`);
      // 임시로 통과시키되, 클라이언트에서 다시 인증 확인하도록 헤더 추가
      const response = NextResponse.next();
      response.headers.set('X-Auth-Warning', 'missing-auth-token');
      return response;
    }
    
    console.log(`🚫 Middleware: ${path} -> /login 리다이렉트 (인증 필요 - authToken: ${!!authCookie}, uid: ${!!uidCookie}, userId: ${!!userIdCookie})`);
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url));
  }
  
  // 쿠키 값 검증 (빈 값 체크) - 백업 쿠키도 확인
  const authTokenValue = authCookie?.value?.trim();
  const uidValue = uidCookie?.value?.trim() || userIdCookie?.value?.trim();
  
  if (!authTokenValue || !uidValue) {
    console.log(`🚫 Middleware: ${path} -> /login 리다이렉트 (빈 쿠키 값)`);
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url));
  }
  
  // 관리자 페이지 접근 제한 (관리자 역할 확인)
  if (path.startsWith('/admin')) {
    const userRoleCookie = request.cookies.get('userRole');
    const userRole = userRoleCookie?.value;
    
    console.log(`👤 Middleware: ${path} - 사용자 role: ${userRole || '없음'}`);
    
    // 관리자가 아닌 경우 홈페이지로 리디렉션
    if (userRole !== 'admin') {
      console.log(`🚫 Middleware: ${path} -> / 리다이렉트 (관리자 아님, role: ${userRole})`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    console.log(`✅ Middleware: ${path} - 관리자 접근 허용`);
  }
  
  console.log(`✅ Middleware: ${path} - 통과`);
  return NextResponse.next();
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    /*
     * 다음은 미들웨어가 적용되는 경로 패턴:
     * - 모든 경로에 적용됨
     * - _next, api, public 등은 제외
     */
    '/((?!_next/|api/|favicon.ico).*)',
  ],
}; 