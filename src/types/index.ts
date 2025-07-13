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

// 사용자 역할 타입 (앱과 통일)
export type UserRole = 'student' | 'teacher' | 'admin';

// 사용자 프로필 인터페이스 (통일된 구조)
export interface UserProfile {
  userName: string; // 사용자 아이디
  realName: string; // 실명
  gender: string; // 성별
  birthYear: number; // 생년
  birthMonth: number; // 생월
  birthDay: number; // 생일
  phoneNumber: string; // 전화번호
  profileImageUrl: string; // 프로필 이미지
  createdAt: number; // 생성일
  isAdmin: boolean; // 관리자 여부
}

// 사용자 통계 인터페이스 (통일된 구조)
export interface UserStats {
  level: number; // 레벨
  currentExp: number; // 현재 레벨에서의 경험치 (0부터 시작)
  totalExperience: number; // 누적 경험치 (메인 필드)
  currentLevelRequiredXp: number; // 현재 레벨에서 다음 레벨로 가기 위해 필요한 경험치
  postCount: number; // 게시글 수
  commentCount: number; // 댓글 수
  likeCount: number; // 좋아요 수
  streak: number; // 연속 출석
}

// 사용자 타입 (통일된 구조)
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  
  // 프로필 정보
  profile: UserProfile;
  
  // 학교 정보
  school?: {
    id: string;
    name: string;
  };
  
  // 지역 정보
  regions?: {
    sido: string;
    sigungu: string;
    address?: string;
  };
  
  // 경험치/통계
  stats: UserStats;
  
  // 게임 통계
  gameStats?: {
    flappyBird?: { 
      bestReactionTime?: number; // ms 단위
    };
    reactionGame?: { 
      bestReactionTime?: number; // ms 단위
    };
    tileGame?: { 
      bestReactionTime?: number; // ms 단위
    };
  };
  
  // 약관 동의 (통합)
  agreements: {
    terms: boolean; // 이용약관
    privacy: boolean; // 개인정보
    location: boolean; // 위치정보
    marketing: boolean; // 마케팅
  };
  
  // 시스템 정보
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
  referrerId?: string; // 추천인 ID
  
  // 기타 정보
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
}

// 회원가입 폼 데이터 타입 (실제 구조와 일치)
export interface FormDataType {
  // 기본 정보
  userName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  realName: string;
  gender: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  phoneNumber: string;
  verificationCode: string;
  referral: string;
  
  // 학교 정보
  school: {
    id: string;
    name: string;
    grade: string;
    classNumber: string;
    studentNumber: string;
    isGraduate: boolean;
  };
  favoriteSchools: string[];
  
  // 지역 정보
  regions: {
    sido: string;
    sigungu: string;
    address: string;
  };
  
  // 약관 동의
  agreements: {
    terms: boolean;
    privacy: boolean;
    location: boolean;
    marketing: boolean;
  };
  
  // 프로필 이미지
  profileImage: File | null;
  
  // 기타
  interests: string[];
}

// 회원가입 단계 컴포넌트 props
export interface SignupStepProps {
  formData: FormDataType;
  updateFormData: (data: Partial<FormDataType>) => void;
}

// 기타 필요한 타입들
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
  icon?: string;
  customIcon?: string;
  categories?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    order: number;
    isActive: boolean;
  }[];
}

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

export interface Region {
  id: string;
  name: string;
  code: string;
  level: 'sido' | 'sigungu';
  parentId?: string;
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

// 출석 체크 관련 타입
export interface AttendanceLog {
  [date: string]: boolean;
}

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

export interface SystemSettings {
  experience: {
    postReward: number;
    commentReward: number;
    likeReward: number;
    attendanceReward: number;
    attendanceStreakReward: number;
    referralReward: number;
    levelRequirements: Record<number, number>;
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
      thresholds?: Array<{
        minScore: number;
        xpReward: number;
      }>;
    };
    tileGame: {
      rewardThreshold: number;
      rewardAmount: number;
      thresholds?: Array<{
        minScore: number;
        xpReward: number;
      }>;
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
  };
  attendanceBonus?: {
    weeklyBonusXP: number;
    streakBonus: number;
  };
} 