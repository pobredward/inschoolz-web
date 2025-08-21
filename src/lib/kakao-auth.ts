/**
 * 카카오 로그인 인증 라이브러리
 * 카카오 JavaScript SDK를 사용하여 로그인/회원가입 처리
 */

import { User } from '@/types';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { db, auth } from './firebase';

// 카카오 SDK 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      Auth: {
        authorize: (options: {
          redirectUri: string;
          state?: string;
        }) => void;
        getAccessToken: () => string | null;
        setAccessToken: (token: string) => void;
        logout: (callback?: () => void) => void;
      };
      API: {
        request: (options: {
          url: string;
          success?: (response: any) => void;
          fail?: (error: any) => void;
        }) => void;
      };
    };
  }
}

// 카카오 사용자 정보 타입
interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account: {
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile: {
      nickname: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    has_email?: boolean;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
    has_phone_number?: boolean;
    phone_number_needs_agreement?: boolean;
    phone_number?: string;
    has_age_range?: boolean;
    age_range_needs_agreement?: boolean;
    age_range?: string;
    has_birthday?: boolean;
    birthday_needs_agreement?: boolean;
    birthday?: string;
    birthday_type?: string;
    has_gender?: boolean;
    gender_needs_agreement?: boolean;
    gender?: string;
  };
}

/**
 * 카카오 SDK 초기화
 */
export const initializeKakao = (): void => {
  if (typeof window === 'undefined') return;
  
  const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
  
  if (!kakaoAppKey) {
    console.error('NEXT_PUBLIC_KAKAO_APP_KEY가 설정되지 않았습니다.');
    return;
  }

  try {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(kakaoAppKey);
      console.log('카카오 SDK 초기화 완료');
    }
  } catch (error) {
    console.error('카카오 SDK 초기화 실패:', error);
  }
};

/**
 * 카카오 로그인 시작 (리다이렉트 방식)
 */
export const startKakaoLogin = (): void => {
  if (typeof window === 'undefined') return;
  
  let redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  
  // 환경 변수가 없는 경우 현재 도메인 기반으로 생성
  if (!redirectUri) {
    const currentOrigin = window.location.origin;
    redirectUri = `${currentOrigin}/api/auth/callback/kakao`;
    console.log('[KAKAO] 환경 변수 없음, 자동 생성된 리다이렉트 URI:', redirectUri);
  }

  console.log('[KAKAO] 사용할 리다이렉트 URI:', redirectUri);

  try {
    window.Kakao.Auth.authorize({
      redirectUri,
      state: Math.random().toString(36).substring(2, 15), // CSRF 방지용 랜덤 상태값
    });
  } catch (error) {
    console.error('카카오 로그인 시작 실패:', error);
    throw new Error('카카오 로그인을 시작할 수 없습니다.');
  }
};

/**
 * 카카오 사용자 정보 가져오기
 */
export const getKakaoUserInfo = (): Promise<KakaoUserInfo> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('클라이언트 환경에서만 사용 가능합니다.'));
      return;
    }

    try {
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: (response: KakaoUserInfo) => {
          console.log('카카오 사용자 정보 조회 성공:', response);
          resolve(response);
        },
        fail: (error: any) => {
          console.error('카카오 사용자 정보 조회 실패:', error);
          reject(new Error('카카오 사용자 정보를 가져올 수 없습니다.'));
        },
      });
    } catch (error) {
      console.error('카카오 API 요청 실패:', error);
      reject(new Error('카카오 API 요청 중 오류가 발생했습니다.'));
    }
  });
};

/**
 * 카카오 사용자 정보를 우리 시스템의 User 타입으로 변환
 */
export const convertKakaoUserToUser = (kakaoUser: KakaoUserInfo, accessToken: string): User => {
  const now = Timestamp.now();
  
  return {
    uid: `kakao_${kakaoUser.id}`, // 카카오 ID를 uid로 사용
    email: kakaoUser.kakao_account.email || '',
    role: 'student',
    isVerified: !!kakaoUser.kakao_account.is_email_verified,
    profile: {
      userName: kakaoUser.kakao_account.profile.nickname || kakaoUser.properties.nickname || '카카오사용자',
      realName: '',
      gender: kakaoUser.kakao_account.gender || '',
      birthYear: 0,
      birthMonth: 0,
      birthDay: 0,
      phoneNumber: kakaoUser.kakao_account.phone_number || '',
      profileImageUrl: kakaoUser.kakao_account.profile.profile_image_url || kakaoUser.properties.profile_image || '',
      createdAt: now,
      isAdmin: false,
    },
    stats: {
      level: 1,
      currentExp: 0,
      totalExperience: 0,
      currentLevelRequiredXp: 10,
      postCount: 0,
      commentCount: 0,
      likeCount: 0,
      streak: 0,
    },
    agreements: {
      terms: false, // 추가 약관 동의 필요
      privacy: false,
      location: false,
      marketing: false,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // 카카오 관련 추가 정보
    kakaoId: kakaoUser.id.toString(),
    kakaoAccessToken: accessToken,
  };
};

/**
 * Firebase Custom Token 생성 요청
 */
const createFirebaseCustomToken = async (accessToken: string): Promise<string> => {
  const response = await fetch('/api/auth/kakao/firebase-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Firebase 토큰 생성 실패');
  }

  const data = await response.json();
  return data.customToken;
};

/**
 * 카카오 로그인으로 사용자 생성 또는 로그인 처리 (Firebase Auth 연동)
 */
export const processKakaoLogin = async (accessToken: string): Promise<User> => {
  try {
    // 액세스 토큰 설정
    if (typeof window !== 'undefined') {
      window.Kakao.Auth.setAccessToken(accessToken);
    }

    console.log('[KAKAO LOGIN] 카카오 로그인 프로세스 시작');

    // 1. Firebase Custom Token 생성
    const customToken = await createFirebaseCustomToken(accessToken);
    console.log('[KAKAO LOGIN] Firebase Custom Token 생성 완료');

    // 2. Firebase Auth에 로그인
    const userCredential = await signInWithCustomToken(auth, customToken);
    const firebaseUser = userCredential.user;
    console.log('[KAKAO LOGIN] Firebase Auth 로그인 완료:', firebaseUser.uid);

    // 3. 카카오 사용자 정보 가져오기
    const kakaoUser = await getKakaoUserInfo();
    const userId = firebaseUser.uid;

    // 4. Firestore에서 기존 사용자 확인
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (userDoc.exists()) {
      // 기존 사용자: 로그인 시간 및 토큰 업데이트
      const existingUser = userDoc.data() as User;
      
      await updateDoc(doc(db, 'users', userId), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        kakaoAccessToken: accessToken, // 최신 액세스 토큰으로 업데이트
      });

      console.log('[KAKAO LOGIN] 기존 사용자 로그인 성공:', existingUser.profile.userName);
      return existingUser;
    } else {
      // 신규 사용자: 계정 생성
      const newUser = convertKakaoUserToUser(kakaoUser, accessToken);
      // Firebase Auth에서 생성된 UID 사용
      newUser.uid = userId;
      
      await setDoc(doc(db, 'users', userId), newUser);
      
      console.log('[KAKAO LOGIN] 신규 사용자 생성 성공:', newUser.profile.userName);
      return newUser;
    }
  } catch (error) {
    console.error('[KAKAO LOGIN] 로그인 처리 실패:', error);
    throw new Error('카카오 로그인 처리 중 오류가 발생했습니다.');
  }
};

/**
 * 카카오 로그아웃
 */
export const kakaoLogout = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    try {
      window.Kakao.Auth.logout(() => {
        console.log('카카오 로그아웃 완료');
        resolve();
      });
    } catch (error) {
      console.error('카카오 로그아웃 실패:', error);
      // 에러가 발생해도 로그아웃 처리를 완료
      resolve();
    }
  });
};

/**
 * 카카오 SDK 스크립트 동적 로드
 */
export const loadKakaoSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('클라이언트 환경에서만 사용 가능합니다.'));
      return;
    }

    // 이미 로드된 경우
    if (window.Kakao) {
      resolve();
      return;
    }

    // 스크립트 태그 생성
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4';
    script.crossOrigin = 'anonymous';
    script.async = true;

    script.onload = () => {
      console.log('카카오 SDK 로드 완료');
      initializeKakao();
      resolve();
    };

    script.onerror = () => {
      console.error('카카오 SDK 로드 실패');
      reject(new Error('카카오 SDK를 로드할 수 없습니다.'));
    };

    document.head.appendChild(script);
  });
};
