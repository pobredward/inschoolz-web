// utils/adminAuth.ts

const ADMIN_PASSWORD = "7988"; // 실제 사용 시 안전한 비밀번호로 변경하세요

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function setAdminAuthToken(): void {
  localStorage.setItem("adminAuth", "true");
}

export function clearAdminAuthToken(): void {
  localStorage.removeItem("adminAuth");
}

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem("adminAuth") === "true";
}
