'use client';

import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import Cookies from 'js-cookie';
import { resetDailyActivityLimits } from '@/lib/experience';

interface AuthUser extends User {
  emailVerified: boolean;
}

interface AuthContextProps {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, userName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resetError: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다.');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // 하이드레이션 이슈 해결을 위한 로딩 상태
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 인증 상태 변경 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        const { uid, email, displayName, photoURL, emailVerified } = firebaseUser;
        
        try {
          // Firestore에서 실제 사용자 데이터 가져오기
          const userDocRef = doc(db, 'users', uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // 일일 활동 제한 자동 리셋 실행
            await resetDailyActivityLimits(uid);
            
            // Firestore의 실제 사용자 데이터 사용
            const firestoreUserData = userDoc.data();
            
            // 쿠키 설정 (일관성을 위해 uid와 userId 둘 다 설정)
            const authToken = await firebaseUser.getIdToken();
            Cookies.set('authToken', authToken, { expires: 7 });
            Cookies.set('emailVerified', emailVerified ? 'true' : 'false', { expires: 7 });
            Cookies.set('uid', uid, { expires: 7 });
            Cookies.set('userId', uid, { expires: 7 }); // 추가: 일관성을 위해
            
            console.log('AuthProvider - 쿠키 설정 완료:', { uid, authToken: authToken.substring(0, 20) + '...' });
            
            setUser({
              uid,
              email: email || '',
              role: firestoreUserData.role || 'student',
              isVerified: emailVerified,
              profile: firestoreUserData.profile || {
                userName: displayName || '',
                realName: '',
                gender: '',
                birthYear: 0,
                birthMonth: 0,
                birthDay: 0,
                phoneNumber: '',
                profileImageUrl: photoURL || '',
                createdAt: serverTimestamp(),
                isAdmin: false
              },
              stats: firestoreUserData.stats || {
                level: 1,
                totalExperience: 0,
                currentExp: 0,
                streak: 0,
                postCount: 0,
                commentCount: 0,
                likeCount: 0
              },
              school: firestoreUserData.school,
              regions: firestoreUserData.regions,
              agreements: firestoreUserData.agreements || {
                terms: false,
                privacy: false,
                location: false,
                marketing: false
              },
              createdAt: firestoreUserData.createdAt || serverTimestamp(),
              updatedAt: firestoreUserData.updatedAt || serverTimestamp(),
              lastLoginAt: firestoreUserData.lastLoginAt,
              referrerId: firestoreUserData.referrerId,
              emailVerified
            });
            
            // 관리자 권한 확인
            const isUserAdmin = firestoreUserData.role === 'admin';
            setIsAdmin(isUserAdmin);
            
            if (isUserAdmin) {
              Cookies.set('userRole', 'admin', { expires: 7 });
            } else {
              Cookies.remove('userRole');
            }
          } else {
            // Firestore에 사용자 데이터가 없는 경우 기본값 사용
            const authToken = await firebaseUser.getIdToken();
            Cookies.set('authToken', authToken, { expires: 7 });
            Cookies.set('emailVerified', emailVerified ? 'true' : 'false', { expires: 7 });
            Cookies.set('uid', uid, { expires: 7 });
            Cookies.set('userId', uid, { expires: 7 }); // 추가: 일관성을 위해
            
            console.log('AuthProvider - 기본 쿠키 설정 완료:', { uid });
            
            setUser({
              uid,
              email: email || '',
              role: 'student',
              isVerified: emailVerified,
              profile: {
                userName: displayName || '',
                realName: '',
                gender: '',
                birthYear: 0,
                birthMonth: 0,
                birthDay: 0,
                phoneNumber: '',
                profileImageUrl: photoURL || '',
                createdAt: serverTimestamp(),
                isAdmin: false
              },
              stats: {
                level: 1,
                totalExperience: 0,
                currentExp: 0,
                currentLevelRequiredXp: 0,
                streak: 0,
                postCount: 0,
                commentCount: 0,
                likeCount: 0
              },
              agreements: {
                terms: false,
                privacy: false,
                location: false,
                marketing: false
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              emailVerified
            });
          }
        } catch (error) {
          console.error('사용자 데이터 조회 오류:', error);
          // 오류 발생 시 기본값 사용
          const authToken = await firebaseUser.getIdToken();
          Cookies.set('authToken', authToken, { expires: 7 });
          Cookies.set('emailVerified', emailVerified ? 'true' : 'false', { expires: 7 });
          Cookies.set('uid', uid, { expires: 7 });
          Cookies.set('userId', uid, { expires: 7 }); // 추가: 일관성을 위해
          
          console.log('AuthProvider - 오류 후 기본 쿠키 설정:', { uid });
          
          setUser({
            uid,
            email: email || '',
            role: 'student',
            isVerified: emailVerified,
            profile: {
              userName: displayName || '',
              realName: '',
              gender: '',
              birthYear: 0,
              birthMonth: 0,
              birthDay: 0,
              phoneNumber: '',
              profileImageUrl: photoURL || '',
              createdAt: serverTimestamp(),
              isAdmin: false
            },
            stats: {
              level: 1,
              totalExperience: 0,
              currentExp: 0,
              currentLevelRequiredXp: 0,
              streak: 0,
              postCount: 0,
              commentCount: 0,
              likeCount: 0
            },
            agreements: {
              terms: false,
              privacy: false,
              location: false,
              marketing: false
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            emailVerified
          });
        }
      } else {
        // 로그아웃 시 쿠키 삭제
        Cookies.remove('authToken');
        Cookies.remove('emailVerified');
        Cookies.remove('uid');
        Cookies.remove('userId'); // 추가: 일관성을 위해
        Cookies.remove('userRole');
        
        console.log('AuthProvider - 로그아웃: 모든 쿠키 삭제');
        
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 회원가입
  const signUp = async (email: string, password: string, userName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      
      // 사용자 프로필 업데이트
      await updateProfile(user, { displayName: userName });
      
      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
                  profile: {
            userName,
            realName: '',
            gender: '',
            birthYear: 0,
            birthMonth: 0,
            birthDay: 0,
            phoneNumber: '',
            profileImageUrl: user.photoURL || '',
            createdAt: serverTimestamp(),
            isAdmin: false
          },
        createdAt: new Date(),
        role: 'user'
      });
      
      router.push('/');
    } catch (error: unknown) {
      console.error('회원가입 오류:', error);
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 인증 토큰 쿠키 설정 (7일 유효)
      Cookies.set('authToken', await user.getIdToken(), { expires: 7 });
      
      // 사용자 UID 쿠키 설정 (일관성을 위해 uid와 userId 둘 다 설정)
      Cookies.set('uid', user.uid, { expires: 7 });
      Cookies.set('userId', user.uid, { expires: 7 });
      
      // 인증된 사용자는 메인 페이지로 리디렉션
      router.push('/');
    } catch (error: unknown) {
      console.error('로그인 오류:', error);
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'auth/invalid-credential') {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    setIsLoading(true);
    try {
      // 쿠키 삭제
      Cookies.remove('authToken');
      Cookies.remove('uid');
      Cookies.remove('userId');
      
      await firebaseSignOut(auth);
      router.push('/');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      setError('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 구글 로그인
  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 사용자 정보 저장
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          profile: {
            userName: user.displayName || '',
            email: user.email || '',
            realName: '',
            birthYear: 0,
            birthMonth: 0,
            birthDay: 0,
            phoneNumber: '',
            profileImageUrl: user.photoURL || '',
            createdAt: serverTimestamp(),
            isAdmin: false
          },
          createdAt: new Date(),
          role: 'user'
        });
      }
      
      router.push('/');
    } catch (error: unknown) {
      console.error('구글 로그인 오류:', error);
      setError('구글 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 재설정
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      console.error('비밀번호 재설정 오류:', error);
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'auth/user-not-found') {
        setError('해당 이메일로 등록된 계정을 찾을 수 없습니다.');
      } else {
        setError('비밀번호 재설정 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 오류 초기화
  const resetError = () => {
    setError(null);
  };

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    if (!auth.currentUser) return;
    
    const firebaseUser = auth.currentUser;
    const { uid, email, displayName, photoURL, emailVerified } = firebaseUser;
    
    try {
      setIsLoading(true);
      
      // Firestore에서 최신 사용자 데이터 가져오기
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const firestoreUserData = userDoc.data();
        
        setUser({
          uid,
          email: email || '',
          role: firestoreUserData.role || 'student',
          isVerified: emailVerified,
          profile: firestoreUserData.profile || {
            userName: displayName || '',
            realName: '',
            gender: '',
            birthYear: 0,
            birthMonth: 0,
            birthDay: 0,
            phoneNumber: '',
            profileImageUrl: photoURL || '',
            createdAt: firestoreUserData.createdAt || serverTimestamp(),
            isAdmin: false
          },
          stats: firestoreUserData.stats || {
            level: 1,
            totalExperience: 0,
            currentExp: 0,
            currentLevelRequiredXp: 0,
            streak: 0,
            postCount: 0,
            commentCount: 0,
            likeCount: 0
          },
          school: firestoreUserData.school,
          regions: firestoreUserData.regions,
          agreements: firestoreUserData.agreements || {
            terms: false,
            privacy: false,
            location: false,
            marketing: false
          },
          createdAt: firestoreUserData.createdAt || serverTimestamp(),
          updatedAt: firestoreUserData.updatedAt || serverTimestamp(),
          emailVerified
        });
        
        // 관리자 권한 확인
        const isUserAdmin = firestoreUserData.role === 'admin';
        setIsAdmin(isUserAdmin);
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 하이드레이션이 완료될 때까지 로딩 상태 표시
  if (!isMounted) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
        resetPassword,
        resetError,
        refreshUser,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 