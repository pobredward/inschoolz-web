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
import { logAuthPersistenceStatus, testAuthPersistence } from '@/lib/auth-persistence';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 쿠키 설정 함수 (기본 30일 지속)
const setCookie = (name: string, value: string, days = 30): Promise<void> => {
  return new Promise((resolve) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    // 프로덕션과 개발 환경에 따른 쿠키 설정
    const isProduction = process.env.NODE_ENV === 'production';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    let cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
    
    if (isProduction) {
      // 프로덕션 환경: secure, samesite=lax
      cookieString += '; secure; samesite=lax';
      
      // 도메인이 inschoolz.com인 경우 명시적으로 설정
      if (hostname.includes('inschoolz.com')) {
        cookieString += '; domain=.inschoolz.com';
      }
    } else {
      // 개발 환경: samesite=strict
      cookieString += '; samesite=strict';
    }
    
    document.cookie = cookieString;
    
    console.log(`🍪 쿠키 설정: ${name} (${days}일 지속)`, {
      isProduction,
      hostname,
      cookieString: cookieString.replace(value, '[값숨김]')
    });
    
    // localStorage에도 백업 저장 (쿠키 실패 시 대안)
    try {
      localStorage.setItem(`auth_${name}`, value);
      localStorage.setItem(`auth_${name}_expires`, expires.getTime().toString());
      console.log(`💾 localStorage 백업: auth_${name}`);
    } catch (error) {
      console.warn(`⚠️ localStorage 설정 실패: ${name}`, error);
    }
    
    // 쿠키 설정이 완료되었는지 확인
    setTimeout(() => {
      const cookieSet = document.cookie.split(';').some(cookie => 
        cookie.trim().startsWith(`${name}=`)
      );
      
      if (cookieSet) {
        console.log(`✅ 쿠키 설정 확인: ${name}`);
        resolve();
      } else {
        console.warn(`⚠️ 쿠키 설정 실패: ${name} - localStorage 백업 사용 가능`);
        resolve(); // 실패해도 진행 (localStorage 백업 있음)
      }
    }, 200); // 200ms 대기 후 확인 (프로덕션에서 더 긴 시간)
  });
};

// 쿠키 삭제 함수
const deleteCookie = (name: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // 기본 쿠키 삭제
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  
  // 프로덕션에서 도메인 쿠키도 삭제
  if (isProduction && hostname.includes('inschoolz.com')) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.inschoolz.com`;
  }
  
  // localStorage 백업도 삭제
  try {
    localStorage.removeItem(`auth_${name}`);
    localStorage.removeItem(`auth_${name}_expires`);
    console.log(`🗑️ localStorage 백업 삭제: auth_${name}`);
  } catch (error) {
    console.warn(`⚠️ localStorage 삭제 실패: ${name}`, error);
  }
};

// 토큰 자동 갱신 타이머 저장
let tokenRefreshTimer: NodeJS.Timeout | null = null;

// 토큰 자동 갱신 설정
const setupTokenRefresh = (firebaseUser: FirebaseUser) => {
  // 기존 타이머 정리
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer);
  }
  
  // 50분마다 토큰 갱신 (Firebase ID 토큰은 1시간 만료)
  tokenRefreshTimer = setInterval(async () => {
    try {
      console.log('🔄 토큰 자동 갱신 시작');
      const newToken = await firebaseUser.getIdToken(true);
      setCookie('authToken', newToken, 1);
      console.log('✅ 토큰 자동 갱신 완료');
    } catch (error) {
      console.error('❌ 토큰 자동 갱신 실패:', error);
      // 갱신 실패 시 로그아웃 처리할 수도 있음
    }
  }, 50 * 60 * 1000); // 50분
  
  console.log('⏰ 토큰 자동 갱신 타이머 설정 완료 (50분 간격)');
};

// 토큰 갱신 타이머 정리
const clearTokenRefresh = () => {
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer);
    tokenRefreshTimer = null;
    console.log('🛑 토큰 자동 갱신 타이머 정리 완료');
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

// localStorage에서 만료되지 않은 토큰 복원
const restoreAuthFromLocalStorage = () => {
  try {
    const authToken = localStorage.getItem('auth_authToken');
    const authTokenExpires = localStorage.getItem('auth_authToken_expires');
    const uid = localStorage.getItem('auth_uid');
    const userRole = localStorage.getItem('auth_userRole');
    
    if (authToken && authTokenExpires) {
      const expiresTime = parseInt(authTokenExpires);
      const now = new Date().getTime();
      
      // 토큰이 아직 유효한 경우에만 복원
      if (expiresTime > now) {
        console.log('🔄 localStorage에서 인증 정보 복원 중...');
        
        // 쿠키로 복원
        document.cookie = `authToken=${authToken}; expires=${new Date(expiresTime).toUTCString()}; path=/; secure; samesite=lax`;
        if (uid) {
          document.cookie = `uid=${uid}; expires=${new Date(now + 30 * 24 * 60 * 60 * 1000).toUTCString()}; path=/; secure; samesite=lax`;
        }
        if (userRole) {
          document.cookie = `userRole=${userRole}; expires=${new Date(now + 30 * 24 * 60 * 60 * 1000).toUTCString()}; path=/; secure; samesite=lax`;
        }
        
        console.log('✅ localStorage에서 쿠키 복원 완료');
        return true;
      } else {
        console.log('🗑️ localStorage의 토큰이 만료됨, 정리 중...');
        localStorage.removeItem('auth_authToken');
        localStorage.removeItem('auth_authToken_expires');
        localStorage.removeItem('auth_uid');
        localStorage.removeItem('auth_userRole');
      }
    }
  } catch (error) {
    console.warn('⚠️ localStorage 복원 실패:', error);
  }
  return false;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspensionStatus, setSuspensionStatus] = useState<SuspensionStatus | null>(null);

  // 컴포넌트 마운트 시 localStorage에서 인증 정보 복원 시도
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const restored = restoreAuthFromLocalStorage();
      if (restored) {
        console.log('📱 페이지 로드 시 localStorage에서 인증 정보 복원됨');
      }
    }
  }, []);

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
      
      // Firebase ID 토큰 가져오기 (강제 새로고침)
      const idToken = await firebaseUser.getIdToken(true);
      console.log('🔑 AuthProvider: Firebase ID 토큰 획득 완료');
      
      // 쿠키 설정을 순차적으로 처리하여 완료 보장 (프로덕션 환경에서 중요)
      await setCookie('authToken', idToken, 1); // 1일
      await setCookie('uid', userData.uid, 30); // 30일
      await setCookie('userId', userData.uid, 30); // 백업용, 30일
      await setCookie('userRole', userData.role, 30); // 30일
      
      console.log('✅ AuthProvider: 모든 쿠키 설정 완료', {
        authToken: '설정됨 (1일)',
        uid: userData.uid,
        userRole: userData.role
      });
      
      // 토큰 자동 갱신 설정 (50분마다 갱신)
      setupTokenRefresh(firebaseUser);
      
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
    
    // 토큰 갱신 타이머 정리
    clearTokenRefresh();
    
    // 쿠키 삭제
    deleteCookie('authToken');
    deleteCookie('uid');
    deleteCookie('userId');
    deleteCookie('userRole');
    
    console.log('🧹 AuthProvider: 모든 인증 정보 및 타이머 정리 완료');
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      // 프로덕션에서도 중요한 로그 유지
      console.log('🚀 AuthProvider: signIn 시작');
      await loginWithEmail(email, password);
      console.log('✅ AuthProvider: loginWithEmail 완료, onAuthStateChanged 대기 중...');
      
      // Firebase Auth의 onAuthStateChanged가 트리거되어 사용자 상태가 업데이트될 때까지 대기
      // 이는 로그인 직후 즉시 라우팅할 때 사용자 상태가 확실히 설정되도록 함
      await new Promise<void>((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5초 최대 대기 (100ms × 50)
        
        const checkAuth = () => {
          attempts++;
          
          if (auth.currentUser && !isLoading && user) {
            console.log('✅ AuthProvider: 인증 상태 확인 완료 (사용자 정보 + 쿠키 설정 완료)');
            resolve();
          } else if (attempts >= maxAttempts) {
            console.warn('⚠️ AuthProvider: 인증 상태 확인 시간 초과, 진행 계속');
            resolve();
          } else {
            if (attempts % 10 === 0) { // 1초마다 로그
              console.log(`⏳ AuthProvider: 인증 상태 확인 중... (${attempts}/${maxAttempts})`);
            }
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

  // 개발 환경에서 인증 지속성 테스트 도구 활성화
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.log('🛠️ 개발 모드: 인증 지속성 테스트 도구 활성화');
      testAuthPersistence();
      
      // 인증 상태 변경 시 로그
      const interval = setInterval(() => {
        if (user) {
          logAuthPersistenceStatus();
        }
      }, 5 * 60 * 1000); // 5분마다
      
      return () => clearInterval(interval);
    }
  }, [user]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 