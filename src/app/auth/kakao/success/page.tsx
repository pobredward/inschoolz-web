'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface KakaoUserInfo {
  id: number;
  kakao_account: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    phone_number?: string;
    birthday?: string;
    birthyear?: string;
    gender?: 'female' | 'male';
  };
}

/**
 * 카카오 사용자 정보 조회
 */
async function getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
  try {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error('사용자 정보 조회 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('카카오 사용자 정보 조회 실패:', error);
    throw error;
  }
}

/**
 * 카카오 사용자 정보를 Firebase User 형식으로 변환
 */
function convertKakaoUserToFirebaseUser(kakaoUser: KakaoUserInfo, uid: string): User {
  const profile = kakaoUser.kakao_account.profile;
  const birthday = kakaoUser.kakao_account.birthday;
  const birthyear = kakaoUser.kakao_account.birthyear;

  return {
    uid,
    email: kakaoUser.kakao_account.email || '',
    role: 'student',
    isVerified: true,
    profile: {
      userName: profile?.nickname || `카카오사용자${kakaoUser.id}`,
      realName: '',
      gender: kakaoUser.kakao_account.gender === 'female' ? '여성' : 
              kakaoUser.kakao_account.gender === 'male' ? '남성' : '',
      birthYear: birthyear ? parseInt(birthyear) : 0,
      birthMonth: birthday ? parseInt(birthday.substring(0, 2)) : 0,
      birthDay: birthday ? parseInt(birthday.substring(2, 4)) : 0,
      phoneNumber: kakaoUser.kakao_account.phone_number || '',
      profileImageUrl: profile?.profile_image_url || '',
      createdAt: Timestamp.now(),
      isAdmin: false
    },
    stats: {
      level: 1,
      currentExp: 0,
      totalExperience: 0,
      currentLevelRequiredXp: 10,
      postCount: 0,
      commentCount: 0,
      likeCount: 0,
      streak: 0
    },
    agreements: {
      terms: true,
      privacy: true,
      location: false,
      marketing: false
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

function KakaoSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processKakaoLogin = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        
        if (!accessToken) {
          throw new Error('액세스 토큰이 없습니다.');
        }

        setStatus('processing');

        // 1. 카카오 사용자 정보 조회
        const kakaoUser = await getKakaoUserInfo(accessToken);

        // 2. 카카오 이메일로 Firebase 이메일 로그인 시도
        const kakaoEmail = kakaoUser.kakao_account.email;
        if (!kakaoEmail) {
          throw new Error('카카오에서 이메일 정보를 제공하지 않습니다. 카카오 계정 설정을 확인해주세요.');
        }

        console.log('📧 카카오 이메일로 Firebase 로그인 시도:', kakaoEmail);
        
        // 3. Firebase 이메일 로그인 (카카오 ID 기반 고정 비밀번호, 6자 이상)
        const emailPrefix = kakaoEmail.split('@')[0];
        const kakaoPassword = `KakaoAuth${kakaoUser.id}${emailPrefix}2025!`;
        
        console.log('🔐 생성된 비밀번호 정보:', {
          kakaoId: kakaoUser.id,
          emailPrefix,
          passwordLength: kakaoPassword.length,
          password: kakaoPassword // 개발용, 나중에 제거 필요
        });
        let firebaseUser;
        
        try {
          // 기존 사용자로 로그인 시도
          console.log('🔍 기존 사용자 로그인 시도:', kakaoEmail);
          const userCredential = await signInWithEmailAndPassword(auth, kakaoEmail, kakaoPassword);
          firebaseUser = userCredential.user;
          console.log('✅ 기존 카카오 사용자 로그인 성공');
        } catch (loginError: any) {
          console.log('ℹ️ 기존 사용자 로그인 실패:', loginError.code, loginError.message);
          
          if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-login-credentials') {
            console.log('📝 신규 사용자 생성 시도');
            try {
              // 신규 사용자 생성
              const userCredential = await createUserWithEmailAndPassword(auth, kakaoEmail, kakaoPassword);
              firebaseUser = userCredential.user;
              console.log('✅ 신규 카카오 사용자 생성 성공');
            } catch (createError: any) {
              console.error('❌ 신규 사용자 생성 실패:', createError.code, createError.message);
              
              if (createError.code === 'auth/email-already-in-use') {
                // 이메일이 이미 존재하지만 비밀번호가 다른 경우
                throw new Error('해당 이메일은 이미 다른 방식으로 가입된 계정입니다. 일반 로그인을 사용해주세요.');
              } else {
                throw createError;
              }
            }
          } else {
            throw loginError;
          }
        }
        
        // 3.5. Firebase Auth 프로필 업데이트 (이메일과 displayName 설정)
        try {
          await updateProfile(firebaseUser, {
            displayName: kakaoUser.kakao_account.profile?.nickname || `카카오사용자${kakaoUser.id}`,
            photoURL: kakaoUser.kakao_account.profile?.profile_image_url || null,
          });
          console.log('✅ Firebase Auth 프로필 업데이트 성공:', {
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL
          });
        } catch (profileError) {
          console.warn('⚠️ Firebase Auth 프로필 업데이트 실패 (무시하고 계속):', profileError);
        }

        // 3.6. 쿠키 즉시 설정 (middleware 인증을 위해)
        try {
          const idToken = await firebaseUser.getIdToken(true);
          const setCookieForAuth = (name: string, value: string, days = 1) => {
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
            const isProduction = process.env.NODE_ENV === 'production';
            const secureOption = isProduction ? '; secure' : '';
            document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/${secureOption}; samesite=strict`;
          };
          
          setCookieForAuth('authToken', idToken, 1);
          console.log('🍪 카카오 로그인: 인증 쿠키 즉시 설정 완료');
        } catch (cookieError) {
          console.warn('⚠️ 쿠키 설정 실패 (무시하고 계속):', cookieError);
        }
        
        // 4. Firestore에서 사용자 정보 확인/생성
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        let userRole = 'student'; // 기본값

        if (userDoc.exists()) {
          // 기존 사용자: 마지막 로그인 시간 업데이트
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          const userData = userDoc.data() as User;
          userRole = userData.role;
          console.log('✅ 기존 사용자 로그인 완료');
        } else {
          // 신규 사용자: Firestore에 정보 저장 (Firebase UID 사용)
          const newUser = convertKakaoUserToFirebaseUser(kakaoUser, firebaseUser.uid);
          
          // 이메일 정보는 Firebase Auth에서 자동으로 설정되므로 카카오 이메일로 덮어쓰기
          newUser.email = kakaoEmail;
          
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          
          userRole = newUser.role;
          console.log('✅ 신규 사용자 가입 완료');
          toast.success('카카오 계정으로 회원가입이 완료되었습니다!');
        }

        // 4.5. 추가 쿠키 설정 (사용자 role과 uid)
        try {
          const setCookieForAuth = (name: string, value: string, days = 30) => {
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
            const isProduction = process.env.NODE_ENV === 'production';
            const secureOption = isProduction ? '; secure' : '';
            document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/${secureOption}; samesite=strict`;
          };
          
          setCookieForAuth('uid', firebaseUser.uid, 30);
          setCookieForAuth('userId', firebaseUser.uid, 30);
          setCookieForAuth('userRole', userRole, 30);
          console.log('🍪 카카오 로그인: 추가 쿠키 설정 완료', { uid: firebaseUser.uid, userRole });
        } catch (cookieError) {
          console.warn('⚠️ 추가 쿠키 설정 실패 (무시하고 계속):', cookieError);
        }

        setStatus('success');
        
        // 이메일 로그인이므로 AuthProvider가 즉시 인식함
        console.log('✅ 카카오 이메일 로그인 완료, AuthProvider 자동 동기화됨');
        
        // 메인 페이지로 이동 (기본값을 메인 페이지로 설정)
        const redirectUrl = sessionStorage.getItem('kakao_login_redirect') || '/';
        sessionStorage.removeItem('kakao_login_redirect');
        
        // 이메일 로그인이므로 즉시 리다이렉트 가능
        console.log('🔄 리다이렉트 준비:', redirectUrl);
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1000);

      } catch (error) {
        console.error('❌ 카카오 로그인 처리 실패:', error);
        setStatus('error');
        toast.error(error instanceof Error ? error.message : '로그인 처리 중 오류가 발생했습니다.');
        
        // 3초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    processKakaoLogin();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center space-y-6">
          {/* 카카오 로고 */}
          <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-brown-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C7.03 3 3 6.58 3 11c0 2.91 2.05 5.47 5 6.48v2.58c0 .25.33.4.55.26L11.09 18H12c4.97 0 9-3.58 9-8s-4.03-8-9-8z"/>
            </svg>
          </div>

          {/* 상태별 메시지 */}
          {status === 'processing' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900">카카오 로그인 처리 중</h1>
              <p className="text-gray-600">잠시만 기다려주세요...</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="text-2xl font-bold text-green-600">로그인 성공!</h1>
              <p className="text-gray-600">카카오 계정으로 로그인되었습니다.</p>
              <div className="text-green-500">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">인증 상태를 업데이트하고 있습니다...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="text-2xl font-bold text-red-600">로그인 실패</h1>
              <p className="text-gray-600">로그인 처리 중 문제가 발생했습니다.</p>
              <div className="text-red-500">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">로그인 페이지로 돌아갑니다...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KakaoSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-brown-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C7.03 3 3 6.58 3 11c0 2.91 2.05 5.47 5 6.48v2.58c0 .25.33.4.55.26L11.09 18H12c4.97 0 9-3.58 9-8s-4.03-8-9-8z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">카카오 로그인 처리 중</h1>
            <p className="text-gray-600">잠시만 기다려주세요...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <KakaoSuccessContent />
    </Suspense>
  );
}
