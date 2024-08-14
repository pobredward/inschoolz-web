// types.ts

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
  birthYear: number;
  birthMonth: number;
  birthDay: number;
}

// 사용자 데이터 타입
export interface User {
  uid: string;
  email: string | null;
  name: string;
  userId: string;
  address1?: string;
  address2?: string;
  schoolId?: string;
  schoolName?: string;
  experience: number;
  totalExperience: number;
  level: number;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  phoneNumber: string;
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
  updatedAt: any;
  likedBy: string[];
  schoolId?: string;
  schoolName?: string;
  likes?: number;
  title: string;
  views?: number;
  imageUrls?: string[];
  voteOptions?: VoteOption[] | null;
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
  postId: string;
  author: string;
  content: string;
  date: Date;
  parentId: string | null;
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
