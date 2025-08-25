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
  '/youth-protection',
  '/help',
  '/support',
  '/community', // 커뮤니티 메인 페이지는 공개 접근 허용
  '/ranking', // 랭킹 페이지는 공개 접근 허용 (전국 랭킹은 누구나 볼 수 있음)
  '/games', // 게임 메인 페이지는 공개 접근 허용 (게임 목록은 누구나 볼 수 있음)
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
  
  // 클라이언트 측 인증 쿠키 확인 (상세 디버깅)
  const authCookie = request.cookies.get('authToken');
  const uidCookie = request.cookies.get('uid');
  const userRoleCookie = request.cookies.get('userRole');
  
  // 프로덕션 환경에서 상세 쿠키 디버깅
  console.log(`🔐 Middleware: ${path} - 쿠키 상태 확인:`, {
    authToken: authCookie ? `있음 (${authCookie.value?.substring(0, 20)}...)` : '없음',
    uid: uidCookie ? `있음 (${uidCookie.value})` : '없음',
    userRole: userRoleCookie ? `있음 (${userRoleCookie.value})` : '없음',
    allCookies: request.cookies.getAll().map(c => c.name).join(', '),
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    referer: request.headers.get('referer')
  });
  
  // 인증 토큰이 없는 경우 로그인 페이지로 리디렉션
  if (!authCookie) {
    console.log(`🚫 Middleware: ${path} -> /login 리다이렉트 (인증 필요)`);
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