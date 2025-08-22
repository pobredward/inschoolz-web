import { redirect } from 'next/navigation';

export default function AuthPage() {
  // /auth 경로로 접근 시 /login으로 리다이렉트
  redirect('/login');
} 