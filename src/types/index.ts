// 학교 정보 타입
export interface School {
  id: string;
  name: string;
  address: string;
  district: string;
  type: '초등학교' | '중학교' | '고등학교' | '대학교';
  logoUrl?: string;
  websiteUrl?: string;
  regions?: {
    sido: string;
    sigungu: string;
  };
  gameStats?: {
    flappyBird?: { totalScore: number };
    reactionGame?: { totalScore: number };
    tileGame?: { totalScore: number };
  };
  createdAt: number;
  updatedAt: number;
  memberCount?: number;
  favoriteCount?: number;
}

// 사용자 타입
export interface User {
  uid: string;
  email: string;
  profile: {
    userName: string; // 아이디로 통일 (변수명 변경: displayName → userName)
    email: string;
    realName: string; // 실명
    gender?: string; // 성별 정보 추가
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    phoneNumber: string;
    profileImageUrl: string;
    createdAt: number;
    isAdmin: boolean;
  };
  regions?: {
    sido: string;
    sigungu: string;
    address?: string;
  };
  school?: {
    id: string;
    name: string;
    grade?: string;
    classNumber?: string;
    studentNumber?: string;
    isGraduate?: boolean;
  };
  role?: 'student' | 'teacher' | 'admin' | 'user';
  isVerified?: boolean;
  stats?: UserStats;
  gameStats?: {
    flappyBird?: { totalScore: number };
    reactionGame?: { totalScore: number };
    tileGame?: { totalScore: number };
  };
  createdAt?: number;
  updatedAt?: number;
  social?: {
    followers: number;
    following: number;
    friends: number;
  };
  preferences?: {
    theme: string;
    fontSize: string;
    notificationSounds: boolean;
    chatAlerts: boolean;
    emailNotifications: {
      posts: boolean;
      comments: boolean;
      messages: boolean;
      system: boolean;
    }
  };
  activityLimits?: {
    lastResetDate: string;
    dailyCounts: {
      posts: number;
      comments: number;
      games: {
        flappyBird: number;
        reactionGame: number;
        tileGame: number;
      };
      adViewedCount: number;
    };
    adRewards: {
      flappyBird: number;
      reactionGame: number;
      tileGame: number;
      lastRewardTime: number;
    }
  };
  warnings?: {
    count: number;
    lastWarned: number;
  };
  referrerId?: string;
}

// 게시판 타입
export interface Board {
  id: string;
  name: string;
  code: string;
  description: string;
  type: 'national' | 'regional' | 'school';
  parentCode?: string;
  order: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  stats: {
    postCount: number;
    viewCount: number;
    activeUserCount: number;
  };
  allowAnonymous: boolean;
  allowPolls: boolean;
  icon?: string; // Lucide 아이콘 이름
  customIcon?: string; // 사용자 정의 이미지 URL
  categories?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    order: number;
    isActive: boolean;
  }[];
}

// 게시글 타입
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorInfo: {
    displayName: string;
    profileImageUrl?: string;
    isAnonymous: boolean;
  };
  boardCode: string;
  type: 'national' | 'regional' | 'school';
  category?: {
    id: string;
    name: string;
  };
  createdAt: number;
  updatedAt?: number;
  schoolId?: string;
  regions?: {
    sido: string;
    sigungu: string;
  };
  attachments: {
    type: 'image' | 'file';
    url: string;
    name: string;
    size: number;
  }[];
  tags: string[];
  stats: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  status: {
    isPinned: boolean;
    isDeleted: boolean;
    isHidden: boolean;
    isBlocked: boolean;
  };
  poll?: {
    isActive: boolean;
    question: string;
    options: {
      text: string;
      imageUrl?: string;
      voteCount: number;
      index: number;
    }[];
    expiresAt?: number;
    multipleChoice: boolean;
  };
}

// 투표 옵션 타입
export interface PollOption {
  text: string;
  imageUrl?: string;
  voteCount: number;
  index: number;
}

// 댓글 타입
export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  isAnonymous: boolean;
  parentId: string | null;
  createdAt: number;
  updatedAt?: number;
  stats: {
    likeCount: number;
  };
  status: {
    isDeleted: boolean;
    isBlocked: boolean;
  };
}

// 첨부 파일 타입
export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  postId?: string;
  userId: string;
  createdAt: number;
}

// 좋아요 타입
export interface Like {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: number;
}

// 투표 타입
export interface Vote {
  id: string;
  userId: string;
  postId: string;
  optionIndex: number;
  votedAt: number;
}

// 알림 타입
export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'comment' | 'like' | 'mention' | 'system';
  referenceId?: string;
  isRead: boolean;
  createdAt: number;
}

// 채팅방 타입
export interface ChatRoom {
  id: string;
  schoolId?: string;
  name: string;
  description?: string;
  type: 'school' | 'private' | 'group';
  participantIds: string[];
  lastMessageAt: number;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
  };
  createdAt: number;
  updatedAt: number;
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  attachments?: Attachment[];
  mentions?: string[];
  isDeleted: boolean;
  timestamp: number;
}

// 학교 인증 요청 타입
export interface SchoolVerificationRequest {
  id: string;
  userId: string;
  schoolId: string;
  status: 'pending' | 'approved' | 'rejected';
  proofImageUrl: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}

// 스크랩 타입
export interface UserScrap {
  id: string;
  userId: string;
  postId: string;
  folders: string[];
  createdAt: number;
}

// 스크랩 폴더 타입
export interface ScrapFolder {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

// 사용자 관계 타입
export interface UserRelationship {
  id: string;
  userId: string;
  targetId: string;
  type: 'follow' | 'block';
  status: 'active' | 'pending' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

// 초대 코드 타입
export interface UserInvitation {
  id: string;
  inviterId: string;
  email?: string;
  phone?: string;
  code: string;
  isUsed: boolean;
  usedBy?: string;
  createdAt: number;
  expiresAt: number;
}

// 검색 기록 타입
export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  timestamp: number;
}

// 인기 검색어 타입
export interface PopularSearch {
  date: string;
  searches: {
    query: string;
    count: number;
  }[];
}

// 공지사항 타입
export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isGlobal: boolean;
  targetBoards?: string[];
  targetSchools?: string[];
  targetRegions?: {
    sido: string[];
    sigungu?: string[];
  };
  pinned: boolean;
  attachments?: Attachment[];
  createdAt: number;
  updatedAt: number;
}

// 회원가입 폼 데이터 타입 (선택적 필드는 모두 옵셔널로 표시)
export interface FormDataType {
  // 기본 정보
  userName?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  nickname?: string;
  realName?: string;
  gender?: string;
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  phone?: string;
  verificationCode?: string;
  referral?: string;
  interests?: string[]; // 관심사 목록 (선택적)
  
  // 학교 정보
  school?: string;
  schoolName?: string;
  grade?: string;
  classNumber?: string;
  studentNumber?: string;
  favoriteSchools?: string[]; // 즐겨찾기한 학교 ID 목록
  
  // 지역 정보
  province?: string;
  city?: string;
  detailAddress?: string;
  
  // 프로필 설정
  profileImage?: File | null;
  
  // 약관 동의
  termsAgreed?: boolean;
  privacyAgreed?: boolean;
  locationAgreed?: boolean;
  marketingAgreed?: boolean;

  isGraduate?: boolean;
}

// 회원가입 단계 컴포넌트 props
export interface SignupStepProps {
  formData: FormDataType;
  updateFormData: (data: Partial<FormDataType>) => void;
}

// 출석 로그 객체 타입
export interface AttendanceLog {
  [date: string]: boolean;
}

// 출석체크 데이터 타입
export interface UserAttendance {
  checkedToday: boolean;
  streak: number;
  totalCount: number;
  monthCount: number;
  lastAttendance?: number;
  monthlyLog?: AttendanceLog;
  // 경험치 관련 정보 (출석체크 수행 시에만 포함)
  expGained?: number;
  leveledUp?: boolean;
  oldLevel?: number;
  newLevel?: number;
}

// 사용자 통계 데이터
export interface UserStats {
  level: number;
  experience: number;   // 누적 경험치
  currentExp: number;   // 현재 레벨에서의 경험치
  streak: number;       // 연속 출석 일수
  postCount: number;    // 게시글 수
  commentCount: number; // 댓글 수
  likeCount: number;    // 좋아요 수
}

// 시스템 설정 타입
export interface SystemSettings {
  experience: {
    postReward: number;
    commentReward: number;
    likeReward: number;
    attendanceReward: number;
    attendanceStreakReward: number;
    referralReward: number;
    levelRequirements: { [level: number]: number };
  };
  dailyLimits: {
    postsForReward: number;
    commentsForReward: number;
    gamePlayCount: number;
  };
  gameSettings: {
    reactionGame: {
      rewardThreshold: number;
      rewardAmount: number;
    };
    tileGame: {
      rewardThreshold: number;
      rewardAmount: number;
    };
    flappyBird: {
      rewardThreshold: number;
      rewardAmount: number;
    };
  };
  ads: {
    rewardedVideo: {
      gameExtraPlays: number;
      cooldownMinutes: number;
    };
  };
  appVersion: {
    current: string;
    minimum: string;
    forceUpdate: boolean;
  };
  maintenance: {
    isActive: boolean;
    message?: string;
    startTime?: number;
    endTime?: number;
  };
}

// 지역 정보 타입
export interface Region {
  id: string;
  name: string; // 시/도 이름
  code: string; // 지역 코드
  level: 'sido' | 'sigungu';
  parentId?: string; // 상위 지역 ID (시군구의 경우 시/도 ID)
  sigungu?: {
    id: string;
    name: string;
    code: string;
  }[];
  stats: {
    userCount: number;
    postCount: number;
    schoolCount: number;
  };
  createdAt: number;
  updatedAt: number;
}

// 인기글 타입
export interface HottestPost {
  id: string;
  postId: string;
  title: string;
  content: string; // 요약된 내용
  code: string;
  type: 'national' | 'regional' | 'school';
  schoolId?: string;
  regions?: {
    sido: string;
    sigungu: string;
  };
  authorInfo: {
    displayName: string;
    profileImageUrl?: string;
    isAnonymous: boolean;
  };
  thumbnailUrl?: string;
  stats: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    hotScore: number; // 인기 점수 (조회수+좋아요*3+댓글*2)
  };
  tags: string[];
  createdAt: number;
  calculatedAt: number; // 인기 점수 계산 시간
  rank: number; // 순위
}

// 게시판 집계 데이터 타입
export interface BoardAggregate {
  id: string; // format: {code}_{YYYYMM}
  code: string;
  type: 'national' | 'regional' | 'school';
  period: string; // YYYYMM 형식
  stats: {
    postCount: number;
    commentCount: number;
    viewCount: number;
    likeCount: number;
    uniqueUserCount: number;
    averagePostsPerDay: number;
  };
  topUsers: {
    userId: string;
    displayName: string;
    postCount: number;
    commentCount: number;
    likeCount: number;
  }[];
  topPosts: {
    postId: string;
    title: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

// 태그 관리 타입
export interface Tag {
  id: string;
  name: string;
  description?: string;
  isBlocked: boolean; // 차단된 태그 여부
  category?: string; // 태그 카테고리
  usageCount: number; // 사용 횟수
  createdAt: number;
  updatedAt: number;
  blockedAt?: number;
  blockedBy?: string; // 차단한 관리자 ID
  blockReason?: string;
}

// 출석 체크 타입
export interface Attendance {
  id: string; // userId
  userId: string;
  streak: number; // 연속 출석 일수
  totalCount: number; // 전체 출석 일수
  lastCheckDate: string; // YYYY-MM-DD 형식
  monthlyLog: { [date: string]: boolean }; // 월별 출석 기록
  rewards: {
    dailyReward: number; // 일일 출석 보상 경험치
    streakReward: number; // 연속 출석 보상 경험치
    lastRewardDate: string;
  };
  createdAt: number;
  updatedAt: number;
}

// 게임 랭킹 타입
export interface GameRanking {
  id: string; // format: {gameType}_{period}
  gameType: 'reactionGame' | 'tileGame' | 'flappyBird';
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
  periodValue: string; // YYYY-MM-DD, YYYY-WW, YYYY-MM, "all"
  rankings: {
    rank: number;
    userId: string;
    displayName: string;
    schoolName?: string;
    score: number;
    playCount: number;
    achievedAt: number;
  }[];
  stats: {
    totalPlayers: number;
    averageScore: number;
    highestScore: number;
  };
  createdAt: number;
  updatedAt: number;
} 