'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById } from '@/lib/api/users';
import { loginWithEmail, loginWithGoogle, registerWithEmail } from '@/lib/auth';
import { signUp as signUpAPI } from '@/lib/api/auth';
import { User, FormDataType } from '@/types';
import { checkSuspensionStatus, SuspensionStatus } from '@/lib/auth/suspension-check';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  suspensionStatus: SuspensionStatus | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (emailOrFormData: string | FormDataType, password?: string, userName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkSuspension: () => void;
  resetError: () => void;
  setUser: (user: User | null) => void;
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
      console.log('🍪 AuthProvider: 사용자 상태 및 쿠키 설정 시작', { 
        uid: userData.uid, 
        userName: userData.profile?.userName 
      });
      
      setUser(userData);
      
      // Firebase ID 토큰 가져오기
      const idToken = await firebaseUser.getIdToken();
      console.log('🔑 AuthProvider: Firebase ID 토큰 획득 완료');
      
      // 쿠키 설정
      setCookie('authToken', idToken);
      setCookie('uid', userData.uid);
      setCookie('userId', userData.uid); // 백업용
      setCookie('userRole', userData.role);
      
      console.log('✅ AuthProvider: 모든 쿠키 설정 완료', {
        authToken: '설정됨',
        uid: userData.uid,
        userRole: userData.role
      });
      
      // 사용자 정지 상태 확인
      const suspensionStatus = checkSuspensionStatus(userData);
      setSuspensionStatus(suspensionStatus);
      
      if (suspensionStatus.isSuspended) {
        console.log('⚠️ 정지된 사용자 감지:', suspensionStatus);
      } else {
        console.log('✅ 정지되지 않은 사용자');
      }
    } catch (error) {
      console.error('❌ AuthProvider: 쿠키 설정 오류:', error);
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
      console.log('🚀 AuthProvider: signIn 시작');
      await loginWithEmail(email, password);
      console.log('✅ AuthProvider: loginWithEmail 완료, onAuthStateChanged 대기 중...');
      
      // Firebase Auth의 onAuthStateChanged가 트리거되어 사용자 상태가 업데이트될 때까지 대기
      // 이는 로그인 직후 즉시 라우팅할 때 사용자 상태가 확실히 설정되도록 함
      await new Promise<void>((resolve) => {
        const checkAuth = () => {
          if (auth.currentUser && !isLoading) {
            console.log('✅ AuthProvider: 인증 상태 확인 완료');
            resolve();
          } else {
            setTimeout(checkAuth, 100);
          }
        };
        checkAuth();
      });
      
      console.log('🎉 AuthProvider: 로그인 프로세스 완전히 완료');
      toast.success('로그인되었습니다.');
    } catch (error) {
      console.error('❌ AuthProvider: 로그인 오류:', error);
      setError(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.');
      throw error; // 에러를 다시 throw하여 LoginPageClient에서 처리할 수 있도록 함
    }
  };

  const signUp = async (emailOrFormData: string | FormDataType, password?: string, userName?: string) => {
    try {
      setError(null);
      console.log('🚀 AuthProvider: 회원가입 시작', { 
        type: typeof emailOrFormData === 'object' ? 'FormData' : 'Simple',
        email: typeof emailOrFormData === 'object' ? emailOrFormData.email : emailOrFormData 
      });
      
      // 복잡한 FormDataType이 전달된 경우
      if (typeof emailOrFormData === 'object') {
        console.log('📝 AuthProvider: 복잡한 회원가입 처리 중...');
        await signUpAPI(emailOrFormData);
        console.log('✅ AuthProvider: signUpAPI 완료, Firebase Auth 상태 변화 대기 중...');
        // signUpAPI는 Firebase Auth에 계정을 생성하고 Firestore에 사용자 정보를 저장
        // Firebase Auth의 onAuthStateChanged가 자동으로 트리거되어 사용자 상태가 업데이트됨
      } else {
        // 간단한 이메일/비밀번호/이름이 전달된 경우
        if (!password || !userName) {
          throw new Error('비밀번호와 사용자명이 필요합니다.');
        }
        console.log('📝 AuthProvider: 간단한 회원가입 처리 중...');
        await registerWithEmail(emailOrFormData, password, userName);
        console.log('✅ AuthProvider: registerWithEmail 완료, Firebase Auth 상태 변화 대기 중...');
      }
      
      // 잠시 대기하여 Firebase Auth 상태 변화가 제대로 처리되도록 함
      console.log('⏳ AuthProvider: Firebase Auth 상태 업데이트 대기 중...');
      
      toast.success('회원가입이 완료되었습니다. 환영합니다!');
    } catch (error) {
      console.error('❌ AuthProvider: 회원가입 오류:', error);
      setError(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      console.log('🚀 AuthProvider: Google signIn 시작');
      await loginWithGoogle();
      console.log('✅ AuthProvider: loginWithGoogle 완료, onAuthStateChanged 대기 중...');
      
      // Firebase Auth의 onAuthStateChanged가 트리거되어 사용자 상태가 업데이트될 때까지 대기
      await new Promise<void>((resolve) => {
        const checkAuth = () => {
          if (auth.currentUser && !isLoading) {
            console.log('✅ AuthProvider: Google 인증 상태 확인 완료');
            resolve();
          } else {
            setTimeout(checkAuth, 100);
          }
        };
        checkAuth();
      });
      
      console.log('🎉 AuthProvider: Google 로그인 프로세스 완전히 완료');
      toast.success('Google 로그인되었습니다.');
    } catch (error) {
      console.error('❌ AuthProvider: Google 로그인 오류:', error);
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

  const checkSuspension = () => {
    if (user) {
      const suspensionStatus = checkSuspensionStatus(user);
      setSuspensionStatus(suspensionStatus);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 AuthProvider: onAuthStateChanged 트리거됨', {
        user: firebaseUser ? `${firebaseUser.uid} (${firebaseUser.email})` : null,
        timestamp: new Date().toISOString()
      });
      
      setIsLoading(true);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          console.log('👤 AuthProvider: Firebase 사용자 로그인됨, Firestore에서 사용자 정보 조회 중...');
          
          // 회원가입 직후에는 Firestore 데이터 저장이 약간의 지연이 있을 수 있으므로 재시도 로직 추가
          let userData = null;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (!userData && retryCount < maxRetries) {
            userData = await getUserById(firebaseUser.uid);
            
            if (!userData && retryCount < maxRetries - 1) {
              console.log(`⏳ AuthProvider: 사용자 정보 조회 실패, 재시도 중... (${retryCount + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
              retryCount++;
            } else {
              break;
            }
          }
          
          if (userData) {
            console.log('✅ AuthProvider: 사용자 정보 조회 성공, 쿠키 설정 중...');
            await setUserAndCookies(userData, firebaseUser);
            console.log('✅ AuthProvider: 인증 완료', { userName: userData.profile?.userName });
          } else {
            console.warn('⚠️ AuthProvider: Firestore에서 사용자 정보를 찾을 수 없음 (재시도 완료)');
            clearAuthAndCookies();
          }
        } catch (error) {
          console.error('❌ AuthProvider: 사용자 정보 조회 오류:', error);
          clearAuthAndCookies();
        }
      } else {
        console.log('🚪 AuthProvider: 사용자 로그아웃됨');
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
        signUp,
        signInWithGoogle,
        signOut,
        refreshUser,
        checkSuspension,
        resetError,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 