import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증이 필요 없는 공개 경로 목록
const publicRoutes = [
  '/auth',
  '/auth/reset-password',
  '/',
  '/about',
  '/terms',
  '/privacy',
  '/sitemap.xml',
  '/robots.txt',
  '/youth-protection',
  '/help',
  '/support',
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 기존 /login 및 /signup 경로를 /auth로 리디렉션
  if (path === '/login') {
    return NextResponse.redirect(new URL('/auth?tab=login', request.url));
  }
  
  if (path === '/signup') {
    return NextResponse.redirect(new URL('/auth?tab=signup', request.url));
  }
  
  // SEO용 커뮤니티 게시글 경로는 공개 접근 허용
  if (path.match(/^\/community\/(national|school|region)\/.*\/[a-zA-Z0-9]+$/)) {
    return NextResponse.next();
  }
  
  // 인증이 필요 없는 경로는 통과
  if (publicRoutes.some(route => path === route || path.startsWith(`${route}/`))) {
    return NextResponse.next();
  }
  
  // 클라이언트 측 인증 쿠키 확인
  const authCookie = request.cookies.get('authToken');
  
  // 인증 토큰이 없는 경우 로그인 페이지로 리디렉션
  if (!authCookie) {
    return NextResponse.redirect(new URL('/auth?tab=login', request.url));
  }
  
  // 관리자 페이지 접근 제한 (관리자 역할 확인)
  if (path.startsWith('/admin')) {
    const userRoleCookie = request.cookies.get('userRole');
    
    // 관리자가 아닌 경우 홈페이지로 리디렉션
    if (userRoleCookie?.value !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
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