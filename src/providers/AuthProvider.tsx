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
import { SuspensionNotice } from '@/components/ui/suspension-notice';
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

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
  error: null,
  suspensionStatus: null,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
  checkSuspension: () => {},
  resetError: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
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
  const [showSuspensionNotice, setShowSuspensionNotice] = useState(false);

  const resetError = () => {
    setError(null);
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await loginWithEmail(email, password);
      toast.success('로그인되었습니다.');
    } catch (error) {
      console.error('로그인 오류:', error);
      setError(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loginWithGoogle();
      toast.success('Google 로그인되었습니다.');
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      setError(error instanceof Error ? error.message : 'Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      setSuspensionStatus(null);
      setShowSuspensionNotice(false);
      setError(null);
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
        setUser(userData);
        checkUserSuspension(userData);
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 오류:', error);
    }
  };

  const checkUserSuspension = (userData: User) => {
    const status = checkSuspensionStatus(userData);
    setSuspensionStatus(status);
    
    if (status.isSuspended) {
      setShowSuspensionNotice(true);
      
      // 임시 정지이고 기간이 만료된 경우 자동 복구 처리
      if (!status.isPermanent && !status.suspendedUntil) {
        handleAutoRestore();
      }
    } else {
      setShowSuspensionNotice(false);
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

  const handleContactSupport = () => {
    // 고객지원 페이지로 이동 또는 이메일 클라이언트 열기
    window.location.href = '/support';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userData = await getUserById(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            checkUserSuspension(userData);
          } else {
            setUser(null);
            setSuspensionStatus(null);
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          setUser(null);
          setSuspensionStatus(null);
        }
      } else {
        setUser(null);
        setSuspensionStatus(null);
        setShowSuspensionNotice(false);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 정지된 사용자에게 정지 안내 화면 표시
  if (showSuspensionNotice && suspensionStatus?.isSuspended) {
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
        <SuspensionNotice
          suspensionStatus={suspensionStatus}
          onContactSupport={handleContactSupport}
          onLogout={signOut}
        />
      </AuthContext.Provider>
    );
  }

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