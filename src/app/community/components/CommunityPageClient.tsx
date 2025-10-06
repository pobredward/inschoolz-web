'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, School as SchoolIcon, TrendingUp } from 'lucide-react';
import { Board, BoardType } from '@/types/board';
import { Post } from '@/types';
import { School } from '@/types';
import { 
  getBoardsByType, 
  getPostsByBoardType, 
  getAllPostsByTypeWithPagination,
  getAllPostsBySchoolWithPagination,
  getAllPostsByRegionWithPagination
} from '@/lib/api/board';
import { getBlockedUserIds } from '@/lib/api/users';
import { getPopularSchools, getSchoolById } from '@/lib/api/schools';
import { BlockedUserContent } from '@/components/ui/blocked-user-content';
import BoardSelector from '@/components/board/BoardSelector';
import SchoolSelector from '@/components/board/SchoolSelector';
import { generatePreviewContent } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import PostListItem from '@/components/board/PostListItem';
import CommunityPagination, { PaginationInfo } from '@/components/ui/community-pagination';
import { RegionSetupModal } from '@/components/community/RegionSetupModal';
import { SchoolSetupModal } from '@/components/community/SchoolSetupModal';
// 광고 제거: 리워디드 광고만 사용

interface CommunityPost extends Post {
  boardName: string;
  previewContent: string;
}

type SortOption = 'latest' | 'popular' | 'views' | 'comments';

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'views', label: '조회순' },
  { value: 'comments', label: '댓글순' }
];

export default function CommunityPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, suspensionStatus, isLoading: authLoading } = useAuth();
  
  // 사용자 상태 디버깅
  useEffect(() => {
    console.log('=== 사용자 상태 변경 감지 ===');
    console.log('user:', user);
    console.log('user type:', typeof user);
    console.log('user === null:', user === null);
    console.log('user === undefined:', user === undefined);
  }, [user]);
  
  const [selectedTab, setSelectedTab] = useState<BoardType>('national');
  const [boards, setBoards] = useState<Board[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [showRegionSetupModal, setShowRegionSetupModal] = useState(false);
  const [showSchoolSetupModal, setShowSchoolSetupModal] = useState(false);
  const [currentSchoolId, setCurrentSchoolId] = useState<string | undefined>(undefined);
  const [currentSchoolInfo, setCurrentSchoolInfo] = useState<School | null>(null);
  const [popularSchools, setPopularSchools] = useState<School[]>([]);
  const [popularSchoolsLoading, setPopularSchoolsLoading] = useState(false);
  
  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10); // 기본적으로 10개씩

  // showBoardSelector 상태 변화 감지
  useEffect(() => {
    console.log('showBoardSelector changed to:', showBoardSelector);
  }, [showBoardSelector]);

  // 현재 학교 정보 로드
  const loadCurrentSchoolInfo = async (schoolId: string) => {
    try {
      console.log('현재 학교 정보 로드:', schoolId);
      const school = await getSchoolById(schoolId);
      if (school) {
        setCurrentSchoolInfo(school);
        console.log('현재 학교 정보 로드 완료:', school.name);
      } else {
        console.log('학교 정보를 찾을 수 없음:', schoolId);
        setCurrentSchoolInfo(null);
      }
    } catch (error) {
      console.error('현재 학교 정보 로드 실패:', error);
      setCurrentSchoolInfo(null);
    }
  };

  // 인기 학교 목록 로드
  const loadPopularSchools = async () => {
    try {
      setPopularSchoolsLoading(true);
      const schools = await getPopularSchools(12); // 12개 학교 로드
      setPopularSchools(schools);
    } catch (error) {
      console.error('인기 학교 목록 로드 실패:', error);
    } finally {
      setPopularSchoolsLoading(false);
    }
  };

  // currentSchoolId 변경 시 학교 정보 로드
  useEffect(() => {
    if (currentSchoolId) {
      loadCurrentSchoolInfo(currentSchoolId);
    } else {
      setCurrentSchoolInfo(null);
    }
  }, [currentSchoolId]);

  // URL 변경 감지하여 학교 ID 업데이트 (초기 로드 포함)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    console.log('URL 변경 감지 - tab:', tabFromUrl);
    
    if (tabFromUrl && tabFromUrl.startsWith('school/')) {
      const schoolId = tabFromUrl.split('/')[1];
      console.log('URL에서 추출한 학교 ID:', schoolId);
      
      if (schoolId) {
        // 현재 상태와 다른 경우에만 업데이트
        if (schoolId !== currentSchoolId) {
          console.log('학교 ID 업데이트:', currentSchoolId, '->', schoolId);
          setCurrentSchoolId(schoolId);
          sessionStorage.setItem('community-selected-school', schoolId);
        }
        
        // 학교 탭이 아닌 경우 학교 탭으로 변경
        if (selectedTab !== 'school') {
          console.log('탭을 school로 변경');
          setSelectedTab('school');
        }
      }
    } else if (tabFromUrl === 'school') {
      // /community?tab=school (학교 ID 없음) - 인기 학교 목록 표시
      console.log('학교 탭이지만 특정 학교 ID 없음 - 인기 학교 목록 표시');
      setCurrentSchoolId(undefined);
      sessionStorage.removeItem('community-selected-school');
      
      if (selectedTab !== 'school') {
        setSelectedTab('school');
      }
    }
  }, [searchParams]);

  // 학교 탭에서 로그인하지 않은 사용자를 위한 인기 학교 로드
  useEffect(() => {
    if (selectedTab === 'school' && !user && !authLoading && !currentSchoolId && popularSchools.length === 0) {
      console.log('인기 학교 목록 로드 조건 충족');
      loadPopularSchools();
    }
  }, [selectedTab, user, authLoading, currentSchoolId, popularSchools.length]);

  // 페이지 로드 시 URL 파라미터와 세션에서 탭 상태 복원 (최초 로드만)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const savedTab = sessionStorage.getItem('community-selected-tab');
    
    let initialTab: BoardType = 'national';
    
    console.log('초기화 - tabFromUrl:', tabFromUrl, 'savedTab:', savedTab);
    
    // 새로운 라우팅 구조 파싱
    if (tabFromUrl) {
      // tab=school/schoolId 또는 tab=regional/sido/sigungu 형태
      const tabParts = tabFromUrl.split('/');
      const baseTab = tabParts[0];
      
      if (['school', 'regional', 'national'].includes(baseTab)) {
        initialTab = baseTab as BoardType;
      }
    } else if (savedTab && ['school', 'regional', 'national'].includes(savedTab)) {
      initialTab = savedTab as BoardType;
    }
    
    // 탭이 변경된 경우에만 업데이트
    if (selectedTab !== initialTab) {
      console.log('탭 초기화:', selectedTab, '->', initialTab);
      setSelectedTab(initialTab);
    }
    
    // URL 파라미터 업데이트 (히스토리에 추가하지 않음)
    if (!tabFromUrl || (!tabFromUrl.startsWith(initialTab) && initialTab === 'national')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', initialTab);
      window.history.replaceState({}, '', newUrl.toString());
    }
    
    // 초기 로드 완료 표시
    setIsInitialLoading(false);
  }, []); // 최초 로드 시에만 실행

  // 탭 변경 핸들러
  const handleTabChange = async (newTab: BoardType) => {
    console.log('=== handleTabChange 시작 ===');
    console.log('새로운 탭:', newTab);
    console.log('현재 user 상태:', user);
    console.log('user === null:', user === null);
    console.log('user?.uid:', user?.uid);
    console.log('user?.regions:', user?.regions);
    
    setSelectedTab(newTab);
    // 페이지네이션 리셋
    setCurrentPage(1);
    setSelectedBoard('all');
    
    // 세션 스토리지와 URL 파라미터 모두 업데이트
    sessionStorage.setItem('community-selected-tab', newTab);
    
    // 새로운 라우팅 구조로 리다이렉트
    if (newTab === 'school') {
      // 유저 정보가 로딩 중인 경우
      if (user === null) {
        // 로딩 중이면 일단 기본 URL로 이동 (자동 리다이렉트가 처리함)
        console.log('User loading, setting basic school tab...');
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tab', 'school');
        window.history.replaceState({}, '', newUrl.toString());
        return;
      }
      
      // 로그인되지 않은 경우
      if (!user?.uid) {
        console.log('Not logged in, staying on page to show login prompt');
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tab', 'school');
        window.history.replaceState({}, '', newUrl.toString());
        return;
      }
      
      // 로그인된 사용자가 있으면 users 컬렉션에서 최신 정보 가져오기
      try {
        console.log('Fetching latest user info from users collection...');
        const { getUserById } = await import('@/lib/api/users');
        const latestUser = await getUserById(user.uid);
        
        if (latestUser?.school?.id) {
          console.log('Redirecting to school:', latestUser.school.id);
          router.push(`/community?tab=school/${latestUser.school.id}`);
        } else {
          // 로그인은 되어 있지만 학교 정보가 없는 경우
          console.log('No school info in users collection, showing school setup modal');
          setShowSchoolSetupModal(true);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        // API 호출 실패 시 기존 user 정보로 fallback
        if (user?.school?.id) {
          console.log('Fallback to cached school:', user.school.id);
          router.push(`/community?tab=school/${user.school.id}`);
        } else {
          console.log('No cached school info, showing school setup modal');
          setShowSchoolSetupModal(true);
        }
      }
    } else if (newTab === 'regional') {
      console.log('=== 지역 탭 선택됨 ===');
      // 유저 정보가 로딩 중인 경우
      if (user === null) {
        // 로딩 중이면 일단 기본 URL로 이동 (자동 리다이렉트가 처리함)
        console.log('User loading, setting basic regional tab...');
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tab', 'regional');
        window.history.replaceState({}, '', newUrl.toString());
        return;
      }
      
      // 로그인되지 않은 경우
      if (!user?.uid) {
        console.log('Not logged in, staying on page to show login prompt');
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tab', 'regional');
        window.history.replaceState({}, '', newUrl.toString());
        return;
      }
      
      // 로그인된 사용자가 있으면 users 컬렉션에서 최신 정보 가져오기
      try {
        console.log('Fetching latest user info from users collection...');
        const { getUserById } = await import('@/lib/api/users');
        const latestUser = await getUserById(user.uid);
        console.log('가져온 사용자 정보:', latestUser);
        console.log('지역 정보:', latestUser?.regions);
        
        if (latestUser?.regions?.sido && latestUser?.regions?.sigungu) {
          console.log('Redirecting to region:', latestUser.regions.sido, latestUser.regions.sigungu);
          router.push(`/community?tab=regional/${encodeURIComponent(latestUser.regions.sido)}/${encodeURIComponent(latestUser.regions.sigungu)}`);
        } else {
          // 로그인은 되어 있지만 지역 정보가 없는 경우
          console.log('No region info in users collection, showing region setup modal');
          setShowRegionSetupModal(true);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        // API 호출 실패 시 기존 user 정보로 fallback
        if (user?.regions?.sido && user?.regions?.sigungu) {
          console.log('Fallback to cached region:', user.regions.sido, user.regions.sigungu);
          router.push(`/community?tab=regional/${encodeURIComponent(user.regions.sido)}/${encodeURIComponent(user.regions.sigungu)}`);
        } else {
          console.log('No cached region info, showing region setup modal');
          setShowRegionSetupModal(true);
        }
      }
    } else {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', newUrl.toString());
    }
  };

  // 사용자 정보 로딩 후 자동 리다이렉트 처리
  useEffect(() => {
    const handleAutoRedirect = async () => {
      if (user !== null && user?.uid) { // 사용자 정보가 로딩 완료되고 로그인된 경우
        const tabFromUrl = searchParams.get('tab');
        
        try {
          // users 컬렉션에서 최신 정보 가져오기
          const { getUserById } = await import('@/lib/api/users');
          const latestUser = await getUserById(user.uid);
          
          if (selectedTab === 'school') {
            // URL이 단순히 'school'인 경우 자동 리다이렉트
            if (tabFromUrl === 'school') {
              if (latestUser?.school?.id) {
                console.log('Auto-redirecting to school with ID:', latestUser.school.id);
                router.push(`/community?tab=school/${latestUser.school.id}`);
              } else {
                // 학교 정보가 없으면 모달 표시
                console.log('No school info in users collection, showing school setup modal');
                setShowSchoolSetupModal(true);
              }
            }
          } else if (selectedTab === 'regional') {
            // URL이 단순히 'regional'인 경우 자동 리다이렉트
            if (tabFromUrl === 'regional') {
              if (latestUser?.regions?.sido && latestUser?.regions?.sigungu) {
                console.log('Auto-redirecting to region:', latestUser.regions.sido, latestUser.regions.sigungu);
                router.push(`/community?tab=regional/${encodeURIComponent(latestUser.regions.sido)}/${encodeURIComponent(latestUser.regions.sigungu)}`);
              } else {
                // 지역 정보가 없으면 모달 표시
                console.log('No region info in users collection, showing region setup modal');
                setShowRegionSetupModal(true);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch user info for auto-redirect:', error);
          // API 호출 실패 시 기존 user 정보로 fallback
          if (selectedTab === 'school' && tabFromUrl === 'school') {
            if (user?.school?.id) {
              console.log('Fallback auto-redirect to cached school:', user.school.id);
              router.push(`/community?tab=school/${user.school.id}`);
            } else {
              console.log('No cached school info, showing school setup modal');
              setShowSchoolSetupModal(true);
            }
          } else if (selectedTab === 'regional' && tabFromUrl === 'regional') {
            if (user?.regions?.sido && user?.regions?.sigungu) {
              console.log('Fallback auto-redirect to cached region:', user.regions.sido, user.regions.sigungu);
              router.push(`/community?tab=regional/${encodeURIComponent(user.regions.sido)}/${encodeURIComponent(user.regions.sigungu)}`);
            } else {
              console.log('No cached region info, showing region setup modal');
              setShowRegionSetupModal(true);
            }
          }
        }
      }
    };

    handleAutoRedirect();
  }, [user, selectedTab, searchParams, router]);

  useEffect(() => {
    loadBoards();
  }, [selectedTab]);

  useEffect(() => {
    if (boards.length > 0 && !isInitialLoading) {
      loadPosts();
    }
  }, [selectedTab, selectedBoard, sortBy, boards, currentPage, currentSchoolId, isInitialLoading]);

  // 사용자 정보 변경 시 차단된 사용자 목록 로드
  useEffect(() => {
    if (user?.uid) {
      loadBlockedUsers();
    }
  }, [user?.uid]);

  // 브라우저 탭이 포커스될 때마다 게시글 목록 새로고침
  useEffect(() => {
    const handleWindowFocus = () => {
      // 초기 로드가 아닌 경우에만 새로고침 (뒤로가기 등으로 돌아온 경우)
      if (posts.length > 0) {
        loadPosts();
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [posts.length]);

  // 차단 해제 시 상태 업데이트
  const handleUnblock = (userId: string) => {
    setBlockedUserIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  // 게시글 렌더링 함수
  const renderPost = (post: CommunityPost) => {
    const isBlocked = blockedUserIds.has(post.authorId);
    
    if (isBlocked) {
      return (
        <BlockedUserContent
          key={post.id}
          blockedUserId={post.authorId}
          blockedUserName={post.authorInfo?.displayName || '사용자'}
          contentType="post"
          onUnblock={() => handleUnblock(post.authorId)}
        >
          <PostListItem
            post={post}
            href={getPostUrl(post)}
            typeBadgeText={getTabName()}
            boardBadgeText={post.boardName}
          />
        </BlockedUserContent>
      );
    }
    
    return (
      <PostListItem
        key={post.id}
        post={post}
        href={getPostUrl(post)}
        typeBadgeText={getTabName()}
        boardBadgeText={post.boardName}
      />
    );
  };

  const getPostUrl = (post: CommunityPost) => {
    switch (selectedTab) {
      case 'national':
        return `/community/national/${post.boardCode}/${post.id}`;
      case 'regional':
        const selectedSido = sessionStorage.getItem('community-selected-sido') || user?.regions?.sido;
        const selectedSigungu = sessionStorage.getItem('community-selected-sigungu') || user?.regions?.sigungu;
        if (selectedSido && selectedSigungu) {
          return `/community/region/${encodeURIComponent(selectedSido)}/${encodeURIComponent(selectedSigungu)}/${post.boardCode}/${post.id}`;
        }
        return '#';
      case 'school':
        const selectedSchoolId = sessionStorage.getItem('community-selected-school') || user?.school?.id;
        if (selectedSchoolId) {
          return `/community/school/${selectedSchoolId}/${post.boardCode}/${post.id}`;
        }
        return '#';
      default:
        return '#';
    }
  };

  const getTabName = () => {
    switch (selectedTab) {
      case 'national': return '전국';
      case 'regional': return '지역';
      case 'school': return '학교';
      default: return '전국';
    }
  };

  const loadBoards = async () => {
    try {
      console.log('Loading boards for type:', selectedTab);
      const boardsData = await getBoardsByType(selectedTab);
      console.log('Loaded boards:', boardsData);
      setBoards(boardsData as Board[]);
      setSelectedBoard('all'); // 탭 변경 시 전체로 리셋
    } catch (error) {
      console.error('게시판 로드 실패:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      let result: { items: Post[]; totalCount: number; totalPages: number; currentPage: number } | null = null;

      console.log('Loading posts for tab:', selectedTab, 'page:', currentPage, 'pageSize:', pageSize);

      if (selectedBoard === 'all') {
        // 모든 게시판의 게시글 가져오기 - 페이지네이션 적용
        if (selectedTab === 'school') {
          // 학교 탭: currentSchoolId 상태 사용
          if (currentSchoolId) {
            console.log('Loading posts for school:', currentSchoolId);
            result = await getAllPostsBySchoolWithPagination(currentSchoolId, currentPage, pageSize, sortBy);
          } else {
            console.log('No currentSchoolId available');
          }
        } else if (selectedTab === 'regional') {
          // 지역 탭: URL 파라미터 또는 사용자의 지역 사용
          const selectedSido = sessionStorage.getItem('community-selected-sido') || user?.regions?.sido;
          const selectedSigungu = sessionStorage.getItem('community-selected-sigungu') || user?.regions?.sigungu;
          if (selectedSido && selectedSigungu) {
            result = await getAllPostsByRegionWithPagination(selectedSido, selectedSigungu, currentPage, pageSize, sortBy);
          }
        } else {
          // 전국 탭: 기존 로직 유지
          result = await getAllPostsByTypeWithPagination(selectedTab, currentPage, pageSize, sortBy);
        }
        
        if (result) {
          const postsWithBoardName = result.items.map(post => {
            const board = boards.find(b => b.code === post.boardCode);
            console.log('Post boardCode:', post.boardCode, 'Found board:', board?.name);
            return {
              ...post,
              attachments: post.attachments || [], // 기본값 설정
              boardName: board?.name || `게시판 (${post.boardCode})`,
              previewContent: generatePreviewContent(post.content)
            };
          });
          
          setPosts(postsWithBoardName);
          setTotalCount(result.totalCount);
          setTotalPages(result.totalPages);
        } else {
          setPosts([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      } else {
        // 특정 게시판의 게시글만 가져오기 - 기존 API 사용 (향후 페이지네이션 추가 가능)
        let boardPosts: Post[] = [];
        
        if (selectedTab === 'school') {
          // 학교 탭: 해당 학교의 특정 게시판 게시글만 가져오기
          if (currentSchoolId) {
            boardPosts = await getPostsByBoardType(selectedTab, selectedBoard, pageSize, currentSchoolId);
          }
        } else if (selectedTab === 'regional') {
          // 지역 탭: 해당 지역의 특정 게시판 게시글만 가져오기
          const selectedSido = sessionStorage.getItem('community-selected-sido') || user?.regions?.sido;
          const selectedSigungu = sessionStorage.getItem('community-selected-sigungu') || user?.regions?.sigungu;
          if (selectedSido && selectedSigungu) {
            boardPosts = await getPostsByBoardType(selectedTab, selectedBoard, pageSize, undefined, { sido: selectedSido, sigungu: selectedSigungu });
          }
        } else {
          // 전국 탭: 기존 로직 유지
          boardPosts = await getPostsByBoardType(selectedTab, selectedBoard, pageSize);
        }
        
        const board = boards.find(b => b.code === selectedBoard);
        console.log('Selected board:', selectedBoard, 'Found board:', board?.name, 'Posts count:', boardPosts.length);
        const allPosts = boardPosts.map(post => ({
          ...post,
          attachments: post.attachments || [], // 기본값 설정
          boardName: board?.name || `게시판 (${selectedBoard})`,
          previewContent: generatePreviewContent(post.content)
        }));
        
        setPosts(allPosts);
        setTotalCount(boardPosts.length);
        setTotalPages(1); // 특정 게시판의 경우 임시로 1페이지로 설정
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      setPosts([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  // 차단된 사용자 목록 로드
  const loadBlockedUsers = async () => {
    if (!user?.uid) return;
    
    try {
      const blockedIds = await getBlockedUserIds(user.uid);
      setBlockedUserIds(new Set(blockedIds));
    } catch (error) {
      console.error('차단된 사용자 목록 로드 실패:', error);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 스크롤을 맨 위로
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 게시판 변경 시 페이지 리셋
  const handleBoardChange = (boardCode: string) => {
    setSelectedBoard(boardCode);
    setCurrentPage(1);
  };

  // 정렬 변경 시 페이지 리셋
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleWriteClick = () => {
    console.log('Write button clicked!');
    console.log('Current tab:', selectedTab);
    console.log('User:', user);
    console.log('User school:', user?.school);
    
    // 정지된 사용자 차단
    if (suspensionStatus?.isSuspended) {
      const message = suspensionStatus.isPermanent
        ? "계정이 영구 정지되어 게시글을 작성할 수 없습니다."
        : `계정이 정지되어 게시글을 작성할 수 없습니다. (남은 기간: ${suspensionStatus.remainingDays}일)`;
      
      alert(message + `\n사유: ${suspensionStatus.reason || '정책 위반'}`);
      return;
    }
    
    // 현재 선택된 탭에 따라 적절한 write 페이지로 이동하거나 BoardSelector 표시
    if (selectedTab === 'national') {
      console.log('Opening board selector for national');
      setShowBoardSelector(true);
    } else if (selectedTab === 'school') {
      console.log('School tab - checking user info...');
      
      // 사용자 정보가 아직 로딩 중이면 일단 BoardSelector 표시
      if (user === null) {
        console.log('User loading, but showing board selector anyway...');
        setShowBoardSelector(true);
        return;
      }
      
      const selectedSchoolId = sessionStorage.getItem('community-selected-school') || user?.school?.id;
      console.log('Selected school ID:', selectedSchoolId);
      
      if (selectedSchoolId) {
        console.log('Opening board selector for school');
        setShowBoardSelector(true);
      } else {
        console.log('No school info for writing, showing school setup modal');
        setShowSchoolSetupModal(true);
      }
    } else if (selectedTab === 'regional') {
      console.log('Regional tab - checking user info...');
      
      // 사용자 정보가 아직 로딩 중이면 일단 BoardSelector 표시
      if (user === null) {
        console.log('User loading, but showing board selector anyway...');
        setShowBoardSelector(true);
        return;
      }
      
      const selectedSido = sessionStorage.getItem('community-selected-sido') || user?.regions?.sido;
      const selectedSigungu = sessionStorage.getItem('community-selected-sigungu') || user?.regions?.sigungu;
      console.log('Selected region:', selectedSido, selectedSigungu);
      
      if (selectedSido && selectedSigungu) {
        console.log('Opening board selector for region');
        setShowBoardSelector(true);
      } else {
        console.log('No region info for writing, showing region setup modal');
        setShowRegionSetupModal(true);
      }
    } else {
      console.log('Default case - opening board selector');
      setShowBoardSelector(true);
    }
  };

  // 로그인이 필요한 탭인지 확인 (학교 탭은 로그인 없이도 접근 가능)
  const isLoginRequired = selectedTab === 'regional' && !user && !authLoading;

  // 로딩 화면 렌더링 (인증 상태 확인 중)
  const renderAuthLoading = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 정보 확인 중...</h2>
        <p className="text-gray-600">
          지역 게시판 접근 권한을 확인하고 있습니다.
        </p>
      </div>
    </div>
  );

  // 로그인 안내 화면 렌더링
  const renderLoginRequired = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인이 필요합니다</h2>
        <p className="text-gray-600 mb-6">
          지역 게시판을 보려면 로그인해주세요.
        </p>
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={() => router.push('/login')}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            로그인하기
          </Button>
          <Button 
            variant="outline"
            onClick={() => setSelectedTab('national')}
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            전국 커뮤니티 보기
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 탭 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <Tabs value={selectedTab} onValueChange={(value) => handleTabChange(value as BoardType)}>
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-12">
              <TabsTrigger 
                value="national" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none"
              >
                전국
              </TabsTrigger>
              <TabsTrigger 
                value="regional" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none"
              >
                지역
              </TabsTrigger>
              <TabsTrigger 
                value="school" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none"
              >
                학교
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 인증 로딩 중일 때는 로딩 화면 표시 (지역 탭만) */}
      {authLoading && selectedTab === 'regional' ? (
        renderAuthLoading()
      ) : isLoginRequired ? (
        renderLoginRequired()
      ) : (
        <>
          {/* 학교 선택 (학교 탭일 때만 표시) */}
          {selectedTab === 'school' && (
            <div className="bg-white border-b">
              <div className="container mx-auto px-4 py-3">
                {user ? (
                  // 로그인한 사용자: 기존 SchoolSelector
                  <SchoolSelector 
                    currentSchoolId={currentSchoolId}
                    onSchoolChange={async (school) => {
                      console.log('School changed to:', school.id, school.name);
                      
                      // URL 업데이트 - 새로운 학교 ID로 리다이렉트
                      router.push(`/community?tab=school/${school.id}`);
                      
                      // 세션 스토리지에도 업데이트
                      sessionStorage.setItem('community-selected-school', school.id);
                      setCurrentSchoolId(school.id);
                      
                      // 게시판과 게시글 목록 새로고침
                      await loadBoards();
                      await loadPosts();
                    }}
                    className="max-w-sm"
                  />
                ) : (
                  // 로그인하지 않은 사용자: 안내 메시지
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SchoolIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        {currentSchoolInfo ? (
                          <>
                            <p className="font-medium text-sm text-gray-800">{currentSchoolInfo.name}</p>
                            <p className="text-xs text-gray-600">{currentSchoolInfo.district} • 게스트로 방문 중</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-sm text-gray-800">학교 커뮤니티 탐색</p>
                            <p className="text-xs text-gray-600">아래에서 원하는 학교를 선택해보세요</p>
                          </>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => router.push('/login')}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      로그인하기
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 카테고리 필터 - 인기 학교 목록이 아닐 때만 표시 */}
          {!(selectedTab === 'school' && !user && !currentSchoolId) && (
            <div className="bg-white border-b">
              <div className="container mx-auto px-4 py-3">
                {/* 가로 스크롤 카테고리와 화살표 버튼 */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 overflow-x-auto flex-1">
                    <Button
                      variant={selectedBoard === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleBoardChange('all')}
                      className="whitespace-nowrap text-xs px-2.5 py-1.5 h-7"
                    >
                      전체
                    </Button>
                    {boards.map((board) => (
                      <Button
                        key={board.code}
                        variant={selectedBoard === board.code ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleBoardChange(board.code)}
                        className="whitespace-nowrap text-xs px-2.5 py-1.5 h-7"
                      >
                        {board.name}
                      </Button>
                    ))}
                  </div>
                  
                  {/* 화살표 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="flex-shrink-0 p-1.5 h-7 w-7 text-gray-600 hover:text-gray-900 border-gray-300"
                  >
                    {showCategoryDropdown ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* 인라인 확장 카테고리 영역 */}
              {showCategoryDropdown && (
                <div className="border-t bg-gray-50">
                  <div className="container mx-auto px-4 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                      <Button
                        variant={selectedBoard === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          handleBoardChange('all');
                          setShowCategoryDropdown(false);
                        }}
                        className="justify-start text-xs px-2.5 py-1.5 h-7"
                      >
                        전체
                      </Button>
                      {boards.map((board) => (
                        <Button
                          key={`dropdown-${board.code}`}
                          variant={selectedBoard === board.code ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            handleBoardChange(board.code);
                            setShowCategoryDropdown(false);
                          }}
                          className="justify-start text-xs px-2.5 py-1.5 h-7"
                        >
                          {board.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 게시글 리스트 헤더 - 인기 학교 목록이 아닐 때만 표시 */}
          {!(selectedTab === 'school' && !user && !currentSchoolId) && (
            <div className="container mx-auto px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">게시글</h2>
                <div className="flex items-center space-x-3">
                  <Select value={sortBy} onValueChange={(value: SortOption) => handleSortChange(value)}>
                    <SelectTrigger className="w-24 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user && (
                    <Button 
                      onClick={handleWriteClick}
                      className="bg-green-500 hover:bg-green-600 text-white shadow-sm"
                    >
                      <span className="text-sm">✏️ 글쓰기</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 모바일 앱 리워드 광고 안내 - 인기 학교 목록이 아닐 때만 표시 */}
          {!(selectedTab === 'school' && !user && !currentSchoolId) && (
            <div className="container mx-auto px-4 py-2">
              <div className="max-w-2xl mx-auto p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-lg">📱</span>
                    <h3 className="font-semibold text-gray-800 text-sm">모바일 앱에서 경험치 받기</h3>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500">🎁</span>
                      <span>+50 XP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-green-500">⏰</span>
                      <span>15분 간격</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-500">🚀</span>
                      <span>하루 5회</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 게시글 리스트 */}
          <div className="container mx-auto px-4 pb-4">
            {isLoading || isInitialLoading ? (
              <div>
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-muted-foreground font-medium">게시글을 가져오는 중...</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">잠시만 기다려 주세요</p>
                </div>
                <div className="space-y-4 opacity-50">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                        <div className="flex items-center space-x-4">
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : posts.length === 0 ? (
              // 학교 탭에서 로그인하지 않은 사용자이고 특정 학교가 선택되지 않은 경우 인기 학교 목록 표시
              selectedTab === 'school' && !user && !currentSchoolId ? (
                <div className="px-2 py-4">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      <h2 className="text-xl font-semibold text-gray-800">인기 학교 커뮤니티</h2>
                    </div>
                    {/* <p className="text-gray-600">
                      활발한 활동이 이루어지고 있는 학교 커뮤니티를 둘러보세요
                    </p> */}
                  </div>
                  
                  {popularSchoolsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-muted-foreground">인기 학교를 불러오는 중...</p>
                    </div>
                  ) : popularSchools.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                      {popularSchools.map((school) => (
                        <Card 
                          key={school.id} 
                          className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300"
                          onClick={() => router.push(`/community?tab=school/${school.id}`)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 flex-shrink-0">
                                <SchoolIcon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-xs leading-tight">
                                  {school.name}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate">
                                  {school.district}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>멤버 {school.memberCount || 0}명</span>
                              <span>즐겨찾기 {school.favoriteCount || 0}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <SchoolIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        인기 학교 목록을 불러올 수 없습니다.
                      </p>
                    </div>
                  )}
                  
                  <div className="text-center pt-4 border-t mx-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      더 많은 기능을 이용하려면 로그인하세요
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => router.push('/login')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        로그인하기
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedTab('national')}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        전국 커뮤니티 보기
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // 기본 "게시글이 없습니다" 메시지
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">📝</div>
                  <p className="text-gray-500">게시글이 없습니다.</p>
                  <p className="text-sm text-gray-400 mt-1">첫 번째 게시글을 작성해보세요!</p>
                </div>
              )
            ) : (
              <>
                <div className="space-y-3">
                  {posts.map((post, index) => (
                    <React.Fragment key={post.id}>
                      {renderPost(post)}
                      {/* 피드 광고 제거 - 리워디드 광고만 사용 */}
                    </React.Fragment>
                  ))}
                </div>
                
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col items-center gap-4">
                    <CommunityPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                    <PaginationInfo
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalCount={totalCount}
                      pageSize={pageSize}
                      className="text-sm text-gray-500"
                    />
                  </div>
                )}

                {/* 하단 광고 제거 - 리워디드 광고만 사용 */}
              </>
            )}
          </div>


        </>
      )}

      {/* 게시판 선택 모달 */}
      <BoardSelector
        isOpen={showBoardSelector}
        onClose={() => setShowBoardSelector(false)}
        type={selectedTab}
        schoolId={selectedTab === 'school' ? (sessionStorage?.getItem('community-selected-school') || user?.school?.id) : undefined}
        regions={selectedTab === 'regional' ? {
          sido: sessionStorage?.getItem('community-selected-sido') || user?.regions?.sido || '',
          sigungu: sessionStorage?.getItem('community-selected-sigungu') || user?.regions?.sigungu || ''
        } : undefined}
      />

      {/* 지역 설정 모달 */}
      <RegionSetupModal
        isOpen={showRegionSetupModal}
        onClose={() => setShowRegionSetupModal(false)}
        onComplete={() => {
          // 지역 설정 완료 후 리프레시하여 업데이트된 정보 반영
          window.location.reload();
        }}
      />

      {/* 학교 설정 모달 */}
      <SchoolSetupModal
        isOpen={showSchoolSetupModal}
        onClose={() => setShowSchoolSetupModal(false)}
        onComplete={() => {
          // 학교 설정 완료 후 리프레시하여 업데이트된 정보 반영
          window.location.reload();
        }}
      />
    </div>
  );
} 