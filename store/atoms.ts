import { atom } from "recoil";

export interface User {
  uid: string;
  address1?: string;
  address2?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  email: string | null;
  experience: number;
  level: number;
  name: string;
  schoolId?: string;
  schoolName?: string;
  phoneNumber?: string;
  userId: string;
  totalExperience: number;
}

export const userState = atom<User | null>({
  key: "userState",
  default: null,
});

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
}

export const postsState = atom<Post[]>({
  key: "postsState",
  default: [],
});

export interface Category {
  id: string;
  name: string;
  subcategories?: Category[];
}

export const categoriesState = atom<Category[]>({
  key: "categoriesState",
  default: [
    {
      id: "national",
      name: "전국",
      subcategories: [
        { id: "national-free", name: "자유 게시판" },
        { id: "national-popular", name: "학교별 인기글" },
      ],
    },
    {
      id: "regional",
      name: "지역",
      subcategories: [
        { id: "regional-share", name: "나눔" },
        { id: "regional-common", name: "공유" },
      ],
    },
    {
      id: "school",
      name: "학교",
      subcategories: [
        { id: "school-notice", name: "공지사항" },
        { id: "school-free", name: "자유 게시판" },
        { id: "school-club", name: "교내 동아리 활동" },
        { id: "school-counseling", name: "심리 상담 & 익명 고민 상담" },
      ],
    },
  ],
});

export const selectedCategoryState = atom<string>({
  key: "selectedCategoryState",
  default: "national-all",
});

export interface School {
  id: string;
  KOR_NAME: string;
  ADDRESS: string;
}

export const searchResultsState = atom<School[]>({
  key: "searchResultsState",
  default: [],
});

export const selectedSchoolState = atom<School | null>({
  key: "selectedSchoolState",
  default: null,
});

// 댓글 상태 관리 아톰
export const commentsState = atom({
  key: "commentsState",
  default: [],
});
