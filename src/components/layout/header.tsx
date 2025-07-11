'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Home, 
  MessageSquare, 
  Gamepad2, 
  Trophy, 
  User as UserIcon, 
  LogIn, 
  LogOut, 
  UserPlus, 
  Settings,
  Menu,
  Bell,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/providers/AuthProvider';
import { useExperience } from '@/providers/experience-provider';
import { User } from '@/types';

// 메뉴 아이템 정의 (PRD 요구사항에 맞게 수정)
const menuItems = [
  { name: '홈', path: '/', icon: <Home className="h-5 w-5" />, ariaLabel: '홈 페이지로 이동' },
  { name: '커뮤니티', path: '/community', icon: <MessageSquare className="h-5 w-5" />, ariaLabel: '커뮤니티 페이지로 이동' },
  { name: '미니게임', path: '/games', icon: <Gamepad2 className="h-5 w-5" />, ariaLabel: '미니게임 페이지로 이동' },
  { name: '랭킹', path: '/ranking', icon: <Trophy className="h-5 w-5" />, ariaLabel: '랭킹 페이지로 이동' },
];

// 경험치/레벨 컴포넌트 - 실시간 업데이트 지원
function ExperienceDisplay({ user }: { user?: User }) {
  const { userStats } = useExperience();
  
  if (!user && !userStats) return null;

  // 실시간 stats 우선 사용, 없으면 user 데이터 사용
  const level = userStats?.level || user?.stats?.level || 1;
  const currentExp = userStats?.currentExp || user?.stats?.currentExp || 0;
  const currentLevelRequiredXp = userStats?.currentLevelRequiredXp || user?.stats?.currentLevelRequiredXp || (level * 10);
  
  const xpPercentage = Math.min((currentExp / currentLevelRequiredXp) * 100, 100);

  return (
    <div className="flex items-center gap-2" aria-label={`레벨 ${level}, 경험치 ${currentExp}/${currentLevelRequiredXp}`}>
      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
        Lv.{level}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(xpPercentage, 3)}%` }}
            aria-label={`경험치 진행률 ${xpPercentage.toFixed(1)}%`}
          />
        </div>
        <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
          {currentExp}/{currentLevelRequiredXp}
        </span>
      </div>
    </div>
  );
}

// 에러 표시 컴포넌트
function ErrorAlert({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 pr-12 relative">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100"
          onClick={onDismiss}
          aria-label="오류 메시지 닫기"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}

export function Header() {
  const { user, signOut, isLoading, error, resetError } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // 사용자 프로필 경로 설정 
  const profilePath = user?.profile?.userName ? `/${user.profile.userName}` : '/my';
  const myMenuItem = { 
    name: '마이페이지', 
    path: profilePath, 
    icon: <UserIcon className="h-5 w-5" />, 
    ariaLabel: '마이페이지로 이동' 
  };
  
  // 전체 메뉴 아이템 (기본 메뉴 + 프로필 메뉴)
  const allMenuItems = [...menuItems, myMenuItem];

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 로그아웃 처리 (에러 처리 개선)
  const handleSignOut = async () => {
    if (isSigningOut) return; // 중복 실행 방지
    
    try {
      setIsSigningOut(true);
      resetError?.(); // 기존 에러 초기화
      await signOut();
      router.push('/'); // 홈페이지로 리디렉션
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 에러는 AuthProvider에서 관리되므로 여기서는 추가 처리 불필요
    } finally {
      setIsSigningOut(false);
    }
  };

  // 키보드 네비게이션 지원
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  // 모바일 메뉴 닫기
  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // 에러 처리
  const handleErrorDismiss = () => {
    resetError?.();
  };

  return (
    <>
      {/* 에러 표시 */}
      {error && <ErrorAlert error={error} onDismiss={handleErrorDismiss} />}

      {/* 데스크탑 헤더 */}
      <header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md h-16' : 'bg-white/90 backdrop-blur-md h-16'
        }`}
        role="banner"
      >
        <div className="container h-full mx-auto flex items-center justify-between px-4">
          {/* 로고 */}
          <Link 
            href="/" 
            className="flex items-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-pastel-green-400 focus:ring-offset-2 rounded-md"
            aria-label="인스쿨즈 홈페이지로 이동"
          >
            <span className="text-xl font-bold text-pastel-green-600 font-jammin">
              InSchoolz
            </span>
          </Link>

          {/* 데스크탑 네비게이션 - 중간 사이즈 이상에서만 표시 */}
          <nav className="hidden md:flex items-center space-x-1" role="navigation" aria-label="주 메뉴">
            {allMenuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={pathname === item.path ? "default" : "ghost"}
                  className={`flex items-center gap-1 px-3 transition-colors ${
                    pathname === item.path 
                      ? 'bg-pastel-green-300 text-pastel-green-800 hover:bg-pastel-green-400' 
                      : 'hover:bg-pastel-green-100 hover:text-pastel-green-700'
                  }`}
                  aria-label={item.ariaLabel}
                  aria-current={pathname === item.path ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* 헤더 오른쪽 - 경험치, 알림, 프로필 */}
          <div className="flex items-center gap-3">
            {/* 경험치/레벨 표시 - 로그인 시에만 표시 */}
            {user && (
              <div className="hidden md:block">
                <ExperienceDisplay user={user} />
              </div>
            )}

            {/* 알림 버튼 - 로그인 시에만 표시 */}
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-pastel-green-100 focus:ring-2 focus:ring-pastel-green-400"
                aria-label="알림 확인"
                disabled={isLoading}
              >
                <Bell className="h-5 w-5 text-pastel-green-600" />
                <span 
                  className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                  aria-label="새 알림 있음"
                ></span>
              </Button>
            )}

            {/* 모바일 메뉴 트리거 - md 미만에서만 표시 */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-pastel-green-100"
                  aria-label="모바일 메뉴 열기"
                  disabled={isLoading}
                >
                  <Menu className="h-5 w-5 text-pastel-green-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader className="mb-4">
                  <SheetTitle>메뉴</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-1" role="navigation" aria-label="모바일 메뉴">
                  {user && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-pastel-green-50 to-pastel-green-100 rounded-lg border border-pastel-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={user.profile?.profileImageUrl} 
                            alt={user.profile?.userName || '사용자'} 
                          />
                          <AvatarFallback className="bg-pastel-green-200 text-pastel-green-800 text-lg">
                            {user.profile?.userName?.substring(0, 2) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-pastel-green-800 truncate">
                            {user.profile?.userName || '사용자'}님
                          </p>
                          <p className="text-xs text-pastel-green-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <ExperienceDisplay user={user} />
                    </div>
                  )}
                  {allMenuItems.map((item) => (
                    <Link key={item.path} href={item.path} onClick={handleMobileMenuClose}>
                      <Button
                        variant={pathname === item.path ? "default" : "ghost"}
                        className={`w-full justify-start ${
                          pathname === item.path 
                            ? 'bg-pastel-green-300 text-pastel-green-800' 
                            : 'hover:bg-pastel-green-100'
                        }`}
                        aria-label={item.ariaLabel}
                      >
                        {item.icon}
                        <span className="ml-2">{item.name}</span>
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* 프로필 아이콘 & 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-pastel-green-100 focus:ring-2 focus:ring-pastel-green-400 p-1"
                  aria-label="사용자 메뉴 열기"
                  aria-haspopup="true"
                  disabled={isLoading}
                >
                  {user ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.profile?.profileImageUrl} 
                        alt={user.profile?.userName || '사용자'} 
                      />
                      <AvatarFallback className="bg-pastel-green-100 text-pastel-green-700 text-sm">
                        {user.profile?.userName?.substring(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <UserIcon className="h-5 w-5 text-pastel-green-600" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user.profile?.profileImageUrl} 
                          alt={user.profile?.userName || '사용자'} 
                        />
                        <AvatarFallback className="bg-pastel-green-100 text-pastel-green-700 text-sm">
                          {user.profile?.userName?.substring(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.profile?.userName || '사용자'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={profilePath} className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>내 프로필</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>설정</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className={`cursor-pointer ${isSigningOut ? 'opacity-50' : ''}`}
                      onClick={handleSignOut}
                      onKeyDown={(e) => handleKeyDown(e, handleSignOut)}
                      disabled={isSigningOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isSigningOut ? '로그아웃 중...' : '로그아웃'}</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth?tab=login" className="cursor-pointer">
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>로그인</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth?tab=signup" className="cursor-pointer">
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>회원가입</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* 모바일 하단 네비게이션 - md 미만에서만 표시 */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-pastel-green-200"
        role="navigation"
        aria-label="하단 네비게이션"
      >
        <div className="flex justify-around items-center h-16">
          {allMenuItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path} 
              className="flex-1"
              aria-label={item.ariaLabel}
            >
              <div 
                className={`flex flex-col items-center justify-center py-2 transition-colors ${
                  pathname === item.path 
                    ? 'text-pastel-green-600' 
                    : 'text-gray-500 hover:text-pastel-green-500'
                }`}
                role="button"
                tabIndex={0}
                aria-current={pathname === item.path ? 'page' : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
              >
                {item.icon}
                <span className="text-xs mt-1 font-medium">{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* 헤더와 하단 네비게이션을 위한 여백 */}
      <div className="h-16" aria-hidden="true" /> {/* 헤더 높이만큼 상단 여백 */}
      <div className="md:hidden h-16" aria-hidden="true" /> {/* 모바일에서 하단 네비게이션 높이만큼 하단 여백 */}
    </>
  );
} 