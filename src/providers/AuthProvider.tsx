'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById } from '@/lib/api/users';
import { loginWithEmail, loginWithGoogle } from '@/lib/auth';
import { User } from '@/types';
import { checkSuspensionStatus, SuspensionStatus } from '@/lib/auth/suspension-check';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  suspensionStatus: SuspensionStatus | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkSuspension: () => void;
  resetError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 쿠키 설정 함수
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  // 개발 환경에서는 secure 옵션 제외
  const isProduction = process.env.NODE_ENV === 'production';
  const secureOption = isProduction ? '; secure' : '';
  
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/${secureOption}; samesite=strict`;
};

// 쿠키 삭제 함수
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspensionStatus, setSuspensionStatus] = useState<SuspensionStatus | null>(null);

  const resetError = () => {
    setError(null);
  };

  // 사용자 정보와 쿠키 설정
  const setUserAndCookies = async (userData: User, firebaseUser: FirebaseUser) => {
    try {
      setUser(userData);
      
      // Firebase ID 토큰 가져오기
      const idToken = await firebaseUser.getIdToken();
      
      // 쿠키 설정
      setCookie('authToken', idToken);
      setCookie('uid', userData.uid);
      setCookie('userId', userData.uid); // 백업용
      setCookie('userRole', userData.role);
      
      checkUserSuspension(userData);
    } catch (error) {
      console.error('쿠키 설정 오류:', error);
    }
  };

  // 인증 정보 초기화 및 쿠키 삭제
  const clearAuthAndCookies = () => {
    setUser(null);
    setFirebaseUser(null);
    setSuspensionStatus(null);
    setError(null);
    
    // 쿠키 삭제
    deleteCookie('authToken');
    deleteCookie('uid');
    deleteCookie('userId');
    deleteCookie('userRole');
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await loginWithEmail(email, password);
      toast.success('로그인되었습니다.');
    } catch (error) {
      console.error('로그인 오류:', error);
      setError(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.');
      throw error; // 에러를 다시 throw하여 LoginPageClient에서 처리할 수 있도록 함
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await loginWithGoogle();
      toast.success('Google 로그인되었습니다.');
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      setError(error instanceof Error ? error.message : 'Google 로그인 중 오류가 발생했습니다.');
      throw error; // 에러를 다시 throw하여 호출하는 곳에서 처리할 수 있도록 함
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      clearAuthAndCookies();
      toast.success('로그아웃되었습니다.');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;
    
    try {
      const userData = await getUserById(firebaseUser.uid);
      if (userData) {
        await setUserAndCookies(userData, firebaseUser);
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 오류:', error);
    }
  };

  const checkUserSuspension = (userData: User) => {
    console.log('=== checkUserSuspension 호출 ===');
    console.log('userData:', userData);
    console.log('userData.status:', userData.status);
    console.log('userData에 있는 모든 키:', Object.keys(userData));
    
    // 정지 관련 필드들 확인
    const userWithSuspension = userData as unknown as Record<string, unknown>;
    console.log('suspensionReason:', userWithSuspension.suspensionReason);
    console.log('suspendedUntil:', userWithSuspension.suspendedUntil);
    console.log('suspendedAt:', userWithSuspension.suspendedAt);
    
    const status = checkSuspensionStatus(userData);
    console.log('정지 상태 확인 결과:', status);
    
    setSuspensionStatus(status);
    
    // 정지 상태 로깅 (디버깅용)
    if (status.isSuspended) {
      console.log('🚫 사용자 정지 감지:', status);
      console.log('정지 사유:', status.reason);
      console.log('정지 기간:', status.suspendedUntil);
      console.log('남은 일수:', status.remainingDays);
      console.log('영구 정지 여부:', status.isPermanent);
      
      // 임시 정지이고 기간이 만료된 경우 자동 복구 처리
      if (!status.isPermanent && status.suspendedUntil && status.suspendedUntil <= new Date()) {
        console.log('정지 기간 만료, 자동 복구 시도');
        handleAutoRestore();
      }
    } else {
      console.log('✅ 정지되지 않은 사용자 또는 정지 기간 만료');
    }
  };

  const handleAutoRestore = async () => {
    try {
      // 여기서 실제로는 서버에 요청해서 상태를 업데이트해야 함
      // 현재는 클라이언트에서만 처리
      toast.success('정지 기간이 만료되어 계정이 복구되었습니다.');
      await refreshUser();
    } catch (error) {
      console.error('자동 복구 처리 오류:', error);
    }
  };

  const checkSuspension = () => {
    if (user) {
      checkUserSuspension(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userData = await getUserById(firebaseUser.uid);
          if (userData) {
            await setUserAndCookies(userData, firebaseUser);
          } else {
            clearAuthAndCookies();
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          clearAuthAndCookies();
        }
      } else {
        clearAuthAndCookies();
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        suspensionStatus,
        signIn,
        signInWithGoogle,
        signOut,
        refreshUser,
        checkSuspension,
        resetError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 