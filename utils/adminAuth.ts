// utils/adminAuth.ts

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

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
