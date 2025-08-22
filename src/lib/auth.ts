import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInWithCustomToken
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

/**
 * 환경에 따른 카카오 Redirect URI 반환
 */
const getKakaoRedirectUri = (): string => {
  // 개발 환경에서는 localhost 사용
  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:3000/api/auth/callback/kakao';
  }
  
  // 프로덕션에서는 환경 변수 사용
  return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'https://inschoolz.com/api/auth/callback/kakao';
};

/**
 * userName 중복 확인 (대소문자 구분)
 */
export const checkUserNameAvailability = async (userName: string): Promise<boolean> => {
  try {
    const trimmedUserName = userName.trim();
    
    if (trimmedUserName.length < 2) {
      return false;
    }
    
    console.log(`[DEBUG] Checking userName availability for: "${trimmedUserName}"`);
    
    // users 컬렉션에서 정확히 같은 userName이 있는지 확인 (대소문자 구분)
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('profile.userName', '==', trimmedUserName)
    );
    
    const querySnapshot = await getDocs(q);
    
    console.log(`[DEBUG] Query result: ${querySnapshot.size} documents found`);
    
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log(`[DEBUG] Found existing userName: "${userData.profile?.userName}"`);
      });
    }
    
    // 문서가 존재하면 중복, 존재하지 않으면 사용 가능
    const isAvailable = querySnapshot.empty;
    console.log(`[DEBUG] userName "${trimmedUserName}" is ${isAvailable ? 'available' : 'taken'}`);
    
    return isAvailable;
  } catch (error) {
    console.error('userName 중복 확인 오류:', error);
    // 오류 발생시 안전하게 false 반환 (중복으로 간주)
    return false;
  }
};

/**
 * 휴대폰 번호를 한국 표준 형식(010-1234-5678)으로 정규화
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // 모든 비숫자 문자 제거
  const numbers = phoneNumber.replace(/\D/g, '');
  
  // +82로 시작하는 경우 처리
  if (phoneNumber.startsWith('+82')) {
    const koreanNumber = numbers.slice(2); // +82 제거
    // 첫 번째 0이 없으면 추가
    const normalizedNumber = koreanNumber.startsWith('1') ? `0${koreanNumber}` : koreanNumber;
    
    // 010-1234-5678 형식으로 포맷팅
    if (normalizedNumber.length === 11) {
      return `${normalizedNumber.slice(0, 3)}-${normalizedNumber.slice(3, 7)}-${normalizedNumber.slice(7)}`;
    }
  }
  
  // 일반적인 010으로 시작하는 경우
  if (numbers.length === 11 && numbers.startsWith('010')) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  // 길이가 10인 경우 (0이 빠진 경우)
  if (numbers.length === 10 && numbers.startsWith('10')) {
    const fullNumber = `0${numbers}`;
    return `${fullNumber.slice(0, 3)}-${fullNumber.slice(3, 7)}-${fullNumber.slice(7)}`;
  }
  
  // 정규화할 수 없는 경우 원본 반환
  return phoneNumber;
};

/**
 * 이메일 중복 확인
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      return false;
    }
    
    console.log(`[DEBUG] Checking email existence for: "${trimmedEmail}"`);
    
    // users 컬렉션에서 이메일 확인
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', trimmedEmail));
    const querySnapshot = await getDocs(q);
    
    console.log(`[DEBUG] Query for email "${trimmedEmail}": ${querySnapshot.size} documents found`);
    
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log(`[DEBUG] Found existing email: "${userData.email}"`);
      });
      return true;
    }
    
    console.log(`[DEBUG] No duplicate found for email "${trimmedEmail}"`);
    return false;
  } catch (error) {
    console.error('이메일 중복 확인 오류:', error);
    return false;
  }
};

/**
 * 휴대폰 번호 중복 확인
 */
export const checkPhoneNumberExists = async (phoneNumber: string): Promise<boolean> => {
  try {
    // 입력된 번호를 여러 형식으로 정규화하여 검색
    const inputNumber = phoneNumber.trim();
    
    // 가능한 형식들
    const possibleFormats = [
      inputNumber, // 원본 그대로
      inputNumber.replace(/-/g, ''), // 하이픈 제거
      inputNumber.startsWith('+82') ? inputNumber : `+82${inputNumber.replace(/^0/, '').replace(/-/g, '')}`, // +82 형식
      inputNumber.startsWith('010') ? inputNumber : `010${inputNumber.replace(/^\+82/, '').replace(/-/g, '')}`, // 010 형식
    ];
    
    console.log(`[DEBUG] Checking phone number existence for input: "${inputNumber}"`);
    console.log(`[DEBUG] Possible formats to check:`, possibleFormats);
    
    // users 컬렉션에서 여러 형식으로 검색
    const usersRef = collection(db, 'users');
    
    for (const format of possibleFormats) {
      const q = query(
        usersRef, 
        where('profile.phoneNumber', '==', format)
      );
      
      const querySnapshot = await getDocs(q);
      
      console.log(`[DEBUG] Query for "${format}": ${querySnapshot.size} documents found`);
      
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log(`[DEBUG] Found existing phone: "${userData.profile?.phoneNumber}"`);
        });
        return true; // 중복 발견
      }
    }
    
    console.log(`[DEBUG] No duplicates found for any format`);
    return false;
  } catch (error) {
    console.error('휴대폰 번호 확인 오류:', error);
    return false;
  }
};

/**
 * 이메일/비밀번호로 회원가입
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  userName: string
): Promise<User> => {
  try {
    // Firebase 인증으로 계정 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // 프로필 업데이트
    await updateProfile(firebaseUser, { displayName: userName });
    
    // Firestore에 사용자 정보 저장
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: 'student',
      isVerified: true,
      profile: {
        userName: userName.trim(),
        realName: '',
        gender: '',
        birthYear: 0,
        birthMonth: 0,
        birthDay: 0,
        phoneNumber: '',
        profileImageUrl: '',
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
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    
    return newUser;
  } catch (error) {
    console.error('회원가입 오류:', error);
    
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        throw new Error('이미 가입된 이메일 주소입니다.');
      } else if (firebaseError.code === 'auth/weak-password') {
        throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        throw new Error('유효하지 않은 이메일 형식입니다.');
      }
    }
    
    throw new Error('회원가입 중 오류가 발생했습니다.');
  }
};

/**
 * 이메일/비밀번호로 로그인
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    // Firebase 인증으로 로그인
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Firestore에서 사용자 정보 가져오기
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      // 마지막 로그인 시간 업데이트
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return userDoc.data() as User;
    } else {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/user-not-found') {
        throw new Error('가입되지 않은 이메일입니다.');
      } else if (firebaseError.code === 'auth/wrong-password') {
        throw new Error('비밀번호가 올바르지 않습니다.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        throw new Error('올바르지 않은 이메일 형식입니다.');
      } else if (firebaseError.code === 'auth/invalid-credential') {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    }
    
    throw new Error('로그인 중 오류가 발생했습니다.');
  }
};

/**
 * Google로 로그인
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    
    // Firestore에서 사용자 정보 확인
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      // 기존 사용자: 마지막 로그인 시간 업데이트
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return userDoc.data() as User;
    } else {
      // 신규 사용자: Firestore에 정보 저장
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        profile: {
          userName: firebaseUser.displayName || '사용자',
          realName: '',
          gender: '',
          birthYear: 0,
          birthMonth: 0,
          birthDay: 0,
          phoneNumber: '',
          profileImageUrl: firebaseUser.photoURL || '',
          createdAt: Timestamp.now(),
          isAdmin: false
        },
        role: 'student',
        isVerified: false,
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
          terms: false,
          privacy: false,
          location: false,
          marketing: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      return newUser;
    }
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    throw new Error('Google 로그인 중 오류가 발생했습니다.');
  }
};

/**
 * 카카오 로그인 시작 (리다이렉트 방식)
 */
export const startKakaoLogin = () => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('카카오 로그인은 브라우저에서만 실행할 수 있습니다.');
    }

    const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    const redirectUri = getKakaoRedirectUri();

    if (!kakaoAppKey) {
      throw new Error('카카오 앱 키가 설정되지 않았습니다.');
    }

    console.log('카카오 로그인 설정:', {
      environment: process.env.NODE_ENV,
      redirectUri,
      appKey: kakaoAppKey?.substring(0, 8) + '...'
    });

    // 카카오 OAuth 인가 코드 요청 URL 생성
    const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
    kakaoAuthUrl.searchParams.append('client_id', kakaoAppKey);
    kakaoAuthUrl.searchParams.append('redirect_uri', redirectUri);
    kakaoAuthUrl.searchParams.append('response_type', 'code');
    kakaoAuthUrl.searchParams.append('scope', 'profile_nickname,profile_image,account_email');

    console.log('카카오 로그인 URL:', kakaoAuthUrl.toString());

    // 카카오 로그인 페이지로 리다이렉트
    window.location.href = kakaoAuthUrl.toString();
  } catch (error) {
    console.error('카카오 로그인 시작 오류:', error);
    throw new Error('카카오 로그인을 시작할 수 없습니다.');
  }
};

/**
 * 카카오 JavaScript SDK를 사용한 로그인 (팝업 방식)
 */
export const loginWithKakaoSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined') {
        reject(new Error('카카오 로그인은 브라우저에서만 실행할 수 있습니다.'));
        return;
      }

      if (!window.Kakao || !window.Kakao.isInitialized()) {
        reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
        return;
      }

      window.Kakao.Auth.login({
        success: (authObj: any) => {
          console.log('카카오 로그인 성공:', authObj);
          
          // 사용자 정보 요청
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: (res: any) => {
              console.log('카카오 사용자 정보:', res);
              // 여기서 Firebase Auth와 연동하거나 자체 처리 로직 구현
              resolve();
            },
            fail: (error: any) => {
              console.error('카카오 사용자 정보 요청 실패:', error);
              reject(new Error('사용자 정보를 가져올 수 없습니다.'));
            }
          });
        },
        fail: (error: any) => {
          console.error('카카오 로그인 실패:', error);
          reject(new Error('카카오 로그인에 실패했습니다.'));
        }
      });
    } catch (error) {
      console.error('카카오 SDK 로그인 오류:', error);
      reject(new Error('카카오 로그인 중 오류가 발생했습니다.'));
    }
  });
};

/**
 * 카카오 사용자 데이터로 Firebase Auth 및 Firestore에 사용자 생성/로그인
 */
export const processKakaoLogin = async (kakaoUserData: {
  id: number;
  email?: string;
  nickname?: string;
  profile_image?: string;
  access_token: string;
}): Promise<User> => {
  try {
    // 카카오 ID를 기반으로 기존 사용자 확인
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('kakaoId', '==', kakaoUserData.id.toString()));
    const querySnapshot = await getDocs(q);

    let user: User;

    if (!querySnapshot.empty) {
      // 기존 사용자 로그인
      const userDoc = querySnapshot.docs[0];
      user = userDoc.data() as User;

      // 마지막 로그인 시간 업데이트
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('기존 카카오 사용자 로그인:', user);
    } else {
      // 새 사용자 생성
      const newUserId = `kakao_${kakaoUserData.id}`;
      
      user = {
        uid: newUserId,
        email: kakaoUserData.email || '',
        kakaoId: kakaoUserData.id.toString(),
        profile: {
          userName: kakaoUserData.nickname || `카카오사용자${kakaoUserData.id}`,
          realName: '',
          gender: '',
          birthYear: 0,
          birthMonth: 0,
          birthDay: 0,
          phoneNumber: '',
          profileImageUrl: kakaoUserData.profile_image || '',
          createdAt: Timestamp.now(),
          isAdmin: false
        },
        role: 'student',
        isVerified: false,
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
          terms: true, // 카카오 로그인 시 기본 동의로 처리
          privacy: true,
          location: false,
          marketing: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', newUserId), user);
      
      console.log('새 카카오 사용자 생성:', user);
    }

    return user;
  } catch (error) {
    console.error('카카오 로그인 처리 오류:', error);
    throw new Error('카카오 로그인 처리 중 오류가 발생했습니다.');
  }
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw new Error('로그아웃 중 오류가 발생했습니다.');
  }
};

/**
 * 현재 로그인된 사용자 가져오기 (Promise 버전)
 */
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            resolve(userDoc.data() as User);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 오류:', error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * 휴대폰 인증 코드 발송
 */
export const sendPhoneVerificationCode = async (
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    // 휴대폰 번호 형식 정규화 (+82 형식으로 변환)
    const normalizedPhoneNumber = phoneNumber.startsWith('+82') 
      ? phoneNumber 
      : phoneNumber.replace(/^0/, '+82');
    
    const confirmationResult = await signInWithPhoneNumber(auth, normalizedPhoneNumber, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('휴대폰 인증 코드 발송 오류:', error);
    
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      
      // reCAPTCHA Enterprise 관련 오류 처리
      if (firebaseError.message.includes('reCAPTCHA Enterprise') || 
          firebaseError.message.includes('Triggering the reCAPTCHA v2')) {
        console.warn('reCAPTCHA Enterprise 설정 오류 감지됨. v2로 fallback 처리됨.');
        // 재시도 로직은 UI에서 처리하도록 특별한 오류 메시지 전달
        throw new Error('RECAPTCHA_ENTERPRISE_FALLBACK');
      }
      
      if (firebaseError.code === 'auth/invalid-phone-number') {
        throw new Error('유효하지 않은 휴대폰 번호입니다.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        throw new Error('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else if (firebaseError.code === 'auth/invalid-app-credential') {
        throw new Error('앱 인증 정보가 올바르지 않습니다. 관리자에게 문의하세요.');
      } else if (firebaseError.code === 'auth/captcha-check-failed') {
        throw new Error('보안 검증에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
      }
    }
    
    throw new Error('휴대폰 인증 코드 발송 중 오류가 발생했습니다.');
  }
};

/**
 * 휴대폰 인증 코드 확인 및 로그인
 */
export const confirmPhoneVerificationCode = async (
  confirmationResult: ConfirmationResult,
  verificationCode: string,
  userName?: string
): Promise<User> => {
  try {
    const userCredential = await confirmationResult.confirm(verificationCode);
    const firebaseUser = userCredential.user;
    
    // Firestore에서 사용자 정보 확인
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      // 기존 사용자: 마지막 로그인 시간 업데이트
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return userDoc.data() as User;
    } else {
      // 신규 사용자: Firestore에 정보 저장
      const newUser: User = {
        uid: firebaseUser.uid,
        email: '',
        profile: {
          userName: (userName || '사용자').trim(),
          realName: '',
          gender: '',
          birthYear: 0,
          birthMonth: 0,
          birthDay: 0,
          phoneNumber: normalizePhoneNumber(firebaseUser.phoneNumber || ''),
          profileImageUrl: '',
          createdAt: Timestamp.now(),
          isAdmin: false
        },
        role: 'student',
        isVerified: true,
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
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      return newUser;
    }
  } catch (error) {
    console.error('휴대폰 인증 코드 확인 오류:', error);
    
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/invalid-verification-code') {
        throw new Error('잘못된 인증번호입니다.');
      } else if (firebaseError.code === 'auth/code-expired') {
        throw new Error('인증번호가 만료되었습니다. 다시 요청해주세요.');
      }
    }
    
    throw new Error('휴대폰 인증 중 오류가 발생했습니다.');
  }
};

/**
 * reCAPTCHA 인증기 생성
 */
export const createRecaptchaVerifier = (containerId: string): RecaptchaVerifier => {
  // 개발 환경에서 테스트를 위한 설정
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // reCAPTCHA Enterprise 사이트 키 설정
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LdWZqwrAAAAAGwzb3hss860jQgsCiOX_XnnypHr';
  
  // reCAPTCHA Enterprise 지원을 위한 설정
  const recaptchaConfig = {
    'size': isDevelopment ? 'normal' : 'invisible', // 개발 환경에서는 visible로 설정
    'callback': () => {
      // reCAPTCHA solved
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      // Response expired
      console.log('reCAPTCHA expired');
    },
    // reCAPTCHA Enterprise 호환성을 위한 추가 설정
    'hl': 'ko', // 한국어 설정
    'isolated': true, // 격리 모드로 설정
    // Enterprise 사이트 키 설정 (v3 호환)
    'sitekey': recaptchaSiteKey
  };

  try {
    const verifier = new RecaptchaVerifier(auth, containerId, recaptchaConfig);
    
    // 개발 환경에서 테스트 모드 활성화
    if (isDevelopment && typeof window !== 'undefined') {
      console.log('개발 환경: reCAPTCHA Enterprise 설정 완료, 사이트 키:', recaptchaSiteKey);
    }
    
    return verifier;
  } catch (error) {
    console.error('reCAPTCHA 인증기 생성 실패:', error);
    // fallback으로 기본 설정 시도 (Enterprise 키 제외)
    return new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {
        console.log('reCAPTCHA solved (fallback)');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired (fallback)');
      }
    });
  }
};

/**
 * 휴대폰 번호로 회원가입 (휴대폰 인증 포함)
 */
export const registerWithPhoneNumber = async (
  phoneNumber: string,
  userName: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    // 휴대폰 번호 형식 정규화
    const normalizedPhoneNumber = phoneNumber.startsWith('+82') 
      ? phoneNumber 
      : phoneNumber.replace(/^0/, '+82');
    
    const confirmationResult = await signInWithPhoneNumber(auth, normalizedPhoneNumber, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('휴대폰 회원가입 오류:', error);
    
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/invalid-phone-number') {
        throw new Error('유효하지 않은 휴대폰 번호입니다.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        throw new Error('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
    
    throw new Error('휴대폰 회원가입 중 오류가 발생했습니다.');
  }
};
