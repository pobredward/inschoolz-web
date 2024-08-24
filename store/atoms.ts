import { atom } from "recoil";
import { User, Post, Comment, Category, School } from "../types";

export const userState = atom<User | null>({
  key: "userState",
  default: null,
});

export const userExperienceState = atom<number>({
  key: "userExperienceState",
  default: 0,
});

export const userLevelState = atom<number>({
  key: "userLevelState",
  default: 1,
});

export const postsState = atom<Post[]>({
  key: "postsState",
  default: [],
});

// 댓글 상태 관리 아톰
export const commentsState = atom<Comment[]>({
  key: "commentsState",
  default: [],
});

export const categoriesState = atom<Category[]>({
  key: "categoriesState",
  default: [
    {
      id: "national",
      name: "전국",
      subcategories: [
        { id: "national-free", name: "자유 게시판" },
        { id: "national-hot", name: "HOT 게시글" },
      ],
    },
    {
      id: "regional",
      name: "지역",
      subcategories: [
        { id: "regional-free", name: "자유 게시판" },
        { id: "regional-share", name: "나눔 게시판" },
        { id: "regional-academy", name: "학원 공유" },
      ],
    },
    {
      id: "school",
      name: "학교",
      subcategories: [
        { id: "school-student", name: "재학생 게시판" },
        { id: "school-graduate", name: "졸업생 게시판" },
      ],
    },
  ],
});

export const selectedCategoryState = atom<string>({
  key: "selectedCategoryState",
  default: "national-all",
});

export const searchResultsState = atom<School[]>({
  key: "searchResultsState",
  default: [],
});

export const selectedSchoolState = atom<School | null>({
  key: "selectedSchoolState",
  default: null,
});
