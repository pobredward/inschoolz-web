import { redirect } from "next/navigation";

export default function BoardIndexPage() {
  // 기본 게시판 유형은 전국 게시판으로 리다이렉트합니다
  redirect("/board/national");
} 