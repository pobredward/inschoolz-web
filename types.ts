// types.ts
import { Timestamp } from "firebase/firestore";

// 회원가입 데이터 타입
export interface SignupData {
  email: string;
  password: string;
  name: string;
  userId: string;
  phoneNumber: string;
  address1: string;
  address2: string;
  schoolId: string;
  schoolName: string;
  grade: string;
  classNumber: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
}

// 사용자 데이터 타입
export interface User {
  userId: string;
  uid: string;
  address1?: string;
  address2?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  classNumber?: string;
  email: string | null;
  experience: number;
  grade?: string;
  level: number;
  name: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  schoolId?: string;
  schoolName?: string;
  totalExperience: number;
}

export interface VoteOption {
  text: string;
  imageUrl?: string;
}

// 게시글 데이터 타입
export interface Post {
  id: string;
  address1?: string;
  address2?: string;
  author: string;
  authorId: string;
  categoryId: string;
  comments?: number;
  content: string;
  createdAt: any;
  imageUrls?: string[];
  isDeleted?: boolean;
  isVotePost?: boolean;
  likedBy: string[];
  likes?: number;
  schoolId?: string;
  schoolName?: string;
  scraps?: number;
  title: string;
  updatedAt: any;
  views?: number;
  voteOptions?: VoteOption[] | null;
  voteResults?: { [key: number]: number };
  voterIds?: string[];
}

// 카테고리 데이터 타입
export interface Category {
  id: string;
  name: string;
  subcategories?: Category[];
}

// 학교 데이터 타입
export interface School {
  id: string;
  KOR_NAME: string;
  ADDRESS: string;
  SCHOOL_CODE: string;
}

// 댓글 데이터 타입
export interface Comment {
  id: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: any;
  parentId: string | null;
  likes: number;
  likedBy: string[];
  isDeleted: boolean;
  postId: string | null;
}

export interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  onCommentUpdate: (newCommentCount: number) => void;
}

// 게임 점수 데이터 타입
export interface Score {
  user: string;
  schoolName: string;
  address1: string;
  address2: string;
  time: number;
}

// 로그인 데이터 타입
export interface LoginData {
  email: string;
  password: string;
}

// 게시글 생성 데이터 타입
export interface CreatePostData {
  title: string;
  content: string;
  categoryId: string;
  author: string;
  authorId: string;
  address1?: string;
  address2?: string;
  schoolId?: string;
  schoolName?: string;
}

export interface AttendanceRecord {
  userId: string;
  attendances: {
    [key: string]: boolean;
  };
  streak: number;
  lastAttendance: Timestamp;
}

export interface AttendanceState {
  canCheckToday: boolean;
  currentStreak: number;
  lastAttendance: Date | null;
  monthlyAttendances: {
    [key: string]: boolean;
  };
}
