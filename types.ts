// types.ts

// 회원가입 데이터 타입
export interface SignupData {
  email: string;
  password: string;
  name: string;
  address1: string;
  address2: string;
  schoolId: string;
  schoolName: string; // 추가된 필드
  birthYear: number; // 추가된 생년 필드
  birthMonth: number; // 추가된 생월 필드
  birthDay: number; // 추가된 생일 필드
  phoneNumber: string; // 추가된 필드
}

// 사용자 데이터 타입
export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  address1?: string;
  address2?: string;
  schoolId?: string;
  schoolName?: string; // 학교 이름 필드 추가
  experience: number;
  totalExperience: number;
  level: number;
  birthYear: number; // 추가된 생년 필드
  birthMonth: number; // 추가된 생월 필드
  birthDay: number; // 추가된 생일 필드
  phoneNumber: string; // 추가된 필드
}

// 게시글 데이터 타입
export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  date: any;
  categoryId: string;
  address1?: string;
  address2?: string;
  schoolId?: string;
  likes?: number;
  comments?: number;
  views?: number;
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
}
